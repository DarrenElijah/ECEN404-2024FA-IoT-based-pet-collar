const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, { useUnifiedTopology: true, tls: false });

function getRandomTimestamp() {
  // Generate a random date within the past 30 days
  const now = new Date();
  const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  // Get a random timestamp between pastDate and now
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
}

async function insertRandomCoordinates() {
  try {
    await client.connect();
    const database = client.db("coordinates_db"); // Database name
    const collection = database.collection("coordinates_collection"); // Collection name

    console.log("Connected to MongoDB");

    // Texas A&M College Station coordinates
    const centerLatitude = 30.6187;
    const centerLongitude = -96.3365;

    // Degrees per mile approximation
    const degreesPerMileLat = 1 / 69.0; // Approximate value
    const latRadians = centerLatitude * Math.PI / 180;
    const degreesPerMileLon = 1 / (69.0 * Math.cos(latRadians));

    const intervalId = setInterval(async () => {
      // Generate random point within a 5-mile radius
      const r = 5 * Math.sqrt(Math.random()); // Random distance within circle
      const theta = Math.random() * 2 * Math.PI; // Random angle

      // Calculate offsets in degrees
      const deltaLat = r * Math.cos(theta) * degreesPerMileLat;
      const deltaLon = r * Math.sin(theta) * degreesPerMileLon;

      const randomLatitude = centerLatitude + deltaLat;
      const randomLongitude = centerLongitude + deltaLon;

      // Generate a random timestamp
      const randomTimestamp = getRandomTimestamp();

      const randomCoordinate = {
        latitude: parseFloat(randomLatitude.toFixed(6)),
        longitude: parseFloat(randomLongitude.toFixed(6)),
        timestamp: randomTimestamp,
      };

      try {
        await collection.insertOne(randomCoordinate);
        console.log(`Inserted: ${JSON.stringify(randomCoordinate)}`);
      } catch (insertError) {
        console.error("Failed to insert data:", insertError);
      }
    }, 500); // Runs every x milliseconds: 1000 millisecond = 1 sec

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

