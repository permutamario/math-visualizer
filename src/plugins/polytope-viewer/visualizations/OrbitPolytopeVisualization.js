// Orbit Polytope Visualization
import { BasePolytopeVisualization } from '../BasePolytopeVisualization.js';

/**
 * Visualization for orbit polytopes
 */
export class OrbitPolytopeVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Default orbit point
    this.orbitPoint = [1, 2, 2, 3];
  }

  /**
   * Get visualization-specific parameters
   * @returns {Object} Parameter schema with structural and visual parameters
   */
  getVisualizationParameters() {
    return {
      structural: [
        {
          id: 'orbitPoint',
          type: 'text',
          label: 'Orbit Point [x,y,z,w]',
          default: JSON.stringify(this.orbitPoint)
        }
      ],
      visual: []
    };
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Update orbit point if provided
    if (parameters.orbitPoint) {
      try {
        this.orbitPoint = JSON.parse(parameters.orbitPoint);
      } catch (error) {
        console.error("Invalid orbit point format:", error);
      }
    }
    
    // Call parent initialization
    await super.initialize(parameters);
    
    return true;
  }

  /**
   * Determine if the polytope should be rebuilt after a parameter change
   * @param {Object} parameters - New parameters
   * @param {Object} prevParameters - Previous parameters
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters, prevParameters) {
    return parameters.orbitPoint !== undefined && 
           parameters.orbitPoint !== prevParameters?.orbitPoint;
  }

  /**
   * Get the vertices for this orbit polytope
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Parse orbit point if it's a string
    let point = this.orbitPoint;
    if (parameters.orbitPoint && typeof parameters.orbitPoint === 'string') {
      try {
        point = JSON.parse(parameters.orbitPoint);
      } catch (error) {
        console.error("Invalid orbit point format:", error);
      }
    }
    
    // Generate orbit polytope vertices
    const vertices = this.buildOrbitPolytope(point);
    
    // Convert to THREE.Vector3 objects
    return vertices.map(v => new THREE.Vector3(v[0] || 0, v[1] || 0, v[2] || 0));
  }

  /**
   * Build an orbit polytope from a point
   * @param {Array<number>} point - Initial point for orbit
   * @returns {Array<Array<number>>} Array of vertex coordinates
   */
  buildOrbitPolytope(point) {
    const orbit = this.permutations(point);
    return this.projectTo3D(orbit);
  }

  /**
   * Generate all permutations of an array
   * @param {Array} arr - Array to permute
   * @returns {Array<Array>} All permutations
   */
  permutations(arr) {
    if (arr.length <= 1) return [arr];
    return arr.flatMap((x, i) =>
      this.permutations(arr.slice(0, i).concat(arr.slice(i + 1))).map(rest => [x, ...rest])
    );
  }

  /**
   * Project points to 3D
   * @param {Array<Array<number>>} points - Points to project
   * @returns {Array<Array<number>>} Projected points
   */
  projectTo3D(points) {
    const dim = points[0].length;
    const n = dim;

    // Create orthonormal basis of the hyperplane ⟨x⟩ such that ∑x_i = 0
    const basis = [];
    for (let i = 0; i < n - 1; i++) {
      const vec = Array(n).fill(0);
      vec[i] = 1;
      vec[n - 1] = -1;
      basis.push(vec);
    }

    // Orthonormalize basis using Gram-Schmidt
    const orthoBasis = this.gramSchmidt(basis).slice(0, 3); // Take first 3 vectors

    // Project each point onto this basis
    return points.map(p =>
      orthoBasis.map(b => this.dot(p, b))
    );
  }

  // Utility functions
  dot(u, v) {
    return u.reduce((sum, x, i) => sum + x * v[i], 0);
  }

  normalize(v) {
    const norm = Math.hypot(...v);
    return v.map(x => x / norm);
  }

  subtract(u, v) {
    return u.map((x, i) => x - v[i]);
  }

  gramSchmidt(vectors) {
    const ortho = [];
    for (let v of vectors) {
      let vec = [...v];
      for (let u of ortho) {
        const proj = this.dot(vec, u);
        vec = this.subtract(vec, u.map(x => x * proj));
      }
      ortho.push(this.normalize(vec));
    }
    return ortho;
  }
}
