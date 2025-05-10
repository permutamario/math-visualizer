// src/plugins/polytope-viewer/visualizations/BasePolytopeVisualization.js
import { Visualization } from '../../../core/Visualization.js';

// Import ConvexGeometry globally when this module is loaded
// This script should ensure ConvexGeometry is available as a global object
const script = document.createElement('script');
script.src = '/vendors/examples/jsm/geometries/ConvexGeometry.js';
script.type = 'module';
script.async = false;
document.head.appendChild(script);

/**
 * Base class for all polytope visualizations
 */
export class BasePolytopeVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Set direct isAnimating property for the RenderingManager
    this.isAnimating = true;
    
    // Store state
    this.state = {
      meshGroup: null,   // Group containing all meshes
      solid: null,       // Main polytope mesh
      edges: null,       // Edge wireframe
      vertices: null,    // Vertex spheres
      extraMesh: null,   // Extra visualization elements
      isAnimating: false // Animation state
    };
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Set animation state based on parameters
    this.state.isAnimating = parameters.rotation || false;
    
    // Clean up any existing meshes
    this.cleanupMeshes();
    
    return true;
  }
  
  /**
   * Get the vertices for this polytope
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Abstract method - must be implemented by subclasses
    console.warn("BasePolytopeVisualization.getVertices() must be implemented by subclasses");
    return [];
  }
  
  /**
   * Get any extra meshes for this polytope
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Object3D|null} Extra mesh or null
   */
  getExtraMesh(THREE, parameters) {
    // Optional method - can be overridden by subclasses
    return null;
  }
  
  /**
   * Render the visualization in 3D
   * @param {Object} THREE - THREE.js library
   * @param {THREE.Scene} scene - THREE.js scene
   * @param {Object} parameters - Current parameters
   */
  async render3D(THREE, scene, parameters) {
    // Check for ConvexGeometry availability
    if (!window.ConvexGeometry) {
      console.error("ConvexGeometry not available. Make sure it's properly loaded.");
      // Create an error mesh to indicate the issue
      const errorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
      );
      scene.add(errorMesh);
      return;
    }
    
    // Remove existing mesh if present
    if (this.state.meshGroup && this.state.meshGroup.parent) {
      scene.remove(this.state.meshGroup);
    }
    
    // Create new meshes if needed
    if (!this.state.meshGroup) {
      try {
        // Create mesh group
        this.state.meshGroup = new THREE.Group();
        
        // Get vertices from subclass
        const vertices = this.getVertices(THREE, parameters);
        
        // Create the polytope from vertices
        this.createPolytope(THREE, vertices, parameters);
        
        // Get any extra mesh from subclass
        const extraMesh = this.getExtraMesh(THREE, parameters);
        if (extraMesh) {
          this.state.extraMesh = extraMesh;
          this.state.meshGroup.add(extraMesh);
        }
      } catch (error) {
        console.error("Error creating polytope:", error);
        
        // Create a fallback error indicator
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ 
          color: 0xff0000,
          wireframe: true 
        });
        const errorMesh = new THREE.Mesh(geometry, material);
        
        // Clear state and add error mesh
        this.cleanupMeshes();
        this.state.meshGroup = new THREE.Group();
        this.state.meshGroup.add(errorMesh);
      }
    }
    
    // Add the mesh group to the scene
    scene.add(this.state.meshGroup);
  }

  /**
   * Create a polytope from vertices
   * @param {Object} THREE - THREE.js library
   * @param {Array<THREE.Vector3>} vertices - Array of vertices
   * @param {Object} parameters - Visualization parameters
   */
  createPolytope(THREE, vertices, parameters) {
    try {
      // Check if we have enough vertices
      if (!vertices || vertices.length < 4) {
        throw new Error("Not enough vertices to create a polytope");
      }
      
      // Create convex hull geometry using global ConvexGeometry
      const hullGeometry = new ConvexGeometry(vertices);
      
      // Create materials
      const faceMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(parameters.faceColor || '#3498db'),
        wireframe: parameters.wireframe || false,
        transparent: (parameters.opacity || 1) < 1,
        opacity: parameters.opacity || 1,
        side: THREE.DoubleSide,
        flatShading: true
      });
      
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: parameters.edgeColor || '#2c3e50',
        linewidth: 1
      });
      
      const vertexMaterial = new THREE.MeshBasicMaterial({
        color: parameters.vertexColor || '#e74c3c'
      });
      
      // Create the main polytope mesh
      this.state.solid = new THREE.Mesh(hullGeometry, faceMaterial);
      this.state.meshGroup.add(this.state.solid);
      
      // Create edges
      const edgesGeometry = new THREE.EdgesGeometry(hullGeometry);
      this.state.edges = new THREE.LineSegments(edgesGeometry, edgeMaterial);
      this.state.meshGroup.add(this.state.edges);
      
      // Create vertex spheres
      this.state.vertices = new THREE.Group();
      
      // Use a shared sphere geometry for all vertices
      const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
      
      // Add a sphere at each vertex position
      const vertexSize = parameters.vertexSize || 0.05;
      
      vertices.forEach(vertex => {
        const sphere = new THREE.Mesh(sphereGeometry, vertexMaterial);
        sphere.position.copy(vertex);
        sphere.scale.set(vertexSize, vertexSize, vertexSize);
        this.state.vertices.add(sphere);
      });
      
      // Set vertex visibility
      this.state.vertices.visible = parameters.showVertices !== false;
      
      // Add vertices to the mesh group
      this.state.meshGroup.add(this.state.vertices);
      
    } catch (error) {
      console.error("Error creating polytope from vertices:", error);
      throw error;
    }
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  animate(deltaTime) {
    // Update rotation if animation is enabled
    if (this.state.isAnimating && this.state.meshGroup) {
      this.state.meshGroup.rotation.y += 0.5 * deltaTime;
      this.state.meshGroup.rotation.x += 0.2 * deltaTime;
      return true; // Request continuous rendering
    }
    
    return false;
  }
  
  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - New parameters
   * @param {Object} prevParameters - Previous parameters
   */
  update(parameters, prevParameters = null) {
    // Update animation state
    if (parameters.rotation !== undefined) {
      this.state.isAnimating = parameters.rotation;
    }
    
    // Update materials
    this.updateMaterials(parameters);
    
    // Update vertex visibility
    this.updateVertexVisibility(parameters);
    
    // Check if we need to rebuild the mesh entirely
    const needsRebuild = this.shouldRebuildOnUpdate(parameters, prevParameters);
    
    if (needsRebuild) {
      // Clean up existing meshes
      this.cleanupMeshes();
    }
  }
  
  /**
   * Determine if the polytope should be rebuilt after a parameter change
   * @param {Object} parameters - New parameters
   * @param {Object} prevParameters - Previous parameters
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters, prevParameters) {
    // Base implementation - subclasses should override
    return false;
  }
  
  /**
   * Update materials with new parameters
   * @param {Object} parameters - New parameters
   */
  updateMaterials(parameters) {
    // Update solid material
    if (this.state.solid && this.state.solid.material) {
      const material = this.state.solid.material;
      
      // Update color
      if (parameters.faceColor !== undefined) {
        material.color.set(parameters.faceColor);
      }
      
      // Update opacity
      if (parameters.opacity !== undefined) {
        material.opacity = parameters.opacity;
        material.transparent = parameters.opacity < 1;
      }
      
      // Update wireframe
      if (parameters.wireframe !== undefined) {
        material.wireframe = parameters.wireframe;
      }
    }
    
    // Update edge material
    if (this.state.edges && this.state.edges.material) {
      if (parameters.edgeColor !== undefined) {
        this.state.edges.material.color.set(parameters.edgeColor);
      }
    }
    
    // Update vertex material
    if (this.state.vertices && this.state.vertices.children) {
      if (parameters.vertexColor !== undefined) {
        this.state.vertices.children.forEach(vertex => {
          if (vertex.material) {
            vertex.material.color.set(parameters.vertexColor);
          }
        });
      }
    }
  }
  
  /**
   * Update vertex visibility and size
   * @param {Object} parameters - New parameters
   */
  updateVertexVisibility(parameters) {
    // Update vertex visibility
    if (this.state.vertices) {
      if (parameters.showVertices !== undefined) {
        this.state.vertices.visible = parameters.showVertices;
      }
      
      // Update vertex size
      if (parameters.vertexSize !== undefined && this.state.vertices.children) {
        const size = parameters.vertexSize;
        this.state.vertices.children.forEach(vertex => {
          vertex.scale.set(size, size, size);
        });
      }
    }
  }
  
  /**
   * Clean up meshes and resources
   */
  cleanupMeshes() {
    // Remove mesh group from scene
    if (this.state.meshGroup && this.state.meshGroup.parent) {
      this.state.meshGroup.parent.remove(this.state.meshGroup);
    }
    
    // Dispose of geometries and materials
    const disposeMesh = (mesh) => {
      if (!mesh) return;
      
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      
      if (mesh.material) {
        // Handle array of materials
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      
      // Handle children recursively
      if (mesh.children && mesh.children.length > 0) {
        [...mesh.children].forEach(child => {
          disposeMesh(child);
        });
      }
    };
    
    // Dispose of main meshes
    disposeMesh(this.state.solid);
    disposeMesh(this.state.edges);
    disposeMesh(this.state.vertices);
    disposeMesh(this.state.extraMesh);
    
    // Reset state
    this.state.meshGroup = null;
    this.state.solid = null;
    this.state.edges = null;
    this.state.vertices = null;
    this.state.extraMesh = null;
  }
  
  /**
   * Clean up resources when visualization is no longer needed
   */
  dispose() {
    // Clean up meshes
    this.cleanupMeshes();
    
    // Reset animation state
    this.state.isAnimating = false;
    this.isAnimating = false;
  }
}