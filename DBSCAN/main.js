// main.js

import MyDBSCAN from './test_DBSCAN.js';
import { matMake, matShow, vecShow } from './utils.js';

/**
 * Generates a random hex color code.
 * @returns {string} A random hex color.
 */
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Initializes the Leaflet map centered around Texas A&M University.
 * @returns {object} The Leaflet map instance.
 */
function initializeMap() {
  // Coordinates for Texas A&M University
  const mapCenter = [30.588806, -96.291481]; // Latitude, Longitude
  const zoomLevel = 16;

  // Initialize the map
  const map = L.map('map').setView(mapCenter, zoomLevel);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  return map;
}

/**
 * Visualizes the clustered data points on the Leaflet map.
 * @param {Array} X - Array of coordinate points [latitude, longitude].
 * @param {Array} clustering - Array of cluster labels corresponding to each point.
 * @param {object} map - The Leaflet map instance.
 */
function visualizeClusters(X, clustering, map) {
  // Clear existing markers from the map
  if (window.markerGroup) {
    window.markerGroup.clearLayers();
  } else {
    window.markerGroup = L.layerGroup().addTo(map);
  }

  // Determine unique clusters
  const uniqueClusters = [...new Set(clustering)];

  // Assign a color to each cluster
  const colors = {};
  uniqueClusters.forEach(cluster => {
    if (cluster === -1) {
      colors[cluster] = '#000000'; // Black for noise
    } else {
      colors[cluster] = getRandomColor();
    }
  });

  // Iterate over each data point and add to the map
  X.forEach((point, index) => {
    const [lat, lon] = point;
    const cluster = clustering[index];
    const color = colors[cluster];

    // Create a circle marker
    const marker = L.circleMarker([lat, lon], {
      radius: 8,
      fillColor: color,
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    });

    // Bind a popup to each marker
    marker.bindPopup(`<strong>Point ${index + 1}</strong><br>Latitude: ${lat.toFixed(6)}<br>Longitude: ${lon.toFixed(6)}<br>Cluster ID: ${cluster}`);

    // Add the marker to the marker group
    marker.addTo(window.markerGroup);
  });

  // Optionally, fit the map to the markers
  if (X.length > 0) {
    map.fitBounds(window.markerGroup.getBounds().pad(0.2));
  }
}

/**
 * Populates the HTML table with clustering results.
 * @param {Array} X - Array of coordinate points [latitude, longitude].
 * @param {Array} clustering - Array of cluster labels corresponding to each point.
 */
function displayClusteringResults(X, clustering) {
  const tableBody = document.getElementById('resultsTableBody');
  tableBody.innerHTML = ''; // Clear existing content

  for (let i = 0; i < X.length; ++i) {
    const row = document.createElement('tr');

    // Latitude cell
    const latCell = document.createElement('td');
    latCell.textContent = X[i][0].toFixed(6);
    row.appendChild(latCell);

    // Longitude cell
    const lonCell = document.createElement('td');
    lonCell.textContent = X[i][1].toFixed(6);
    row.appendChild(lonCell);

    // Cluster ID cell
    const clusterCell = document.createElement('td');
    clusterCell.textContent = clustering[i];
    row.appendChild(clusterCell);

    tableBody.appendChild(row);
  }
}

/**
 * Executes DBSCAN clustering with the provided parameters and updates the visualization.
 * @param {number} epsilon - The epsilon parameter for DBSCAN in meters.
 * @param {number} minPoints - The minPoints parameter for DBSCAN.
 * @param {Array} X - Array of coordinate points [latitude, longitude].
 * @param {object} map - The Leaflet map instance.
 */
function runClustering(epsilon, minPoints, X, map) {
  console.log(`\nClustering with epsilon = ${epsilon} meters and min points = ${minPoints}`);

  const dbscan = new MyDBSCAN(epsilon, minPoints);
  const clustering = dbscan.cluster(X);
  console.log("Clustering done.");

  console.log("\nClustering results: ");
  console.log(vecShow(clustering, 3));

  // Display results in the HTML table
  displayClusteringResults(X, clustering);

  // Visualize clusters on the map
  visualizeClusters(X, clustering, map);
}

/**
 * Initializes the application with fixed parameters and performs clustering.
 */
function main() {
  console.log("Begin DBSCAN clustering using JavaScript ");

  // Accurate coordinate data around Texas A&M University
  // [Latitude, Longitude]
  const X = [
    // Academic Buildings Cluster
    [30.588756, -96.291539], // Main Library
    [30.589000, -96.291800],
    [30.588900, -96.291600],
    [30.588700, -96.291700],
    [30.588850, -96.291650],
    
    // Residence Halls Cluster
    [30.586000, -96.290000], // Residence Hall 1
    [30.586200, -96.290200],
    [30.585900, -96.290100],
    [30.586100, -96.290300],
    [30.586050, -96.290150],
    
    // Recreational Areas Cluster
    [30.590000, -96.293000], // Athletic Complex
    [30.590200, -96.293200],
    [30.589800, -96.292800],
    [30.590100, -96.293100],
    [30.590050, -96.293050],
    
    // Dining Services Cluster
    [30.589500, -96.292500], // Dining Hall
    [30.589700, -96.292700],
    [30.589600, -96.292600],
    
    // Noise Points
    [30.600000, -96.300000], // Far Away Point 1
    [30.580000, -96.280000], // Far Away Point 2
    [30.595000, -96.295000]  // Far Away Point 3
  ];

  console.log("\nData: ");
  console.log(matShow(X, 6, 15));

  // Initialize the map
  const map = initializeMap();

  // Fixed parameters
  const fixedEpsilon = 50; // in meters
  const fixedMinPoints = 3;
  
  // Perform clustering with fixed parameters
  runClustering(fixedEpsilon, fixedMinPoints, X, map);
  
  console.log("End demo ");
}

// Execute main function when the page loads
window.onload = main;
