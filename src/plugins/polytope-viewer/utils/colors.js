// src/plugins/polytope-viewer/utils/colors.js
// Color utilities for polytope visualization

/**
 * Color palette for consistent face coloring
 */
export const FACE_COLORS = [
  '#3498db', // Blue
  '#e74c3c', // Red
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Turquoise
  '#d35400', // Dark Orange
  '#34495e', // Dark Blue
  '#16a085', // Dark Turquoise
  '#27ae60', // Dark Green
  '#2980b9', // Medium Blue
  '#8e44ad', // Dark Purple
  '#f1c40f', // Yellow
  '#e67e22', // Light Orange
  '#c0392b', // Dark Red
  '#7f8c8d'  // Gray
];

/**
 * Generate a color for a face based on its index
 * @param {number} index - Face index
 * @returns {string} Color in hex format
 */
export function colorForFaceIndex(index) {
  return FACE_COLORS[index % FACE_COLORS.length];
}

/**
 * Generate a color based on the face size (number of vertices)
 * @param {number} size - Number of vertices in the face
 * @returns {string} Color in hex format
 */
export function colorForFaceSize(size) {
  // Triangle: Red, Square: Blue, Pentagon: Green, etc.
  const colors = {
    3: '#e74c3c', // Red for triangles
    4: '#3498db', // Blue for quadrilaterals
    5: '#2ecc71', // Green for pentagons
    6: '#f39c12', // Orange for hexagons
    7: '#9b59b6', // Purple for heptagons
    8: '#1abc9c', // Turquoise for octagons
  };
  
  return colors[size] || FACE_COLORS[(size - 3) % FACE_COLORS.length];
}

/**
 * Generate a color based on a value in a range
 * @param {number} value - Value to convert to color
 * @param {number} min - Minimum value in range
 * @param {number} max - Maximum value in range
 * @returns {string} Color in hex format
 */
export function colorFromValue(value, min, max) {
  // Normalize to [0, 1] range
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Convert to hue (0-360)
  const hue = normalized * 240; // Blue to Red
  
  // Convert HSL to hex
  return hslToHex(hue, 0.7, 0.6);
}

/**
 * Convert HSL color to hex format
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {string} Color in hex format
 */
export function hslToHex(h, s, l) {
  // Ensure h is in [0, 360) range
  h = h % 360;
  if (h < 0) h += 360;
  
  // Convert HSL to RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r, g, b;
  if (h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }
  
  // Convert to hex
  return `#${Math.round((r + m) * 255).toString(16).padStart(2, '0')}${
    Math.round((g + m) * 255).toString(16).padStart(2, '0')}${
    Math.round((b + m) * 255).toString(16).padStart(2, '0')}`;
}
