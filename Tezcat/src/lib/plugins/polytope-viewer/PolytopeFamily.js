/**
 * Base class for polytope families using quickhull3d by Mauricio Poppe
 * Provides standard implementations and required interface
 */

import { meshFromFaces } from './meshFromFaces.js';
// Import QuickHull if available globally, otherwise import from utils
let QuickHullFunc;
try {
  // Check if it's already available globally (from libraryInit.js)
  QuickHullFunc = window.QuickHull;
  if (!QuickHullFunc) {
    // Try to import from a relative path
    import('../../utils/QuickHull.js').then(module => {
      QuickHullFunc = module.default;
    }).catch(error => {
      console.error("Error importing QuickHull:", error);
      // Fallback implementation
      QuickHullFunc = (points, options) => {
        console.warn("Using fallback QuickHull (very basic)");
        return [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]];
      };
    });
  }
} catch (e) {
  console.error("Error accessing QuickHull:", e);
  // Fallback implementation
  QuickHullFunc = (points, options) => {
    console.warn("Using fallback QuickHull (very basic)");
    return [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]];
  };
}

class PolytopeFamily {
  /**
   * Create a new PolytopeFamily instance
   * @param {Plugin} plugin - The plugin instance
   * @param {string} name - Name of the polytope family
   */
  constructor(plugin, name = "Unnamed Polytope") {
    this.plugin = plugin;
    this.name = name;
    this.vertices = [];
    this.faces = [];
    this.edges = [];
    this.center = [0, 0, 0];
  }
  
  /**
   * Calculate the center of the polytope from its vertices
   * @returns {number[]} The [x,y,z] coordinates of the center
   */
  calculateCenter() {
    if (this.vertices.length === 0) {
      return [0, 0, 0];
    }
    
    // Sum all vertex coordinates
    const sum = this.vertices.reduce(
      (acc, vertex) => [
        acc[0] + vertex[0],
        acc[1] + vertex[1],
        acc[2] + vertex[2]
      ],
      [0, 0, 0]
    );
    
    // Divide by number of vertices to get center
    const count = this.vertices.length;
    return [
      sum[0] / count,
      sum[1] / count,
      sum[2] / count
    ];
  }
  
  /**
   * Calculate the vertices of the polytope based on current parameters
   * @abstract
   * @returns {number[][]} Array of [x,y,z] vertex coordinates
   */
  calculateVertices() {
    throw new Error("calculateVertices must be implemented by subclasses");
  }
  
  /**
   * Adds family-specific structural parameters to the plugin interface
   * @abstract
   */
  addFamilyParameters() {
    throw new Error("addFamilyParameters must be implemented by subclasses");
  }
  
  /**
   * Generates the polytope geometry based on current parameters
   * 
   */
  createPolytope() {
    this.vertices = this.calculateVertices();
    // Use the function variable we defined at the top
    const faces = QuickHullFunc(this.vertices, { skipTriangulation: true });
    this.faces = faces;

    const edgeSet = new Set();
    this.faces.forEach(face => {
      const n = face.length;
      for (let i = 0; i < n; i++) {
        const a = face[i], b = face[(i + 1) % n];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        edgeSet.add(key);
      }
    });
    this.edges = Array.from(edgeSet, key => key.split('-').map(Number));
  }
  
  /**
   * Creates a THREE.js mesh from the current polytope
   * @returns {THREE.Group} The mesh
   */
  createMesh() {
    // Use the meshFromFaces helper function
    return meshFromFaces(this.plugin, this.vertices, this.faces, this.edges);
  }
}

export default PolytopeFamily;
