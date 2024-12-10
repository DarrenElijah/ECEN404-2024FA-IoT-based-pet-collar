// myDBSCAN.js

class MyDBSCAN {
  constructor(eps, minPts) {
    this.eps = eps; // Epsilon in meters
    this.minPts = minPts;
    this.data = null;
    this.labels = null;
  }

  /**
   * Performs DBSCAN clustering on the provided data.
   * @param {Array} data - Array of data points [latitude, longitude].
   * @returns {Array} Array of cluster labels for each point.
   */
  cluster(data) {
    this.data = data; // Reference to the data
    this.labels = MyDBSCAN.vecMake(this.data.length, 0); // Initialize labels to 0 (unprocessed)
    let cid = 0; // Cluster ID counter

    for (let i = 0; i < this.data.length; ++i) {
      if (this.labels[i] !== 0) continue; // Skip if already processed

      let neighbors = this.rangeQuery(i);
      if (neighbors.length < this.minPts) {
        this.labels[i] = -1; // Mark as noise
      } else {
        cid++; // Start a new cluster
        this.expand(i, neighbors, cid);
      }
    }

    // Convert labels to 0-based cluster IDs, keeping -1 for noise
    let clustering = MyDBSCAN.vecMake(this.data.length, 0);
    for (let i = 0; i < clustering.length; ++i) {
      if (this.labels[i] >= 1) {
        clustering[i] = this.labels[i] - 1;
      } else {
        clustering[i] = this.labels[i];
      }
    }

    return clustering;
  }

  /**
   * Finds all points within eps distance from point p using Haversine distance.
   * @param {number} p - Index of the point.
   * @returns {Array} Array of indices of neighboring points.
   */
  rangeQuery(p) {
    let result = [];
    for (let i = 0; i < this.data.length; ++i) { 
      if (p === i) continue;
      let dist = MyDBSCAN.haversineDistance(this.data[p], this.data[i]);
      if (dist <= this.eps)
        result.push(i);
    }  
    return result;
  }

  /**
   * Expands the cluster to include density-reachable points.
   * @param {number} p - Index of the core point.
   * @param {Array} neighbors - Neighboring points of p.
   * @param {number} cid - Current cluster ID.
   */
  expand(p, neighbors, cid) {
    this.labels[p] = cid;
    let i = 0;
    while (i < neighbors.length) { 
      let pn = neighbors[i];
      if (pn === p) {
        ++i;
        continue;
      }
      if (this.labels[pn] === -1) { // Previously marked as noise
        this.labels[pn] = cid;
      } else if (this.labels[pn] === 0) { // Unprocessed
        this.labels[pn] = cid;
        let newNeighbors = this.rangeQuery(pn);
        if (newNeighbors.length >= this.minPts) {
          for (let j = 0; j < newNeighbors.length; ++j) {
            if (neighbors.indexOf(newNeighbors[j]) === -1)
              neighbors.push(newNeighbors[j]);
          }
        }
      }

      ++i;
    }
  }

  /**
   * Calculates the Haversine distance between two geographic points.
   * @param {Array} x1 - First point [latitude, longitude].
   * @param {Array} x2 - Second point [latitude, longitude].
   * @returns {number} Distance in meters.
   */
  static haversineDistance(x1, x2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000; // Radius of Earth in meters
    const lat1 = toRad(x1[0]);
    const lon1 = toRad(x1[1]);
    const lat2 = toRad(x2[0]);
    const lon2 = toRad(x2[1]);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Creates a vector (array) of a given length and initializes all elements to a specified value.
   * @param {number} n - Length of the vector.
   * @param {number} val - Initial value for each element.
   * @returns {Array} Initialized array.
   */
  static vecMake(n, val) {
    let result = [];
    for (let i = 0; i < n; ++i) {
      result[i] = val;
    }
    return result;
  }

} // MyDBSCAN

// Export the class for use in other modules
export default MyDBSCAN;


//python3 -m http.server 8000 : run this in DBSCAN_test directory to test DBSCAN