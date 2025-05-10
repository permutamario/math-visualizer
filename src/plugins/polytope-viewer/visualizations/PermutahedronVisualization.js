// src/plugins/polytope-viewer/visualizations/PermutahedronVisualization.js
import { BasePolytopeVisualization } from './BasePolytopeVisualization.js';
import { PolytopeUtils } from '../PolytopeUtils.js';

/**
 * Visualization for Type A Permutahedra
 */
export class PermutahedronVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
  }

  /**
   * Get the vertices for this permutahedron
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Get parameters
    const dimension = parameters.dimension || 4;
    const size = parameters.size || 1;
    
    // Generate the permutation vertices
    const vertices = PolytopeUtils.createTypeAPermutahedronVertices(dimension);
    
    // Scale the vertices
    const scaledVertices = PolytopeUtils.scaleVertices(vertices, size);
    
    // Convert to THREE.Vector3 objects
    return PolytopeUtils.verticesToPoints(THREE, scaledVertices);
  }
  
  /**
   * Get any extra meshes for this permutahedron
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Object3D|null} Extra mesh or null
   */
  getExtraMesh(THREE, parameters) {
    // Optional: Add coordinate axes visualization
    if (parameters.showAxes) {
      return new THREE.AxesHelper(parameters.size * 1.5);
    }
    
    return null;
  }
  
  /**
   * Determine if the polytope should be rebuilt after a parameter change
   * @param {Object} parameters - New parameters
   * @param {Object} prevParameters - Previous parameters
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters, prevParameters) {
    // Rebuild if dimension or size changes
    return !prevParameters || 
           parameters.dimension !== prevParameters.dimension ||
           parameters.size !== prevParameters.size;
  }
}