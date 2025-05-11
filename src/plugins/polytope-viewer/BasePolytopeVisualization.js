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
    faceMeshes: [],    // Individual face meshes for palette coloring
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
  
  // Check if we should use a palette
  const usePalette = parameters.usePalette === 'true';
  
  if (usePalette && this.plugin && this.plugin.core && this.plugin.core.colorSchemeManager) {
    // We will use face-based materials with palette colors
    
    // Get the selected palette from color scheme manager
    const colorSchemeManager = this.plugin.core.colorSchemeManager;
    const palette = colorSchemeManager.getPalette(parameters.colorPalette || 'default');
    
    // Create a group to hold the face meshes
    const polytopeGroup = new THREE.Group();
    this.state.meshGroup.add(polytopeGroup);
    
    // Get all the faces from the hull geometry
    const positionAttribute = hullGeometry.getAttribute('position');
    const normalAttribute = hullGeometry.getAttribute('normal');
    const faceCount = positionAttribute.count / 3;
    
    // Store the face meshes to update their materials later if needed
    this.state.faceMeshes = [];
    
    // Create a mesh for each face with its own material
    for (let i = 0; i < faceCount; i++) {
      // Get the color for this face
      const colorIndex = i % palette.length;
      const faceColor = palette[colorIndex];
      
      // Create material for this face
      const faceMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(faceColor),
        wireframe: parameters.wireframe || false,
        transparent: (parameters.opacity || 1) < 1,
        opacity: parameters.opacity || 1,
        side: THREE.DoubleSide,
        flatShading: true
      });
      
      // Create a geometry for just this face
      const faceGeometry = new THREE.BufferGeometry();
      
      // Extract vertices for this face (3 vertices per face)
      const vertices = [];
      const normals = [];
      
      for (let j = 0; j < 3; j++) {
        const index = i * 3 + j;
        
        vertices.push(
          positionAttribute.getX(index),
          positionAttribute.getY(index),
          positionAttribute.getZ(index)
        );
        
        normals.push(
          normalAttribute.getX(index),
          normalAttribute.getY(index),
          normalAttribute.getZ(index)
        );
      }
      
      // Set attributes for the face geometry
      faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      faceGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      
      // Create mesh for this face
      const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
      
      // Add to group and store reference
      polytopeGroup.add(faceMesh);
      this.state.faceMeshes.push(faceMesh);
    }
    
    // Clean up the original hull geometry
    hullGeometry.dispose();
    
  } else {
    // Use standard single-color material for the entire polytope
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
  }
  
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
 * Handle visualization-specific parameter updates
 * Override in subclasses to handle specific parameters
 * @param {Object} parameters - Updated parameters (only changed ones)
 */
handleParameterUpdate(parameters) {
  // Handle color palette changes
  if ((parameters.usePalette !== undefined || 
      parameters.colorPalette !== undefined ||
      parameters.wireframe !== undefined ||
      parameters.opacity !== undefined) &&
      this.state.faceMeshes && 
      this.state.faceMeshes.length > 0) {
    
    if (parameters.usePalette === 'true' || 
        (this.plugin.parameters.usePalette === 'true' && parameters.colorPalette)) {
      
      // Get the selected palette from color scheme manager
      const colorSchemeManager = this.plugin.core.colorSchemeManager;
      const palette = colorSchemeManager.getPalette(
        parameters.colorPalette || this.plugin.parameters.colorPalette || 'default'
      );
      
      // Update each face mesh with a color from the palette
      this.state.faceMeshes.forEach((faceMesh, i) => {
        const colorIndex = i % palette.length;
        const faceColor = palette[colorIndex];
        
        // Update material color
        if (faceMesh.material) {
          faceMesh.material.color.set(faceColor);
          
          // Update other properties if they've changed
          if (parameters.wireframe !== undefined) {
            faceMesh.material.wireframe = parameters.wireframe;
          }
          
          if (parameters.opacity !== undefined) {
            faceMesh.material.transparent = parameters.opacity < 1;
            faceMesh.material.opacity = parameters.opacity;
          }
        }
      });
    } else if (parameters.usePalette === 'none') {
      // Switch back to single color
      const faceColor = this.plugin.parameters.faceColor || '#3498db';
      
      // Update each face mesh with the single color
      this.state.faceMeshes.forEach(faceMesh => {
        if (faceMesh.material) {
          faceMesh.material.color.set(faceColor);
          
          // Update other properties if they've changed
          if (parameters.wireframe !== undefined) {
            faceMesh.material.wireframe = parameters.wireframe;
          }
          
          if (parameters.opacity !== undefined) {
            faceMesh.material.transparent = parameters.opacity < 1;
            faceMesh.material.opacity = parameters.opacity;
          }
        }
      });
    }
  }
  
  // Default implementation (empty for base class)
  // Subclasses should override this method for specific parameter handling
}
  /**
   * Clean up meshes and resources
   */
  /**
 * Clean up meshes and resources
 */
cleanupMeshes() {
  if (!this.state.meshGroup) return;
  
  // Clear the face meshes reference
  if (this.state.faceMeshes) {
    this.state.faceMeshes = [];
  }
  
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