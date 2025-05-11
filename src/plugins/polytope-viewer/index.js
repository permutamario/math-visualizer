// src/plugins/polytope-viewer/index.js
import { Plugin } from '../../core/Plugin.js';
import { BasePolytopeVisualization } from './BasePolytopeVisualization.js';
// Import visualization classes directly to ensure they're available
import { PlatonicVisualization } from './visualizations/PlatonicVisualization.js';
import { PermutahedronVisualization } from './visualizations/PermutahedronVisualization.js';
import { RootPolytopeVisualization } from './visualizations/RootPolytopeVisualization.js';
import { StellahedronVisualization } from './visualizations/StellahedronVisualization.js';
import { OrbitPolytopeVisualization } from './visualizations/OrbitPolytopeVisualization.js';
import { AssociahedronVisualization } from './visualizations/AssociahedronVisualization.js';

export default class PolytopeViewerPlugin extends Plugin {
  static id = "polytope-viewer";
  static name = "Polytope Viewer";
  static description = "Interactive 3D polytope visualizations";
  static renderingType = "3d"; // Using THREE.js for 3D rendering

  constructor(core) {
    super(core);
    
    // Initialize with known visualizations to avoid empty array issues
    this.visualizationTypes = [
      {
        id: 'platonic',
        name: 'Platonic Solids',
        class: PlatonicVisualization
      },
      {
        id: 'permutahedron',
        name: 'Permutahedron',
        class: PermutahedronVisualization
      },
      {
        id: 'rootpolytope',
        name: 'Root Polytope',
        class: RootPolytopeVisualization
      },
      {
        id: 'stellahedron',
        name: 'Stellahedron',
        class: StellahedronVisualization
      },
      {
        id: 'orbitpolytope',
        name: 'Orbit Polytope',
        class: OrbitPolytopeVisualization
      },
      {
        id: 'associahedron',
        name: 'Associahedron',
        class: AssociahedronVisualization
      }
    ];
  }

  /**
   * Load the plugin
   * Called when the plugin is selected
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log("Loading polytope-viewer plugin...");
      
      // Try to discover more visualizations from manifest
      try {
        await this.discoverVisualizations();
      } catch (error) {
        console.warn("Could not discover visualizations from manifest:", error);
        // Continue with hard-coded visualizations
      }
      
      // Set up default parameters from schema
      const schema = this.getParameterSchema();
      this.parameters = this._getDefaultParametersFromSchema(schema);
      
      // Set default visualization type if not already set
      if (!this.parameters.visualizationType) {
        this.parameters.visualizationType = this.visualizationTypes[0].id;
      }
      
      // Initialize default visualization
      await this._initializeDefaultVisualization();
      
      // Mark as loaded
      this.isLoaded = true;
      
      // Give parameters to UI
      this.giveParameters(true);
      
      // Update actions
      if (this.core && this.core.uiManager) {
        const actions = this.getActions();
        this.core.uiManager.updateActions(actions);
      }
      
      console.log("Polytope-viewer plugin loaded successfully");
      return true;
    } catch (error) {
      console.error(`Error loading PolytopeViewerPlugin:`, error);
      
      // Ensure clean state on failure
      await this.unload();
      return false;
    }
  }

  /**
   * Unload the plugin
   * Called when another plugin is selected
   */
  async unload() {
    if (!this.isLoaded) return true;
    
    try {
      console.log("Unloading polytope-viewer plugin...");
      
      // Clean up current visualization
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
        this.currentVisualization = null;
      }
      
      // Clear all visualizations
      this.visualizations.clear();
      
      // Clear parameters
      this.parameters = {};
      
      // Clear visualization types
      // Note: We don't clear this because it would break future loads
      // this.visualizationTypes = [];
      
      // Mark as unloaded
      this.isLoaded = false;
      
      console.log("Polytope-viewer plugin unloaded successfully");
      return true;
    } catch (error) {
      console.error(`Error unloading PolytopeViewerPlugin:`, error);
      return false;
    }
  }

  /**
   * Discover available polytope visualizations from the manifest
   */
  async discoverVisualizations() {
    try {
      // Try different manifest paths since the exact path may vary
      let manifestPath = './src/plugins/polytope-viewer/polytope_manifest.json';
      let response = await fetch(manifestPath);
      
      // If first path fails, try alternative paths
      if (!response.ok) {
        manifestPath = '/src/plugins/polytope-viewer/polytope_manifest.json';
        response = await fetch(manifestPath);
        
        if (!response.ok) {
          manifestPath = '/math-visualizer/src/plugins/polytope-viewer/polytope_manifest.json';
          response = await fetch(manifestPath);
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load polytope manifest: ${response.statusText}`);
      }
      
      const manifest = await response.json();
      
      // Create a map of existing visualization types for fast lookup
      const existingTypeMap = new Map(
        this.visualizationTypes.map(vt => [vt.id.toLowerCase(), vt])
      );
      
      // Process manifest entries
      for (const entry of manifest) {
        try {
          const { name, file, description } = entry;
          if (!name || !file) continue;
          
          const id = name.toLowerCase().replace(/\s+/g, '');
          
          // Skip if we already have this visualization type
          if (existingTypeMap.has(id)) continue;
          
          const className = file.replace(/\.js$/, '');
          
          // Try different import paths
          let module;
          try {
            // Try relative path
            module = await import(`./visualizations/${file}`);
          } catch (importError) {
            try {
              // Try absolute path
              module = await import(`/math-visualizer/src/plugins/polytope-viewer/visualizations/${file}`);
            } catch (secondError) {
              // Try another path format
              module = await import(`../plugins/polytope-viewer/visualizations/${file}`);
            }
          }
          
          if (!module) {
            console.warn(`Could not import ${file}`);
            continue;
          }
          
          const VisualizationClass = module[className];
          
          if (!VisualizationClass) {
            console.warn(`Could not find class ${className} in ${file}`);
            continue;
          }
          
          this.visualizationTypes.push({
            id,
            name,
            description,
            class: VisualizationClass
          });
          
          console.log(`Discovered visualization: ${name}`);
        } catch (error) {
          console.error(`Error importing visualization ${entry.name || 'unknown'}: ${error.message}`);
        }
      }
      
      return this.visualizationTypes.length > 0;
    } catch (error) {
      console.error("Error discovering visualizations:", error);
      // No need to throw - we'll use the direct imports as fallback
      return this.visualizationTypes.length > 0;
    }
  }

  /**
   * Initialize the default visualization
   * @private
   */
  async _initializeDefaultVisualization() {
    if (this.visualizationTypes.length === 0) {
      console.error("No visualizations available to initialize");
      return false;
    }
    
    // Get the selected visualization type
    const selectedType = this.parameters.visualizationType || this.visualizationTypes[0].id;
    
    // Find the visualization info
    const vizInfo = this.visualizationTypes.find(vt => vt.id === selectedType) || 
                   this.visualizationTypes[0];
    
    // Create and register visualization
    const visualization = new vizInfo.class(this);
    this.registerVisualization(vizInfo.id, visualization);
    this.currentVisualization = visualization;
    
    // Initialize with current parameters
    await this.currentVisualization.initialize(this.parameters);
    
    return true;
  }
  
  /**
   * Get the parameter schema combining plugin, base, and visualization parameters
   */
  getParameterSchema() {
    // Visualization type selector options
    const visualizationTypeOptions = this.visualizationTypes?.map(vt => ({
      value: vt.id,
      label: vt.name
    })) || [];
    
    // Current visualization type, defaulting to first one if not set
    const currentType = this.parameters?.visualizationType || 
                      (this.visualizationTypes && this.visualizationTypes.length > 0 ? 
                       this.visualizationTypes[0].id : '');
    
    // Plugin parameter
    const pluginParam = {
      id: 'visualizationType',
      type: 'dropdown',
      label: 'Polytope Class',
      options: visualizationTypeOptions,
      default: currentType
    };
    
    // Start with base parameters from BasePolytopeVisualization
    const baseParams = BasePolytopeVisualization.getBaseParameters();
    
    // Get visualization-specific parameters if visualization class is available
    let vizParams = { structural: [], visual: [] };
    
    if (this.visualizationTypes) {
      const vizInfo = this.visualizationTypes.find(vt => vt.id === currentType);
      
      if (vizInfo && vizInfo.class && vizInfo.class.getParameters) {
        vizParams = vizInfo.class.getParameters();
      }
    }
    
    // Combine all parameters
    return {
      structural: [
        pluginParam,
        ...baseParams.structural,
        ...vizParams.structural
      ],
      visual: [
        ...baseParams.visual,
        ...vizParams.visual
      ]
    };
  }

  /**
   * Handle parameter changes
   */
  onParameterChanged(parameterId, value) {
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Special handling for visualization type changes
    if (parameterId === 'visualizationType') {
      // Find visualization info
      const vizInfo = this.visualizationTypes.find(vt => vt.id === value);
      
      if (!vizInfo) {
        console.error(`Visualization type ${value} not found`);
        return;
      }
      
      // Dispose current visualization
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
      }
      
      // Create and register new visualization
      const visualization = new vizInfo.class(this);
      this.registerVisualization(vizInfo.id, visualization);
      this.currentVisualization = visualization;
      
      // Initialize with current parameters
      this.currentVisualization.initialize(this.parameters).then(() => {
        // Update UI with new parameter schema - full rebuild needed
        this.giveParameters(true);
        
        // Request render
        if (this.core && this.core.renderingManager) {
          this.core.renderingManager.requestRender();
        }
      });
      
      return;
    }
    
    // Update visualization with the parameter change
    if (this.currentVisualization) {
      this.currentVisualization.update({ 
        [parameterId]: value 
      });
      
      // Request a render update
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
    }
  }
  
  /**
   * Get available actions
   */
  getActions() {
    return [
      ...super.getActions(),
      {
        id: 'reset-camera',
        label: 'Reset Camera'
      },
      {
        id: 'toggle-rotation',
        label: 'Toggle Rotation'
      }
    ];
  }
  
  /**
   * Execute an action
   */
  executeAction(actionId, ...args) {
    if (actionId === 'toggle-rotation') {
      // Toggle rotation
      const newValue = !this.parameters.rotation;
      this.parameters.rotation = newValue;
      
      // Update visualization
      if (this.currentVisualization) {
        this.currentVisualization.update({ rotation: newValue });
      }
      
      // Update UI
      this.giveParameters(false);
      
      return true;
    } else if (actionId === 'reset-camera') {
      // Reset camera (implementation depends on the 3D environment setup)
      if (this.core && this.core.renderingManager) {
        const environment = this.core.renderingManager.getCurrentEnvironment();
        if (environment && typeof environment.getCamera === 'function') {
          const camera = environment.getCamera();
          if (camera) {
            // Reset camera position
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
          }
          
          // Try to use camera controls if available
          if (environment.getControls && typeof environment.getControls === 'function') {
            const controls = environment.getControls();
            if (controls && typeof controls.reset === 'function') {
              controls.reset();
            }
          }
        }
        
        // Request render update
        this.core.renderingManager.requestRender();
      }
      return true;
    }
    
    return super.executeAction(actionId, ...args);
  }
}
