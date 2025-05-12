// src/core/Plugin.js

/**
 * Base plugin interface for the Math Visualization Framework
 */
export class Plugin {
  /**
   * Create a plugin instance
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    // Get metadata from static properties
    const metadata = this.constructor;
    
    // Ensure required properties are present in the class (static properties)
    if (!metadata.id || !metadata.name || !metadata.renderingType) {
      throw new Error("Plugin class must have static id, name, and renderingType properties");
    }
    
    // Add essential properties from static metadata to this instance
    this.id = metadata.id;
    this.name = metadata.name;
    this.description = metadata.description || "No description provided";
    this.renderingType = metadata.renderingType;
    
    // Store core reference
    this.core = core;
    
    // Internal state
    this.isLoaded = false;
    this._eventHandlers = [];
    
    
    // Parameter storage
    this.pluginParameters = {};
    this.visualizationParameters = {};
    this.advancedParameters = {};
  }
  
  /**
   * Load and initialize the plugin - framework internal use
   * @returns {Promise<boolean>} Whether loading was successful
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log(`Loading plugin: ${this.name} (${this.id})`);
      
      // Framework initialization steps
      // Get the rendering environment at load time to ensure it's the correct one
      this.renderEnv = this.core.getRenderingEnvironment();
      
      // Call the user-implemented start method
      await this.start();
      
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error(`Error loading plugin ${this.id}:`, error);
      await this.unload();
      return false;
    }
  }
  
  /**
   * Start the plugin - main entry point for plugin developers
   * Override this method to implement plugin-specific initialization
   * @returns {Promise<void>}
   */
  async start() {
    // To be implemented by subclasses
    // This is where plugin developers should put their initialization code
  }
  
  /**
   * Unload and clean up the plugin
   * @returns {Promise<boolean>} Whether unloading was successful
   */
  async unload() {
    if (!this.isLoaded) return true;
    
    try {
      console.log(`Unloading plugin: ${this.name} (${this.id})`);
      
      // Implementation will be provided by subclasses
      
      // Remove all event handlers
      this._removeAllEventHandlers();
      
      // Reset state
      this.isLoaded = false;
      this.renderEnv = null;
      
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
    // Implementation will be provided by subclasses
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @returns {boolean} Whether animation should continue
   */
  animate(deltaTime) {
    // Implementation will be provided by subclasses
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