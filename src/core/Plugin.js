// src/core/Plugin.js - Improved version
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

  /**
   * Plugin initialization method
   * @returns {Promise<boolean>} Whether loading was successful
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      // Initialize plugin parameters
      const pluginSchema = this.definePluginParameters();
      this.pluginParameters = this._getDefaultValuesFromSchema(pluginSchema);
      
      // Initialize advanced parameters if any
      const advancedSchema = this.defineAdvancedParameters();
      this.advancedParameters = this._getDefaultValuesFromSchema(advancedSchema);
      
      // Initialize visualizations
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

  /**
   * Plugin cleanup method
   * @returns {Promise<boolean>} Whether unloading was successful
   */
  async unload() {
    if (!this.isLoaded) return true;
    
    try {
      // Clean up current visualization
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
        this.currentVisualization = null;
      }
      
      // Clean up all visualizations
      for (const visualization of this.visualizations.values()) {
        if (visualization !== this.currentVisualization) {
          try {
            visualization.dispose();
          } catch (error) {
            console.error("Error disposing visualization:", error);
          }
        }
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

  /**
   * Send parameters to UI
   * @param {boolean} rebuild - Whether to rebuild UI controls
   */
  giveParameters(rebuild = false) {
    if (!this.core || !this.core.uiManager) return;
    
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
  
  /**
   * Define plugin-level parameters
   * @returns {Array} Array of parameter definitions
   */
  definePluginParameters() {
    // Override in subclass
    return [];
  }
  
  /**
   * Define advanced parameters
   * @returns {Array} Array of parameter definitions
   */
  defineAdvancedParameters() {
    // Override in subclass
    return [];
  }
  
  /**
   * Get parameters for the current visualization
   * @returns {Array} Array of parameter definitions
   */
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

  /**
   * Handle parameter changes
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New value
   * @param {string} parameterGroup - Parameter group (optional)
   */
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
        
        // Update all visualizations with plugin parameters
        if (this.currentVisualization) {
          this.currentVisualization.update({ [parameterId]: value });
        }
        break;
        
      case 'visualization':
        this.visualizationParameters[parameterId] = value;
        
        // Update visualization with visualization-specific parameters
        if (this.currentVisualization) {
          this.currentVisualization.update({ [parameterId]: value });
        }
        break;
        
      case 'advanced':
        this.advancedParameters[parameterId] = value;
        
        // Update visualization with advanced parameters
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
  
  /**
   * Define available actions
   * @returns {Array} Array of action definitions
   */
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
  
  /**
   * Update a single parameter 
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New value
   * @param {string} parameterGroup - Parameter group (optional)
   * @param {boolean} updateUI - Whether to update the UI
   */
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
    if (updateUI && this.core && this.core.uiManager) {
      // Use updateParameterValue method if available
      if (typeof this.core.uiManager.updateParameterValue === 'function') {
        this.core.uiManager.updateParameterValue(parameterId, value, parameterGroup);
      } else {
        // Fall back to full parameters update
        this.giveParameters(false);
      }
    }
    
    // Request a render
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }

  /**
   * Reset parameters to their default values
   * @param {Array<string>} groups - Parameter groups to reset
   * @param {boolean} updateUI - Whether to update the UI
   */
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
    
    // Request a render
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }

  /**
   * Execute an action
   * @param {string} actionId - Action ID
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    // Handle common actions
    switch (actionId) {
      case "export-png":
        // Export as PNG using core
        if (this.core && this.core.renderingManager) {
          return this.core.renderingManager.exportAsPNG();
        }
        return false;
        
      case "reset-parameters":
        // Reset to default parameters
        this.resetParameters(['plugin', 'visualization', 'advanced'], true);
        
        // Show notification if possible
        if (this.core && this.core.uiManager) {
          this.core.uiManager.showNotification("Parameters reset to defaults");
        }
        return true;
        
      case "reset-view":
        // Reset camera/view in the rendering manager
        if (this.core && this.core.renderingManager) {
          const environment = this.core.renderingManager.getCurrentEnvironment();
          if (environment && typeof environment.resetCamera === 'function') {
            environment.resetCamera();
            return true;
          }
        }
        return false;
    }
    
    // Action not handled
    return false;
  }
  
  /**
   * Get the current visualization
   * @returns {Visualization|null} Current visualization or null
   */
  getCurrentVisualization() {
    return this.currentVisualization;
  }
  
  /**
   * Set the current visualization by ID
   * @param {string} visualizationId - Visualization ID
   * @returns {Promise<boolean>} Whether the change was successful
   */
  async setVisualization(visualizationId) {
    // Check if the visualization exists
    if (!this.visualizations.has(visualizationId)) {
      console.error(`Visualization ${visualizationId} not found in plugin ${this.constructor.id}`);
      return false;
    }
    
    try {
      // Show loading indicator if available
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showLoading(`Switching visualization...`);
      }
      
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
      const combinedParams = {
        ...this.pluginParameters,
        ...this.visualizationParameters,
        ...this.advancedParameters
      };
      
      await this.currentVisualization.initialize(combinedParams);
      
      // Update UI to reflect visualization-specific parameters
      this.giveParameters(true);
      
      // Hide loading indicator
      if (this.core && this.core.uiManager) {
        this.core.uiManager.hideLoading();
      }
      
      // Request a render
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
      
      return true;
    } catch (error) {
      console.error(`Error setting visualization ${visualizationId}:`, error);
      
      // Hide loading indicator
      if (this.core && this.core.uiManager) {
        this.core.uiManager.hideLoading();
        this.core.uiManager.showError(`Error switching visualization: ${error.message}`);
      }
      
      return false;
    }
  }
  
  /**
   * Register a visualization with this plugin
   * @param {string} id - Visualization ID
   * @param {Visualization} visualization - Visualization instance
   */
  registerVisualization(id, visualization) {
    this.visualizations.set(id, visualization);
  }
  
  /**
   * Initialize the default visualization (abstract)
   * @returns {Promise<boolean>} Whether initialization was successful
   * @private
   */
  async _initializeDefaultVisualization() {
    throw new Error("_initializeDefaultVisualization must be implemented by subclass");
  }
  
  /**
   * Helper to get visualization options
   * @returns {Array<Object>} Visualization options
   * @private
   */
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
  
  /**
   * Helper to get visualization ID from instance
   * @param {Visualization} visualization - Visualization instance
   * @returns {string} Visualization ID
   * @private
   */
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
  
  /**
   * Extract default parameter values from a schema
   * @param {Array} schema - Parameter schema
   * @returns {Object} Default parameter values
   * @private
   */
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