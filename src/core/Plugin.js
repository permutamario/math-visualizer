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
    
    // Plugin state
    this.parameters = {};
    this.isLoaded = false;
    this.currentVisualization = null;
    this.visualizations = new Map();
    
    // Validate that this is not instantiated directly
    if (this.constructor === Plugin) {
      throw new Error("Plugin is an abstract class and cannot be instantiated directly");
    }
  }

  /**
   * Load the plugin
   * Called when the plugin is selected by the user
   * Sets up all resources, parameters, and visualizations
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      // Initialize default parameters
      const schema = this.getParameterSchema();
      this.parameters = this._getDefaultParametersFromSchema(schema);
      
      // Initialize default visualization
      await this._initializeDefaultVisualization();
      
      // Mark as loaded
      this.isLoaded = true;
      
      // Give parameters to the UI manager
      this.giveParameters(true);
      
      // Update actions
      if (this.core && this.core.uiManager) {
        const actions = this.getActions();
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
      this.parameters = {};
      
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
    if (!this.core || !this.core.uiManager) {
      console.warn(`Cannot give parameters: UI manager not available in plugin ${this.constructor.id}`);
      return;
    }
    
    if (rebuild) {
      // Get schema and build controls from scratch
      const schema = this.getParameterSchema();
console.log("Parameters", this.parameters);
      this.core.uiManager.buildControlsFromSchema(schema, this.parameters);
    } else {
      // Just update control values
      this.core.uiManager.updateControls(this.parameters);
    }
  }
  
  /**
   * Get the parameter schema for this plugin
   * Should be overridden by subclasses
   * @returns {ParameterSchema} Schema defining parameters and UI controls
   */
  getParameterSchema() {
    return {
      structural: [],
      visual: []
    };
  }
  
  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value
   */
  onParameterChanged(parameterId, value) {
    // Update the parameter value
    this.parameters[parameterId] = value;
    
    // If we have a current visualization, update it
    if (this.currentVisualization) {
      this.currentVisualization.update(this.parameters);
    }
    
    // Update the UI with the new parameter value
    this.giveParameters(false);
  }
  
  /**
   * Get available actions for this plugin
   * @returns {Action[]} List of available actions
   */
  getActions() {
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
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    // Handle common actions
    switch (actionId) {
      case "export-png":
        // Default implementation for PNG export
        this.core.renderingManager.exportAsPNG();
        return true;
        
      case "reset-parameters":
        // Reset to default parameters
        const schema = this.getParameterSchema();
        this.parameters = this._getDefaultParametersFromSchema(schema);
        
        // Update UI with rebuilt controls
        this.giveParameters(true);
        
        // Update visualization
        if (this.currentVisualization) {
          this.currentVisualization.update(this.parameters);
        }
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
    
    // Clean up current visualization if it exists
    if (this.currentVisualization) {
      this.currentVisualization.dispose();
    }
    
    // Set and initialize the new visualization
    this.currentVisualization = this.visualizations.get(visualizationId);
    await this.currentVisualization.initialize(this.parameters);
    
    // Update UI to reflect any visualization-specific parameters
    this.giveParameters(true);
    
    return true;
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
   * @param {ParameterSchema} schema - Parameter schema
   * @returns {Object} Object with default parameter values
   * @private
   */
  _getDefaultParametersFromSchema(schema) {
    const defaults = {};
    
    // Process structural parameters
    if (schema.structural) {
      for (const param of schema.structural) {
        defaults[param.id] = param.default;
      }
    }
    
    // Process visual parameters
    if (schema.visual) {
      for (const param of schema.visual) {
        defaults[param.id] = param.default;
      }
    }
    
    return defaults;
  }
}
