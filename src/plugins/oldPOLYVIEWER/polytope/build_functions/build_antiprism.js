// src/plugins/polytope-viewer/polytope/build_functions/build_antiprism.js
// Builder for regular antiprisms

import { Polytope } from '../Polytope.js';

/**
 * Build a regular antiprism
 * @param {Object} params - Construction parameters
 * @returns {Polytope} The constructed antiprism
 */
export function build_antiprism(params = { sides: 4, height: 1, size: 1 }) {
  const sides = params.sides || 4;
  const height = params.height || 1;
  const size = params.size || 1;
  
  if (sides < 3) {
    throw new Error('Antiprisms must have at least 3 sides');
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
  
  // Generate vertices for top face, rotated by half a step
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * (i + 0.5)) / sides;
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
  
  // Side faces (triangles)
  for (let i = 0; i < sides; i++) {
    const nextI = (i + 1) % sides;
    
    // Each side has two triangular faces
    faces.push([
      i,
      nextI,
      i + sides
    ]);
    
    faces.push([
      nextI,
      nextI + sides,
      i + sides
    ]);
  }

  // Create the polytope with custom faces
  const antiprism = new Polytope(vertices, {
    name: `${sides}-sided Antiprism`,
    parameters: params,
    parameterSchema: build_antiprism.defaults
  });
  
  // Override the faces from convex hull
  antiprism.faces = faces;
  
  // Recompute edges from faces
  const edgeSet = new Set();
  antiprism.faces.forEach(face => {
    const n = face.length;
    for (let i = 0; i < n; i++) {
      const a = face[i], b = face[(i + 1) % n];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      edgeSet.add(key);
    }
  });
  antiprism.edges = Array.from(edgeSet, key => key.split('-').map(Number));
  
  return antiprism;
}

// Define parameter schema for antiprisms
build_antiprism.defaults = {
  sides: {
    type: 'slider',
    min: 3,
    max: 12,
    step: 1,
    default: 4,
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
    description: 'Height of the antiprism'
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
