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
    
    // Check if solid type has changed
    const needsRebuild = !prevParameters || 
                        parameters.solidType !== prevParameters.solidType ||
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
    
    // Create new solid if needed
    if (!this.state.meshGroup) {
      try {
        // Get vertices for the selected platonic solid
        const vertices = this.getPlatonicSolidVertices(THREE, parameters);
        
        // Use the base class method to build the polytope from vertices
        this.state.meshGroup = await this.buildPolytope(THREE, vertices, parameters);
      } catch (error) {
        console.error("Error creating platonic solid:", error);
        
        // Create a simple error indicator
        this.state.meshGroup = new THREE.Group();
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ 
          color: 0xff0000, 
          wireframe: true 
        });
        const errorMesh = new THREE.Mesh(geometry, material);
        this.state.meshGroup.add(errorMesh);
      }
    }
    
    // Add mesh to scene
    scene.add(this.state.meshGroup);
  }
  
  /**
   * Get vertices for the selected platonic solid
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getPlatonicSolidVertices(THREE, parameters) {
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
}