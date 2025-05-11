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
}
