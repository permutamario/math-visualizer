// src/plugins/polytope-viewer/families/Cyclohedron.js

import PolytopeFamily from '../PolytopeFamily.js';

export default class Cyclohedron extends PolytopeFamily {
  constructor(plugin, name = "Cyclohedron") {
    super(plugin, name);
    // No additional parameters needed
  }
  
  /**
   * Add parameters specific to Cyclohedron
   */
  addFamilyParameters() {
    // Just use the default size parameter from the framework
  }
  
  /**
   * Calculate vertices for the Cyclohedron
   * Based on 4D tubings for the 4-cycle
   */
  calculateVertices() {
    // Raw 4D tubings for the 4-cycle (20 vertices)
    const raw4 = [
      [0,1,2,3], [0,1,3,2], [0,2,1,2], [0,2,3,1], [0,3,2,1],
      [1,0,2,3], [1,0,3,2], [1,2,0,2], [1,2,3,0], [1,3,2,0],
      [2,0,1,3], [2,0,2,1], [2,1,0,3], [2,1,2,0], [2,3,0,1],
      [2,3,1,0], [3,0,1,2], [3,1,0,2], [3,2,0,1], [3,2,1,0]
    ];
    
    // Center into hyperplane sum=0
    const centered = raw4.map(v => {
      const mean = v.reduce((s,x) => s+x,0) / 4;
      return v.map(x => x - mean);
    });
    
    // Orthonormal basis via Gram-Schmidt
    const dot = (u,v) => u.reduce((s,ui,i) => s + ui*v[i],0);
    const sub = (u,v) => u.map((ui,i) => ui - v[i]);
    const scale = (u,s) => u.map(ui => ui * s);
    const norm = u => Math.hypot(...u);
    
    const rawB = [[1,-1,0,0], [0,1,-1,0], [0,0,1,-1]];
    const basis = [];
    
    rawB.forEach(b => {
      let u = [...b];
      basis.forEach(e => { 
        const p = dot(u,e); 
        u = sub(u, scale(e,p)); 
      });
      const n = norm(u);
      if (n > 1e-8) basis.push(scale(u, 1/n));
    });
    
    // Project to R^3
    const verts3 = centered.map(v4 => basis.map(e => dot(v4, e)));
    
    // Apply size factor from parameters
    const size = this.plugin.getParameter('size') || 1.0;
    return verts3.map(v => v.map(coord => coord * size));
  }
}