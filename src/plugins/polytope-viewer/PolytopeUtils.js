// src/plugins/polytope-viewer/PolytopeUtils.js

/**
 * Common utilities for polytope visualizations
 */
export class PolytopeUtils {
  /**
   * Project points onto a hyperplane where coordinates sum to zero
   * @param {Array<Array<number>>} points - Array of coordinate arrays
   * @returns {Array<Array<number>>} Projected points
   */
  static projectToHyperplane(points) {
    return points.map(point => {
      // Calculate the center (average of coordinates)
      const sum = point.reduce((a, b) => a + b, 0);
      const avg = sum / point.length;
      
      // Project by subtracting the average from each coordinate
      return point.map(coord => coord - avg);
    });
  }
  
  /**
   * Scale vertices by a factor
   * @param {Array<Array<number>>} vertices - Array of vertex coordinates
   * @param {number} scale - Scale factor
   * @returns {Array<Array<number>>} Scaled vertices
   */
  static scaleVertices(vertices, scale) {
    return vertices.map(vertex => 
      vertex.map(coord => coord * scale)
    );
  }
  
  /**
   * Convert array coordinates to THREE.Vector3 points
   * @param {Object} THREE - THREE.js library
   * @param {Array<Array<number>>} vertices - Array of vertex coordinates
   * @returns {Array<THREE.Vector3>} Array of THREE.Vector3 points
   */
  static verticesToPoints(THREE, vertices) {
    return vertices.map(v => new THREE.Vector3(
      v[0] || 0,
      v[1] || 0, 
      v[2] || 0
    ));
  }
  
  /**
   * Get unique vertices from a THREE.js geometry
   * @param {Object} THREE - THREE.js library
   * @param {THREE.BufferGeometry} geometry - Geometry to extract vertices from
   * @param {number} precision - Decimal precision for uniqueness check
   * @returns {Array<THREE.Vector3>} Array of unique vertices
   */
  static getUniqueVertices(THREE, geometry, precision = 5) {
    const vertices = [];
    const uniqueVertices = new Set();
    const positionAttribute = geometry.getAttribute('position');
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const vertexKey = `${positionAttribute.getX(i).toFixed(precision)},${
                          positionAttribute.getY(i).toFixed(precision)},${
                          positionAttribute.getZ(i).toFixed(precision)}`;
      
      if (!uniqueVertices.has(vertexKey)) {
        uniqueVertices.add(vertexKey);
        vertices.push(new THREE.Vector3(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        ));
      }
    }
    
    return vertices;
  }
  
  /**
   * Generate all permutations of [1,2,...,n]
   * @param {number} n - The dimension parameter (n=4 gives S_4 permutations)
   * @returns {Array<Array<number>>} Array of permutation arrays
   */
  static generatePermutations(n) {
    // Create the initial array [1,2,...,n]
    const initial = Array.from({ length: n }, (_, i) => i + 1);
    
    // Generate all permutations using Heap's algorithm
    const permutations = [];
    
    // Helper function for Heap's algorithm
    const generate = (arr, k) => {
      if (k === 1) {
        permutations.push([...arr]);
        return;
      }
      
      generate(arr, k - 1);
      
      for (let i = 0; i < k - 1; i++) {
        if (k % 2 === 0) {
          // Swap i with k-1
          [arr[i], arr[k - 1]] = [arr[k - 1], arr[i]];
        } else {
          // Swap 0 with k-1
          [arr[0], arr[k - 1]] = [arr[k - 1], arr[0]];
        }
        
        generate(arr, k - 1);
      }
    };
    
    generate(initial, n);
    
    return permutations;
  }
  
  /**
   * Create the vertices of a type A permutahedron
   * @param {number} n - Dimension parameter (n=4 gives the 3D permutahedron)
   * @returns {Array<Array<number>>} Projected vertex coordinates
   */
  static createTypeAPermutahedronVertices(n) {
    // Generate permutations as vertices
    const vertices = this.generatePermutations(n);
    
    // Project onto the hyperplane where coordinates sum to zero
    return this.projectToHyperplane(vertices);
  }
}