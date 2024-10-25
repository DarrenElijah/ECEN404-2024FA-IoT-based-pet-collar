const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://darrenelijah19:Barcel0na1@coordcluster.pa9fg.mongodb.net/";
const client = new MongoClient(uri, {
  tls: true, // Enable TLS connection
  tlsAllowInvalidCertificates: true, // Allow invalid certificates (use with caution)
});

async function insertRandomCoordinates() {
  try {
    await client.connect();
    const database = client.db("ECEN404"); // Database name
    const collection = database.collection("CoordsGPS"); // Collection name

    console.log("Connected to MongoDB");

    // Texas A&M College Station coordinates
    const centerLatitude = 30.6187;
    const centerLongitude = -96.3365;

    // Degrees per mile approximation
    const degreesPerMileLat = 1 / 69.0; // Approximate value
    const latRadians = centerLatitude * Math.PI / 180;
    const degreesPerMileLon = 1 / (69.0 * Math.cos(latRadians));

    // Initial position within 5-mile radius
    let currentLatitude;
    let currentLongitude;

    // Function to generate a random starting point within the 5-mile radius
    function generateInitialPosition() {
      const r = 5 * Math.sqrt(Math.random()); // Random distance within circle
      const theta = Math.random() * 2 * Math.PI; // Random angle

      const deltaLat = r * Math.cos(theta) * degreesPerMileLat;
      const deltaLon = r * Math.sin(theta) * degreesPerMileLon;

      currentLatitude = centerLatitude + deltaLat;
      currentLongitude = centerLongitude + deltaLon;
    }

    // Generate initial position
    generateInitialPosition();

    const intervalId = setInterval(async () => {
      // Movement parameters
      const maxStepSize = 0.0001; // Approximate degree change (~10 meters)
      const stepLat = (Math.random() * 2 - 1) * maxStepSize;
      const stepLon = (Math.random() * 2 - 1) * maxStepSize;

      // Update current position
      let newLatitude = currentLatitude + stepLat;
      let newLongitude = currentLongitude + stepLon;

      // Check if new position is within 5-mile radius
      const deltaLat = newLatitude - centerLatitude;
      const deltaLon = newLongitude - centerLongitude;
      const distanceMiles = Math.sqrt(
        (deltaLat / degreesPerMileLat) ** 2 +
        (deltaLon / degreesPerMileLon) ** 2
      );

      if (distanceMiles > 5) {
        // If outside the radius, reverse the step
        newLatitude = currentLatitude - stepLat;
        newLongitude = currentLongitude - stepLon;
      }

      currentLatitude = newLatitude;
      currentLongitude = newLongitude;

      const randomCoordinate = {
        latitude: parseFloat(currentLatitude.toFixed(6)),
        longitude: parseFloat(currentLongitude.toFixed(6)),
        timestamp: new Date(),
      };

      try {
        await collection.insertOne(randomCoordinate);
        console.log(`Inserted: ${JSON.stringify(randomCoordinate)}`);
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

insertRandomCoordinates();
