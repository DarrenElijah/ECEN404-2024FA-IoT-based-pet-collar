// Import required modules
const DBSCAN = require('dbscanjs');

// Sample dataset (replace this with your input data)
let coords = [
    [30.6187, -96.3365],
    [30.6189, -96.3367],
    [30.6191, -96.3368],
    [15.0, -90.0],        // Outlier
    [30.6193, -96.3370],
    [50.0, -120.0],       // Outlier
    [30.6201, -96.3375],
    [30.6205, -96.3380]
];

// Define parameters for DBSCAN
const epsilon = 0.001; // Maximum distance between two points to be considered in the same neighborhood (in degrees)
const minPoints = 2; // Minimum number of points to form a dense region

// Run DBSCAN on the dataset (note that we don't need to use 'new' for DBSCAN)
const dbscan = DBSCAN();

const clusters = dbscan.run(coords, epsilon, minPoints);

if (!clusters) {
    console.error('Error: Clusters could not be generated. Please check input data and parameters.');
    process.exit(1);
}

// Extracting the cleaned data by only including non-noise points
let cleanedData = [];

// Loop through each cluster to include non-outlier points
clusters.forEach((cluster, index) => {
    if (index !== -1) { // index -1 indicates noise/outliers
        cluster.forEach(pointIndex => {
            cleanedData.push(coords[pointIndex]);
        });
    }
});

// Output the cleaned data without outliers
console.log('Cleaned Data:', cleanedData);
