const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'website' directory
app.use(express.static(path.join(__dirname, 'website')));

// New static middleware for HLS
app.use('/hls', express.static('/tmp/hls'));


// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// MongoDB connection URI
const uri = 'mongodb://localhost:27017'
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
  //console.log('New client connected');

  // Clean up when the client disconnects
  socket.on('disconnect', () => {
    //console.log('Client disconnected');
  });
});

// Function to watch the MongoDB collection for changes
async function watchCollection() {
  try {
    const database = client.db('coordinates_db');
    const collection = database.collection('coordinates_collection');

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
    const database = client.db('coordinates_db');
    const collection = database.collection('coordinates_collection');

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
    const database = client.db('coordinates_db');
    const collection = database.collection('coordinates_collection');

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

    const database = client.db('coordinates_db');
    const collection = database.collection('coordinates_collection');

    await collection.insertOne(newCoordinate);
    res.json({ message: 'Data inserted' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).send('Error inserting data');
  }
});

const fs = require('fs');

// Ensure that the directory '/tmp/hls' exists
if (!fs.existsSync('/tmp/hls')) {
  fs.mkdirSync('/tmp/hls', { recursive: true });
}

// FFmpeg command and arguments
const ffmpegArgs = [
  '-i', 'rtsp://10.0.0.7:8000/',
  '-c:v', 'copy',
  '-f', 'hls',
  '-hls_time', '2',
  '-hls_list_size', '5',
  '-hls_flags', 'delete_segments',
  '/tmp/hls/stream.m3u8'
];


const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

ffmpegProcess.stderr.on('data', (data) => {
  console.error(`FFmpeg stderr: ${data}`);
});

ffmpegProcess.on('close', (code) => {
  console.log(`FFmpeg process exited with code ${code}`);
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
