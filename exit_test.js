const { MongoClient } = require('mongodb');

// Replace with your MongoDB connection URI
const uri = "mongodb+srv://darrenelijah19:Barcel0na1@coordcluster.pa9fg.mongodb.net/";
const client = new MongoClient(uri, {
  tls: true, // Enable TLS connection
  tlsAllowInvalidCertificates: true, // Allow invalid certificates (use with caution)
});

async function insertCoordinatesInStraightLine() {
  try {
    await client.connect();
    const database = client.db("ECEN404"); // Database name
    const collection = database.collection("CoordsGPS"); // Collection name

    console.log("Connected to MongoDB");

    // Starting coordinates (e.g., Texas A&M College Station)
    let currentLatitude = 30.6187;
    let currentLongitude = -96.3365;

    // Define the direction and step size
    const stepSize = 0.0001; // Approximate degree change (~10 meters)
    const directionLat = stepSize; // Change in latitude per step
    const directionLon = stepSize; // Change in longitude per step

    const intervalId = setInterval(async () => {
      // Update current position
      currentLatitude += directionLat;
      currentLongitude += directionLon;

      const coordinate = {
        latitude: parseFloat(currentLatitude.toFixed(6)),
        longitude: parseFloat(currentLongitude.toFixed(6)),
        timestamp: new Date(),
      };

      try {
        await collection.insertOne(coordinate);
        console.log(`Inserted: ${JSON.stringify(coordinate)}`);
      } catch (insertError) {
        console.error("Failed to insert data:", insertError);
      }
    }, 500); // Runs every 500 milliseconds (0.5 seconds)

    process.on('SIGINT', async () => {
      clearInterval(intervalId);
      await client.close();
      console.log("MongoDB connection closed.");
      process.exit();
    });

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

insertCoordinatesInStraightLine();
