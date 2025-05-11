// src/core/Plugin.js
export class Plugin {
  static id = "base-plugin";
  static name = "Base Plugin";
  static description = "Abstract base plugin - do not use directly";
  static renderingType = "2d"; // "2d" or "3d"

  constructor(core) {
    // Core application reference
    this.core = core;
    
    // Parameter collections
    this.pluginParameters = {};       // Global plugin parameters
    this.visualizationParameters = {}; // Current visualization parameters
    this.advancedParameters = {};     // Advanced parameters
    
    // Visualization management
    this.isLoaded = false;
    this.currentVisualization = null;
    this.visualizations = new Map();
    
    // Validate this is not instantiated directly
    if (this.constructor === Plugin) {
      throw new Error("Plugin is an abstract class and cannot be instantiated directly");
    }
  }

  // Plugin initialization method
  async load() {
    if (this.isLoaded) return true;
    
    try {
      // Initialize plugin parameters
      const pluginSchema = this.definePluginParameters();
      this.pluginParameters = this._getDefaultValuesFromSchema(pluginSchema);
      
      // Initialize advanced parameters if any
      const advancedSchema = this.defineAdvancedParameters();
      this.advancedParameters = this._getDefaultValuesFromSchema(advancedSchema);
      
      // Initialize default visualization
      await this._initializeDefaultVisualization();
      
      // Initialize visualization parameters after visualization is selected
      if (this.currentVisualization) {
        const visualizationSchema = this.getVisualizationParameters();
        this.visualizationParameters = this._getDefaultValuesFromSchema(visualizationSchema);
      }
      
      // Mark as loaded
      this.isLoaded = true;
      
      // Give parameters to the UI manager
      this.giveParameters(true);
      
      // Update actions
      if (this.core && this.core.uiManager) {
        const actions = this.defineActions();
        this.core.uiManager.updateActions(actions);
      }
      
      return true;
    } catch (error) {
      console.error(`Error loading plugin ${this.constructor.id}:`, error);
      await this.unload();
      return false;
    }
  }

  // Plugin cleanup method
  async unload() {
    if (!this.isLoaded) return true;
    
    try {
      // Clean up current visualization
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
        this.currentVisualization = null;
      }
      
      // Clear all visualizations
      this.visualizations.clear();
      
      // Clear parameters
      this.pluginParameters = {};
      this.visualizationParameters = {};
      this.advancedParameters = {};
      
      // Mark as unloaded
      this.isLoaded = false;
      
      return true;
    } catch (error) {
      console.error(`Error unloading plugin ${this.constructor.id}:`, error);
      return false;
    }
  }

  // Send parameters to UI
  giveParameters(rebuild = false) {
    if (!this.core) return;
    
    // Create schema objects for UI
    const pluginSchema = this.definePluginParameters();
    
    // Get visualization parameters
    let visualizationSchema = [];
    
    // Always add currentVisualization selector at the top if we have multiple visualizations
    if (this.visualizations.size > 1) {
      const currentVisualizationParam = {
        id: 'currentVisualization',
        type: 'dropdown',
        label: 'Current Visualization',
        options: this._getVisualizationOptions(),
        default: this.currentVisualization ? this._getVisualizationId(this.currentVisualization) : ''
      };
      
      // Add to the beginning of visualization parameter list
      visualizationSchema = [currentVisualizationParam];
      
      // Add rest of visualization parameters
      const vizParams = this.getVisualizationParameters();
      if (Array.isArray(vizParams)) {
        visualizationSchema = [...visualizationSchema, ...vizParams];
      }
    } else {
      // Just use visualization parameters if only one visualization
      visualizationSchema = this.getVisualizationParameters();
    }
    
    const advancedSchema = this.defineAdvancedParameters();
    
    // Format parameters for UI manager
    const parameterData = {
      pluginParameters: {
        schema: pluginSchema,
        values: this.pluginParameters
      },
      visualizationParameters: {
        schema: visualizationSchema,
        values: {
          ...this.visualizationParameters,
          // Ensure currentVisualization is included if we have multiple visualizations
          ...(this.visualizations.size > 1 ? {
            currentVisualization: this.currentVisualization ? 
                                 this._getVisualizationId(this.currentVisualization) : ''
          } : {})
        }
      },
      advancedParameters: {
        schema: advancedSchema,
        values: this.advancedParameters
      }
    };
    
    // Send to UI manager
    this.core.uiManager.updatePluginParameterGroups(parameterData, rebuild);
  }
  
  // Define plugin-level parameters
  definePluginParameters() {
    // Override in subclass
    return [];
  }
  
  // Define advanced parameters
  defineAdvancedParameters() {
    // Override in subclass
    return [];
  }
  
  // Get parameters for the current visualization
  getVisualizationParameters() {
    // Get visualization-specific parameters if a visualization is active
    if (this.currentVisualization) {
      const vizClass = this.currentVisualization.constructor;
      
      // Check if the visualization class has a getParameters method
      if (vizClass && typeof vizClass.getParameters === 'function') {
        return vizClass.getParameters();
      }
    }
    
    return [];
  }

  // Handle parameter changes
  onParameterChanged(parameterId, value, parameterGroup = null) {
    // Special case for visualization switching
    if (parameterId === 'currentVisualization' && this.visualizations.has(value)) {
      this.setVisualization(value);
      return;
    }
    
    // Determine which group this parameter belongs to if not specified
    if (!parameterGroup) {
      if (this.pluginParameters.hasOwnProperty(parameterId)) {
        parameterGroup = 'plugin';
      } else if (this.visualizationParameters.hasOwnProperty(parameterId)) {
        parameterGroup = 'visualization';
      } else if (this.advancedParameters.hasOwnProperty(parameterId)) {
        parameterGroup = 'advanced';
      }
    }
    
    // Update the appropriate parameter collection
    switch (parameterGroup) {
      case 'plugin':
        this.pluginParameters[parameterId] = value;
        
        // Update visualization with this parameter
        if (this.currentVisualization) {
          this.currentVisualization.update({ [parameterId]: value });
        }
        break;
        
      case 'visualization':
        this.visualizationParameters[parameterId] = value;
        
        // Update visualization with this parameter
        if (this.currentVisualization) {
          this.currentVisualization.update({ [parameterId]: value });
        }
        break;
        
      case 'advanced':
        this.advancedParameters[parameterId] = value;
        
        // Update visualization with this parameter
        if (this.currentVisualization) {
          this.currentVisualization.update({ [parameterId]: value });
        }
        break;
    }
    
    // Request render from the core
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }
  
  // Define available actions
  defineActions() {
    return [
      {
        id: "export-png",
        label: "Export as PNG"
      },
      {
        id: "reset-parameters",
        label: "Reset Parameters"
      }
    ];
  }
  
  // Update a single parameter 
  updateParameter(parameterId, value, parameterGroup = null, updateUI = true) {
    // Special case for visualization switching
    if (parameterId === 'currentVisualization' && this.visualizations.has(value)) {
      this.setVisualization(value);
      return;
    }
    
    // Determine which group this parameter belongs to if not specified
    if (!parameterGroup) {
      if (this.pluginParameters.hasOwnProperty(parameterId)) {
        parameterGroup = 'plugin';
      } else if (this.visualizationParameters.hasOwnProperty(parameterId)) {
        parameterGroup = 'visualization';
      } else if (this.advancedParameters.hasOwnProperty(parameterId)) {
        parameterGroup = 'advanced';
      }
    }
    
    // Update parameter in correct collection
    switch (parameterGroup) {
      case 'plugin':
        this.pluginParameters[parameterId] = value;
        break;
        
      case 'visualization':
        this.visualizationParameters[parameterId] = value;
        break;
        
      case 'advanced':
        this.advancedParameters[parameterId] = value;
        break;
    }
    
    // Update visualization
    if (this.currentVisualization) {
      this.currentVisualization.update({ [parameterId]: value });
    }
    
    // Update UI if requested
    if (updateUI) {
      this.giveParameters(false);
    }
  }

  // Reset parameters to their default values
  resetParameters(groups = ['plugin', 'visualization', 'advanced'], updateUI = true) {
    if (groups.includes('plugin')) {
      const pluginSchema = this.definePluginParameters();
      this.pluginParameters = this._getDefaultValuesFromSchema(pluginSchema);
    }
    
    if (groups.includes('visualization')) {
      const visualizationSchema = this.getVisualizationParameters();
      this.visualizationParameters = this._getDefaultValuesFromSchema(visualizationSchema);
      
      // Preserve currentVisualization
      const currentVizId = this._getVisualizationId(this.currentVisualization);
      if (currentVizId) {
        this.visualizationParameters.currentVisualization = currentVizId;
      }
    }
    
    if (groups.includes('advanced')) {
      const advancedSchema = this.defineAdvancedParameters();
      this.advancedParameters = this._getDefaultValuesFromSchema(advancedSchema);
    }
    
    // Update visualization with all parameters
    if (this.currentVisualization) {
      this.currentVisualization.update({
        ...this.pluginParameters,
        ...this.visualizationParameters,
        ...this.advancedParameters
      });
    }
    
    // Update UI if requested
    if (updateUI) {
      this.giveParameters(true);
    }
  }

  // Execute an action
  executeAction(actionId, ...args) {
    // Handle common actions
    switch (actionId) {
      case "export-png":
        // Export as PNG using core
        if (this.core && this.core.renderingManager) {
          this.core.renderingManager.exportAsPNG();
          return true;
        }
        return false;
        
      case "reset-parameters":
        // Reset to default parameters
        this.resetParameters(['plugin', 'visualization', 'advanced'], true);
        return true;
    }
    
    // Action not handled
    return false;
  }
  
  // Get the current visualization
  getCurrentVisualization() {
    return this.currentVisualization;
  }
  
  // Set the current visualization by ID
  async setVisualization(visualizationId) {
    // Check if the visualization exists
    if (!this.visualizations.has(visualizationId)) {
      console.error(`Visualization ${visualizationId} not found in plugin ${this.constructor.id}`);
      return false;
    }
    
    try {
      // Clean up current visualization if any
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
      }
      
      // Set new visualization
      this.currentVisualization = this.visualizations.get(visualizationId);
      
      // Reset visualization parameters to defaults from the new visualization
      const vizSchema = this.getVisualizationParameters();
      this.visualizationParameters = this._getDefaultValuesFromSchema(vizSchema);
      
      // Ensure currentVisualization parameter is set
      this.visualizationParameters.currentVisualization = visualizationId;
      
      // Initialize the new visualization with all parameters
      await this.currentVisualization.initialize({
        ...this.pluginParameters,
        ...this.visualizationParameters,
        ...this.advancedParameters
      });
      
      // Update UI to reflect visualization-specific parameters
      this.giveParameters(true);
      
      return true;
    } catch (error) {
      console.error(`Error setting visualization ${visualizationId}:`, error);
      return false;
    }
  }
  
  // Register a visualization with this plugin
  registerVisualization(id, visualization) {
    this.visualizations.set(id, visualization);
  }
  
  // Initialize the default visualization (abstract)
  async _initializeDefaultVisualization() {
    throw new Error("_initializeDefaultVisualization must be implemented by subclass");
  }
  
  // Helper to get visualization options
  _getVisualizationOptions() {
    return Array.from(this.visualizations.entries()).map(([id, viz]) => {
      // Try to get a nice display name 
      let label = id;
      
      // If visualization class has a static name property, use that
      if (viz.constructor.name && viz.constructor.name !== 'Function') {
        label = viz.constructor.name;
      }
      
      return { value: id, label: label };
    });
  }
  
  // Helper to get visualization ID from instance
  _getVisualizationId(visualization) {
    if (!visualization) return '';
    
    // Find the ID from the visualizations map
    for (const [id, viz] of this.visualizations.entries()) {
      if (viz === visualization) {
        return id;
      }
    }
    
    return '';
  }
  
  // Extract default parameter values from a schema
  _getDefaultValuesFromSchema(schema) {
    const defaults = {};
    
    if (Array.isArray(schema)) {
      schema.forEach(param => {
        if (param && param.id && param.default !== undefined) {
          defaults[param.id] = param.default;
        }
      });
    }
    
    return defaults;
  }
}