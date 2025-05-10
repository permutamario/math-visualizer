// src/plugins/polytope-viewer/build_functions/platonic.js
// Builder functions for Platonic solids

/**
 * Golden ratio - used for some Platonic solids
 */
const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Create a regular tetrahedron
 * @returns {Array<Array<number>>} Vertices as [x,y,z] arrays
 */
export async function tetrahedron() {
  return [
    [1, 1, 1],    // Vertex 0
    [1, -1, -1],  // Vertex 1
    [-1, 1, -1],  // Vertex 2
    [-1, -1, 1]   // Vertex 3
  ];
}

/**
 * Create a cube (hexahedron)
 * @returns {Array<Array<number>>} Vertices as [x,y,z] arrays
 */
export async function cube() {
  return [
    [1, 1, 1],     // Vertex 0
    [1, 1, -1],    // Vertex 1
    [1, -1, 1],    // Vertex 2
    [1, -1, -1],   // Vertex 3
    [-1, 1, 1],    // Vertex 4
    [-1, 1, -1],   // Vertex 5
    [-1, -1, 1],   // Vertex 6
    [-1, -1, -1]   // Vertex 7
  ];
}

/**
 * Create a regular octahedron
 * @returns {Array<Array<number>>} Vertices as [x,y,z] arrays
 */
export async function octahedron() {
  return [
    [1, 0, 0],    // Vertex 0: positive x
    [-1, 0, 0],   // Vertex 1: negative x
    [0, 1, 0],    // Vertex 2: positive y
    [0, -1, 0],   // Vertex 3: negative y
    [0, 0, 1],    // Vertex 4: positive z
    [0, 0, -1]    // Vertex 5: negative z
  ];
}

/**
 * Create a regular dodecahedron
 * @returns {Array<Array<number>>} Vertices as [x,y,z] arrays
 */
export async function dodecahedron() {
  const vertices = [];
  
  // (±1, ±1, ±1)
  for (let x = -1; x <= 1; x += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let z = -1; z <= 1; z += 2) {
        vertices.push([x, y, z]);
      }
    }
  }
  
  // (0, ±1/φ, ±φ)
  for (let pm1 = -1; pm1 <= 1; pm1 += 2) {
    for (let pm2 = -1; pm2 <= 1; pm2 += 2) {
      vertices.push([0, pm1 / PHI, pm2 * PHI]);
      vertices.push([pm1 / PHI, pm2 * PHI, 0]);
      vertices.push([pm2 * PHI, 0, pm1 / PHI]);
    }
  }
  
  return vertices;
}

/**
 * Create a regular icosahedron
 * @returns {Array<Array<number>>} Vertices as [x,y,z] arrays
 */
export async function icosahedron() {
  const vertices = [];
  
  // (0, ±1, ±φ)
  for (let pm1 = -1; pm1 <= 1; pm1 += 2) {
    for (let pm2 = -1; pm2 <= 1; pm2 += 2) {
      vertices.push([0, pm1, pm2 * PHI]);
      vertices.push([pm1, pm2 * PHI, 0]);
      vertices.push([pm2 * PHI, 0, pm1]);
    }
  }
  
  return vertices;
}
