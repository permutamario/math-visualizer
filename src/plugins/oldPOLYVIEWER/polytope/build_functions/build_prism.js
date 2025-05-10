// src/plugins/polytope-viewer/polytope/build_functions/build_prism.js
// Builder for regular prisms

import { Polytope } from '../Polytope.js';

/**
 * Build a regular prism
 * @param {Object} params - Construction parameters
 * @returns {Polytope} The constructed prism
 */
export function build_prism(params = { sides: 5, height: 1, size: 1 }) {
  const sides = params.sides || 5;
  const height = params.height || 1;
  const size = params.size || 1;
  
  if (sides < 3) {
    throw new Error('Prisms must have at least 3 sides');
  }
  
  const vertices = [];
  
  // Generate vertices for bottom face
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides;
    vertices.push([
      size * Math.cos(angle),
      size * Math.sin(angle),
      -height / 2
    ]);
  }
  
  // Generate vertices for top face
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides;
    vertices.push([
      size * Math.cos(angle),
      size * Math.sin(angle),
      height / 2
    ]);
  }
  
  // Define faces manually for correct orientation
  const faces = [];
  
  // Bottom face (counter-clockwise looking from outside)
  const bottomFace = [];
  for (let i = sides - 1; i >= 0; i--) {
    bottomFace.push(i);
  }
  faces.push(bottomFace);
  
  // Top face (counter-clockwise looking from outside)
  const topFace = [];
  for (let i = 0; i < sides; i++) {
    topFace.push(i + sides);
  }
  faces.push(topFace);
  
  // Side faces (quads)
  for (let i = 0; i < sides; i++) {
    const nextI = (i + 1) % sides;
    faces.push([
      i,
      nextI,
      nextI + sides,
      i + sides
    ]);
  }

  // Create the polytope with custom faces
  const prism = new Polytope(vertices, {
    name: `${sides}-sided Prism`,
    parameters: params,
    parameterSchema: build_prism.defaults
  });
  
  // Override the faces from convex hull
  prism.faces = faces;
  
  // Recompute edges from faces
  const edgeSet = new Set();
  prism.faces.forEach(face => {
    const n = face.length;
    for (let i = 0; i < n; i++) {
      const a = face[i], b = face[(i + 1) % n];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      edgeSet.add(key);
    }
  });
  prism.edges = Array.from(edgeSet, key => key.split('-').map(Number));
  
  return prism;
}

// Define parameter schema for prisms
build_prism.defaults = {
  sides: {
    type: 'slider',
    min: 3,
    max: 12,
    step: 1,
    default: 5,
    name: 'Number of Sides',
    description: 'Number of sides in the base polygon'
  },
  height: {
    type: 'slider',
    min: 0.1,
    max: 3,
    step: 0.1,
    default: 1,
    name: 'Height',
    description: 'Height of the prism'
  },
  size: {
    type: 'slider',
    min: 0.1,
    max: 2,
    step: 0.1,
    default: 1,
    name: 'Base Size',
    description: 'Radius of the base'
  }
};
