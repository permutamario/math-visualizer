// src/plugins/polytope-viewer/families/Associahedron.js

import PolytopeFamily from '../PolytopeFamily.js';

export default class Associahedron extends PolytopeFamily {
  constructor(plugin, name = "Associahedron") {
    super(plugin, name);
    // Currently no parameters besides the standard size
  }
  
  /**
   * Add parameters specific to Associahedron
   */
  addFamilyParameters() {
    // Just use the default size parameter from the framework
    // Could add polygon size parameter in the future if desired
  }
  
  /**
   * Calculate vertices for the Associahedron
   * Based on triangulations of a hexagon
   */
  calculateVertices() {
    const P = 6;  // hexagon → 3D associahedron
    
    // 1) place P-gon vertices on unit circle
    const polygon = Array.from({ length: P }, (_, i) => [
      Math.cos(2*Math.PI*i/P),
      Math.sin(2*Math.PI*i/P)
    ]);

    // 2) list all triangulations of the hexagon
    const tris = this.generateTriangulations(0, P - 1);

    // 3) build the "area‐weight" vectors in R^P
    const weightVecs = tris.map(tri => {
      const w = Array(P).fill(0);
      for (const [i, k, j] of tri) {
        const [x1,y1] = polygon[i], [x2,y2] = polygon[k], [x3,y3] = polygon[j];
        const area = Math.abs((x2-x1)*(y3-y1) - (x3-x1)*(y2-y1)) / 2;
        [i,k,j].forEach(v => w[v] += area);
      }
      return w;
    });

    // 4) compute centroid and center them in the hyperplane ∑ w_i = const
    const centroid = weightVecs
      .reduce((acc, w) => acc.map((a,i) => a + w[i]), Array(P).fill(0))
      .map(s => s / weightVecs.length);

    const centered = weightVecs.map(w =>
      w.map((wi, i) => wi - centroid[i])
    );

    // 5) choose three raw difference‐vectors e_i − e_{i+1}, i=0..P−4
    const diffs = [];
    for (let i = 0; i < P-3; i++) {
      const b = Array(P).fill(0);
      b[i]   =  1;
      b[i+1] = -1;
      diffs.push(b);
    }

    // 6) orthonormalize to avoid skew
    const basis3 = this.gramSchmidt(diffs);

    // 7) project each centered weight vector onto the 3 basis vectors
    const verts3 = centered.map(w =>
      basis3.map(b => b.reduce((s, bi, i) => s + bi*w[i], 0))
    );

    // Apply size factor from parameters
    const size = this.plugin.getParameter('size') || 1.0;
    return verts3.map(v => v.map(coord => coord * size));
  }
  
  /**
   * Generate all triangulations of vertices [i..j] of a convex P-gon
   * @param {number} i - Start vertex index
   * @param {number} j - End vertex index
   * @returns {Array} Array of triangulations
   */
  generateTriangulations(i, j) {
    if (j <= i + 1) return [[]];
    const all = [];
    for (let k = i + 1; k < j; k++) {
      for (const L of this.generateTriangulations(i, k)) {
        for (const R of this.generateTriangulations(k, j)) {
          all.push([...L, ...R, [i, k, j]]);
        }
      }
    }
    return all;
  }
  
  /**
   * Perform Gram–Schmidt orthogonalization
   * @param {Array} vecs - Array of vectors
   * @returns {Array} Orthonormal basis
   */
  gramSchmidt(vecs) {
    const basis = [];
    for (let v of vecs) {
      // Make a copy
      let w = v.slice();
      // Subtract projections onto earlier basis vectors
      for (let u of basis) {
        const dotUV = u.reduce((s, ui, i) => s + ui * v[i], 0);
        const dotUU = u.reduce((s, ui) => s + ui * ui, 0);
        const coeff = dotUV / dotUU;
        w = w.map((wi, i) => wi - coeff * u[i]);
      }
      const norm = Math.hypot(...w);
      if (norm > 1e-8) {
        basis.push(w.map(x => x / norm));
      }
    }
    return basis;
  }
}