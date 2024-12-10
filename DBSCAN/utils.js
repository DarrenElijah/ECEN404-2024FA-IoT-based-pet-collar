// utils.js

/**
 * Creates a matrix (2D array) with specified rows, columns, and initial value.
 * @param {number} rows - Number of rows.
 * @param {number} cols - Number of columns.
 * @param {number} val - Initial value for each cell.
 * @returns {Array} 2D array (matrix).
 */
export function matMake(rows, cols, val) {
  let result = [];
  for (let i = 0; i < rows; ++i) {
    result[i] = [];
    for (let j = 0; j < cols; ++j) {
      result[i][j] = val;
    }
  }
  return result;
}

/**
 * Formats and returns a string representation of a matrix.
 * @param {Array} m - 2D array (matrix).
 * @param {number} dec - Number of decimal places.
 * @param {number} wid - Width for padding each cell.
 * @returns {string} Formatted matrix as a string.
 */
export function matShow(m, dec, wid) {
  let output = '';
  let rows = m.length;
  let cols = m[0].length;
  for (let i = 0; i < rows; ++i) {
    for (let j = 0; j < cols; ++j) {
      let v = m[i][j];
      if (Math.abs(v) < 0.000001) v = 0.0; // Avoid -0.00
      let vv = v.toFixed(dec);
      let s = vv.toString().padStart(wid, ' ');
      output += s + '  ';
    }
    output += '\n';
  }
  return output;
}

/**
 * Formats and returns a string representation of a vector.
 * @param {Array} vec - Array of numbers.
 * @param {number} wid - Width for padding each element.
 * @returns {string} Formatted vector as a string.
 */
export function vecShow(vec, wid) {
  let output = '';
  for (let i = 0; i < vec.length; ++i) {
    let x = vec[i];
    let s = x.toString().padStart(wid, ' ');
    output += s + ' ';
  }
  output += '\n';
  return output;
}
