// server.js

const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'website' directory
app.use(express.static(path.join(__dirname, 'website')));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// MongoDB connection URI
const uri = 'mongodb+srv://darrenelijah19:Barcel0na1@coordcluster.pa9fg.mongodb.net/'; // Replace with your actual URI

// MongoDB client
const client = new MongoClient(uri);

// Function to connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if the connection fails
  }
}

// Define a route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Clean up when the client disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Function to watch the MongoDB collection for changes
async function watchCollection() {
  try {
    const database = client.db('ECEN404');
    const collection = database.collection('CoordsGPS');

    // Set up a change stream to listen for new documents
    const changeStream = collection.watch();

    changeStream.on('change', (change) => {
      if (change.operationType === 'insert') {
        const newCoordinate = change.fullDocument;
        // Emit the new coordinate to all connected clients
        io.emit('new-coordinate', {
          latitude: newCoordinate.latitude,
          longitude: newCoordinate.longitude,
          timestamp: newCoordinate.timestamp,
        });
      }
    });

    changeStream.on('error', (error) => {
      console.error('Change stream error:', error);
    });

  } catch (error) {
    console.error('Error watching collection:', error);
  }
}

// API endpoint to fetch all data
app.get('/api/data', async (req, res) => {
  try {
    const database = client.db('ECEN404');
    const collection = database.collection('CoordsGPS');

    // Fetch all data
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});

// API endpoint to fetch the latest coordinate
app.get('/api/latest-coordinate', async (req, res) => {
  try {
    const database = client.db('ECEN404');
    const collection = database.collection('CoordsGPS');

    // Find the latest coordinate based on timestamp
    const latestCoordinate = await collection.findOne({}, { sort: { timestamp: -1 } });

    if (latestCoordinate) {
      res.json({
        latitude: latestCoordinate.latitude,
        longitude: latestCoordinate.longitude,
        timestamp: latestCoordinate.timestamp,
      });
    } else {
      res.status(404).json({ error: 'No coordinates found' });
    }
  } catch (error) {
    console.error('Error fetching latest coordinate:', error);
    res.status(500).send('Error fetching latest coordinate');
  }
});

// API endpoint to insert new data
app.post('/api/insert', async (req, res) => {
  try {
    const newCoordinate = req.body;

    const database = client.db('ECEN404');
    const collection = database.collection('CoordsGPS');

    await collection.insertOne(newCoordinate);
    res.json({ message: 'Data inserted' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).send('Error inserting data');
  }
});

// Start the server and connect to MongoDB
const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectToMongoDB();
  watchCollection(); // Start watching the collection after connecting to MongoDB

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Decide whether to exit the process
});
