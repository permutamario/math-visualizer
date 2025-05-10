// src/plugins/polytope-viewer/visualizations/BasePolytopeVisualization.js
import { Visualization } from '../../../core/Visualization.js';
import { PolytopeUtils } from '../PolytopeUtils.js';

/**
 * Base class for all polytope visualizations
 */
export class BasePolytopeVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Animation state
    this.isAnimating = true; // For RenderingManager
    
    // Store 3D objects
    this.state = {
      meshGroup: null,    // Group containing all meshes
      meshes: {           // References to individual mesh components
        solid: null,      // The polytope itself
        edges: null,      // Edge wireframe
        vertices: null    // Vertex spheres
      },
      materials: {        // References to materials
        face: null,
        edge: null,
        vertex: null
      },
      isAnimating: false, // Animation enabled
      rotationSpeed: 0.5  // Rotation speed
    };
  }

  /**
   * Initialize the visualization (abstract method)
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Base implementation - should be overridden by subclasses
    this.state.isAnimating = parameters.rotation;
    return true;
  }
  
  /**
   * Clean up resources when visualization is no longer needed
   */
  dispose() {
    // Clean up Three.js objects
    this.cleanupMeshes();
    
    // Reset animation state
    this.state.isAnimating = false;
    this.isAnimating = false;
  }
  
  /**
   * Build a polytope from vertex data
   * @param {Object} THREE - THREE.js library
   * @param {Array} vertices - Array of vertex coordinates or THREE.Vector3
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Group} Group containing polytope meshes
   */
  async buildPolytope(THREE, vertices, parameters) {
    // Clean up any existing meshes
    this.cleanupMeshes();
    
    // Create the mesh group
    const group = new THREE.Group();
    
    try {
      // Convert vertices to THREE.Vector3 if needed
      const points = Array.isArray(vertices[0]) ? 
        PolytopeUtils.verticesToPoints(THREE, vertices) : vertices;
      
      // Ensure we have enough points for a 3D convex hull
      if (points.length < 4) {
        throw new Error('Not enough vertices to create a 3D polytope');
      }
      
      // Create a convex hull geometry from the points
      const hullGeometry = await PolytopeUtils.createConvexHullGeometry(THREE, points);
      
      // Create materials
      const faceMaterial = this.createFaceMaterial(THREE, parameters);
      const edgeMaterial = this.createEdgeMaterial(THREE, parameters);
      
      // Create face mesh
      const faceMesh = new THREE.Mesh(hullGeometry, faceMaterial);
      
      // Create edge mesh
      const edgesGeometry = new THREE.EdgesGeometry(hullGeometry);
      const edgesMesh = new THREE.LineSegments(edgesGeometry, edgeMaterial);
      
      // Create vertex spheres
      const vertexGroup = this.createVertexSpheres(THREE, points, parameters);
      
      // Add meshes to group
      group.add(faceMesh);
      group.add(edgesMesh);
      group.add(vertexGroup);
      
      // Store references
      this.state.meshGroup = group;
      this.state.meshes.solid = faceMesh;
      this.state.meshes.edges = edgesMesh;
      this.state.meshes.vertices = vertexGroup;
    } catch (error) {
      console.error('Error building polytope:', error);
      
      // Create fallback if there's an error
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        wireframe: true 
      });
      const errorMesh = new THREE.Mesh(geometry, material);
      
      group.add(errorMesh);
      this.state.meshGroup = group;
    }
    
    return group;
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  animate(deltaTime) {
    // Update rotation if enabled
    if (this.state.isAnimating && this.state.meshGroup) {
      this.state.meshGroup.rotation.y += this.state.rotationSpeed * deltaTime;
      this.state.meshGroup.rotation.x += this.state.rotationSpeed * 0.2 * deltaTime;
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
    
    // Update materials if they exist
    this.updateMaterials(parameters);
    
    // Update vertex visibility
    this.updateVertexVisibility(parameters);
    
    // Subclasses should call this and then implement their specific updates
  }
  
  /**
   * Update materials with new parameters
   * @param {Object} parameters - New parameters
   */
  updateMaterials(parameters) {
    // Update face material
    if (this.state.materials.face) {
      if (parameters.faceColor !== undefined) {
        this.state.materials.face.color.set(parameters.faceColor);
      }
      
      if (parameters.opacity !== undefined) {
        this.state.materials.face.opacity = parameters.opacity;
        this.state.materials.face.transparent = parameters.opacity < 1;
      }
      
      if (parameters.wireframe !== undefined) {
        this.state.materials.face.wireframe = parameters.wireframe;
      }
    }
    
    // Update edge material
    if (this.state.materials.edge && parameters.edgeColor !== undefined) {
      this.state.materials.edge.color.set(parameters.edgeColor);
    }
    
    // Update vertex material
    if (this.state.materials.vertex && parameters.vertexColor !== undefined) {
      this.state.materials.vertex.color.set(parameters.vertexColor);
    }
  }
  
  /**
   * Update vertex visibility and size
   * @param {Object} parameters - New parameters
   */
  updateVertexVisibility(parameters) {
    if (this.state.meshes.vertices) {
      // Update vertex visibility
      if (parameters.showVertices !== undefined) {
        this.state.meshes.vertices.visible = parameters.showVertices;
      }
      
      // Update vertex size
      if (parameters.vertexSize !== undefined && this.state.meshes.vertices.children) {
        this.state.meshes.vertices.children.forEach(vertex => {
          vertex.scale.set(
            parameters.vertexSize,
            parameters.vertexSize,
            parameters.vertexSize
          );
        });
      }
    }
  }
  
  /**
   * Cleanup meshes and materials
   */
  cleanupMeshes() {
    // Remove meshes from scene if they exist
    if (this.state.meshGroup && this.state.meshGroup.parent) {
      this.state.meshGroup.parent.remove(this.state.meshGroup);
    }
    
    // Dispose of geometries and materials
    for (const meshName in this.state.meshes) {
      const mesh = this.state.meshes[meshName];
      if (mesh) {
        // If it's a group with children
        if (mesh.children && mesh.children.length > 0) {
          mesh.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        }
        // Single mesh
        else if (mesh.geometry) {
          mesh.geometry.dispose();
        }
      }
    }
    
    // Dispose of materials
    for (const materialName in this.state.materials) {
      const material = this.state.materials[materialName];
      if (material) material.dispose();
    }
    
    // Reset state
    this.state.meshGroup = null;
    this.state.meshes = {
      solid: null,
      edges: null,
      vertices: null
    };
    this.state.materials = {
      face: null,
      edge: null,
      vertex: null
    };
  }
  
  /**
   * Create material for polytope faces
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Material} Face material
   */
  createFaceMaterial(THREE, parameters) {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(parameters.faceColor || '#3498db'),
      wireframe: parameters.wireframe || false,
      transparent: (parameters.opacity || 1) < 1,
      opacity: parameters.opacity || 1,
      side: THREE.DoubleSide,
      flatShading: true
    });
    
    this.state.materials.face = material;
    return material;
  }
  
  /**
   * Create material for polytope edges
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Material} Edge material
   */
  createEdgeMaterial(THREE, parameters) {
    const material = new THREE.LineBasicMaterial({
      color: parameters.edgeColor || '#2c3e50',
      linewidth: 1
    });
    
    this.state.materials.edge = material;
    return material;
  }
  
  /**
   * Create material for vertices
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Material} Vertex material
   */
  createVertexMaterial(THREE, parameters) {
    const material = new THREE.MeshBasicMaterial({
      color: parameters.vertexColor || '#e74c3c'
    });
    
    this.state.materials.vertex = material;
    return material;
  }
  
  /**
   * Create vertex spheres at each vertex position
   * @param {Object} THREE - THREE.js library
   * @param {Array} vertices - Array of vertex positions
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Group} Group containing vertex meshes
   */
  createVertexSpheres(THREE, vertices, parameters) {
    const vertexSize = parameters.vertexSize || 0.05;
    const vertexGroup = new THREE.Group();
    
    // Create a shared geometry for all vertices
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    
    // Create material
    const material = this.createVertexMaterial(THREE, parameters);
    
    // Create a sphere at each vertex
    vertices.forEach(vertex => {
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.set(vertex.x, vertex.y, vertex.z);
      sphere.scale.set(vertexSize, vertexSize, vertexSize);
      vertexGroup.add(sphere);
    });
    
    // Set visibility based on parameters
    vertexGroup.visible = parameters.showVertices !== false;
    
    return vertexGroup;
  }
  
  /**
   * Render the visualization in 3D (abstract method)
   * @param {Object} THREE - THREE.js library
   * @param {THREE.Scene} scene - THREE.js scene
   * @param {Object} parameters - Current parameters
   */
  render3D(THREE, scene, parameters) {
    // Abstract method to be implemented by subclasses
    console.warn("BasePolytopeVisualization.render3D() should be implemented by subclasses");
  }
}