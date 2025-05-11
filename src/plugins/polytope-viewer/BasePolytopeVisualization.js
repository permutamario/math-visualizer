// src/plugins/polytope-viewer/BasePolytopeVisualization.js
import { Visualization } from '../../core/Visualization.js';

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
      maxRadius: 1.0     // Maximum radius of the polytope
    };
  }

  /**
   * Get base parameters common to all polytopes
   */
  static getBaseParameters() {
    return {
      structural: [],
      visual: [
        {
          id: 'wireframe',
          type: 'checkbox',
          label: 'Wireframe',
          default: false
        },
        {
          id: 'rotation',
          type: 'checkbox',
          label: 'Auto-rotate',
          default: false
        },
        {
          id: 'showEdges',
          type: 'checkbox',
          label: 'Show Edges',
          default: false
        },
        {
          id: 'showVertices',
          type: 'checkbox',
          label: 'Show Vertices',
          default: false
        },
        {
          id: 'vertexSize',
          type: 'slider',
          label: 'Vertex Size',
          min: 0.01,
          max: 0.2,
          step: 0.01,
          default: 0.05
        },
        {
          id: 'faceColor',
          type: 'color',
          label: 'Face Color',
          default: '#3498db'
        },
        {
          id: 'edgeColor',
          type: 'color',
          label: 'Edge Color',
          default: '#2c3e50'
        },
        {
          id: 'vertexColor',
          type: 'color',
          label: 'Vertex Color',
          default: '#e74c3c'
        },
        {
          id: 'opacity',
          type: 'slider',
          label: 'Opacity',
          min: 0.1,
          max: 1,
          step: 0.1,
          default: 1
        }
      ]
    };
  }

  /**
   * Get specific parameters for this visualization
   * Override in subclasses
   */
  static getParameters() {
    return {
      structural: [],
      visual: []
    };
  }

  /**
   * Get the vertices for this polytope
   * Override in subclasses
   */
  getVertices(THREE, parameters) {
    // Default implementation returns empty array
    return [];
  }

  /**
   * Initialize the visualization
   */
  async initialize(parameters) {
    this.state.isAnimating = parameters.rotation || false;
    this.cleanupMeshes();
    return true;
  }

  /**
   * Render the visualization in 3D
   */
  render3D(THREE, scene, parameters) {
    // Remove existing mesh if present
    if (this.state.meshGroup && this.state.meshGroup.parent) {
      scene.remove(this.state.meshGroup);
    }
    
    // Create new mesh
    this.state.meshGroup = new THREE.Group();
    
    try {
      // Get vertices from the subclass
      const vertices = this.getVertices(THREE, parameters);
      
      // Create the polytope from vertices
      this.createPolytope(THREE, vertices, parameters);
      
    } catch (error) {
      console.error("Error creating polytope:", error);
      
      // Create a fallback error indicator
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        wireframe: true 
      });
      this.state.meshGroup.add(new THREE.Mesh(geometry, material));
    }
    
    // Add the mesh group to the scene
    scene.add(this.state.meshGroup);
  }

  /**
   * Create a polytope from vertices
   */
  createPolytope(THREE, vertices, parameters) {
    if (!vertices || vertices.length < 4) {
      throw new Error("Not enough vertices to create a polytope");
    }
    
    // Process the vertices to center them
    vertices = this.centerVertices(THREE, vertices);
    
    // Create convex hull geometry using global ConvexGeometry
    const hullGeometry = new window.ConvexGeometry(vertices);
    
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
      const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
      
      // Add a sphere at each vertex position
      vertices.forEach(vertex => {
        const sphere = new THREE.Mesh(sphereGeometry, vertexMaterial);
        sphere.position.copy(vertex);
        sphere.scale.set(vertexSize, vertexSize, vertexSize);
        this.state.meshGroup.add(sphere);
      });
    }
  }

  /**
   * Center vertices around the origin
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
   */
  animate(deltaTime) {
    // Only animate if rotation is enabled
    if (this.state.isAnimating && this.state.meshGroup) {
      this.state.meshGroup.rotation.y += 0.5 * deltaTime;
      this.state.meshGroup.rotation.x += 0.2 * deltaTime;
      return true;
    }
    return false;
  }

  /**
   * Handle parameter updates
   */
  update(parameters) {
    if (parameters.rotation !== undefined) {
      this.state.isAnimating = parameters.rotation;
    }
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
    this.state.isAnimating = false;
    this.isAnimating = false;
  }
}
