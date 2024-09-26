const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the 'website' directory
app.use(express.static(path.join(__dirname, 'website')));

// Optional: Define a route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


const mongoose = require('mongoose');


// Replace with your actual MongoDB connection string
const mongoURI = 'mongodb://localhost:27017/your-database-name';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

