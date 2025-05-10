// src/plugins/polytope-viewer/visualizations/PlatonicVisualization.js
import { BasePolytopeVisualization } from './BasePolytopeVisualization.js';
import { PolytopeUtils } from '../PolytopeUtils.js';

/**
 * Visualization for Platonic solids
 */
export class PlatonicVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
  }

  /**
   * Get the vertices for this platonic solid
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Get parameters
    const solidType = parameters.solidType || 'tetrahedron';
    const size = parameters.size || 1;
    
    // Create geometry based on selected solid type
    let geometry;
    
    switch (solidType) {
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(size, 0);
        break;
      case 'cube':
        geometry = new THREE.BoxGeometry(size, size, size);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(size, 0);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(size, 0);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(size, 0);
        break;
      default:
        // Default to tetrahedron if type is unknown
        geometry = new THREE.TetrahedronGeometry(size, 0);
    }
    
    // Extract unique vertices from the geometry
    const vertices = PolytopeUtils.getUniqueVertices(THREE, geometry);
    
    // Clean up temporary geometry
    geometry.dispose();
    
    return vertices;
  }
  
  /**
   * Get any extra meshes for this platonic solid
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Object3D|null} Extra mesh or null
   */
  getExtraMesh(THREE, parameters) {
    // No extra visualization elements for basic platonic solids
    return null;
  }
  
  /**
   * Determine if the polytope should be rebuilt after a parameter change
   * @param {Object} parameters - New parameters
   * @param {Object} prevParameters - Previous parameters
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters, prevParameters) {
    // Rebuild if solid type or size changes
    return !prevParameters || 
           parameters.solidType !== prevParameters.solidType ||
           parameters.size !== prevParameters.size;
  }
}