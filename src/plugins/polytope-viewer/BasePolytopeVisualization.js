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
    
    // Always use palette mode
    if (this.plugin && this.plugin.core && this.plugin.core.colorSchemeManager) {
      // We will use face-based materials with palette colors
      
      // Get the selected palette from color scheme manager
      const colorSchemeManager = this.plugin.core.colorSchemeManager;
      const palette = colorSchemeManager.getPalette(parameters.colorPalette || 'default');
      
      // Create a group to hold the face meshes
      const polytopeGroup = new THREE.Group();
      this.state.meshGroup.add(polytopeGroup);
      
      // Extract faces from hull geometry
      const faces = this.extractFaces(THREE, hullGeometry);
      
      // Store the face meshes to update their materials later if needed
      this.state.faceMeshes = [];
      
      // Create a mesh for each face with its own material
      faces.forEach((face, i) => {
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
        
        // Create face geometry
        const faceGeometry = new THREE.BufferGeometry();
        
        // Combine all the triangles in this face
        const vertices = [];
        const normals = [];
        const indices = [];
        
        // Add each vertex with its normal
        let vertexCount = 0;
        face.triangles.forEach(triangle => {
          // Add the three vertices of this triangle
          for (let j = 0; j < 3; j++) {
            vertices.push(
              triangle.vertices[j].x,
              triangle.vertices[j].y,
              triangle.vertices[j].z
            );
            
            normals.push(
              triangle.normal.x,
              triangle.normal.y,
              triangle.normal.z
            );
          }
          
          // Add indices for this triangle
          indices.push(
            vertexCount,
            vertexCount + 1,
            vertexCount + 2
          );
          
          vertexCount += 3;
        });
        
        // Set attributes for the face geometry
        faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        faceGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        faceGeometry.setIndex(indices);
        
        // Create mesh for this face
        const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
        
        // Add to group and store reference
        polytopeGroup.add(faceMesh);
        this.state.faceMeshes.push(faceMesh);
      });
      
      // Clean up the original hull geometry
      hullGeometry.dispose();
      
    } else {
      // Fallback to single color if colorSchemeManager is not available
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
   * Extract faces from the geometry
   * A face is a group of connected triangles with the same normal
   * @param {Object} THREE - THREE.js library
   * @param {THREE.BufferGeometry} geometry - Geometry to extract faces from
   * @returns {Array} Array of faces, each containing triangles
   */
  extractFaces(THREE, geometry) {
    const faces = [];
    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    const triangleCount = positionAttribute.count / 3;
    
    // Collect all triangles with their normals
    const triangles = [];
    for (let i = 0; i < triangleCount; i++) {
      const vertices = [];
      let normal = null;
      
      // Get three vertices for this triangle
      for (let j = 0; j < 3; j++) {
        const index = i * 3 + j;
        vertices.push(new THREE.Vector3(
          positionAttribute.getX(index),
          positionAttribute.getY(index),
          positionAttribute.getZ(index)
        ));
        
        // Use the first vertex normal as the face normal
        if (j === 0) {
          normal = new THREE.Vector3(
            normalAttribute.getX(index),
            normalAttribute.getY(index),
            normalAttribute.getZ(index)
          );
        }
      }
      
      triangles.push({
        vertices,
        normal,
        faceIndex: -1 // Will be assigned later
      });
    }
    
    // Group triangles into faces based on their normals
    let faceIndex = 0;
    for (let i = 0; i < triangles.length; i++) {
      const triangle = triangles[i];
      
      // Skip triangles that have already been assigned to a face
      if (triangle.faceIndex >= 0) continue;
      
      // Create a new face with this triangle
      const face = { 
        normal: triangle.normal, 
        triangles: [triangle]
      };
      
      // Mark this triangle as part of this face
      triangle.faceIndex = faceIndex;
      
      // Look for other triangles that belong to this face
      for (let j = i + 1; j < triangles.length; j++) {
        const otherTriangle = triangles[j];
        
        // Skip triangles that have already been assigned
        if (otherTriangle.faceIndex >= 0) continue;
        
        // Check if the normals are similar (within a small threshold)
        if (this.normalsAreSimilar(triangle.normal, otherTriangle.normal, 0.01)) {
          // Add this triangle to the face
          face.triangles.push(otherTriangle);
          otherTriangle.faceIndex = faceIndex;
        }
      }
      
      // Add the completed face to the list
      faces.push(face);
      faceIndex++;
    }
    
    return faces;
  }
  
  /**
   * Check if two normals are similar (within a threshold)
   * @param {THREE.Vector3} normal1 - First normal
   * @param {THREE.Vector3} normal2 - Second normal
   * @param {number} threshold - Threshold for similarity
   * @returns {boolean} Whether the normals are similar
   */
  normalsAreSimilar(normal1, normal2, threshold = 0.01) {
    // Calculate dot product of normalized vectors
    // Dot product of unit vectors equals cosine of angle between them
    // For parallel vectors, dot product is 1
    // For perpendicular vectors, dot product is 0
    // We want vectors to be nearly parallel, so dot product should be close to 1
    const dot = normal1.dot(normal2);
    return Math.abs(1 - dot) < threshold;
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
    
    // Handle color palette changes
    if (parameters.colorPalette !== undefined && 
        this.state.faceMeshes && 
        this.state.faceMeshes.length > 0 &&
        this.plugin && 
        this.plugin.core && 
        this.plugin.core.colorSchemeManager) {
      
      const colorSchemeManager = this.plugin.core.colorSchemeManager;
      const palette = colorSchemeManager.getPalette(parameters.colorPalette || 'default');
      
      // Update each face mesh with a color from the palette
      this.state.faceMeshes.forEach((faceMesh, i) => {
        const colorIndex = i % palette.length;
        const faceColor = palette[colorIndex];
        
        // Update material color
        if (faceMesh.material) {
          faceMesh.material.color.set(faceColor);
        }
      });
    }
    
    // Update wireframe setting if changed
    if (parameters.wireframe !== undefined && 
        this.state.faceMeshes && 
        this.state.faceMeshes.length > 0) {
      
      this.state.faceMeshes.forEach(faceMesh => {
        if (faceMesh.material) {
          faceMesh.material.wireframe = parameters.wireframe;
        }
      });
    }
    
    // Update opacity if changed
    if (parameters.opacity !== undefined && 
        this.state.faceMeshes && 
        this.state.faceMeshes.length > 0) {
      
      this.state.faceMeshes.forEach(faceMesh => {
        if (faceMesh.material) {
          faceMesh.material.transparent = parameters.opacity < 1;
          faceMesh.material.opacity = parameters.opacity;
        }
      });
    }
    
    // Let specific implementations handle their own parameters
    this.handleVisSpecificParameters(parameters);
    
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
  handleVisSpecificParameters(parameters) {
    // Default implementation does nothing
    // This is to be overridden by subclasses
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