// src/core/Plugin3D.js

import { BasePlugin } from './BasePlugin.js';

/**
 * Specialized plugin class for 3D visualizations using THREE.js
 * Provides resource management, object creation, and scene control
 * with automatic cleanup and best practices enforcement
 */
export class Plugin3D extends BasePlugin {
  /**
   * Create a Plugin3D instance
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    super(core);
    
    // Store rendering type
    this.renderingType = '3d';
    
    // Resource tracking for automatic cleanup
    this._meshes = new Set();
    this._groups = new Set();
    this._geometries = new Set();
    this._materials = new Set();
    this._textures = new Set();
    this._lights = new Set();
    
    // Main mesh group for the visualization (what render modes are applied to)
    this.mainMeshGroup = null;
    
    // Current render mode state
    this._currentRenderMode = null;
    this._currentRenderOptions = null;
  }
  
  // ======== RESOURCE REGISTRATION ========
  
  /**
   * Register a mesh for automatic cleanup
   * @param {THREE.Mesh} mesh - Mesh to register
   * @returns {THREE.Mesh} The registered mesh
   */
  addMesh(mesh) {
    if (!mesh) return null;
    
    this._meshes.add(mesh);
    this.addToScene(mesh);
    return mesh;
  }
  
  /**
   * Register a THREE.Group for automatic cleanup
   * @param {THREE.Group} group - Group to register
   * @returns {THREE.Group} The registered group
   */
  addGroup(group) {
    if (!group) return null;
    
    this._groups.add(group);
    return group;
  }
  
  /**
   * Register geometry for automatic cleanup
   * @param {THREE.BufferGeometry} geometry - Geometry to register
   * @returns {THREE.BufferGeometry} The registered geometry
   */
  addGeometry(geometry) {
    if (!geometry) return null;
    
    this._geometries.add(geometry);
    return geometry;
  }
  
  /**
   * Register material for automatic cleanup
   * @param {THREE.Material} material - Material to register
   * @returns {THREE.Material} The registered material
   */
  addMaterial(material) {
    if (!material) return null;
    
    this._materials.add(material);
    return material;
  }
  
  /**
   * Register texture for automatic cleanup
   * @param {THREE.Texture} texture - Texture to register
   * @returns {THREE.Texture} The registered texture
   */
  addTexture(texture) {
    if (!texture) return null;
    
    this._textures.add(texture);
    return texture;
  }
  
  /**
   * Register light for automatic cleanup
   * @param {THREE.Light} light - Light to register
   * @returns {THREE.Light} The registered light
   */
  addLight(light) {
    if (!light) return null;
    
    this._lights.add(light);
    this.addToScene(light);
    return light;
  }
  
  // ======== OBJECT CREATION ========
  
  /**
   * Create a box mesh with automatic registration
   * @param {Object} options - Box geometry options
   * @param {number} options.width - Width of the box
   * @param {number} options.height - Height of the box
   * @param {number} options.depth - Depth of the box
   * @param {number} options.widthSegments - Width segments (default: 1)
   * @param {number} options.heightSegments - Height segments (default: 1)
   * @param {number} options.depthSegments - Depth segments (default: 1)
   * @param {THREE.Material} material - Material for the mesh
   * @returns {THREE.Mesh} Created and registered box mesh
   */
  createBox(options, material) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Default options
    const geometryOptions = {
      width: options.width || 1,
      height: options.height || 1,
      depth: options.depth || 1,
      widthSegments: options.widthSegments || 1,
      heightSegments: options.heightSegments || 1,
      depthSegments: options.depthSegments || 1
    };
    
    // Create geometry
    const geometry = new THREE.BoxGeometry(
      geometryOptions.width,
      geometryOptions.height,
      geometryOptions.depth,
      geometryOptions.widthSegments,
      geometryOptions.heightSegments,
      geometryOptions.depthSegments
    );
    
    // Register geometry
    this.addGeometry(geometry);
    
    // Create and register mesh
    const mesh = new THREE.Mesh(geometry, material);
    return this.addMesh(mesh);
  }
  
  /**
   * Create a sphere mesh with automatic registration
   * @param {Object} options - Sphere geometry options
   * @param {number} options.radius - Sphere radius
   * @param {number} options.widthSegments - Width segments (default: 32)
   * @param {number} options.heightSegments - Height segments (default: 16)
   * @param {THREE.Material} material - Material for the mesh
   * @returns {THREE.Mesh} Created and registered sphere mesh
   */
  createSphere(options, material) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Default options
    const geometryOptions = {
      radius: options.radius || 1,
      widthSegments: options.widthSegments || 32,
      heightSegments: options.heightSegments || 16
    };
    
    // Create geometry
    const geometry = new THREE.SphereGeometry(
      geometryOptions.radius,
      geometryOptions.widthSegments,
      geometryOptions.heightSegments
    );
    
    // Register geometry
    this.addGeometry(geometry);
    
    // Create and register mesh
    const mesh = new THREE.Mesh(geometry, material);
    return this.addMesh(mesh);
  }
  
  /**
   * Create a cylinder mesh with automatic registration
   * @param {Object} options - Cylinder geometry options
   * @param {number} options.radiusTop - Radius of top (default: 1)
   * @param {number} options.radiusBottom - Radius of bottom (default: 1)
   * @param {number} options.height - Height of cylinder (default: 1)
   * @param {number} options.radialSegments - Radial segments (default: 32)
   * @param {number} options.heightSegments - Height segments (default: 1)
   * @param {boolean} options.openEnded - Whether ends are open (default: false)
   * @param {THREE.Material} material - Material for the mesh
   * @returns {THREE.Mesh} Created and registered cylinder mesh
   */
  createCylinder(options, material) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Default options
    const geometryOptions = {
      radiusTop: options.radiusTop !== undefined ? options.radiusTop : 1,
      radiusBottom: options.radiusBottom !== undefined ? options.radiusBottom : 1,
      height: options.height || 1,
      radialSegments: options.radialSegments || 32,
      heightSegments: options.heightSegments || 1,
      openEnded: options.openEnded || false
    };
    
    // Create geometry
    const geometry = new THREE.CylinderGeometry(
      geometryOptions.radiusTop,
      geometryOptions.radiusBottom,
      geometryOptions.height,
      geometryOptions.radialSegments,
      geometryOptions.heightSegments,
      geometryOptions.openEnded
    );
    
    // Register geometry
    this.addGeometry(geometry);
    
    // Create and register mesh
    const mesh = new THREE.Mesh(geometry, material);
    return this.addMesh(mesh);
  }
  
  /**
   * Create a plane mesh with automatic registration
   * @param {Object} options - Plane geometry options
   * @param {number} options.width - Width of plane (default: 1)
   * @param {number} options.height - Height of plane (default: 1)
   * @param {number} options.widthSegments - Width segments (default: 1)
   * @param {number} options.heightSegments - Height segments (default: 1)
   * @param {THREE.Material} material - Material for the mesh
   * @returns {THREE.Mesh} Created and registered plane mesh
   */
  createPlane(options, material) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Default options
    const geometryOptions = {
      width: options.width || 1,
      height: options.height || 1,
      widthSegments: options.widthSegments || 1,
      heightSegments: options.heightSegments || 1
    };
    
    // Create geometry
    const geometry = new THREE.PlaneGeometry(
      geometryOptions.width,
      geometryOptions.height,
      geometryOptions.widthSegments,
      geometryOptions.heightSegments
    );
    
    // Register geometry
    this.addGeometry(geometry);
    
    // Create and register mesh
    const mesh = new THREE.Mesh(geometry, material);
    return this.addMesh(mesh);
  }
  
  /**
   * Create line segments for rendering edges or wireframes
   * @param {Array<THREE.Vector3>} vertices - Array of vertices
   * @param {THREE.Material} material - Line material
   * @returns {THREE.LineSegments} Created and registered line segments
   */
  createLineSegments(vertices, material) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Create geometry from vertices
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    
    // Register geometry
    this.addGeometry(geometry);
    
    // Create and register line segments
    const lineSegments = new THREE.LineSegments(geometry, material);
    return this.addMesh(lineSegments);
  }
  
  // ======== LIGHTING ========
  
  /**
   * Create and register an ambient light
   * @param {Object} options - Light options
   * @param {number|string} options.color - Light color (default: 0xffffff)
   * @param {number} options.intensity - Light intensity (default: 1)
   * @returns {THREE.AmbientLight} Created and registered ambient light
   */
  createAmbientLight(options = {}) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Default options
    const lightOptions = {
      color: options.color !== undefined ? options.color : 0xffffff,
      intensity: options.intensity !== undefined ? options.intensity : 1
    };
    
    // Create and register light
    const light = new THREE.AmbientLight(
      lightOptions.color,
      lightOptions.intensity
    );
    
    return this.addLight(light);
  }
  
  /**
   * Create and register a directional light
   * @param {Object} options - Light options
   * @param {number|string} options.color - Light color (default: 0xffffff)
   * @param {number} options.intensity - Light intensity (default: 1)
   * @param {Array<number>} options.position - Light position [x, y, z] (default: [1, 1, 1])
   * @param {boolean} options.castShadow - Whether light casts shadows (default: false)
   * @returns {THREE.DirectionalLight} Created and registered directional light
   */
  createDirectionalLight(options = {}) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Default options
    const lightOptions = {
      color: options.color !== undefined ? options.color : 0xffffff,
      intensity: options.intensity !== undefined ? options.intensity : 1,
      position: options.position || [1, 1, 1],
      castShadow: options.castShadow || false
    };
    
    // Create light
    const light = new THREE.DirectionalLight(
      lightOptions.color,
      lightOptions.intensity
    );
    
    // Set position
    light.position.set(...lightOptions.position);
    
    // Set shadow properties
    light.castShadow = lightOptions.castShadow;
    
    // Register and return
    return this.addLight(light);
  }
  
  /**
   * Create and register a point light
   * @param {Object} options - Light options
   * @param {number|string} options.color - Light color (default: 0xffffff)
   * @param {number} options.intensity - Light intensity (default: 1)
   * @param {number} options.distance - Light distance (default: 0)
   * @param {number} options.decay - Light decay (default: 2)
   * @param {Array<number>} options.position - Light position [x, y, z] (default: [0, 0, 0])
   * @param {boolean} options.castShadow - Whether light casts shadows (default: false)
   * @returns {THREE.PointLight} Created and registered point light
   */
  createPointLight(options = {}) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Default options
    const lightOptions = {
      color: options.color !== undefined ? options.color : 0xffffff,
      intensity: options.intensity !== undefined ? options.intensity : 1,
      distance: options.distance !== undefined ? options.distance : 0,
      decay: options.decay !== undefined ? options.decay : 2,
      position: options.position || [0, 0, 0],
      castShadow: options.castShadow || false
    };
    
    // Create light
    const light = new THREE.PointLight(
      lightOptions.color,
      lightOptions.intensity,
      lightOptions.distance,
      lightOptions.decay
    );
    
    // Set position
    light.position.set(...lightOptions.position);
    
    // Set shadow properties
    light.castShadow = lightOptions.castShadow;
    
    // Register and return
    return this.addLight(light);
  }
  
  /**
   * Create and register a spot light
   * @param {Object} options - Light options
   * @param {number|string} options.color - Light color (default: 0xffffff)
   * @param {number} options.intensity - Light intensity (default: 1)
   * @param {number} options.distance - Light distance (default: 0)
   * @param {number} options.angle - Light angle in radians (default: Math.PI/3)
   * @param {number} options.penumbra - Light penumbra (default: 0)
   * @param {number} options.decay - Light decay (default: 2)
   * @param {Array<number>} options.position - Light position [x, y, z] (default: [0, 1, 0])
   * @param {boolean} options.castShadow - Whether light casts shadows (default: false)
   * @returns {THREE.SpotLight} Created and registered spot light
   */
  createSpotLight(options = {}) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Default options
    const lightOptions = {
      color: options.color !== undefined ? options.color : 0xffffff,
      intensity: options.intensity !== undefined ? options.intensity : 1,
      distance: options.distance !== undefined ? options.distance : 0,
      angle: options.angle !== undefined ? options.angle : Math.PI/3,
      penumbra: options.penumbra !== undefined ? options.penumbra : 0,
      decay: options.decay !== undefined ? options.decay : 2,
      position: options.position || [0, 1, 0],
      castShadow: options.castShadow || false
    };
    
    // Create light
    const light = new THREE.SpotLight(
      lightOptions.color,
      lightOptions.intensity,
      lightOptions.distance,
      lightOptions.angle,
      lightOptions.penumbra,
      lightOptions.decay
    );
    
    // Set position
    light.position.set(...lightOptions.position);
    
    // Set shadow properties
    light.castShadow = lightOptions.castShadow;
    
    // Register and return
    return this.addLight(light);
  }
  
  // ======== MATERIAL CREATION ========
  
  /**
   * Create and register a standard material
   * @param {Object} options - Material options
   * @param {number|string} options.color - Color (default: 0xffffff)
   * @param {number} options.roughness - Roughness (default: 0.5)
   * @param {number} options.metalness - Metalness (default: 0.5)
   * @param {number} options.opacity - Opacity (default: 1.0)
   * @param {boolean} options.transparent - Whether material is transparent (default: false)
   * @param {THREE.Texture} options.map - Color map texture
   * @returns {THREE.MeshStandardMaterial} Created and registered material
   */
  createStandardMaterial(options = {}) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: options.color !== undefined ? options.color : 0xffffff,
      roughness: options.roughness !== undefined ? options.roughness : 0.5,
      metalness: options.metalness !== undefined ? options.metalness : 0.5,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      transparent: options.opacity !== undefined ? options.opacity < 1.0 : options.transparent || false,
      map: options.map || null,
      side: options.side || THREE.DoubleSide
    });
    
    // Register the material
    return this.addMaterial(material);
  }
  
  /**
   * Create and register a basic material
   * @param {Object} options - Material options
   * @param {number|string} options.color - Color (default: 0xffffff)
   * @param {number} options.opacity - Opacity (default: 1.0)
   * @param {boolean} options.transparent - Whether material is transparent (default: false)
   * @param {boolean} options.wireframe - Whether to render as wireframe (default: false)
   * @param {THREE.Texture} options.map - Color map texture
   * @returns {THREE.MeshBasicMaterial} Created and registered material
   */
  createBasicMaterial(options = {}) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Create material
    const material = new THREE.MeshBasicMaterial({
      color: options.color !== undefined ? options.color : 0xffffff,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      transparent: options.opacity !== undefined ? options.opacity < 1.0 : options.transparent || false,
      wireframe: options.wireframe || false,
      map: options.map || null,
      side: options.side || THREE.DoubleSide
    });
    
    // Register the material
    return this.addMaterial(material);
  }
  
  /**
   * Create and register a line material for edges
   * @param {Object} options - Material options
   * @param {number|string} options.color - Color (default: 0x000000)
   * @param {number} options.linewidth - Line width (default: 1)
   * @param {number} options.opacity - Opacity (default: 1.0)
   * @param {boolean} options.transparent - Whether material is transparent (default: false)
   * @returns {THREE.LineBasicMaterial} Created and registered material
   */
  createLineMaterial(options = {}) {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Create material
    const material = new THREE.LineBasicMaterial({
      color: options.color !== undefined ? options.color : 0x000000,
      linewidth: options.linewidth !== undefined ? options.linewidth : 1,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      transparent: options.opacity !== undefined ? options.opacity < 1.0 : options.transparent || false
    });
    
    // Register the material
    return this.addMaterial(material);
  }
  
  // ======== SCENE MANAGEMENT ========
  
  /**
   * Add an object to the scene
   * @param {THREE.Object3D} object - Object to add
   * @returns {THREE.Object3D} The added object
   */
  addToScene(object) {
    if (!object) return null;
    if (!this.renderEnv || !this.renderEnv.scene) {
      console.error("Scene not available in rendering environment");
      return object;
    }
    
    this.renderEnv.scene.add(object);
    return object;
  }
  
  /**
   * Remove an object from the scene
   * @param {THREE.Object3D} object - Object to remove
   * @returns {boolean} Whether removal was successful
   */
  removeFromScene(object) {
    if (!object) return false;
    if (!this.renderEnv || !this.renderEnv.scene) {
      console.error("Scene not available in rendering environment");
      return false;
    }
    
    this.renderEnv.scene.remove(object);
    return true;
  }
  
  /**
   * Set the main mesh group for the visualization
   * This is the group that render modes are applied to
   * Automatically removes any previous main mesh group
   * @param {THREE.Group|THREE.Mesh} meshGroup - Mesh group to set as main
   * @returns {THREE.Group|THREE.Mesh} The set mesh group
   */
  setMainMesh(meshGroup) {
    if (!meshGroup) return null;
    
    // Remove existing main mesh group if any
    if (this.mainMeshGroup) {
      this.removeFromScene(this.mainMeshGroup);
    }
    
    // Set new main mesh group
    this.mainMeshGroup = meshGroup;
    
    // Add to scene
    this.addToScene(this.mainMeshGroup);
    
    // Reapply render mode if one was previously set
    if (this._currentRenderMode) {
      this.applyRenderMode(this._currentRenderMode, this._currentRenderOptions);
    }
    
    return this.mainMeshGroup;
  }
  
  /**
   * Create an empty group and register it
   * @returns {THREE.Group} Created and registered group
   */
  createGroup() {
    if (!this.renderEnv || !this.renderEnv.THREE) {
      console.error("THREE.js not available in rendering environment");
      return null;
    }
    
    const THREE = this.renderEnv.THREE;
    
    // Create group
    const group = new THREE.Group();
    
    // Register group
    return this.addGroup(group);
  }
  
  // ======== CAMERA CONTROL ========
  
  /**
   * Set the camera position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {boolean} Whether camera position was set
   */
  setCameraPosition(x, y, z) {
    if (!this.renderEnv || !this.renderEnv.camera) {
      console.error("Camera not available in rendering environment");
      return false;
    }
    
    this.renderEnv.camera.position.set(x, y, z);
    return true;
  }
  
  /**
   * Look at a specific point with the camera
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @returns {boolean} Whether camera look-at was set
   */
  lookAt(x, y, z) {
    if (!this.renderEnv || !this.renderEnv.camera) {
      console.error("Camera not available in rendering environment");
      return false;
    }
    
    this.renderEnv.camera.lookAt(x, y, z);
    return true;
  }
  
  /**
   * Reset the camera to its initial position
   * @returns {boolean} Whether camera was reset
   */
  resetCamera() {
    if (!this.renderEnv || !this.renderEnv.resetCamera) {
      console.error("Reset camera function not available in rendering environment");
      return false;
    }
    
    this.renderEnv.resetCamera();
    return true;
  }
  
  // ======== RENDER MODE INTEGRATION ========
  
  /**
   * Apply a render mode to the main mesh group
   * @param {string} mode - Render mode name
   * @param {Object} options - Render mode options
   * @param {number} options.opacity - Opacity value
   * @param {Array<string>} options.colorPalette - Color palette
   * @returns {boolean} Whether render mode was applied
   */
  applyRenderMode(mode, options = {}) {
    if (!this.core || !this.core.renderModeManager) {
      console.error("Render mode manager not available");
      return false;
    }
    
    if (!this.mainMeshGroup) {
      console.warn("No main mesh group available to apply render mode");
      return false;
    }
    
    // Store current render mode and options for reapplication
    this._currentRenderMode = mode;
    this._currentRenderOptions = options;
    
    // Process color palette if provided as string
    if (typeof options.colorPalette === 'string' && this.core.colorSchemeManager) {
      options.colorPalette = this.core.colorSchemeManager.getPalette(options.colorPalette);
    }
    
    // Apply render mode
    return this.core.renderModeManager.applyRenderMode(
      this.renderEnv.scene,
      this.mainMeshGroup,
      mode,
      options
    );
  }
  
  /**
   * Update render mode properties
   * @param {Object} properties - Properties to update
   * @param {number} properties.opacity - New opacity value
   * @param {Array<string>} properties.colorPalette - New color palette
   * @returns {boolean} Whether properties were updated
   */
  updateRenderProperties(properties) {
    if (!this.core || !this.core.renderModeManager) {
      console.error("Render mode manager not available");
      return false;
    }
    
    if (!this.mainMeshGroup) {
      console.warn("No main mesh group available to update render properties");
      return false;
    }
    
    // Process color palette if provided as string
    if (typeof properties.colorPalette === 'string' && this.core.colorSchemeManager) {
      properties.colorPalette = this.core.colorSchemeManager.getPalette(properties.colorPalette);
    }
    
    // Update render properties
    this.core.renderModeManager.updateProperties(properties, this.mainMeshGroup);
    
    // Update stored options
    if (this._currentRenderOptions) {
      if (properties.opacity !== undefined) {
        this._currentRenderOptions.opacity = properties.opacity;
      }
      if (properties.colorPalette !== undefined) {
        this._currentRenderOptions.colorPalette = properties.colorPalette;
      }
    }
    
    return true;
  }
  
  // ======== RENDER CONTROL ========
  
  /**
   * Trigger a render update
   * This is useful for manual updates when automatic rendering is not active
   * @returns {boolean} Whether render was triggered
   */
  render() {
    if (!this.renderEnv || !this.renderEnv.renderer) {
      return false;
    }
    
    // Use the environment's render method if available
    if (typeof this.renderEnv.render === 'function') {
      this.renderEnv.render(this.core.getAllParameters());
      return true;
    }
    
    // Fall back to direct rendering
    if (this.renderEnv.renderer && this.renderEnv.scene && this.renderEnv.camera) {
      this.renderEnv.renderer.render(this.renderEnv.scene, this.renderEnv.camera);
      return true;
    }
    
    return false;
  }
  
  /**
   * Refresh the visualization (alias for render)
   */
  refresh() {
    this.render();
  }
  
  // ======== CLEANUP ========
  
  /**
   * Unload the plugin and clean up all resources
   * @returns {Promise<boolean>} Whether unloading was successful
   */
  async unload() {
    try {
      // Cleanup mesh group
      if (this.mainMeshGroup) {
        this.removeFromScene(this.mainMeshGroup);
        this.mainMeshGroup = null;
      }
      
      // Clean up meshes
      this._meshes.forEach(mesh => {
        if (mesh) {
          this.removeFromScene(mesh);
        }
      });
      
      // Clean up lights
      this._lights.forEach(light => {
        if (light) {
          this.removeFromScene(light);
        }
      });
      
      // Clean up materials
      this._materials.forEach(material => {
        if (material && typeof material.dispose === 'function') {
          material.dispose();
        }
      });
      
      // Clean up geometries
      this._geometries.forEach(geometry => {
        if (geometry && typeof geometry.dispose === 'function') {
          geometry.dispose();
        }
      });
      
      // Clean up textures
      this._textures.forEach(texture => {
        if (texture && typeof texture.dispose === 'function') {
          texture.dispose();
        }
      });
      
      // Clear resource tracking sets
      this._meshes.clear();
      this._groups.clear();
      this._geometries.clear();
      this._materials.clear();
      this._textures.clear();
      this._lights.clear();
      
      // Reset render mode state
      this._currentRenderMode = null;
      this._currentRenderOptions = null;
      
      // Let parent class handle remaining cleanup
      return await super.unload();
    } catch (error) {
      console.error(`Error unloading plugin ${this.id}:`, error);
      return false;
    }
  }
}
