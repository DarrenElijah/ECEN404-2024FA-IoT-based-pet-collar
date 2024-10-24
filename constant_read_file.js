const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = "mongodb://10.0.0.5:27017";
const client = new MongoClient(uri, {
    tls: true, // Enable TLS connection
    tlsAllowInvalidCertificates: true, // Allow invalid certificates (use with caution)
  });

const outputFile = path.join(__dirname, 'coordinates_by_day.json');

async function readAndLogCoordinates() {
  try {
    await client.connect();
    const database = client.db("coordinates_db"); // Database name
    const collection = database.collection("coordinates_collection"); // Collection name

    console.log("Connected to MongoDB");

    // If the output file does not exist, create it with an empty object.
    if (!fs.existsSync(outputFile)) {
      fs.writeFileSync(outputFile, JSON.stringify({}, null, 2));
    }

    // Read the existing data from the database and log it to the output file
    const existingCoordinates = await collection.find({}).toArray();
    let data = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

    existingCoordinates.forEach((coordinate) => {
      const dayOfWeek = new Date(coordinate.timestamp).toLocaleString('en-US', { weekday: 'long' });
      if (!data[dayOfWeek]) {
        data[dayOfWeek] = [];
      }
      data[dayOfWeek].push({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        timestamp: coordinate.timestamp,
      });
    });

    // Write the updated data back to the output file
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`Logged existing coordinates to file.`);

    // Set up a change stream to watch for new inserts and log them
    const changeStream = collection.watch();

    changeStream.on('change', async (next) => {
      if (next.operationType === 'insert') {
        const newCoordinate = next.fullDocument;
        const dayOfWeek = new Date(newCoordinate.timestamp).toLocaleString('en-US', { weekday: 'long' });

        // Read the existing data from the output file
        let data = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

        // If there is no entry for the current day, create one
        if (!data[dayOfWeek]) {
          data[dayOfWeek] = [];
        }

        // Append the new coordinate to the appropriate day
        data[dayOfWeek].push({
          latitude: newCoordinate.latitude,
          longitude: newCoordinate.longitude,
          timestamp: newCoordinate.timestamp,
        });

        // Write the updated data back to the output file
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

        console.log(`Logged coordinate to ${dayOfWeek}: ${JSON.stringify(newCoordinate)}`);
      }
    });

  } catch (error) {
    console.error("Error connecting to MongoDB or processing data:", error);
  }
}

readAndLogCoordinates();