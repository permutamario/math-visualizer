// src/plugins/polytope-viewer/polytope/build_functions/build_archimedean.js
// Builder for archimedean solids

import { Polytope } from '../Polytope.js';

// ---------- Truncated Tetrahedron ----------
function buildTruncatedTetrahedron(size = 1) {
  // Starting from a regular tetrahedron
  const tetraVertices = [
    [1, 1, 1],     // Vertex 0
    [1, -1, -1],   // Vertex 1
    [-1, 1, -1],   // Vertex 2
    [-1, -1, 1]    // Vertex 3
  ];
  
  // Truncation parameter: 0 = no truncation, 1/3 = truncated tetrahedron
  const truncation = 1/3;
  
  const vertices = [];
  
  // For each edge of the tetrahedron, add two vertices based on truncation
  const edges = [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
  ];
  
  edges.forEach(([a, b]) => {
    // Get the two original vertices
    const vA = tetraVertices[a];
    const vB = tetraVertices[b];
    
    // Add two truncated vertices along the edge
    vertices.push([
      vA[0] * (1 - truncation) + vB[0] * truncation,
      vA[1] * (1 - truncation) + vB[1] * truncation,
      vA[2] * (1 - truncation) + vB[2] * truncation
    ]);
    
    vertices.push([
      vB[0] * (1 - truncation) + vA[0] * truncation,
      vB[1] * (1 - truncation) + vA[1] * truncation,
      vB[2] * (1 - truncation) + vA[2] * truncation
    ]);
  });
  
  // Scale by size
  return vertices.map(v => v.map(coord => coord * size));
}

// ---------- Cuboctahedron ----------
function buildCuboctahedron(size = 1) {
  // The cuboctahedron can be constructed as the vertices
  // at the midpoints of the edges of a cube
  const vertices = [
    // Midpoints of edges on the bottom face of the cube
    [1, 0, -1],   // Vertex 0: midpoint of edge 0-1
    [0, -1, -1],  // Vertex 1: midpoint of edge 0-3
    [-1, 0, -1],  // Vertex 2: midpoint of edge 2-3
    [0, 1, -1],   // Vertex 3: midpoint of edge 1-2
    
    // Midpoints of edges on the top face of the cube
    [1, 0, 1],    // Vertex 4: midpoint of edge 4-5
    [0, -1, 1],   // Vertex 5: midpoint of edge 4-7
    [-1, 0, 1],   // Vertex 6: midpoint of edge 6-7
    [0, 1, 1],    // Vertex 7: midpoint of edge 5-6
    
    // Midpoints of vertical edges of the cube
    [1, -1, 0],   // Vertex 8: midpoint of edge 0-4
    [-1, -1, 0],  // Vertex 9: midpoint of edge 3-7
    [-1, 1, 0],   // Vertex 10: midpoint of edge 2-6
    [1, 1, 0]     // Vertex 11: midpoint of edge 1-5
  ];
  
  // Scale by size
  return vertices.map(v => v.map(coord => coord * size));
}

// ---------- Truncated Cube ----------
function buildTruncatedCube(size = 1) {
  // Starting from a cube
  const cubeVertices = [
    [-1, -1, -1],  // Vertex 0
    [1, -1, -1],   // Vertex 1
    [1, 1, -1],    // Vertex 2
    [-1, 1, -1],   // Vertex 3
    [-1, -1, 1],   // Vertex 4
    [1, -1, 1],    // Vertex 5
    [1, 1, 1],     // Vertex 6
    [-1, 1, 1]     // Vertex 7
  ];
  
  // Truncation parameter: 0 = no truncation, 1/3 = truncated cube
  const truncation = 1/3;
  
  const vertices = [];
  
  // For each vertex of the cube, generate 3 new vertices
  // by moving along each of the 3 incident edges
  for (let i = 0; i < 8; i++) {
    const v = cubeVertices[i];
    
    // Determine connected vertices based on cube topology
    const connectedIndices = [];
    for (let j = 0; j < 8; j++) {
      if (i === j) continue;
      
      // Count how many coordinates differ
      let diffCount = 0;
      for (let k = 0; k < 3; k++) {
        if (cubeVertices[i][k] !== cubeVertices[j][k]) {
          diffCount++;
        }
      }
      
      // If only one coordinate differs, they are connected by an edge
      if (diffCount === 1) {
        connectedIndices.push(j);
      }
    }
    
    // For each connected vertex, add a truncated vertex
    connectedIndices.forEach(j => {
      const vConnect = cubeVertices[j];
      vertices.push([
        v[0] * (1 - truncation) + vConnect[0] * truncation,
        v[1] * (1 - truncation) + vConnect[1] * truncation,
        v[2] * (1 - truncation) + vConnect[2] * truncation
      ]);
    });
  }
  
  // Scale by size
  return vertices.map(v => v.map(coord => coord * size));
}

// ---------- Truncated Octahedron ----------
function buildTruncatedOctahedron(size = 1) {
  // Starting from an octahedron
  const octaVertices = [
    [1, 0, 0],     // Vertex 0: positive x-axis
    [-1, 0, 0],    // Vertex 1: negative x-axis
    [0, 1, 0],     // Vertex 2: positive y-axis
    [0, -1, 0],    // Vertex 3: negative y-axis
    [0, 0, 1],     // Vertex 4: positive z-axis
    [0, 0, -1]     // Vertex 5: negative z-axis
  ];
  
  // Truncation parameter: 0 = no truncation, 1/3 = truncated octahedron
  const truncation = 1/3;
  
  const vertices = [];
  
  // For each vertex of the octahedron, generate 4 new vertices
  // by moving along each of the 4 incident edges
  for (let i = 0; i < 6; i++) {
    const v = octaVertices[i];
    
    // Determine connected vertices based on octahedron topology
    const connectedIndices = [];
    for (let j = 0; j < 6; j++) {
      if (i === j) continue;
      
      // In an octahedron, vertices are connected if they're not on opposite axes
      // (i.e., their sum of indices is not 1, 3, or 5)
      if ((i + j) !== 1 && (i + j) !== 3 && (i + j) !== 5) {
        connectedIndices.push(j);
      }
    }
    
    // For each connected vertex, add a truncated vertex
    connectedIndices.forEach(j => {
      const vConnect = octaVertices[j];
      vertices.push([
        v[0] * (1 - truncation) + vConnect[0] * truncation,
        v[1] * (1 - truncation) + vConnect[1] * truncation,
        v[2] * (1 - truncation) + vConnect[2] * truncation
      ]);
    });
  }
  
  // Scale by size
  return vertices.map(v => v.map(coord => coord * size));
}

// ---------- Rhombicuboctahedron ----------
function buildRhombicuboctahedron(size = 1) {
  // The rhombicuboctahedron has vertices where each is the same distance
  // from three adjacent vertices of a cube
  const vertices = [];
  
  // For each octant (corner of a cube), add a vertex at position (±a, ±a, ±b)
  // where a = 1 and b = 1+√2
  const a = 1;
  const b = 1 + Math.sqrt(2);
  
  // Generate all permutations of a and b with all possible signs
  for (const x of [a, b]) {
    for (const y of [a, b]) {
      for (const z of [a, b]) {
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            for (const sz of [-1, 1]) {
              // Skip duplicates
              if (
                !vertices.some(v => 
                  Math.abs(v[0] - sx * x) < 1e-10 && 
                  Math.abs(v[1] - sy * y) < 1e-10 && 
                  Math.abs(v[2] - sz * z) < 1e-10
                )
              ) {
                vertices.push([sx * x, sy * y, sz * z]);
              }
            }
          }
        }
      }
    }
  }
  
  // Scale by size and normalize to fit
  const maxCoord = Math.max(...vertices.map(v => Math.max(...v.map(Math.abs))));
  return vertices.map(v => v.map(coord => coord * size / maxCoord));
}

/**
 * Build an archimedean solid
 * @param {Object} params - Construction parameters
 * @returns {Polytope} The constructed archimedean solid
 */
export function build_archimedean(params = { type: 'truncated_cube', size: 1 }) {
  const type = params.type || 'truncated_cube';
  const size = params.size || 1;
  const truncation = params.truncation || 1/3;
  
  let vertices;
  switch (type) {
    case 'truncated_tetrahedron':
      vertices = buildTruncatedTetrahedron(size);
      break;
    case 'cuboctahedron':
      vertices = buildCuboctahedron(size);
      break;
    case 'truncated_octahedron':
      vertices = buildTruncatedOctahedron(size);
      break;
    case 'rhombicuboctahedron':
      vertices = buildRhombicuboctahedron(size);
      break;
    case 'truncated_cube':
    default:
      vertices = buildTruncatedCube(size);
      break;
  }

  return new Polytope(vertices, {
    name: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    parameters: params,
    parameterSchema: build_archimedean.defaults
  });
}

// Define parameter schema for archimedean solids
build_archimedean.defaults = {
  type: {
    type: 'dropdown',
    options: [
      'truncated_tetrahedron',
      'cuboctahedron',
      'truncated_cube',
      'truncated_octahedron',
      'rhombicuboctahedron'
    ],
    default: 'truncated_cube',
    name: 'Solid Type',
    description: 'Type of archimedean solid'
  },
  size: {
    type: 'slider',
    min: 0.1,
    max: 2,
    step: 0.1,
    default: 1,
    name: 'Size',
    description: 'Scale factor for the solid'
  }
};
