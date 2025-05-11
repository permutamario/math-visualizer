// src/core/Plugin.js

/**
 * Base class for all visualization plugins
 * Plugins manage parameters and visualizations
 */
export class Plugin {
  /**
   * Plugin metadata
   */
  static id = "base-plugin";
  static name = "Base Plugin";
  static description = "Abstract base plugin - do not use directly";
  static renderingType = "2d"; // "2d" or "3d"

  /**
   * Plugin instance constructor
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    // Core application reference
    this.core = core;
    
    // Parameter collections
    this.pluginParameters = {};     // Parameters that affect the entire plugin
    this.visualizationParameters = {}; // Parameters specific to current visualization
    this.advancedParameters = {};   // Advanced parameters (shown optionally)
    
    // Visualization management
    this.isLoaded = false;
    this.currentVisualization = null;
    this.visualizations = new Map();
    
    // Validate that this is not instantiated directly
    if (this.constructor === Plugin) {
      throw new Error("Plugin is an abstract class and cannot be instantiated directly");
    }
  }

  /**
   * Get all parameters (combined for backward compatibility)
   * @returns {Object} Combined parameters
   */
  get parameters() {
    return {
      ...this.pluginParameters,
      ...this.visualizationParameters,
      ...this.advancedParameters
    };
  }

  /**
   * Load the plugin
   * Called when the plugin is selected by the user
   * Sets up all resources, parameters, and visualizations
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
      // Clean up any partial state in case of failure
      await this.unload();
      return false;
    }
  }

  /**
   * Unload the plugin
   * Called when another plugin is selected
   * Cleans up all resources and returns to a fresh state
   */
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

  /**
   * Give parameters to the UI manager
   * Controls whether to rebuild the UI or just update values
   * @param {boolean} rebuild - Whether to rebuild the entire UI
   */
  giveParameters(rebuild = false) {
    if (!this.core) {
      console.warn(`Cannot give parameters: core not available in plugin ${this.constructor.id}`);
      return;
    }
    
    // Create schema objects for UI
    const pluginSchema = this.definePluginParameters();
    const visualizationSchema = this.getVisualizationParameters();
    const advancedSchema = this.defineAdvancedParameters();
    
    // Format parameters for UI manager
    const parameterData = {
      pluginParameters: {
        schema: pluginSchema,
        values: this.pluginParameters
      },
      visualizationParameters: {
        schema: visualizationSchema,
        values: this.visualizationParameters
      },
      advancedParameters: {
        schema: advancedSchema,
        values: this.advancedParameters
      }
    };
    
    // Send to UI manager
    if (this.core.uiManager && typeof this.core.uiManager.updatePluginParameterGroups === 'function') {
      this.core.uiManager.updatePluginParameterGroups(parameterData, rebuild);
    } else {
      // Fallback for backward compatibility
      console.warn("UIManager doesn't support parameter groups, using compatibility mode");
      this.core.updatePluginParameters(this, rebuild);
    }
  }
  
  /**
   * Define plugin-level parameters
   * These parameters affect the entire plugin and all visualizations
   * @returns {Array} Array of parameter definitions
   */
  definePluginParameters() {
    // If multiple visualizations are available, add visualization selector parameter
    if (this.visualizations && this.visualizations.size > 1) {
      const visualizationOptions = Array.from(this.visualizations.keys()).map(id => {
        // Try to get a nice display name if available
        const viz = this.visualizations.get(id);
        const displayName = viz.constructor.name || id;
        
        return { value: id, label: displayName };
      });
      
      return [
        {
          id: 'visualizationType',
          type: 'dropdown',
          label: 'Visualization Type',
          options: visualizationOptions,
          default: visualizationOptions[0]?.value || ''
        }
      ];
    }
    
    // Default empty array if no additional visualizations
    return [];
  }
  
  /**
   * Define advanced parameters
   * These are shown optionally to users
   * @returns {Array} Array of parameter definitions
   */
  defineAdvancedParameters() {
    // Subclasses can override this
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
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value
   * @param {string} parameterGroup - Which group the parameter belongs to 
   *                                 ('plugin', 'visualization', or 'advanced')
   */
  onParameterChanged(parameterId, value, parameterGroup = null) {
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
        
        // Handle special case: visualization selection parameter
        if (parameterId === 'visualizationType' && this.visualizations.has(value)) {
          this.setVisualization(value);
          return; // Don't continue with normal parameter updates
        }
        
        // Update all visualizations with this parameter
        if (this.currentVisualization) {
          this.currentVisualization.update({ [parameterId]: value });
        }
        break;
        
      case 'visualization':
        this.visualizationParameters[parameterId] = value;
        
        // Update only the current visualization
        if (this.currentVisualization) {
          this.currentVisualization.update({ [parameterId]: value });
        }
        break;
        
      case 'advanced':
        this.advancedParameters[parameterId] = value;
        
        // Update current visualization with advanced parameters
        if (this.currentVisualization) {
          this.currentVisualization.update({ [parameterId]: value });
        }
        break;
        
      default:
        // For backward compatibility, treat as visualization parameter
        this.visualizationParameters[parameterId] = value;
        
        if (this.currentVisualization) {
          this.currentVisualization.update({ [parameterId]: value });
        }
    }
    
    // Request render from the core
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }
  
  /**
   * Define available actions for this plugin
   * @returns {Array<Action>} List of available actions
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
   * @param {string} parameterGroup - Which group the parameter belongs to
   * @param {boolean} updateUI - Whether to update the UI
   */
  updateParameter(parameterId, value, parameterGroup = null, updateUI = true) {
    // Determine which group this parameter belongs to if not specified
    if (!parameterGroup) {
      if (this.pluginParameters.hasOwnProperty(parameterId)) {
        parameterGroup = 'plugin';
      } else if (this.visualizationParameters.hasOwnProperty(parameterId)) {
        parameterGroup = 'visualization';
      } else if (this.advancedParameters.hasOwnProperty(parameterId)) {
        parameterGroup = 'advanced';
      } else {
        // Default to visualization parameters if not found elsewhere
        parameterGroup = 'visualization';
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

  /**
   * Reset parameters to their default values
   * @param {Array<string>} groups - Which parameter groups to reset (default: all)
   * @param {boolean} updateUI - Whether to update the UI
   */
  resetParameters(groups = ['plugin', 'visualization', 'advanced'], updateUI = true) {
    try {
      if (groups.includes('plugin')) {
        const pluginSchema = this.definePluginParameters();
        this.pluginParameters = this._getDefaultValuesFromSchema(pluginSchema);
      }
      
      if (groups.includes('visualization')) {
        const visualizationSchema = this.getVisualizationParameters();
        this.visualizationParameters = this._getDefaultValuesFromSchema(visualizationSchema);
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
    } catch (error) {
      console.error('Error resetting parameters:', error);
    }
  }

  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
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
  
  /**
   * Get the current visualization
   * @returns {Visualization} Current visualization instance
   */
  getCurrentVisualization() {
    return this.currentVisualization;
  }
  
  /**
   * Set the current visualization by ID
   * @param {string} visualizationId - ID of the visualization to activate
   * @returns {Promise<boolean>} Whether the change was successful
   */
  async setVisualization(visualizationId) {
    // Check if the visualization exists
    if (!this.visualizations.has(visualizationId)) {
      console.error(`Visualization ${visualizationId} not found in plugin ${this.constructor.id}`);
      return false;
    }
    
    try {
      // Update plugin parameters if needed
      if (this.pluginParameters.visualizationType !== visualizationId) {
        this.pluginParameters.visualizationType = visualizationId;
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
  
  /**
   * Register a visualization with this plugin
   * @param {string} id - Visualization ID
   * @param {Visualization} visualization - Visualization instance
   */
  registerVisualization(id, visualization) {
    this.visualizations.set(id, visualization);
  }
  
  // PRIVATE METHODS
  
  /**
   * Initialize the default visualization
   * @private
   */
  async _initializeDefaultVisualization() {
    // This should be implemented by subclasses
    throw new Error("_initializeDefaultVisualization must be implemented by subclass");
  }
  
  /**
   * Extract default parameter values from a schema
   * @param {Array} schema - Parameter schema array
   * @returns {Object} Object with default parameter values
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

// Import the parameter builder
import { createParameters } from '../ui/ParameterBuilder.js';