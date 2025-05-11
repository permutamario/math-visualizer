// src/rendering/RenderModeManager.js

import * as THREE from 'three';

/**
 * Manages rendering modes that combine material and lighting settings
 * for a cohesive visual style across the application.
 */
export class RenderModeManager {
  /**
   * Create a new RenderModeManager
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    this.core = core;
    
    // Track current mode elements for cleanup
    this.currentLights = [];
    this.currentEffects = [];
    this.currentMode = 'standard';
    
    // Define render modes (material + lighting + effects)
    this.renderModes = {
      // Standard balanced mode - good default
      standard: {
        id: 'standard',
        name: 'Standard',
        description: 'Balanced lighting with standard materials',
        materialSettings: {
          type: 'standard',
          properties: {
            roughness: 0.5,
            metalness: 0.2
          }
        },
        lighting: () => this._createBalancedLighting(),
        effects: {
          shadows: false
        }
      },
      
      
      // Professional studio look
      studio: {
        id: 'studio',
        name: 'Studio',
        description: 'Professional lighting with glossy materials',
        materialSettings: {
          type: 'glossy',
          properties: {
            roughness: 0.1,
            metalness: 0.3
          }
        },
        lighting: () => this._createStudioLighting(),
        effects: {
          shadows: true
        }
      },
      
      // Metallic look with dramatic lighting
      metallic: {
        id: 'metallic',
        name: 'Metallic',
        description: 'Metallic surfaces with dramatic lighting',
        materialSettings: {
          type: 'metallic',
          properties: {
            roughness: 0.1,
            metalness: 1.0,
            reflectivity: 1.0
          }
        },
        lighting: () => this._createContrastLighting(),
        effects: {
          shadows: true
        }
      },
      
      // Matte look with soft lighting
      matte: {
        id: 'matte',
        name: 'Matte',
        description: 'Matte surfaces with soft diffuse lighting',
        materialSettings: {
          type: 'matte',
          properties: {
            roughness: 1.0,
            metalness: 0.0
          }
        },
        lighting: () => this._createSoftLighting(),
        effects: {
          shadows: false
        }
      },
      
      // Technical schematic-style rendering
      technical: {
        id: 'technical',
        name: 'Technical',
        description: 'Technical schematic-style rendering',
        materialSettings: {
          type: 'flatShaded',
          properties: {
            flatShading: true
          }
        },
        lighting: () => this._createDirectionalLighting(),
        effects: {
          shadows: false,
          grid: true
        }
      },
      
      // Glass-like transparent materials
      glass: {
        id: 'glass',
        name: 'Glass',
        description: 'Transparent glass-like materials',
        materialSettings: {
          type: 'glass',
          properties: {
            transmission: 0.9,
            roughness: 0.0
          }
        },
        lighting: () => this._createMultiPointLighting(),
        effects: {
          shadows: false
        }
      },
      
      // Toon-shaded cartoon style
      toon: {
        id: 'toon',
        name: 'Toon',
        description: 'Cel-shaded cartoon style',
        materialSettings: {
          type: 'toon',
          properties: {}
        },
        lighting: () => this._createContrastLighting(),
        effects: {
          outlines: true
        }
      },
      
      // Neon glow effect
      neon: {
        id: 'neon',
        name: 'Neon',
        description: 'Glowing neon materials on dark background',
        materialSettings: {
          type: 'neon',
          properties: {
            emissiveIntensity: 1.5
          }
        },
        lighting: () => this._createDarkLighting(),
        effects: {
          bloom: true
        }
      },
      
      // Lightweight mobile-friendly mode
      mobile: {
        id: 'mobile',
        name: 'Mobile',
        description: 'Performance-optimized mode for mobile devices',
        materialSettings: {
          type: 'basic',
          properties: {}
        },
        lighting: () => this._createAmbientLighting(),
        effects: {
          shadows: false
        }
      }
    };
    
    // Material factory functions
    this.materialFactories = {
      // Standard balanced PBR material
      standard: (color, opacity, properties = {}) => {
        return new THREE.MeshStandardMaterial({
          color,
          roughness: properties.roughness !== undefined ? properties.roughness : 0.5,
          metalness: properties.metalness !== undefined ? properties.metalness : 0.2,
          opacity,
          transparent: opacity < 1.0,
          side: THREE.DoubleSide
        });
      },
      
      // Basic non-PBR material for performance
      basic: (color, opacity) => {
        return new THREE.MeshBasicMaterial({
          color,
          opacity,
          transparent: opacity < 1.0,
          side: THREE.DoubleSide
        });
      },
      
      // Wireframe material
      wireframe: (color, opacity) => {
        return new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
          opacity,
          transparent: opacity < 1.0,
          side: THREE.DoubleSide
        });
      },
      
      // Glossy PBR material
      glossy: (color, opacity, properties = {}) => {
        return new THREE.MeshStandardMaterial({
          color,
          roughness: properties.roughness !== undefined ? properties.roughness : 0.1,
          metalness: properties.metalness !== undefined ? properties.metalness : 0.3,
          opacity,
          transparent: opacity < 1.0,
          side: THREE.DoubleSide
        });
      },
      
      // Metallic PBR material
      metallic: (color, opacity, properties = {}) => {
        const material = new THREE.MeshPhysicalMaterial({
          color,
          roughness: properties.roughness !== undefined ? properties.roughness : 0.1,
          metalness: properties.metalness !== undefined ? properties.metalness : 1.0,
          reflectivity: properties.reflectivity !== undefined ? properties.reflectivity : 1.0,
          opacity,
          transparent: opacity < 1.0,
          side: THREE.DoubleSide
        });
        
        // Add emissive properties for better visualization
        material.emissive = color.clone().multiplyScalar(0.2);
        material.emissiveIntensity = 0.3;
        
        return material;
      },
      
      // Matte non-reflective material
      matte: (color, opacity, properties = {}) => {
        return new THREE.MeshStandardMaterial({
          color,
          roughness: properties.roughness !== undefined ? properties.roughness : 1.0,
          metalness: properties.metalness !== undefined ? properties.metalness : 0.0,
          opacity,
          transparent: opacity < 1.0,
          side: THREE.DoubleSide
        });
      },
      
      // Glass-like transparent material
      glass: (color, opacity, properties = {}) => {
        return new THREE.MeshPhysicalMaterial({
          color,
          roughness: properties.roughness !== undefined ? properties.roughness : 0.0,
          metalness: properties.metalness !== undefined ? properties.metalness : 0.0,
          transmission: properties.transmission !== undefined ? properties.transmission : 0.9,
          transparent: true,
          opacity,
          side: THREE.DoubleSide
        });
      },
      
      // Toon/cel-shaded material
      toon: (color, opacity) => {
        return new THREE.MeshToonMaterial({
          color,
          opacity,
          transparent: opacity < 1.0,
          side: THREE.DoubleSide
        });
      },
      
      // Self-illuminated neon material
      neon: (color, opacity, properties = {}) => {
        const material = new THREE.MeshBasicMaterial({
          color,
          opacity,
          transparent: opacity < 1.0,
          side: THREE.DoubleSide
        });
        
        material.emissive = color.clone();
        material.emissiveIntensity = properties.emissiveIntensity !== undefined ? 
          properties.emissiveIntensity : 1.5;
          
        return material;
      },
      
      // Normal-mapped flat-shaded PBR
      flatShaded: (color, opacity) => {
        return new THREE.MeshStandardMaterial({
          color,
          roughness: 0.5,
          metalness: 0.0,
          flatShading: true,
          opacity,
          transparent: opacity < 1.0,
          side: THREE.DoubleSide
        });
      }
    };
  }
  
  /**
   * Get a list of available render modes for UI
   * @param {boolean} includeDescriptions - Whether to include descriptions
   * @returns {Array<Object>} Array of mode objects with id, name, (and description)
   */
  getAvailableModes(includeDescriptions = false) {
    return Object.values(this.renderModes).map(mode => {
      const modeInfo = {
        value: mode.id,
        label: mode.name
      };
      
      if (includeDescriptions) {
        modeInfo.description = mode.description;
      }
      
      return modeInfo;
    });
  }
  
  /**
   * Apply a render mode to a scene and mesh group
   * @param {THREE.Scene} scene - Scene to apply lighting to
   * @param {THREE.Group} meshGroup - Mesh group to apply materials to
   * @param {string} modeName - Name of the render mode to apply
   * @param {Object} options - Additional options
   * @param {number} options.opacity - Override opacity value
   * @param {THREE.Color} options.baseColor - Base color for single-color materials
   * @param {Array<string>} options.colorPalette - Color palette for multi-color materials
   * @returns {boolean} Whether the mode was applied successfully
   */
  applyRenderMode(scene, meshGroup, modeName, options = {}) {
    // Clean up previous mode elements
    this._cleanupPreviousMode(scene);
    
    // Get requested mode (or fall back to standard)
    const mode = this.renderModes[modeName] || this.renderModes['standard'];
    this.currentMode = mode.id;
    
    // Apply lighting
    const lights = mode.lighting();
    lights.forEach(light => {
      scene.add(light);
      this.currentLights.push(light);
    });
    
    // Apply materials if mesh group is provided
    if (meshGroup && meshGroup.children) {
      this._applyMaterialsToGroup(meshGroup, mode.materialSettings, options);
    }
    
    // Apply additional effects
    if (mode.effects) {
      this._applyEffects(scene, mode.effects);
    }
    
    // Store reference to scene for later updates
    this.currentScene = scene;
    
    return true;
  }
  
  /**
   * Update rendering properties without changing the mode
   * @param {Object} properties - Properties to update
   * @param {number} properties.opacity - New opacity value
   * @param {Array<string>} properties.colorPalette - New color palette
   * @param {THREE.Group} meshGroup - Mesh group to update
   */
  updateProperties(properties, meshGroup) {
    if (!meshGroup || !this.currentScene) return;
    
    // Update opacity
    if (properties.opacity !== undefined) {
      this._updateOpacity(meshGroup, properties.opacity);
    }
    
    // Update colors
    if (properties.colorPalette) {
      this._updateColors(meshGroup, properties.colorPalette);
    }
  }
  
  /**
   * Apply materials to a mesh group based on mode settings
   * @param {THREE.Group} group - Mesh group
   * @param {Object} materialSettings - Material settings from mode
   * @param {Object} options - Additional options
   * @private
   */
  _applyMaterialsToGroup(group, materialSettings, options = {}) {
    const materialType = materialSettings.type;
    const properties = materialSettings.properties || {};
    const opacity = options.opacity !== undefined ? options.opacity : 1.0;
    
    // Different handling based on if using a color palette or single color
    if (options.colorPalette) {
      // Apply palette colors to each child mesh
      group.children.forEach((child, index) => {
        if (child.isMesh) {
          const palette = options.colorPalette;
          const colorIndex = index % palette.length;
          const color = new THREE.Color(palette[colorIndex]);
          
          // Create material for this child
          child.material = this._createMaterial(materialType, color, opacity, properties);
        }
      });
    } else {
      // Apply a single color to all meshes
      const color = options.baseColor || new THREE.Color(0x3498db);
      
      // Create and apply material to all meshes
      group.traverse(child => {
        if (child.isMesh) {
          child.material = this._createMaterial(materialType, color, opacity, properties);
        }
      });
    }
  }
  
  /**
   * Create a material based on type and parameters
   * @param {string} materialType - Material type
   * @param {THREE.Color} color - Material color
   * @param {number} opacity - Material opacity
   * @param {Object} properties - Additional material properties
   * @returns {THREE.Material} Created material
   * @private
   */
  _createMaterial(materialType, color, opacity, properties = {}) {
    const factory = this.materialFactories[materialType];
    if (!factory) {
      console.warn(`Material type "${materialType}" not found. Using standard.`);
      return this.materialFactories.standard(color, opacity, properties);
    }
    
    return factory(color, opacity, properties);
  }
  
  /**
   * Update opacity of all materials in a group
   * @param {THREE.Group} group - Mesh group
   * @param {number} opacity - New opacity value
   * @private
   */
  _updateOpacity(group, opacity) {
    group.traverse(child => {
      if (child.material) {
        // Handle arrays of materials
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.opacity = opacity;
            mat.transparent = opacity < 1.0;
            mat.needsUpdate = true;
          });
        } else {
          child.material.opacity = opacity;
          child.material.transparent = opacity < 1.0;
          child.material.needsUpdate = true;
        }
      }
    });
  }
  
  /**
   * Update colors based on a new palette
   * @param {THREE.Group} group - Mesh group
   * @param {Array<string>} palette - Color palette
   * @private
   */
  _updateColors(group, palette) {
    if (!palette || !palette.length) return;
    
    group.children.forEach((child, index) => {
      if (child.material) {
        const colorIndex = index % palette.length;
        const colorValue = palette[colorIndex];
        child.material.color.set(colorValue);
        
        // Update emissive color for certain material types
        if (child.material.emissive) {
          child.material.emissive.set(colorValue).multiplyScalar(0.2);
        }
        
        child.material.needsUpdate = true;
      }
    });
  }
  
  /**
   * Apply effects to the scene
   * @param {THREE.Scene} scene - Scene to apply effects to
   * @param {Object} effects - Effects configuration
   * @private
   */
  _applyEffects(scene, effects) {
    // Apply shadows if requested
    if (effects.shadows) {
      this.currentLights.forEach(light => {
        if (light.castShadow !== undefined) {
          light.castShadow = true;
          
          // Configure shadow maps for better quality
          if (light.shadow) {
            light.shadow.mapSize.width = 1024;
            light.shadow.mapSize.height = 1024;
            light.shadow.camera.near = 0.5;
            light.shadow.camera.far = 50;
          }
        }
      });
    }
    
    // Add grid if requested
    if (effects.grid) {
      const grid = new THREE.GridHelper(20, 20);
      scene.add(grid);
      this.currentEffects.push(grid);
    }
    
    // Add outlines if requested
    if (effects.outlines) {
      // Implement edge detection or outline post-processing here
      // This would typically be done with a post-processing pass
    }
    
    // Add bloom effect if requested
    if (effects.bloom) {
      // Implement bloom post-processing here
      // This would typically be done with a post-processing pass
    }
  }
  
  /**
   * Clean up previous mode elements before applying a new mode
   * @param {THREE.Scene} scene - Scene to clean up
   * @private
   */
  _cleanupPreviousMode(scene) {
    // Remove current lights
    this.currentLights.forEach(light => scene.remove(light));
    this.currentLights = [];
    
    // Remove current effects
    this.currentEffects.forEach(effect => scene.remove(effect));
    this.currentEffects = [];
  }
  
  //
  // LIGHT CONFIGURATION METHODS
  //
  
  /**
   * Create balanced lighting (ambient + directional)
   * @returns {Array<THREE.Light>} Array of lights
   * @private
   */
  _createBalancedLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7.5);
    return [ambient, dir];
  }
  
  /**
   * Create studio lighting setup (three-point lighting)
   * @returns {Array<THREE.Light>} Array of lights
   * @private
   */
  _createStudioLighting() {
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(10, 10, 10);
    
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-10, 5, 5);
    
    const back = new THREE.DirectionalLight(0xffffff, 0.5);
    back.position.set(0, -5, -10);
    
    return [key, fill, back];
  }
  
  /**
   * Create contrast lighting (strong key + minimal ambient)
   * @returns {Array<THREE.Light>} Array of lights
   * @private
   */
  _createContrastLighting() {
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(5, 15, 5);
    
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    
    return [key, ambient];
  }
  
  /**
   * Create soft diffuse lighting
   * @returns {Array<THREE.Light>} Array of lights
   * @private
   */
  _createSoftLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    const hemi = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.6);
    
    return [ambient, hemi];
  }
  
  /**
   * Create simple ambient-only lighting
   * @returns {Array<THREE.Light>} Array of lights
   * @private
   */
  _createAmbientLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    return [ambient];
  }
  
  /**
   * Create single directional light setup
   * @returns {Array<THREE.Light>} Array of lights
   * @private
   */
  _createDirectionalLighting() {
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(1, 1, 1);
    
    return [dir];
  }
  
  /**
   * Create multi-point lighting
   * @returns {Array<THREE.Light>} Array of lights
   * @private
   */
  _createMultiPointLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    
    const positions = [
      [5, 5, 5],
      [-5, 5, 5],
      [5, 5, -5],
      [-5, 5, -5]
    ];
    
    const pointLights = positions.map(pos => {
      const p = new THREE.PointLight(0xffffff, 0.5, 50);
      p.position.set(...pos);
      return p;
    });
    
    return [ambient, ...pointLights];
  }
  
  /**
   * Create dark ambient lighting for neon/emissive materials
   * @returns {Array<THREE.Light>} Array of lights
   * @private
   */
  _createDarkLighting() {
    const ambient = new THREE.AmbientLight(0x000000, 0.1);
    return [ambient];
  }
}