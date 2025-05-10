// src/plugins/polytope-viewer/build_functions/index.js
// Exports polytope builder functions

import { tetrahedron, cube, octahedron, dodecahedron, icosahedron } from './platonic.js';

// Map of polytope types to builder functions
const POLYTOPE_BUILDERS = {
  // Platonic solids
  tetrahedron,
  cube,
  octahedron,
  dodecahedron,
  icosahedron,
  
  // Aliases
  tet: tetrahedron,
  box: cube,
  oct: octahedron,
  dodec: dodecahedron,
  ico: icosahedron
};

/**
 * Get a builder function for a polytope type
 * @param {string} type - Type of polytope
 * @returns {Function|null} Builder function or null if not found
 */
export function getPolytopeBuilder(type) {
  return POLYTOPE_BUILDERS[type.toLowerCase()] || null;
}

/**
 * Get list of available polytope types
 * @returns {string[]} List of available polytope types
 */
export function getAvailablePolytopeTypes() {
  // Return only the primary names, not the aliases
  return [
    'tetrahedron', 
    'cube', 
    'octahedron', 
    'dodecahedron', 
    'icosahedron'
  ];
}

// Export individual builders
export { tetrahedron, cube, octahedron, dodecahedron, icosahedron };
