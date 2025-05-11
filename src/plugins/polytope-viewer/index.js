// src/plugins/polytope-viewer/index.js
import { Plugin } from '../../core/Plugin.js';
import { BasePolytopeVisualization } from './BasePolytopeVisualization.js';

export default class PolytopeViewerPlugin extends Plugin {
  static id = "polytope-viewer";
  static name = "Polytope Viewer";
  static description = "Interactive 3D polytope visualizations";
  static renderingType = "3d"; // Using THREE.js for 3D rendering

  constructor(core) {
    super(core);
    
    // Initialize empty visualization types - will be filled from manifest
    this.visualizationTypes = [];
  }

  /**
   * Initialize the plugin
   * This is called when the plugin is first loaded, before activation
   */
  async initialize() {
    // Call parent initialization
    await super.initialize();

    // Discover visualizations from manifest
    await this.discoverVisualizations();
    
    // Ensure we have at least one visualization
    if (this.visualizationTypes.length === 0) {
      console.error("No polytope visualizations found in manifest");
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
      // We now know the correct path for the manifest
      const manifestPath = '/math-visualizer/src/plugins/polytope-viewer/polytope_manifest.json';
      
      console.log(`Fetching manifest from: ${manifestPath}`);
      const response = await fetch(manifestPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load polytope manifest: ${response.statusText}`);
      }
      
      const manifest = await response.json();
      
      if (!Array.isArray(manifest) || manifest.length === 0) {
        throw new Error("Invalid or empty polytope manifest");
      }
      
      console.log(`Processing ${manifest.length} visualizations from manifest`);
      
      // Process each visualization in the manifest
      let loadedVisualizationCount = 0;
      
      for (const entry of manifest) {
        try {
          // Extract visualization information
          const { name, file } = entry;
          
          if (!name || !file) {
            console.warn("Invalid manifest entry - missing name or file");
            continue;
          }
          
          const id = name.toLowerCase();
	const className = file.replace(/\.js$/, '');
          
          // Build the correct path - assuming all files are in the same directory as the plugin
          const importPath = `/math-visualizer/src/plugins/polytope-viewer/visualizations/` + file;
          console.log(`Importing visualization from: ${importPath}`);
          
          // Import the visualization module
          const module = await import(importPath);
          
          // Get the visualization class
          const VisualizationClass = module[className];
          
          if (!VisualizationClass) {
            console.warn(`Could not find ${className} in ${importPath}`);
            continue;
          }
          
          // Add to visualization types
          this.visualizationTypes.push({
            id,
            name,
            createVisualization: () => new VisualizationClass(this)
          });
          
          loadedVisualizationCount++;
          console.log(`Discovered visualization: ${name}`);
        } catch (error) {
          console.error(`Error importing visualization ${entry.name || 'unknown'}: ${error.message}`);
        }
      }
      
      console.log(`Successfully loaded ${loadedVisualizationCount} visualizations`);
      
      // Consider success even if we only loaded one visualization
      if (loadedVisualizationCount === 0) {
        throw new Error("No valid visualizations found in manifest");
      }
      
      return true;
    } catch (error) {
      console.error("Error discovering visualizations:", error);
      throw error; // Re-throw to indicate initialization failure
    }
  }


  /**
   * Initialize the default visualization
   */
  async _initializeDefaultVisualization() {
    // Make sure visualization types are available
    if (this.visualizationTypes.length === 0) {
      console.error("No visualizations available to initialize");
      return false;
    }
    
    // Get the selected visualization type (default to first if not specified)
    const selectedType = this.parameters.visualizationType || this.visualizationTypes[0].id;
    
    // Find the visualization info
    const vizInfo = this.visualizationTypes.find(vt => vt.id === selectedType) || 
                   this.visualizationTypes[0];
    
    // Update parameter in case we fell back to the first visualization
    this.parameters.visualizationType = vizInfo.id;
    
    // Create and register the visualization
    const visualization = vizInfo.createVisualization();
    this.registerVisualization(vizInfo.id, visualization);
    
    // Set as current visualization
    this.currentVisualization = visualization;
    
    // Initialize the visualization with parameters
    await this.currentVisualization.initialize(this.parameters);
    
    return true;
  }

  /**
   * Get the parameter schema combining plugin, base, and visualization parameters
   */
  getParameterSchema() {
    // If no visualizations, return empty schema
    if (this.visualizationTypes.length === 0) {
      return {
        structural: [],
        visual: []
      };
    }
    
    // Plugin-level parameter: visualization type selector
    const visualizationTypeOptions = this.visualizationTypes.map(vt => ({
      value: vt.id,
      label: vt.name
    }));
    
    // Default to first visualization if none selected
    const defaultType = this.parameters.visualizationType || this.visualizationTypes[0].id;
    
    const pluginParams = {
      structural: [
        {
          id: 'visualizationType',
          type: 'dropdown',
          label: 'Polytope Class',
          options: visualizationTypeOptions,
          default: defaultType
        }
      ],
      visual: []
    };
    
    // If no current visualization, return just plugin params
    if (!this.currentVisualization) {
      return pluginParams;
    }
    
    // Get base parameters from the base class
    let baseParams = { structural: [], visual: [] };
    if (typeof this.currentVisualization.getBaseParameters === 'function') {
      baseParams = this.currentVisualization.getBaseParameters();
    }
    
    // Get visualization-specific parameters
    let vizParams = { structural: [], visual: [] };
    if (typeof this.currentVisualization.getVisualizationParameters === 'function') {
      vizParams = this.currentVisualization.getVisualizationParameters();
    }
    
    // Combine all parameters
    return {
      structural: [
        ...pluginParams.structural,
        ...baseParams.structural,
        ...vizParams.structural
      ],
      visual: [
        ...pluginParams.visual,
        ...baseParams.visual,
        ...vizParams.visual
      ]
    };
  }
  
  /**
   * Update a parameter without triggering the parameter change handler
   * Used by actions to update parameters directly
   */
  updateParameter(parameterId, value) {
    // Update parameter
    this.parameters[parameterId] = value;
    
    // Update UI
    if (this.core && this.core.uiManager) {
      this.core.uiManager.updateControls({
        [parameterId]: value
      });
    }
    
    // Request render
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
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
      // Create and initialize the new visualization
      this._handleVisualizationTypeChange(value);
      return;
    }
    
    // Update visualization
    if (this.currentVisualization) {
      if (parameterId === 'rotation') {
        // Update animation state
        this.currentVisualization.state.isAnimating = value;
      } 
      
      // Allow the visualization to handle its own parameters
      if (typeof this.currentVisualization.update === 'function') {
        this.currentVisualization.update({ 
          [parameterId]: value 
        }, { 
          [parameterId]: prevValue 
        });
      }
      
      // Request a render update
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
    }
  }
  
  /**
   * Handle visualization type change
   */
  async _handleVisualizationTypeChange(newType) {
    try {
      // Find visualization info
      const vizInfo = this.visualizationTypes.find(vt => vt.id === newType);
      
      if (!vizInfo) {
        console.error(`Visualization type ${newType} not found`);
        return;
      }
      
      // Dispose current visualization if exists
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
      }
      
      // Create new visualization instance
      const visualization = vizInfo.createVisualization();
      
      // Register and set as current
      this.registerVisualization(vizInfo.id, visualization);
      this.currentVisualization = visualization;
      
      // Initialize with current parameters
      await this.currentVisualization.initialize(this.parameters);
      
      // Update UI with new parameters schema
      if (this.core && this.core.uiManager) {
        const paramSchema = this.getParameterSchema();
        this.core.uiManager.buildControlsFromSchema(paramSchema, this.parameters);
      }
      
      // Request render
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
    } catch (error) {
      console.error("Error changing visualization type:", error);
    }
  }
  
  /**
   * Get available actions for this plugin
   */
  getActions() {
    // Default actions from parent
    const baseActions = super.getActions();
    
    // Common actions from visualization base class
    let commonActions = [];
    if (this.currentVisualization && 
        typeof this.currentVisualization.getCommonActions === 'function') {
      commonActions = this.currentVisualization.getCommonActions();
    }
    
    // Combine all actions
    return [...baseActions, ...commonActions];
  }
  
  /**
   * Execute an action
   */
  executeAction(actionId, ...args) {
    // Try parent actions first
    const handled = super.executeAction(actionId, ...args);
    if (handled) return true;
    
    // Try common actions in the visualization
    if (this.currentVisualization && 
        typeof this.currentVisualization.executeCommonAction === 'function') {
      const handled = this.currentVisualization.executeCommonAction(
        actionId, 
        this.parameters
      );
      if (handled) return true;
    }
    
    return false;
  }
}
