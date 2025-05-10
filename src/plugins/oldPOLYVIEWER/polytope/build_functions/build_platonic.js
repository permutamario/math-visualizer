// src/plugins/polytope-viewer/polytope/build_functions/build_platonic.js
// Builder for platonic solids

import { Polytope } from '../Polytope.js';

// Set of vertices for each Platonic solid
const PLATONIC_VERTICES = {
  // Tetrahedron: four equidistant points
  tetrahedron: [
    [1, 1, 1],     // Vertex 0
    [1, -1, -1],   // Vertex 1
    [-1, 1, -1],   // Vertex 2
    [-1, -1, 1]    // Vertex 3
  ],
  
  // Cube: eight vertices of a unit cube
  cube: [
    // Bottom face
    [-1, -1, -1],  // Vertex 0
    [1, -1, -1],   // Vertex 1
    [1, 1, -1],    // Vertex 2
    [-1, 1, -1],   // Vertex 3
    // Top face
    [-1, -1, 1],   // Vertex 4
    [1, -1, 1],    // Vertex 5
    [1, 1, 1],     // Vertex 6
    [-1, 1, 1]     // Vertex 7
  ],
  
  // Octahedron: six vertices along coordinate axes
  octahedron: [
    [1, 0, 0],     // Vertex 0: positive x-axis
    [-1, 0, 0],    // Vertex 1: negative x-axis
    [0, 1, 0],     // Vertex 2: positive y-axis
    [0, -1, 0],    // Vertex 3: negative y-axis
    [0, 0, 1],     // Vertex 4: positive z-axis
    [0, 0, -1]     // Vertex 5: negative z-axis
  ],
  
  // Dodecahedron: 20 vertices derived from inscribed cube and golden ratio
  dodecahedron: (() => {
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const invPhi = 1 / phi;
    
    // Vertices based on coordinate permutations
    return [
      // Permutations of (±1, ±1, ±1)
      [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
      [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
      
      // Permutations of (0, ±phi, ±invPhi)
      [0, phi, invPhi], [0, phi, -invPhi], [0, -phi, invPhi], [0, -phi, -invPhi],
      [invPhi, 0, phi], [invPhi, 0, -phi], [-invPhi, 0, phi], [-invPhi, 0, -phi],
      [phi, invPhi, 0], [phi, -invPhi, 0], [-phi, invPhi, 0], [-phi, -invPhi, 0]
    ];
  })(),
  
  // Icosahedron: 12 vertices based on golden ratio
  icosahedron: (() => {
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    
    // Vertices based on coordinate permutations
    return [
      // Permutations of (0, ±1, ±phi)
      [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
      
      // Permutations of (±1, ±phi, 0)
      [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
      
      // Permutations of (±phi, 0, ±1)
      [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
    ];
  })()
};

// Manually defined faces for each platonic solid to ensure correct orientation
const PLATONIC_FACES = {
  tetrahedron: [
    [0, 1, 2],  // Face 0
    [0, 3, 1],  // Face 1
    [0, 2, 3],  // Face 2
    [1, 3, 2]   // Face 3
  ],
  
  cube: [
    [0, 1, 2, 3],    // Bottom face
    [4, 7, 6, 5],    // Top face
    [0, 4, 5, 1],    // Front face
    [1, 5, 6, 2],    // Right face
    [2, 6, 7, 3],    // Back face
    [3, 7, 4, 0]     // Left face
  ],
  
  octahedron: [
    [0, 2, 4],    // Face 0
    [0, 4, 3],    // Face 1
    [0, 3, 5],    // Face 2
    [0, 5, 2],    // Face 3
    [1, 4, 2],    // Face 4
    [1, 3, 4],    // Face 5
    [1, 5, 3],    // Face 6
    [1, 2, 5]     // Face 7
  ]
  
  // For dodecahedron and icosahedron, we'll compute the faces
  // using the convex hull algorithm in the Polytope class
};

/**
 * Build a platonic solid
 * @param {Object} params - Construction parameters
 * @returns {Polytope} The constructed platonic solid
 */
export function build_platonic(params = { type: 'cube', size: 1 }) {
  const type = params.type || 'cube';
  const size = params.size || 1;
  
  if (!PLATONIC_VERTICES[type]) {
    throw new Error(`Unknown platonic solid type: ${type}`);
  }
  
  // Get vertices for the selected type and scale by size
  const vertices = PLATONIC_VERTICES[type].map(v => 
    v.map(coord => coord * size)
  );
  
  // Create the polytope
  const polytope = new Polytope(vertices, {
    name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
    parameters: params,
    parameterSchema: build_platonic.defaults
  });
  
  // Override faces if we have predefined ones
  if (PLATONIC_FACES[type]) {
    polytope.faces = PLATONIC_FACES[type];
    
    // Recompute edges from faces
    const edgeSet = new Set();
    polytope.faces.forEach(face => {
      const n = face.length;
      for (let i = 0; i < n; i++) {
        const a = face[i], b = face[(i + 1) % n];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        edgeSet.add(key);
      }
    });
    polytope.edges = Array.from(edgeSet, key => key.split('-').map(Number));
  }
  
  return polytope;
}

// Define parameter schema for platonic solids
build_platonic.defaults = {
  type: {
    type: 'dropdown',
    options: ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'],
    default: 'cube',
    name: 'Solid Type',
    description: 'Type of platonic solid'
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
