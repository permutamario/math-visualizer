// src/plugins/polytope-viewer/families/Permutahedron.js

import PolytopeFamily from '../PolytopeFamily.js';

export default class Permutahedron extends PolytopeFamily {
  constructor(plugin, name = "Permutahedron") {
    super(plugin, name);
    
    // Define permutahedron types
    this.types = [
      { value: 'A3', label: 'Type A₃' },
      { value: 'B3/C3', label: 'Type B₃/C₃' }
    ];
    
    // Set default type
    this.currentType = 'A3';
  }
  
  /**
   * Add parameters specific to Permutahedron
   */
  addFamilyParameters() {
    // Add parameter to select permutahedron type
    this.plugin.addDropdown(
      'permutahedronType',
      'Coxeter Type',
      'A3',
      this.types,
      'structural'
    );
  }
  
  /**
   * Calculate vertices for the Permutahedron
   */
  calculateVertices() {
    // Get the selected type
    this.currentType = this.plugin.getParameter('permutahedronType') || 'A3';
    
    // Generate vertices based on type
    let vertices;
    switch (this.currentType) {
      case 'B3/C3':
        vertices = this.buildTypeBC();
        break;
      default:
        vertices = this.buildTypeA();
        break;
    }
    
    // Apply size factor from parameters
    const size = this.plugin.getParameter('size') || 1.0;
    return vertices.map(v => v.map(coord => coord * size));
  }
  
  /**
   * Build Type A₃ (S₄) permutahedron
   * @returns {Array} Vertices for A₃ permutahedron
   */
  buildTypeA() {
    const perms4 = this.permutations([1, 2, 3, 4]);
    const basis = [[1, -1, 0, 0], [0, 1, -1, 0], [0, 0, 1, -1]];
    const ons = this.orthonormalBasis(basis);
    return perms4.map(p => ons.map(e => this.dot(p, e)));
  }
  
  /**
   * Build Type B₃/C₃ (signed S₃) permutahedron
   * @returns {Array} Vertices for B₃/C₃ permutahedron
   */
  buildTypeBC() {
    const base = [1, 2, 3];
    const pts = this.signedPermutations(base);
    const centroid = pts.reduce((c, p) => p.map((x, i) => c[i] + x), [0, 0, 0])
                       .map(x => x / pts.length);
    return pts.map(p => p.map((x, i) => x - centroid[i]));
  }
  
  /**
   * Calculate dot product of two vectors
   * @param {Array} u - First vector
   * @param {Array} v - Second vector
   * @returns {number} Dot product
   */
  dot(u, v) { 
    return u.reduce((s, ui, k) => s + ui * v[k], 0); 
  }
  
  /**
   * Subtract two vectors
   * @param {Array} u - First vector
   * @param {Array} v - Second vector
   * @returns {Array} Resulting vector
   */
  sub(u, v) { 
    return u.map((ui, k) => ui - v[k]); 
  }
  
  /**
   * Scale a vector by a scalar
   * @param {Array} u - Vector
   * @param {number} s - Scalar
   * @returns {Array} Scaled vector
   */
  scale(u, s) { 
    return u.map(ui => ui * s); 
  }
  
  /**
   * Calculate norm (length) of a vector
   * @param {Array} u - Vector
   * @returns {number} Norm
   */
  norm(u) { 
    return Math.hypot(...u); 
  }
  
  /**
   * Create an orthonormal basis from a set of vectors
   * @param {Array} vectors - Array of vectors
   * @returns {Array} Orthonormal basis
   */
  orthonormalBasis(vectors) {
    const es = [];
    for (let v of vectors) {
      let u = [...v];
      for (let e of es) u = this.sub(u, this.scale(e, this.dot(u, e)));
      const n = this.norm(u);
      if (n > 1e-8) es.push(this.scale(u, 1 / n));
    }
    return es;
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
   * Generate all signed permutations of an array
   * @param {Array} arr - The array
   * @returns {Array} Array of signed permutations
   */
  signedPermutations(arr) {
    const signs = arr.map(() => [-1, 1]);
    const allSigns = signs.reduce((acc, curr) => acc.flatMap(a => curr.map(s => [...a, s])), [[]]);
    return this.permutations(arr).flatMap(p => allSigns.map(signs => p.map((v, i) => v * signs[i])));
  }
}