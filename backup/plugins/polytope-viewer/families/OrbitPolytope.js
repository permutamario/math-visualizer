// src/plugins/polytope-viewer/families/OrbitPolytope.js

import PolytopeFamily from '../PolytopeFamily.js';

export default class OrbitPolytope extends PolytopeFamily {
  constructor(plugin, name = "Orbit Polytope") {
    super(plugin, name);
    
    // Default point value
    this.defaultPoint = [1, 2, 2, 3];
  }
  
  /**
   * Add parameters specific to Orbit Polytope
   */
  addFamilyParameters() {
    // Add parameters for the point coordinates
    this.plugin.addNumber('point1', 'Point X₁', this.defaultPoint[0], { min: -5, max: 5, step: 0.5 }, 'structural');
    this.plugin.addNumber('point2', 'Point X₂', this.defaultPoint[1], { min: -5, max: 5, step: 0.5 }, 'structural');
    this.plugin.addNumber('point3', 'Point X₃', this.defaultPoint[2], { min: -5, max: 5, step: 0.5 }, 'structural');
    this.plugin.addNumber('point4', 'Point X₄', this.defaultPoint[3], { min: -5, max: 5, step: 0.5 }, 'structural');
  }
  
  /**
   * Calculate vertices for the Orbit Polytope
   * Generates permutations of a 4D point and projects to 3D
   */
  calculateVertices() {
    // Get the point coordinates from parameters
    const point = [
      this.plugin.getParameter('point1') || this.defaultPoint[0],
      this.plugin.getParameter('point2') || this.defaultPoint[1],
      this.plugin.getParameter('point3') || this.defaultPoint[2],
      this.plugin.getParameter('point4') || this.defaultPoint[3]
    ];
    
    // Generate permutations and project to 3D
    const orbit = this.permutations(point);
    const vertices = this.projectTo3D(orbit);
    
    // Apply size factor from parameters
    const size = this.plugin.getParameter('size') || 1.0;
    return vertices.map(v => v.map(coord => coord * size));
  }
  
  /**
   * Generate all permutations of an array
   * @param {Array} arr - The array to permute
   * @returns {Array} Array of permutations
   */
  permutations(arr) {
    if (arr.length <= 1) return [arr];
    return arr.flatMap((x, i) =>
      this.permutations(arr.slice(0, i).concat(arr.slice(i + 1))).map(rest => [x, ...rest])
    );
  }
  
  /**
   * Project points from a higher dimension to 3D
   * @param {Array} points - Array of points in higher dimension
   * @returns {Array} Projected points in 3D
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

    // Apply Gram-Schmidt orthonormalization
    const orthoBasis = this.gramSchmidt(basis).slice(0, 3); // Take first 3 orthonormal vectors

    // Project each point onto this basis
    return points.map(p =>
      orthoBasis.map(b => this.dot(p, b))
    );
  }
  
  /**
   * Calculate dot product of two vectors
   * @param {Array} u - First vector
   * @param {Array} v - Second vector
   * @returns {number} Dot product
   */
  dot(u, v) {
    return u.reduce((sum, x, i) => sum + x * v[i], 0);
  }
  
  /**
   * Subtract two vectors
   * @param {Array} u - First vector
   * @param {Array} v - Second vector
   * @returns {Array} Resulting vector
   */
  subtract(u, v) {
    return u.map((x, i) => x - v[i]);
  }
  
  /**
   * Normalize a vector
   * @param {Array} v - Vector to normalize
   * @returns {Array} Normalized vector
   */
  normalize(v) {
    const norm = Math.hypot(...v);
    return v.map(x => x / norm);
  }
  
  /**
   * Perform Gram-Schmidt orthonormalization
   * @param {Array} vectors - Array of vectors
   * @returns {Array} Orthonormal basis
   */
  gramSchmidt(vectors) {
    const ortho = [];
    for (let v of vectors) {
      let u = [...v];
      for (let base of ortho) {
        const proj = this.dot(u, base);
        u = this.subtract(u, base.map(x => x * proj));
      }
      if (Math.hypot(...u) > 1e-8) {
        ortho.push(this.normalize(u));
      }
    }
    return ortho;
  }
}