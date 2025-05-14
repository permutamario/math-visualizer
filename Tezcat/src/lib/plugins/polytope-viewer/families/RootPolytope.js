// src/plugins/polytope-viewer/families/RootPolytope.js

import PolytopeFamily from '../PolytopeFamily.js';

export default class RootPolytope extends PolytopeFamily {
  constructor(plugin, name = "Root Polytope") {
    super(plugin, name);
    
    // Define root system types
    this.types = [
      { value: 'A3', label: 'Type A₃' },
      { value: 'B3', label: 'Type B₃' },
      { value: 'C3', label: 'Type C₃' },
      { value: 'D3', label: 'Type D₃' },
      { value: 'H3', label: 'Type H₃' }
    ];
    
    // Set default type
    this.currentType = 'A3';
  }
  
  /**
   * Add parameters specific to Root Polytope
   */
  addFamilyParameters() {
    // Add parameter to select root system type
    this.plugin.addDropdown(
      'rootSystemType',
      'Root System',
      'A3',
      this.types,
      'structural'
    );
  }
  
  /**
   * Calculate vertices for the Root Polytope
   */
  calculateVertices() {
    // Get the selected type
    this.currentType = this.plugin.getParameter('rootSystemType') || 'A3';
    
    // Generate vertices based on type
    let vertices;
    switch (this.currentType) {
      case 'B3':
        vertices = this.buildTypeB3();
        break;
      case 'C3':
        vertices = this.buildTypeC3();
        break;
      case 'D3':
        vertices = this.buildTypeD3();
        break;
      case 'H3':
        vertices = this.buildTypeH3();
        break;
      default:
        vertices = this.buildTypeA3();
        break;
    }
    
    // Apply size factor from parameters
    const size = this.plugin.getParameter('size') || 1.0;
    return vertices.map(v => v.map(coord => coord * size));
  }
  
  /**
   * Build Type A₃ root system
   * @returns {Array} Vertices for A₃ root system
   */
  buildTypeA3() {
    const roots4 = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const v = [0, 0, 0, 0]; v[i] = 1; v[j] = -1;
      roots4.push(v); roots4.push(v.map(x => -x));
    }
    
    const basis4 = [
      [1, -1, 0, 0],
      [0, 1, -1, 0],
      [0, 0, 1, -1]
    ];
    const ons = this.orthonormalBasis(basis4);
    return roots4.map(v4 => ons.map(e => this.dot(v4, e)));
  }
  
  /**
   * Build Type B₃ root system
   * @returns {Array} Vertices for B₃ root system
   */
  buildTypeB3() {
    const roots = [];
    // Short roots: ±e_i
    for (let i = 0; i < 3; i++) {
      const v = [0, 0, 0]; v[i] = 1;
      roots.push([...v]); roots.push(v.map(x => -x));
    }
    // Long roots: ±e_i ± e_j
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++)
      for (const si of [-1, 1]) for (const sj of [-1, 1]) {
        const v = [0, 0, 0]; v[i] = si; v[j] = sj;
        roots.push(v);
      }
    return roots;
  }
  
  /**
   * Build Type C₃ root system
   * @returns {Array} Vertices for C₃ root system
   */
  buildTypeC3() {
    const roots = [];
    // Long roots: ±2e_i
    for (let i = 0; i < 3; i++) {
      const v = [0, 0, 0]; v[i] = 2;
      roots.push([...v]); roots.push(v.map(x => -x));
    }
    // Medium roots: ±e_i ± e_j
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++)
      for (const si of [-1, 1]) for (const sj of [-1, 1]) {
        const v = [0, 0, 0]; v[i] = si; v[j] = sj;
        roots.push(v);
      }
    // Short roots: ±e_i (if needed for completeness)
    for (let i = 0; i < 3; i++) {
      const v = [0, 0, 0]; v[i] = 1;
      roots.push([...v]); roots.push(v.map(x => -x));
    }
    return roots;
  }
  
  /**
   * Build Type D₃ root system
   * @returns {Array} Vertices for D₃ root system
   */
  buildTypeD3() {
    const roots = [];
    // Roots: ±e_i ± e_j
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      for (const si of [-1, 1]) for (const sj of [-1, 1]) {
        const v = [0, 0, 0]; v[i] = si; v[j] = sj;
        roots.push(v);
      }
    }
    return roots;
  }
  
  /**
   * Build Type H₃ root system
   * @returns {Array} Vertices for H₃ root system
   */
  buildTypeH3() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const icosaVerts = [
      [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
      [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
      [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
    ];
    
    // Find edge length of icosahedron
    let edgeLen = Infinity;
    for (let i = 0; i < icosaVerts.length; i++) {
      for (let j = i + 1; j < icosaVerts.length; j++) {
        const dx = icosaVerts[i][0] - icosaVerts[j][0];
        const dy = icosaVerts[i][1] - icosaVerts[j][1];
        const dz = icosaVerts[i][2] - icosaVerts[j][2];
        const dist = Math.hypot(dx, dy, dz);
        if (dist > 1e-6 && dist < edgeLen) edgeLen = dist;
      }
    }
    
    // Collect midpoints of edges (these form the H₃ root system)
    const mids = [];
    for (let i = 0; i < icosaVerts.length; i++) {
      for (let j = i + 1; j < icosaVerts.length; j++) {
        const a = icosaVerts[i], b = icosaVerts[j];
        const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
        const dist = Math.hypot(dx, dy, dz);
        if (Math.abs(dist - edgeLen) < 1e-6) {
          mids.push([
            (a[0] + b[0]) / 2,
            (a[1] + b[1]) / 2,
            (a[2] + b[2]) / 2
          ]);
        }
      }
    }
    
    return mids;
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
}