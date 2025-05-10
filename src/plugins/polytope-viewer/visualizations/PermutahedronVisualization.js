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
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Call parent initialize
    await super.initialize(parameters);
    
    // Clean up any existing meshes
    this.cleanupMeshes();
    
    // Set animation state based on parameters
    this.state.isAnimating = parameters.rotation || false;
    
    return true;
  }

  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - New parameters
   * @param {Object} prevParameters - Previous parameters
   */
  update(parameters, prevParameters = null) {
    // Call parent update
    super.update(parameters, prevParameters);
    
    // Check if dimension or size has changed
    const needsRebuild = !prevParameters || 
                        parameters.dimension !== prevParameters.dimension ||
                        parameters.size !== prevParameters.size;
                        
    // Mark for rebuild if needed
    if (needsRebuild) {
      // Clean up existing meshes
      this.cleanupMeshes();
    }
  }

  /**
   * Render the visualization in 3D
   * @param {Object} THREE - THREE.js library
   * @param {THREE.Scene} scene - THREE.js scene
   * @param {Object} parameters - Current parameters
   */
  async render3D(THREE, scene, parameters) {
    // Remove existing mesh if present
    if (this.state.meshGroup) {
      scene.remove(this.state.meshGroup);
    }
    
    // Create new permutahedron if needed
    if (!this.state.meshGroup) {
      // Generate vertices for the permutahedron
      const vertices = this.generatePermutahedronVertices(parameters);
      
      // Use the base class method to build the polytope from vertices
      await this.buildPolytope(THREE, vertices, parameters);
      
      // Add permutahedron-specific visualizations if needed
      this.addPermutahedronSpecificVisualizations(THREE, parameters);
    }
    
    // Add mesh to scene
    scene.add(this.state.meshGroup);
  }
  
  /**
   * Generate vertices for the permutahedron
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<Array<number>>} Array of vertex coordinates
   */
  generatePermutahedronVertices(parameters) {
    // Get parameters
    const dimension = parameters.dimension || 4;
    const size = parameters.size || 1;
    
    // Generate the permutation vertices
    const vertices = PolytopeUtils.createTypeAPermutahedronVertices(dimension);
    
    // Scale the vertices
    return PolytopeUtils.scaleVertices(vertices, size);
  }
  
  /**
   * Add permutahedron-specific visualizations
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   */
  addPermutahedronSpecificVisualizations(THREE, parameters) {
    // No additional visualizations for now, but could include:
    // - Coordinate axes
    // - Permutation labels
    // - Highlighting specific permutations
    // - Showing permutation group structure
  }
}