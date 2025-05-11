// src/plugins/polytope-viewer/BasePolytopeVisualization.js
import { Visualization } from '../../core/Visualization.js';

/**
 * Base class for all polytope visualizations
 * Provides common functionality and parameters
 */
export class BasePolytopeVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Set direct isAnimating property for the RenderingManager
    this.isAnimating = true;
    
    // Store visualization state
    this.state = {
      meshGroup: null,   // Group containing all meshes
      maxRadius: 1.0,    // Maximum radius of the polytope
      isRotating: false  // Whether the polytope is rotating
    };
  }

  /**
   * Get common parameters for all polytope visualizations
   * This is used by the plugin to build the parameter schema
   * @returns {Object} Parameter schema with structural and visual parameters
   */
  static getParameters() {
    return {
      structural: [],
      visual: []
    };
  }

  /**
   * Get the vertices for this polytope
   * Must be overridden by subclasses
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array} Array of vertices as THREE.Vector3
   */
  getVertices(THREE, parameters) {
    // Default implementation returns empty array
    // Subclasses must override this method
    return [];
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Visualization parameters
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(parameters) {
    try {
      // Store rotation state
      this.state.isRotating = parameters.rotation || false;
      
      // Clean up any existing meshes
      this.cleanupMeshes();
      
      // Trigger a render after initialization
      if (this.plugin && this.plugin.core && this.plugin.core.renderingManager) {
        this.plugin.core.renderingManager.requestRender();
      }
      
      return true;
    } catch (error) {
      console.error("Error initializing polytope visualization:", error);
      return false;
    }
  }

  /**
   * Create a polytope from vertices
   * @param {Object} THREE - THREE.js library
   * @param {Array} vertices - Array of vertices as THREE.Vector3
   * @param {Object} parameters - Visualization parameters
   */
  createPolytope(THREE, vertices, parameters) {
    if (!vertices || vertices.length < 4) {
      throw new Error("Not enough vertices to create a polytope");
    }
    
    // Process the vertices to center them
    const centeredVertices = this.centerVertices(THREE, vertices);
    
    // Create convex hull geometry using ConvexGeometry
    // (which should be globally available via the window object)
    if (!window.ConvexGeometry) {
      throw new Error("ConvexGeometry is not available. Make sure it's properly imported.");
    }
    
    const hullGeometry = new window.ConvexGeometry(centeredVertices);
    
    // Create materials
    const faceMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(parameters.faceColor || '#3498db'),
      wireframe: parameters.wireframe || false,
      transparent: (parameters.opacity || 1) < 1,
      opacity: parameters.opacity || 1,
      side: THREE.DoubleSide,
      flatShading: true
    });
    
    // Create the main polytope mesh
    const solid = new THREE.Mesh(hullGeometry, faceMaterial);
    this.state.meshGroup.add(solid);
    
    // Add edges if needed
    if (parameters.showEdges) {
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: parameters.edgeColor || '#2c3e50',
        linewidth: 1
      });
      
      const edgesGeometry = new THREE.EdgesGeometry(hullGeometry);
      const edges = new THREE.LineSegments(edgesGeometry, edgeMaterial);
      this.state.meshGroup.add(edges);
    }
    
    // Add vertices if needed
    if (parameters.showVertices) {
      const vertexMaterial = new THREE.MeshBasicMaterial({
        color: parameters.vertexColor || '#e74c3c'
      });
      
      const vertexSize = parameters.vertexSize || 0.05;
      const sphereGeometry = new THREE.SphereGeometry(vertexSize, 16, 16);
      
      // Add a sphere at each vertex position
      centeredVertices.forEach(vertex => {
        const sphere = new THREE.Mesh(sphereGeometry, vertexMaterial);
        sphere.position.copy(vertex);
        this.state.meshGroup.add(sphere);
      });
    }
  }

  /**
   * Render the visualization in 3D
   * @param {Object} THREE - THREE.js library
   * @param {Object} scene - THREE.js scene
   * @param {Object} parameters - Current parameters
   */
  render3D(THREE, scene, parameters) {
    try {
      // Remove existing mesh if present
      if (this.state.meshGroup && scene.children.includes(this.state.meshGroup)) {
        scene.remove(this.state.meshGroup);
      }
      
      // Create new mesh group
      this.state.meshGroup = new THREE.Group();
      
      // Get vertices from the subclass
      const vertices = this.getVertices(THREE, parameters);
      
      // Create the polytope from vertices
      this.createPolytope(THREE, vertices, parameters);
      
      // Add the mesh group to the scene
      scene.add(this.state.meshGroup);
    } catch (error) {
      console.error("Error rendering polytope:", error);
      
      // Create a fallback error indicator
      if (!this.state.meshGroup) {
        this.state.meshGroup = new THREE.Group();
      }
      
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        wireframe: true 
      });
      this.state.meshGroup.add(new THREE.Mesh(geometry, material));
      
      // Add the error mesh to the scene
      scene.add(this.state.meshGroup);
    }
  }

  /**
   * Center vertices around the origin
   * @param {Object} THREE - THREE.js library
   * @param {Array} vertices - Array of vertices as THREE.Vector3
   * @returns {Array} Centered vertices
   */
  centerVertices(THREE, vertices) {
    if (!vertices || vertices.length === 0) return vertices;
    
    // Calculate the center
    const center = new THREE.Vector3();
    vertices.forEach(v => center.add(v));
    center.divideScalar(vertices.length);
    
    // Center the vertices
    return vertices.map(v => new THREE.Vector3(
      v.x - center.x,
      v.y - center.y,
      v.z - center.z
    ));
  }

  /**
   * Update animation
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @returns {boolean} Whether a render is needed
   */
  animate(deltaTime) {
    // Only animate if rotation is enabled
    if (this.state.isRotating && this.state.meshGroup) {
      this.state.meshGroup.rotation.y += 0.5 * deltaTime;
      this.state.meshGroup.rotation.x += 0.2 * deltaTime;
      return true;
    }
    return false;
  }

  /**
   * Handle parameter updates - only the changed parameters are passed
   * @param {Object} parameters - Updated parameters (only changed ones)
   */
  update(parameters) {
    // Handle rotation separately
    if (parameters.rotation !== undefined) {
      this.state.isRotating = parameters.rotation;
    }
    
    // Let specific implementations handle their own parameters
    this.handleParameterUpdate(parameters);
    
    // Request a render if needed
    if (this.plugin && this.plugin.core && this.plugin.core.renderingManager) {
      this.plugin.core.renderingManager.requestRender();
    }
  }
  
  /**
   * Handle visualization-specific parameter updates
   * Override in subclasses to handle specific parameters
   * @param {Object} parameters - Updated parameters (only changed ones)
   */
  handleParameterUpdate(parameters) {
    // Default implementation does nothing
    // Subclasses should override this method
  }

  /**
   * Determine if the polytope should be rebuilt after a parameter change
   * Override in subclasses that need special rebuild logic
   * @param {Object} parameters - New parameters (only changed ones)
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters) {
    // Default implementation rebuilds for any of these core parameter changes
    return parameters.visualizationType !== undefined || 
           parameters.solidType !== undefined ||
           parameters.rootType !== undefined ||
           parameters.orbitPoint !== undefined;
  }

  /**
   * Clean up meshes and resources
   */
  cleanupMeshes() {
    if (!this.state.meshGroup) return;
    
    // Remove mesh group from scene
    if (this.state.meshGroup.parent) {
      this.state.meshGroup.parent.remove(this.state.meshGroup);
    }
    
    // Dispose of geometries and materials
    this.state.meshGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    this.state.meshGroup = null;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.cleanupMeshes();
    this.state.isRotating = false;
    this.isAnimating = false;
  }
}