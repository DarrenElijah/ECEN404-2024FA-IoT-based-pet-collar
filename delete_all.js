const { MongoClient } = require('mongodb');

// Updated connection string with database name and options
const uri = "mongodb+srv://darrenelijah19:Barcel0na1@coordcluster.pa9fg.mongodb.net/ECEN404?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  tls: true, // Enable TLS connection
  tlsAllowInvalidCertificates: true, // Allow invalid certificates (use with caution)
});

async function deleteAllData() {
  try {
    await client.connect();
    const database = client.db("ECEN404"); // Database name
    const collection = database.collection("CoordsGPS"); // Collection name
    console.log("Connected to MongoDB");

    // Delete all documents from the collection
    const result = await collection.deleteMany({});
    console.log(`Deleted ${result.deletedCount} documents from the collection.`);
  } catch (error) {
    console.error("Error deleting data from collection:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

deleteAllData();
