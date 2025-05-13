import { Plugin } from '../../core/Plugin.js';
import { buildMesh } from './meshBuilder.js';

export default class PolytopeVisualization extends Plugin {
  static id = 'polytope-visualization';
  static name = 'Polytope Visualization';
  static description = 'Visualize polytopes in 3D';
  static renderingType = '3d';
  
  constructor(core) {
    super(core);
    this.state = {
      currentPolytopeType: '',
      currentParams: {},
      polytope: null,
      meshGroup: null,
      polytopeBuilders: {}, // Will be populated during initialization
      polytopeOptions: [] // Will be populated during initialization
    };
  }
  
  async start() {
    // First, discover available polytopes from manifest
    await this.discoverPolytopes();
    
    // Add the polytope type selector as a structural parameter
    if (this.state.polytopeOptions.length > 0) {
      const defaultType = this.state.polytopeOptions[0].value;
      this.state.currentPolytopeType = defaultType;
      
      this.addDropdown(
        'polytopeType', 
        'Polytope Type', 
        defaultType, 
        this.state.polytopeOptions, 
        'structural'
      );
      
      // Add initial polytope-specific parameters
      await this.addPolytopeParameters(defaultType);
    }
    
    // Add visual parameters
    this.addColor('faceColor', 'Base Face Color', '#3498db');
    this.addSlider('opacity', 'Face Opacity', 0.85, { min: 0, max: 1, step: 0.05 });
    this.addDropdown('renderMode', 'Render Mode', 'standard', [
      'wireframe', 'standard', 'glossy', 'metallic', 'glass', 'toon'
    ]);
    this.addSlider('rotationSpeed', 'Rotation Speed', 0.5, { min: 0, max: 2, step: 0.1 });
    
    // Add actions
    this.addAction('resetView', 'Reset View', () => {
      if (this.renderEnv && this.renderEnv.resetCamera) {
        this.renderEnv.resetCamera();
      }
    });
    
    this.addAction('regenerate', 'Regenerate Polytope', () => {
      this.generatePolytope();
      this.createMesh();
    });
    
    // Generate initial polytope
    await this.generatePolytope();
    
    // Create the 3D mesh
    this.createMesh();
    
    // Start animation
    this.animationHandler = this.requestAnimation(this.animate.bind(this));
  }
  
  /**
   * Discover available polytopes from a manifest file
   */
  async discoverPolytopes() {
    try {
      // Fetch the manifest file - you'll need to create this file
      const response = await fetch('/math-viewer/src/plugins/polytopes/manifest.json');
      if (!response.ok) {
        throw new Error(`Failed to load polytope manifest: ${response.statusText}`);
      }
      
      const manifest = await response.json();
      
      // Process the manifest
      this.state.polytopeOptions = [];
      
      for (const entry of manifest.polytopes) {
        this.state.polytopeOptions.push({
          value: entry.id,
          label: entry.name
        });
      }
      
      console.log(`Discovered ${this.state.polytopeOptions.length} polytope types`);
      
      if (this.state.polytopeOptions.length === 0) {
        console.warn("No polytopes found in manifest");
      } else {
        // Set default polytope type
        this.state.currentPolytopeType = this.state.polytopeOptions[0].value;
      }
    } catch (error) {
      console.error("Error discovering polytopes:", error);
      
      // Fallback to hardcoded polytopes if manifest loading fails
      this.state.polytopeOptions = [
        { value: 'permutahedron', label: 'Permutahedron' },
        { value: 'orbit', label: 'Orbit Polytope' }
      ];
      this.state.currentPolytopeType = 'permutahedron';
    }
  }
  
  /**
   * Load a polytope builder dynamically
   * @param {string} polytopeType - Type of polytope
   * @returns {Function|null} The builder function
   */
  async loadPolytopeBuilder(polytopeType) {
    // Check if already loaded
    if (this.state.polytopeBuilders[polytopeType]) {
      return this.state.polytopeBuilders[polytopeType];
    }
    
    try {
      // Dynamic import based on polytope type
      const module = await import(`./polytopes/build_functions/build_${polytopeType}.js`);
      
      // Expect the module to export a function named build_[polytopeType]
      const builderName = `build_${polytopeType}`;
      
      if (typeof module[builderName] === 'function') {
        // Cache the builder
        this.state.polytopeBuilders[polytopeType] = module[builderName];
        return module[builderName];
      }
      
      throw new Error(`Builder function ${builderName} not found`);
    } catch (error) {
      console.error(`Failed to load polytope builder for ${polytopeType}:`, error);
      return null;
    }
  }
  
  /**
   * Add parameters specific to the selected polytope type
   * @param {string} polytopeType - Type of polytope
   */
  async addPolytopeParameters(polytopeType) {
    // Load the builder for this polytope type
    const builder = await this.loadPolytopeBuilder(polytopeType);
    
    if (!builder || !builder.defaults) {
      console.warn(`No parameter schema available for polytope type: ${polytopeType}`);
      return;
    }
    
    // Store current params for this polytope type
    this.state.currentParams[polytopeType] = {};
    
    // Add parameters from the builder's default schema
    Object.entries(builder.defaults).forEach(([paramId, paramSchema]) => {
      // Process different parameter types
      switch (paramSchema.type) {
        case 'dropdown':
          this.addDropdown(
            paramId,
            paramSchema.name || paramId,
            paramSchema.default,
            paramSchema.options,
            'structural'
          );
          this.state.currentParams[polytopeType][paramId] = paramSchema.default;
          break;
          
        case 'vector':
          // For vector types, we'll create multiple number inputs
          // Store the default value
          this.state.currentParams[polytopeType][paramId] = [...paramSchema.default];
          
          // Create a parameter for each dimension
          for (let i = 0; i < paramSchema.dimension; i++) {
            const coordId = `${paramId}_${i}`;
            this.addNumber(
              coordId,
              `${paramSchema.name || paramId} ${i+1}`,
              paramSchema.default[i],
              { step: 0.1 },
              'structural'
            );
          }
          break;
          
        case 'number':
          this.addNumber(
            paramId,
            paramSchema.name || paramId,
            paramSchema.default,
            {
              min: paramSchema.min,
              max: paramSchema.max,
              step: paramSchema.step || 0.1
            },
            'structural'
          );
          this.state.currentParams[polytopeType][paramId] = paramSchema.default;
          break;
          
        case 'checkbox':
        case 'boolean':
          this.addCheckbox(
            paramId,
            paramSchema.name || paramId,
            paramSchema.default,
            'structural'
          );
          this.state.currentParams[polytopeType][paramId] = paramSchema.default;
          break;
          
        default:
          console.warn(`Unsupported parameter type: ${paramSchema.type}`);
      }
    });
  }
  
  /**
   * Remove all structural parameters and add ones for the new polytope type
   * @param {string} newPolytopeType - Type of polytope to switch to
   */
  async updatePolytopeParameters(newPolytopeType) {
    // 1. Remove all existing structural parameters
    this.emptyParameters('structural');
    
    // 2. Add back the polytope type selector
    this.addDropdown(
      'polytopeType', 
      'Polytope Type', 
      newPolytopeType, 
      this.state.polytopeOptions, 
      'structural'
    );
    
    // 3. Add parameters for the new polytope type
    await this.addPolytopeParameters(newPolytopeType);
    
    // 4. Update current type in state
    this.state.currentPolytopeType = newPolytopeType;
  }
  
  /**
   * Generate the polytope based on current parameters
   */
  async generatePolytope() {
    const polytopeType = this.state.currentPolytopeType;
    
    // Load builder if not already loaded
    const builder = await this.loadPolytopeBuilder(polytopeType);
    
    if (!builder) {
      console.error(`Failed to load builder for polytope type: ${polytopeType}`);
      return;
    }
    
    // Collect parameters for the builder based on its schema
    const params = {};
    const defaults = builder.defaults || {};
    
    Object.keys(defaults).forEach(paramId => {
      const paramSchema = defaults[paramId];
      
      switch (paramSchema.type) {
        case 'vector':
          // For vector type, collect all coordinates
          const vector = [];
          const dimension = paramSchema.dimension;
          
          for (let i = 0; i < dimension; i++) {
            vector.push(this.getParameter(`${paramId}_${i}`));
          }
          
          params[paramId] = vector;
          break;
          
        case 'dropdown':
        case 'number':
        case 'checkbox':
        case 'boolean':
          // For simple types, just get the parameter value
          params[paramId] = this.getParameter(paramId);
          break;
          
        default:
          console.warn(`Unsupported parameter type: ${paramSchema.type}`);
      }
    });
    
    // Generate the polytope
    try {
      // Make sure the Polytope class is loaded
      if (!this.state.Polytope) {
        const polytopeModule = await import('./polytopes/Polytope.js');
        this.state.Polytope = polytopeModule.Polytope;
      }
      
      this.state.polytope = builder(params);
      console.log(`Generated ${polytopeType} polytope with ${this.state.polytope.vertices.length} vertices`);
    } catch (error) {
      console.error('Error generating polytope:', error);
    }
  }
  
  /**
   * Create the 3D mesh from the current polytope
   */
createMesh() {
  if (!this.state.polytope || !this.renderEnv) return;
  
  // Remove existing mesh if any
  if (this.state.meshGroup && this.renderEnv.scene) {
    this.renderEnv.scene.remove(this.state.meshGroup);
  }
  
  // Get color palette from the ColorSchemeManager
  let colorPalette = [];
  if (this.core && this.core.colorSchemeManager) {
    const paletteName = this.getParameter('colorPalette') || 'default';
    colorPalette = this.core.colorSchemeManager.getPalette(paletteName);
  } else {
    // Fallback if no ColorSchemeManager is available
    const baseColor = this.getParameter('faceColor') || '#3498db';
    colorPalette = this.generateFallbackPalette(baseColor, 10);
  }
  
  // Get render mode
  const renderMode = this.getParameter('renderMode') || 'standard';
  
  // Create mesh settings
  const settings = {
    colorPalette,
    faceOpacity: this.getParameter('opacity') || 0.85,
    renderMode
  };
  
  // Build the mesh with our renderEnv
  this.state.meshGroup = buildMesh(this.state.polytope, settings, this.renderEnv);
  
  // Apply render mode (except for wireframe which handles its own rendering)
  if (renderMode !== 'wireframe' && this.core && this.core.renderModeManager) {
    this.core.renderModeManager.applyRenderMode(
      this.renderEnv.scene,
      this.state.meshGroup,
      renderMode,
      {
        opacity: settings.faceOpacity,
        colorPalette
      }
    );
  }
  

  // Add to scene
  if (this.renderEnv.scene) {
    this.renderEnv.scene.add(this.state.meshGroup);
  }
}
  
  /**
   * Generate a color scheme based on a base color
   * @param {string} baseColor - Base color in hex format
   * @param {number} count - Number of colors to generate
   * @returns {string[]} Array of colors in hex format
   */
  generateColorScheme(baseColor, count) {
    const { THREE } = this.renderEnv;
    if (!THREE) return Array(count).fill(baseColor);
    
    const color = new THREE.Color(baseColor);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    
    return Array.from({ length: count }, (_, i) => {
      const h = (hsl.h + i / count) % 1;
      return new THREE.Color().setHSL(h, hsl.s, hsl.l).getHexString();
    }).map(c => `#${c}`);
  }
  
  /**
   * Animation loop
   * @param {number} deltaTime - Time since last frame in seconds
   */
  animate(deltaTime) {
    // Rotate the mesh if it exists
    if (this.state.meshGroup) {
      const speed = this.getParameter('rotationSpeed') || 0.5;
      this.state.meshGroup.rotation.y += deltaTime * speed;
      this.state.meshGroup.rotation.x += deltaTime * speed * 0.5;
    }
    
    return true; // Continue animation
  }
  
  /**
   * Handle parameter changes
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New value
   * @param {string} group - Parameter group
   */
  async onParameterChanged(parameterId, value, group) {
    // Handle polytope type change
    if (parameterId === 'polytopeType') {
      // Only update if it's actually different
      if (value !== this.state.currentPolytopeType) {
        await this.updatePolytopeParameters(value);
        await this.generatePolytope();
        this.createMesh();
      }
      return;
    }
    
    // Handle visual parameter changes
    if (group === 'visual') {
      if (['faceColor', 'opacity', 'renderMode'].includes(parameterId)) {
        // These require recreating the mesh
        this.createMesh();
      }
      return;
    }
    
    // Handle structural parameter changes
    if (group === 'structural') {
      // Update the corresponding parameter in our state
      const polytopeType = this.state.currentPolytopeType;
      
      if (!this.state.currentParams[polytopeType]) {
        this.state.currentParams[polytopeType] = {};
      }
      
      // For vector components
      if (parameterId.includes('_')) {
        const [baseParam, index] = parameterId.split('_');
        
        if (!this.state.currentParams[polytopeType][baseParam]) {
          // Initialize array if needed
          this.state.currentParams[polytopeType][baseParam] = [];
        }
        
        // Update the specific component
        this.state.currentParams[polytopeType][baseParam][parseInt(index)] = value;
      } else {
        // Regular parameter
        this.state.currentParams[polytopeType][parameterId] = value;
      }
      
      // Regenerate polytope and mesh on any structural parameter change
      await this.generatePolytope();
      this.createMesh();
    }
  }
  
  /**
   * Clean up
   */
  async unload() {
    // Cancel animation
    if (this.animationHandler) {
      this.cancelAnimation(this.animationHandler);
    }
    
    // Call parent cleanup
    await super.unload();
    
    // Clean up THREE.js objects
    if (this.state.meshGroup && this.renderEnv && this.renderEnv.scene) {
      this.renderEnv.scene.remove(this.state.meshGroup);
      
      // Dispose of geometries and materials
      this.state.meshGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
    
    // Reset state
    this.state = null;
  }
}