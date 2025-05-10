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
    this.isActive = false;
    this.currentVisualization = null;
    this.visualizations = new Map();
    
    // Validate that this is not instantiated directly
    if (this.constructor === Plugin) {
      throw new Error("Plugin is an abstract class and cannot be instantiated directly");
    }
  }

  /**
   * Initialize the plugin
   * Called when the plugin is first loaded, before activation
   * Lightweight initialization only
   */
  async initialize() {
    // Set default parameters
    const schema = this.getParameterSchema();
    this.parameters = this._getDefaultParametersFromSchema(schema);
    return true;
  }

  /**
   * Activate the plugin
   * Called when the plugin is selected by the user
   * Initialize resources, set up visualizations
   */
  async activate() {
    if (this.isActive) return true;
    
    try {
      // Initialize default visualization
      await this._initializeDefaultVisualization();
      this.isActive = true;
      return true;
    } catch (error) {
      console.error(`Error activating plugin ${this.constructor.id}:`, error);
      return false;
    }
  }

  /**
   * Deactivate the plugin
   * Called when another plugin is activated
   * Clean up resources, dispose visualizations
   */
  async deactivate() {
    if (!this.isActive) return true;
    
    try {
      // Clean up current visualization
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
        this.currentVisualization = null;
      }
      
      this.isActive = false;
      return true;
    } catch (error) {
      console.error(`Error deactivating plugin ${this.constructor.id}:`, error);
      return false;
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
        
        // Update UI
        this.core.uiManager.updateControls(this.parameters);
        
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
