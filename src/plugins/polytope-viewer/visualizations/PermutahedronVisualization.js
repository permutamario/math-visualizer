// src/plugins/polytope-viewer/visualizations/PermutahedronVisualization.js
import { BasePolytopeVisualization } from '../BasePolytopeVisualization.js';

/**
 * Visualization for Permutahedra based on root systems
 */
export class PermutahedronVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
    this.rootSystem = 'A3';
  }

  /**
   * Get specific parameters for this visualization
   * @returns {Object} Parameter schema with structural and visual parameters
   */
  static getParameters() {
    return {
      structural: [
        {
          id: 'rootSystem',
          type: 'dropdown',
          label: 'Root System',
          options: [
            { value: 'A3', label: 'Type A3' },
            { value: 'BC3', label: 'Type B3/C3' }
          ],
          default: 'A3'
        }
      ],
      visual: []
    };
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Visualization parameters
   */
  async initialize(parameters) {
    // Call parent initialization
    await super.initialize(parameters);
    
    // Set root system from parameters
    this.rootSystem = parameters.rootSystem || 'A3';
    
    return true;
  }

  /**
   * Handle specific parameter updates
   * @param {Object} parameters - Changed parameters only
   */
  handleParameterUpdate(parameters) {
    // Check if root system has changed
    if (parameters.rootSystem !== undefined) {
      this.rootSystem = parameters.rootSystem;
    }
  }

  /**
   * Determine if the polytope should be rebuilt after a parameter change
   * @param {Object} parameters - New parameters (only changed ones)
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters) {
    return parameters.rootSystem !== undefined || 
           super.shouldRebuildOnUpdate(parameters);
  }

  /**
   * Get the vertices for this permutahedron
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Get root system from parameters, falling back to instance state
    const rootSystem = parameters.rootSystem || this.rootSystem;
    
    // Generate coordinates based on root system type
    let coordinates;
    
    if (rootSystem === 'BC3') {
      coordinates = this.buildTypeBC();
    } else {
      coordinates = this.buildTypeA();
    }
    
    // Convert to THREE.Vector3 objects
    return coordinates.map(v => new THREE.Vector3(v[0] || 0, v[1] || 0, v[2] || 0));
  }

  /**
   * Build Type A permutahedron
   */
  buildTypeA() {
    // Generate all permutations of [1,2,3,4]
    const permutations = this.getPermutations([1, 2, 3, 4]);
    
    // Create basis vectors for projection from 4D to 3D
    const basis = [
      [1, -1, 0, 0],
      [0, 1, -1, 0],
      [0, 0, 1, -1]
    ];
    
    // Create orthonormal basis
    const orthoBasis = this.createOrthonormalBasis(basis);
    
    // Project each permutation to 3D using the orthonormal basis
    return permutations.map(p => orthoBasis.map(e => this.dot(p, e)));
  }

  /**
   * Build Type BC permutahedron
   */
  buildTypeBC() {
    // Generate all signed permutations of [1,2,3]
    const vertices = this.getSignedPermutations([1, 2, 3]);
    
    // Center the vertices around the origin
    const sum = vertices.reduce((acc, v) => [
      acc[0] + v[0],
      acc[1] + v[1],
      acc[2] + v[2]
    ], [0, 0, 0]);
    
    const center = [
      sum[0] / vertices.length,
      sum[1] / vertices.length,
      sum[2] / vertices.length
    ];
    
    return vertices.map(v => [
      v[0] - center[0],
      v[1] - center[1],
      v[2] - center[2]
    ]);
  }

  /**
   * Get all permutations of an array
   */
  getPermutations(arr) {
    if (arr.length <= 1) return [arr];
    
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const permutationsOfRemaining = this.getPermutations(remaining);
      
      for (const perm of permutationsOfRemaining) {
        result.push([current, ...perm]);
      }
    }
    
    return result;
  }

  /**
   * Get all signed permutations of an array
   */
  getSignedPermutations(arr) {
    const permutations = this.getPermutations(arr);
    const result = [];
    
    // For each permutation, add all possible sign combinations
    for (const perm of permutations) {
      const signCombinations = this.getSignCombinations(perm.length);
      
      for (const signs of signCombinations) {
        const signedPerm = perm.map((v, i) => v * signs[i]);
        result.push(signedPerm);
      }
    }
    
    return result;
  }

  /**
   * Get all sign combinations (1 or -1) for a given length
   */
  getSignCombinations(length) {
    const result = [];
    
    const generateCombinations = (current, depth) => {
      if (depth === length) {
        result.push([...current]);
        return;
      }
      
      generateCombinations([...current, 1], depth + 1);
      generateCombinations([...current, -1], depth + 1);
    };
    
    generateCombinations([], 0);
    return result;
  }

  /**
   * Create orthonormal basis from a set of vectors
   */
  createOrthonormalBasis(vectors) {
    const result = [];
    
    for (const v of vectors) {
      // Start with the current vector
      let u = [...v];
      
      // Subtract projections onto existing basis vectors
      for (const e of result) {
        const projection = this.dot(u, e);
        u = u.map((ui, i) => ui - projection * e[i]);
      }
      
      // Calculate the norm
      const norm = Math.sqrt(u.reduce((sum, ui) => sum + ui * ui, 0));
      
      // If the vector is not zero, normalize and add to basis
      if (norm > 1e-8) {
        result.push(u.map(ui => ui / norm));
      }
    }
    
    return result;
  }

  /**
   * Calculate the dot product of two vectors
   */
  dot(u, v) {
    return u.reduce((sum, ui, i) => sum + ui * v[i], 0);
  }
}