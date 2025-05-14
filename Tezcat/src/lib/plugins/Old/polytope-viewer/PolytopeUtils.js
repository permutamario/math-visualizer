// src/plugins/polytope-viewer/PolytopeUtils.js

/**
 * Common utilities for polytope visualizations
 */
export class PolytopeUtils {
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
   * Calculate the center (mean) of a set of vertices
   * @param {Array<THREE.Vector3>} vertices - Array of vertices
   * @returns {THREE.Vector3} Center point
   */
  static calculateCenter(THREE, vertices) {
    if (!vertices || vertices.length === 0) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    const sum = vertices.reduce((acc, v) => {
      return acc.add(v);
    }, new THREE.Vector3(0, 0, 0));
    
    return sum.divideScalar(vertices.length);
  }

  /**
   * Center a set of vertices around the origin
   * @param {Object} THREE - THREE.js library
   * @param {Array<THREE.Vector3>} vertices - Array of vertices
   * @returns {Array<THREE.Vector3>} Centered vertices
   */
  static centerVertices(THREE, vertices) {
    if (!vertices || vertices.length === 0) {
      return [];
    }
    
    const center = this.calculateCenter(THREE, vertices);
    
    return vertices.map(v => {
      // Create a new vector to avoid modifying the original
      return new THREE.Vector3(
        v.x - center.x,
        v.y - center.y,
        v.z - center.z
      );
    });
  }

  /**
   * Calculate the maximum distance from center to any vertex
   * @param {Object} THREE - THREE.js library
   * @param {Array<THREE.Vector3>} vertices - Array of vertices
   * @returns {number} Maximum distance
   */
  static calculateMaxDistance(THREE, vertices) {
    if (!vertices || vertices.length === 0) {
      return 1; // Default radius if no vertices
    }
    
    // First center the vertices if they're not already centered
    const centeredVertices = this.centerVertices(THREE, vertices);
    
    // Find the maximum distance from the origin
    return centeredVertices.reduce((maxDist, v) => {
      const dist = v.length();
      return dist > maxDist ? dist : maxDist;
    }, 0);
  }

  /**
   * Normalize vertices to fit within a unit sphere
   * @param {Object} THREE - THREE.js library
   * @param {Array<THREE.Vector3>} vertices - Array of vertices
   * @returns {Array<THREE.Vector3>} Normalized vertices
   */
  static normalizeVertices(THREE, vertices) {
    if (!vertices || vertices.length === 0) {
      return [];
    }
    
    // First center the vertices
    const centeredVertices = this.centerVertices(THREE, vertices);
    
    // Find the maximum distance from the origin
    const maxDistance = this.calculateMaxDistance(THREE, centeredVertices);
    
    if (maxDistance === 0) {
      return centeredVertices;
    }
    
    // Scale all vertices to fit within a unit sphere
    return centeredVertices.map(v => {
      // Create a new vector to avoid modifying the original
      return new THREE.Vector3(
        v.x / maxDistance,
        v.y / maxDistance,
        v.z / maxDistance
      );
    });
  }
}
