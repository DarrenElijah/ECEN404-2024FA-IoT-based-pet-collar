const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, { tls: false });

const outputFile = path.join(__dirname, 'coordinates_by_day.json');

async function pollCoordinates() {
  try {
    await client.connect();
    const database = client.db("coordinates_db");
    const collection = database.collection("coordinates_collection");

    console.log("Connected to MongoDB");

    // Initialize the JSON file if it does not exist
    if (!fs.existsSync(outputFile)) {
      fs.writeFileSync(outputFile, JSON.stringify({}, null, 2));
    }

    let lastCount = await collection.countDocuments(); // Initialize document count

    async function poll() {
      try {
        // Get the current count of documents in the collection
        const currentCount = await collection.countDocuments();

        // If the count has changed, fetch new documents
        if (currentCount > lastCount) {
          // Find all documents added since the last count
          const newCoordinates = await collection
            .find({})
            .sort({ timestamp: 1 })
            .skip(lastCount) // Skip previously counted documents
            .toArray();

          if (newCoordinates.length > 0) {
            // Load existing data from the JSON file
            let data = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

            // Process new coordinates
            newCoordinates.forEach((coordinate) => {
              const dayOfWeek = new Date(coordinate.timestamp).toLocaleString('en-US', { weekday: 'long' });
              if (!data[dayOfWeek]) {
                data[dayOfWeek] = [];
              }
              data[dayOfWeek].push({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                timestamp: coordinate.timestamp,
              });

              // Display the new coordinate in the terminal
              console.log(`New Coord = Lat: ${coordinate.latitude}, Long: ${coordinate.longitude}, Time: ${coordinate.timestamp}`);
            });

            // Update lastCount to the new total document count
            lastCount = currentCount;

            // Write the updated data to the JSON file
            fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
            //console.log(`Logged ${newCoordinates.length} new coordinates to file.`);
          }
        } else {
          //console.log("No new coordinates found.");
        }
      } catch (pollError) {
        console.error("Error polling coordinates:", pollError);
      }

      // Schedule the next poll after a 1-second delay
      setTimeout(poll, 100);
    }

    // Start the polling loop
    poll();

  } catch (error) {
    console.error("Error connecting to MongoDB or processing data:", error);
  }
}

// Start polling for database updates
pollCoordinates();

// Handle cleanup on process exit
process.on('SIGINT', async () => {
  await client.close();
  console.log("\nMongoDB connection closed.");
  process.exit();
});
