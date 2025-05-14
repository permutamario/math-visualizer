// src/plugins/polytope-viewer/families/Stellahedron.js

import PolytopeFamily from '../PolytopeFamily.js';

export default class Stellahedron extends PolytopeFamily {
  constructor(plugin, name = "Stellahedron") {
    super(plugin, name);
    // No additional parameters needed
  }
  
  /**
   * Add parameters specific to Stellahedron
   */
  addFamilyParameters() {
    // Just use the default size parameter from the framework
  }
  
  /**
   * Calculate vertices for the Stellahedron
   * Based on Minkowski sums of unit simplices
   */
  calculateVertices() {
    // Define the unit simplices
    const u1 = [
      [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]
    ];
    const u2 = [
      [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1],
      [1, 1, 0], [1, 0, 1], [0, 1, 1]
    ];
    const u3 = [
      [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1],
      [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]
    ];
    
    // Minkowski sum u1 + u2
    const sum12 = [];
    u1.forEach(v1 => u2.forEach(v2 => sum12.push([
      v1[0] + v2[0],
      v1[1] + v2[1],
      v1[2] + v2[2]
    ])));
    
    // Then + u3
    const vertices = [];
    sum12.forEach(v12 => u3.forEach(v3 => vertices.push([
      v12[0] + v3[0],
      v12[1] + v3[1],
      v12[2] + v3[2]
    ])));
    
    // Apply size factor from parameters
    const size = this.plugin.getParameter('size') || 1.0;
    return vertices.map(v => v.map(coord => coord * size * 0.1)); // Scale down by 0.1 because it's big
  }
}