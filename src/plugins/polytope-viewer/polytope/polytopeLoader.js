// src/plugins/polytope-viewer/polytope/polytopeLoader.js
// Responsible for loading and managing polytope builders

// Direct imports for all polytope builders
import { build_permutahedron } from './build_functions/build_permutahedron.js';
import { build_platonic } from './build_functions/build_platonic.js';
import { build_archimedean } from './build_functions/build_archimedean.js';
import { build_prism } from './build_functions/build_prism.js';
import { build_antiprism } from './build_functions/build_antiprism.js';
import { build_custom } from './build_functions/build_custom.js';

/**
 * Load all polytope builders
 * @returns {Promise<Object>} Map of polytope type to builder functions
 */
export async function loadPolytopeBuilders() {
  // In a production environment, this could be more dynamic,
  // potentially loading from a JSON file or scanning a directory.
  
  // For now, we'll define our builders and their metadata in code
  // This is more reliable across different browser environments
  const builders = {
    // Regular Platonic solids
    'tetrahedron': {
      build: (params) => build_platonic({ ...params, type: 'tetrahedron' }),
      defaults: build_platonic.defaults,
      category: 'Platonic Solids',
      name: 'Tetrahedron',
      description: 'Regular tetrahedron (4 triangular faces)'
    },
    'cube': {
      build: (params) => build_platonic({ ...params, type: 'cube' }),
      defaults: build_platonic.defaults,
      category: 'Platonic Solids',
      name: 'Cube',
      description: 'Regular hexahedron (6 square faces)'
    },
    'octahedron': {
      build: (params) => build_platonic({ ...params, type: 'octahedron' }),
      defaults: build_platonic.defaults,
      category: 'Platonic Solids',
      name: 'Octahedron',
      description: 'Regular octahedron (8 triangular faces)'
    },
    'dodecahedron': {
      build: (params) => build_platonic({ ...params, type: 'dodecahedron' }),
      defaults: build_platonic.defaults,
      category: 'Platonic Solids',
      name: 'Dodecahedron',
      description: 'Regular dodecahedron (12 pentagonal faces)'
    },
    'icosahedron': {
      build: (params) => build_platonic({ ...params, type: 'icosahedron' }),
      defaults: build_platonic.defaults,
      category: 'Platonic Solids',
      name: 'Icosahedron',
      description: 'Regular icosahedron (20 triangular faces)'
    },
    
    // Archimedean solids (selected)
    'truncated_tetrahedron': {
      build: (params) => build_archimedean({ ...params, type: 'truncated_tetrahedron' }),
      defaults: build_archimedean.defaults,
      category: 'Archimedean Solids',
      name: 'Truncated Tetrahedron',
      description: 'Tetrahedron with truncated vertices'
    },
    'cuboctahedron': {
      build: (params) => build_archimedean({ ...params, type: 'cuboctahedron' }),
      defaults: build_archimedean.defaults,
      category: 'Archimedean Solids',
      name: 'Cuboctahedron',
      description: 'Polyhedron with 8 triangular and 6 square faces'
    },
    'truncated_cube': {
      build: (params) => build_archimedean({ ...params, type: 'truncated_cube' }),
      defaults: build_archimedean.defaults,
      category: 'Archimedean Solids',
      name: 'Truncated Cube',
      description: 'Cube with truncated vertices'
    },
    'truncated_octahedron': {
      build: (params) => build_archimedean({ ...params, type: 'truncated_octahedron' }),
      defaults: build_archimedean.defaults,
      category: 'Archimedean Solids',
      name: 'Truncated Octahedron',
      description: 'Octahedron with truncated vertices'
    },
    'rhombicuboctahedron': {
      build: (params) => build_archimedean({ ...params, type: 'rhombicuboctahedron' }),
      defaults: build_archimedean.defaults,
      category: 'Archimedean Solids',
      name: 'Rhombicuboctahedron',
      description: 'Polyhedron with 8 triangular and 18 square faces'
    },
    
    // Prisms
    'triangular_prism': {
      build: (params) => build_prism({ ...params, sides: 3 }),
      defaults: build_prism.defaults,
      category: 'Prisms & Antiprisms',
      name: 'Triangular Prism',
      description: 'Prism with triangular bases'
    },
    'pentagonal_prism': {
      build: (params) => build_prism({ ...params, sides: 5 }),
      defaults: build_prism.defaults,
      category: 'Prisms & Antiprisms',
      name: 'Pentagonal Prism',
      description: 'Prism with pentagonal bases'
    },
    'hexagonal_prism': {
      build: (params) => build_prism({ ...params, sides: 6 }),
      defaults: build_prism.defaults,
      category: 'Prisms & Antiprisms',
      name: 'Hexagonal Prism',
      description: 'Prism with hexagonal bases'
    },
    
    // Antiprisms
    'square_antiprism': {
      build: (params) => build_antiprism({ ...params, sides: 4 }),
      defaults: build_antiprism.defaults,
      category: 'Prisms & Antiprisms',
      name: 'Square Antiprism',
      description: 'Antiprism with square bases'
    },
    'pentagonal_antiprism': {
      build: (params) => build_antiprism({ ...params, sides: 5 }),
      defaults: build_antiprism.defaults,
      category: 'Prisms & Antiprisms',
      name: 'Pentagonal Antiprism',
      description: 'Antiprism with pentagonal bases'
    },
    
    // Abstract polytopes
    'permutahedron_a3': {
      build: (params) => build_permutahedron({ ...params, type: 'A3' }),
      defaults: build_permutahedron.defaults,
      category: 'Abstract Polytopes',
      name: 'A₃ Permutahedron',
      description: 'Convex hull of permutations of [1,2,3,4]'
    },
    'permutahedron_b3': {
      build: (params) => build_permutahedron({ ...params, type: 'B3/C3' }),
      defaults: build_permutahedron.defaults,
      category: 'Abstract Polytopes',
      name: 'B₃/C₃ Permutahedron',
      description: 'Convex hull of signed permutations of [1,2,3]'
    },
    
    // Custom polytope with user-defined vertices
    'custom': {
      build: build_custom,
      defaults: build_custom.defaults,
      category: 'Custom',
      name: 'Custom Polytope',
      description: 'Define your own polytope with custom vertices'
    }
  };
  
  // In a real implementation, we would load more dynamically
  // For now, just return the static map
  return builders;
}
