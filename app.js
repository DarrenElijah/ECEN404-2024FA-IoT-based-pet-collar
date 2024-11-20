// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB connection URI from environment variables
const uri = 'mongodb+srv://darrenelijah19:Barcel0na1@coordcluster.pa9fg.mongodb.net/ECEN404?retryWrites=true&w=majority';

// Initialize MongoDB client
const client = new MongoClient(uri);

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if the connection fails
  }
}

// Session configuration
app.use(session({
    secret: "93ca5bb2be1957183ce529f65f092e8530adbdb38a947679411d4015faae2234d8ad59414678bbf777b8177541d63541ae32e9c1f96c48dc97d4fd6321a1b857",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: uri,
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
    sameSite: 'lax',
  },
}));

// Serve static files from the 'website' directory
app.use(express.static(path.join(__dirname, 'website')));

// Serve static files for HLS
app.use('/hls', express.static('/tmp/hls'));

// Define collections
let usersCollection;
let geofencesCollection;
let coordsGPSCollection;

// Initialize collections after connecting to MongoDB
async function initializeCollections() {
  const database = client.db('ECEN404');
  usersCollection = database.collection('users'); // New collection for users
  geofencesCollection = database.collection('geofences'); // New collection for geofences
  coordsGPSCollection = database.collection('CoordsGPS'); // Existing collection
}

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized: Please log in.' });
  }
}

// User Registration Route
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Check if username or email already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    // Initialize session
    req.session.userId = result.insertedId;
    req.session.username = username;

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// User Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Find user by username
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Initialize session
    req.session.userId = user._id;
    req.session.username = user.username;

    res.status(200).json({ message: 'Logged in successfully.' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// User Logout Route
app.post('/api/logout', (req, res) => {
  if (req.session) {
    // Destroy the session
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ message: 'Internal server error during logout.' });
      }

      // Clear the cookie
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully.' });
    });
  } else {
    res.status(400).json({ message: 'No active session found.' });
  }
});

// Get Current User Info Route
app.get('/api/user', isAuthenticated, async (req, res) => {
  try {
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.session.userId) },
      { projection: { password: 0 } } // Exclude password from the response
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Internal server error fetching user info.' });
  }
});

// Define a route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  //console.log('New client connected');

  // Clean up when the client disconnects
  socket.on('disconnect', () => {
   // console.log('Client disconnected');
  });
});

// Function to watch the MongoDB collection for changes
async function watchCollection() {
  try {
    // Use existing coordsGPSCollection
    const changeStream = coordsGPSCollection.watch();

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
app.get('/api/data', isAuthenticated, async (req, res) => {
  try {
    // Fetch all data
    const data = await coordsGPSCollection.find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});

// API endpoint to fetch the latest coordinate
app.get('/api/latest-coordinate', isAuthenticated, async (req, res) => {
  try {
    // Find the latest coordinate based on timestamp
    const latestCoordinate = await coordsGPSCollection.findOne({}, { sort: { timestamp: -1 } });

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
app.post('/api/insert', isAuthenticated, async (req, res) => {
  try {
    const newCoordinate = req.body;

    // Optional: Validate the newCoordinate data here

    await coordsGPSCollection.insertOne(newCoordinate);
    res.json({ message: 'Data inserted' });
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).send('Error inserting data');
  }
});

// API endpoint to create a new geofence
app.post('/api/geofences', isAuthenticated, async (req, res) => {
  const { name, coordinates, city } = req.body;

  // Basic validation
  if (!name || !coordinates || !city) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Check if geofence name already exists for the user
    const existingGeofence = await geofencesCollection.findOne({
      userId: new ObjectId(req.session.userId),
      name: name
    });

    if (existingGeofence) {
      return res.status(400).json({ message: 'Geofence name already exists.' });
    }

    // Create new geofence
    const newGeofence = {
      userId: new ObjectId(req.session.userId),
      name,
      coordinates, // Expected to be an array of { lat, lng }
      city,
      createdAt: new Date(),
    };

    await geofencesCollection.insertOne(newGeofence);
    res.status(201).json({ message: 'Geofence created successfully.', geofence: newGeofence });
  } catch (error) {
    console.error('Error creating geofence:', error);
    res.status(500).json({ message: 'Internal server error creating geofence.' });
  }
});

// API endpoint to get all geofences for the logged-in user
app.get('/api/geofences', isAuthenticated, async (req, res) => {
  try {
    const geofences = await geofencesCollection.find({ userId: new ObjectId(req.session.userId) }).toArray();
    res.status(200).json(geofences);
  } catch (error) {
    console.error('Error fetching geofences:', error);
    res.status(500).json({ message: 'Internal server error fetching geofences.' });
  }
});

// API endpoint to delete a geofence by ID
app.delete('/api/geofences/:id', isAuthenticated, async (req, res) => {
  const geofenceId = req.params.id;

  if (!ObjectId.isValid(geofenceId)) {
    return res.status(400).json({ message: 'Invalid geofence ID.' });
  }

  console.log('Session User ID Type:', typeof req.session.userId);
  console.log('Session User ID:', req.session.userId);

  try {
    const userId = typeof req.session.userId === 'string' ? new ObjectId(req.session.userId) : req.session.userId;

    const result = await geofencesCollection.deleteOne({
      _id: new ObjectId(geofenceId),
      userId: userId
    });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Geofence deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Geofence not found or unauthorized.' });
    }
  } catch (error) {
    console.error('Error deleting geofence:', error);
    res.status(500).json({ message: 'Internal server error deleting geofence.' });
  }
});


// FFmpeg command and arguments (commented out to disable camera streaming)
// const ffmpegArgs = [
//   '-i', 'rtsp://10.0.0.7:8000/',
//   '-c:v', 'copy',
//   '-f', 'hls',
//   '-hls_time', '2',
//   '-hls_list_size', '5',
//   '-hls_flags', 'delete_segments',
//   '/tmp/hls/stream.m3u8'
// ];

// const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

// ffmpegProcess.stderr.on('data', (data) => {
//   console.error(`FFmpeg stderr: ${data}`);
// });

// ffmpegProcess.on('close', (code) => {
//   console.log(`FFmpeg process exited with code ${code}`);
// });

// Start the server and connect to MongoDB
const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectToMongoDB();
  await initializeCollections(); // Initialize collections after connecting
  watchCollection(); // Start watching the collection after connecting to MongoDB

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Optionally, decide whether to exit the process
});
