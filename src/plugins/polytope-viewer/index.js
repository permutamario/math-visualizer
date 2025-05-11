// src/plugins/polytope-viewer/index.js
import { Plugin } from '../../core/Plugin.js';
import { BasePolytopeVisualization } from './BasePolytopeVisualization.js';
// Import visualization classes directly to ensure they're available
import { PlatonicVisualization } from './visualizations/PlatonicVisualization.js';
import { PermutahedronVisualization } from './visualizations/PermutahedronVisualization.js';

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
      }
    ];
  }

  /**
   * Initialize the plugin
   */
  async initialize() {
    await super.initialize();
    
    // Try to discover more visualizations from manifest
    try {
      await this.discoverVisualizations();
    } catch (error) {
      console.warn("Could not discover visualizations from manifest:", error);
      // Continue with hard-coded visualizations
    }
    
    if (this.visualizationTypes.length === 0) {
      console.error("No polytope visualizations available");
      return false;
    }
    
    // Set default visualization type to first visualization
    this.parameters.visualizationType = this.visualizationTypes[0].id;
    
    return true;
  }

  /**
   * Discover available polytope visualizations from the manifest
   */
  async discoverVisualizations() {
    try {
      // Try different manifest paths since the exact path may vary
      let manifestPath = '/math-visualizer/src/plugins/polytope-viewer/polytope_manifest.json';
      let response = await fetch(manifestPath);
      
      // If first path fails, try alternative path
      if (!response.ok) {
        manifestPath = './src/plugins/polytope-viewer/polytope_manifest.json';
        response = await fetch(manifestPath);
        
        // If that also fails, try one more path
        if (!response.ok) {
          manifestPath = '/src/plugins/polytope-viewer/polytope_manifest.json';
          response = await fetch(manifestPath);
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load polytope manifest: ${response.statusText}`);
      }
      
      const manifest = await response.json();
      
      // Clear existing visualizations to avoid duplicates
      this.visualizationTypes = [];
      
      for (const entry of manifest) {
        try {
          const { name, file } = entry;
          if (!name || !file) continue;
          
          const id = name.toLowerCase();
          const className = file.replace(/\.js$/, '');
          
          // Try different import paths
          let module;
          try {
            // Try absolute path first
            module = await import(`/math-visualizer/src/plugins/polytope-viewer/visualizations/${file}`);
          } catch (importError) {
            try {
              // Try relative path
              module = await import(`./visualizations/${file}`);
            } catch (secondError) {
              // Try another relative path format
              module = await import(`../plugins/polytope-viewer/visualizations/${file}`);
            }
          }
          
          const VisualizationClass = module[className];
          
          if (!VisualizationClass) {
            console.warn(`Could not find class ${className} in ${file}`);
            continue;
          }
          
          this.visualizationTypes.push({
            id,
            name,
            class: VisualizationClass
          });
          
          console.log(`Discovered visualization: ${name}`);
        } catch (error) {
          console.error(`Error importing visualization ${entry.name || 'unknown'}: ${error.message}`);
        }
      }
      
      // If no visualizations could be loaded from manifest, fall back to direct imports
      if (this.visualizationTypes.length === 0) {
        console.warn("No visualizations loaded from manifest, using direct imports");
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
          }
        ];
      }
      
      return this.visualizationTypes.length > 0;
    } catch (error) {
      console.error("Error discovering visualizations:", error);
      
      // Fallback to directly imported visualization classes
      console.warn("Falling back to direct imports");
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
        }
      ];
      
      return this.visualizationTypes.length > 0;
    }
  }

  /**
   * Initialize the default visualization
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
    
    // Update parameter for consistency
    this.parameters.visualizationType = vizInfo.id;
    
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
    const visualizationTypeOptions = this.visualizationTypes.map(vt => ({
      value: vt.id,
      label: vt.name
    }));
    
    // Default to first visualization if none selected
    const defaultType = this.parameters.visualizationType || this.visualizationTypes[0].id;
    
    // Plugin parameter
    const pluginParam = {
      id: 'visualizationType',
      type: 'dropdown',
      label: 'Polytope Class',
      options: visualizationTypeOptions,
      default: defaultType
    };
    
    // Start with base parameters from BasePolytopeVisualization
    const baseParams = BasePolytopeVisualization.getBaseParameters();
    
    // Get visualization-specific parameters if visualization class is available
    let vizParams = { structural: [], visual: [] };
    const vizInfo = this.visualizationTypes.find(vt => vt.id === this.parameters.visualizationType);
    
    if (vizInfo && vizInfo.class && vizInfo.class.getParameters) {
      vizParams = vizInfo.class.getParameters();
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
    // Store previous value for comparison
    const prevValue = this.parameters[parameterId];
    
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Special handling for visualization type changes
    if (parameterId === 'visualizationType' && value !== prevValue) {
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
        // Update UI with new parameter schema
        if (this.core && this.core.uiManager) {
          const paramSchema = this.getParameterSchema();
          this.core.uiManager.buildControlsFromSchema(paramSchema, this.parameters);
        }
        
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
      if (this.core && this.core.uiManager) {
        this.core.uiManager.updateControls({ rotation: newValue });
      }
      
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
        }
        
        // Request render update
        this.core.renderingManager.requestRender();
      }
      return true;
    }
    
    return super.executeAction(actionId, ...args);
  }
}
