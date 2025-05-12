// src/core/Plugin.js

/**
 * Base plugin interface for the Math Visualization Framework
 * Uses a simple API-based approach instead of inheritance
 */
export class Plugin {
  /**
   * Create a plugin instance
   * @param {Object} pluginDefinition - Plugin definition object
   * @param {AppCore} core - Reference to the application core
   */
  constructor(pluginDefinition, core) {
    // Ensure required properties are present
    if (!pluginDefinition.id || !pluginDefinition.name || !pluginDefinition.renderingType) {
      throw new Error("Plugin definition must have id, name, and renderingType properties");
    }
    
    // Add essential properties from definition to this instance
    this.id = pluginDefinition.id;
    this.name = pluginDefinition.name;
    this.description = pluginDefinition.description || "No description provided";
    this.renderingType = pluginDefinition.renderingType;
    
    // Store the original plugin definition
    this._definition = pluginDefinition;
    
    // Store core reference
    this.core = core;

    // Store the rendering environment which is used to render
    this.renderEnv = core.getRenderingEnvironment();
    
    // Internal state
    this.isLoaded = false;
    this._eventHandlers = [];
  }
  
  /**
   * Load and initialize the plugin
   * @returns {Promise<boolean>} Whether loading was successful
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log(`Loading plugin: ${this.name} (${this.id})`);
      
      // Call plugin's load method if it exists
      if (typeof this._definition.load === 'function') {
        // Plugin definition's load method should be called with the core
        // Plugin will get rendering environment directly from core if needed
        const success = await this._definition.load(this.core);
        
        if (success === false) {
          // Explicitly returned false
          console.error(`Plugin ${this.id} load() returned false`);
          return false;
        }
      }
      
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error(`Error loading plugin ${this.id}:`, error);
      await this.unload();
      return false;
    }
  }
  
  /**
   * Unload and clean up the plugin
   * @returns {Promise<boolean>} Whether unloading was successful
   */
  async unload() {
    if (!this.isLoaded) return true;
    
    try {
      console.log(`Unloading plugin: ${this.name} (${this.id})`);
      
      // Call plugin's unload method if it exists
      if (typeof this._definition.unload === 'function') {
        await this._definition.unload(this.core);
      }
      
      // Remove all event handlers
      this._removeAllEventHandlers();
      
      // Reset state
      this.isLoaded = false;
      
      return true;
    } catch (error) {
      console.error(`Error unloading plugin ${this.id}:`, error);
      return false;
    }
  }
  
  /**
   * Handle parameter changes
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New value
   * @param {string} group - Parameter group
   */
  onParameterChanged(parameterId, value, group) {
    // Forward to plugin's handler if it exists
    if (typeof this._definition.onParameterChanged === 'function') {
      this._definition.onParameterChanged(parameterId, value, group);
    }
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @returns {boolean} Whether animation should continue
   */
  animate(deltaTime) {
    // Forward to plugin's animate method if it exists
    if (typeof this._definition.animate === 'function') {
      return this._definition.animate(deltaTime);
    }
    
    return false;
  }
  
  /**
   * Execute an action
   * @param {string} actionId - Action ID
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    // Forward to plugin's action handler if it exists
    if (typeof this._definition.executeAction === 'function') {
      return this._definition.executeAction(actionId, ...args);
    }
    
    return false;
  }
  
  /**
   * Clean up event handlers
   * @private
   */
  _removeAllEventHandlers() {
    this._eventHandlers.forEach(handler => {
      if (handler.type === 'parameterChanged') {
        this.core?.removeParameterCallback(handler.callback);
      } else if (handler.type === 'action') {
        this.core?.removeActionCallback(handler.callback);
      }
    });
    
    this._eventHandlers = [];
  }
}