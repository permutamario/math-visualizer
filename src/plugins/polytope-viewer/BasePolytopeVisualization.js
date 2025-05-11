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
   * Initialize the visualization
   * @param {Object} parameters - Visualization parameters
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(parameters) {
    try {
      // Store rotation state from plugin parameters
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
    if (this.plugin && this.plugin.core) {
      // Get RenderModeManager and ColorSchemeManager if available
      const renderModeManager = this.plugin.core.renderModeManager;
      const colorSchemeManager = this.plugin.core.colorSchemeManager;
      
      // Get the current render mode from visualization parameters or advanced parameters
      const renderMode = parameters.renderMode || 'standard';
      
      // Get the selected palette from color scheme manager
      const palette = colorSchemeManager ? 
        colorSchemeManager.getPalette(parameters.colorPalette || 'default') :
        ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
      
      // Create a group to hold the face meshes
      const polytopeGroup = new THREE.Group();
      this.state.meshGroup.add(polytopeGroup);
      
      // Extract faces from hull geometry
      const faces = this.extractFaces(THREE, hullGeometry);
      
      // Store the face meshes to update their materials later if needed
      this.state.faceMeshes = [];
      
      // Check if we have access to the RenderModeManager's material factories
      const useRenderModeManager = renderModeManager && 
                                 renderModeManager.renderModes && 
                                 renderModeManager.materialFactories;
      
      // Get material settings from render mode
      let materialSettings = { type: 'standard', properties: {} };
      if (useRenderModeManager && renderModeManager.renderModes[renderMode]) {
        materialSettings = renderModeManager.renderModes[renderMode].materialSettings;
      }
      
      // Create a mesh for each face with its own material
      faces.forEach((face, i) => {
        // Get the color for this face
        const colorIndex = i % palette.length;
        const faceColor = palette[colorIndex];
        
        // Create material for this face - either using RenderModeManager or fallback
        let faceMaterial;
        
        if (useRenderModeManager) {
          // Use the appropriate material factory from RenderModeManager
          const materialType = materialSettings.type;
          const materialFactory = renderModeManager.materialFactories[materialType];
          
          if (materialFactory) {
            // Create material using the factory
            faceMaterial = materialFactory(
              new THREE.Color(faceColor),
              parameters.opacity || 1.0,
              materialSettings.properties
            );
          } else {
            // Fallback to standard material if factory not found
            faceMaterial = new THREE.MeshStandardMaterial({
              color: new THREE.Color(faceColor),
              wireframe: parameters.wireframe || false,
              transparent: (parameters.opacity || 1) < 1,
              opacity: parameters.opacity || 1,
              side: THREE.DoubleSide,
              flatShading: true
            });
          }
        } else {
          // Fallback if RenderModeManager is not available
          faceMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(faceColor),
            wireframe: parameters.wireframe || false,
            transparent: (parameters.opacity || 1) < 1,
            opacity: parameters.opacity || 1,
            side: THREE.DoubleSide,
            flatShading: true
          });
        }
        
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
      
      // Get vertices from the subclass implementation
      const vertices = this.getVertices(THREE, parameters);
      
      // Create the polytope from vertices
      this.createPolytope(THREE, vertices, parameters);
      
      // Add the mesh group to the scene
      scene.add(this.state.meshGroup);
      
      // Update render mode if RenderModeManager is available
      if (this.plugin && this.plugin.core && this.plugin.core.renderModeManager && parameters.renderMode) {
        const renderModeManager = this.plugin.core.renderModeManager;
        
        // Apply the render mode to configure lighting and update materials
        renderModeManager.applyRenderMode(
          scene,
          this.state.meshGroup,
          parameters.renderMode,
          {
            opacity: parameters.opacity,
            colorPalette: this.plugin.core.colorSchemeManager ?
                          this.plugin.core.colorSchemeManager.getPalette(parameters.colorPalette || 'default') :
                          null
          }
        );
      }
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
   * Update the visualization with changed parameters
   * @param {Object} parameters - Changed parameters only
   */
  update(parameters) {
    // Handle rotation separately
    if (parameters.rotation !== undefined) {
      this.state.isRotating = parameters.rotation;
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
    
    // Handle RenderModeManager-specific updates
    if (this.plugin && this.plugin.core && this.plugin.core.renderModeManager) {
      const renderModeManager = this.plugin.core.renderModeManager;
      
      // Check if we need to update RenderMode-managed properties
      const updateProperties = {};
      let needsPropertyUpdate = false;
      
      // Collect properties that RenderModeManager can update without rebuilding
      if (parameters.opacity !== undefined) {
        updateProperties.opacity = parameters.opacity;
        needsPropertyUpdate = true;
      }
      
      if (parameters.colorPalette !== undefined && this.plugin.core.colorSchemeManager) {
        updateProperties.colorPalette = this.plugin.core.colorSchemeManager.getPalette(
          parameters.colorPalette
        );
        needsPropertyUpdate = true;
      }
      
      // If render mode changed, we need to apply it fully rather than just updating properties
      if (parameters.renderMode !== undefined) {
        // For complete render mode changes, we need access to the scene
        // This requires a full rebuild which will be handled elsewhere
        // Just flag that we should not do a property-only update
        needsPropertyUpdate = false;
      } else if (needsPropertyUpdate && this.state.meshGroup) {
        // Update just the properties that changed without changing the render mode
        renderModeManager.updateProperties(updateProperties, this.state.meshGroup);
      }
    }
    
    // Let subclasses handle their specific parameters
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
           parameters.orbitPoint !== undefined ||
           parameters.renderMode !== undefined; // Add renderMode as a trigger for rebuild
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