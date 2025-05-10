// src/plugins/polytope-viewer/polytope/build_functions/build_custom.js
// Builder for custom polytopes with user-defined vertices

import { Polytope } from '../Polytope.js';

/**
 * Parse vertex data from a string
 * @param {string} vertexString - Comma-separated vertex coordinates
 * @returns {Array} Array of vertex coordinates
 */
function parseVertices(vertexString) {
  const vertices = [];
  
  // Split by lines or semicolons
  const lines = vertexString.split(/[;\n]/).filter(line => line.trim());
  
  for (const line of lines) {
    // Split by commas or spaces
    const coords = line.trim().split(/[,\s]+/).filter(x => x.trim());
    
    if (coords.length >= 3) {
      const x = parseFloat(coords[0]);
      const y = parseFloat(coords[1]);
      const z = parseFloat(coords[2]);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        vertices.push([x, y, z]);
      }
    }
  }
  
  return vertices;
}

/**
 * Build a custom polytope from user-defined vertices
 * @param {Object} params - Construction parameters
 * @returns {Polytope} The constructed custom polytope
 */
export function build_custom(params = { vertices: '', size: 1 }) {
  const vertexString = params.vertices || '';
  const size = params.size || 1;
  
  // Parse vertices from the string
  let vertices = parseVertices(vertexString);
  
  // If no valid vertices were provided, use a default tetrahedron
  if (vertices.length < 4) {
    vertices = [
      [1, 1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, 1]
    ];
  }
  
  // Scale vertices by size
  vertices = vertices.map(v => v.map(coord => coord * size));
  
  return new Polytope(vertices, {
    name: 'Custom Polytope',
    parameters: params,
    parameterSchema: build_custom.defaults
  });
}

// Define parameter schema for custom polytopes
build_custom.defaults = {
  vertices: {
    type: 'textarea',
    rows: 5,
    default: '1,1,1\n1,-1,-1\n-1,1,-1\n-1,-1,1',
    name: 'Vertex Coordinates',
    description: 'Enter comma-separated coordinates (x,y,z), one vertex per line'
  },
  size: {
    type: 'slider',
    min: 0.1,
    max: 2,
    step: 0.1,
    default: 1,
    name: 'Size',
    description: 'Scale factor for the polytope'
  }
};
