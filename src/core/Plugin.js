// src/core/Plugin.js

/**
 * Enhanced base plugin interface for the Math Visualization Framework
 * Provides convenient helper methods while maintaining the framework philosophy
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
    this._animationHandlers = [];
    
    // Parameter tracking
    this._visualParameters = [];
    this._structuralParameters = [];
    this._advancedParameters = [];
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
      
      // Cancel all animations
      this._cancelAllAnimations();
      
      // Remove all event handlers
      this._removeAllEventHandlers();
      
      // Reset state
      this.isLoaded = false;
      this.renderEnv = null;
      this._visualParameters = [];
      this._structuralParameters = [];
      this._advancedParameters = [];
      
      return true;
    } catch (error) {
      console.error(`Error unloading plugin ${this.id}:`, error);
      return false;
    }
  }
  
  // ======== PARAMETER MANAGEMENT HELPER METHODS ========
  
  /**
   * Add a slider parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {number} defaultValue - Default value
   * @param {Object} options - Options like min, max, step
   * @param {string} group - Parameter group ('visual', 'structural', 'advanced')
   * @returns {Plugin} This plugin for chaining
   */
  addSlider(id, label, defaultValue, options = {}, group = 'visual') {
    const param = {
      id,
      type: 'slider',
      label,
      default: defaultValue,
      min: options.min !== undefined ? options.min : 0,
      max: options.max !== undefined ? options.max : 100,
      step: options.step !== undefined ? options.step : 1
    };
    
    this._addParameter(param, group);
    return this;
  }
  
  /**
   * Add a checkbox parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {boolean} defaultValue - Default value
   * @param {string} group - Parameter group ('visual', 'structural', 'advanced')
   * @returns {Plugin} This plugin for chaining
   */
  addCheckbox(id, label, defaultValue, group = 'visual') {
    const param = {
      id,
      type: 'checkbox',
      label,
      default: defaultValue
    };
    
    this._addParameter(param, group);
    return this;
  }
  
  /**
   * Add a color picker parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {string} defaultValue - Default color value
   * @param {string} group - Parameter group ('visual', 'structural', 'advanced')
   * @returns {Plugin} This plugin for chaining
   */
  addColor(id, label, defaultValue, group = 'visual') {
    const param = {
      id,
      type: 'color',
      label,
      default: defaultValue
    };
    
    this._addParameter(param, group);
    return this;
  }
  
  /**
   * Add a dropdown parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {string} defaultValue - Default selected value
   * @param {Array} options - Array of options (strings or {value, label} objects)
   * @param {string} group - Parameter group ('visual', 'structural', 'advanced')
   * @returns {Plugin} This plugin for chaining
   */
  addDropdown(id, label, defaultValue, options, group = 'visual') {
    const param = {
      id,
      type: 'dropdown',
      label,
      default: defaultValue,
      options
    };
    
    this._addParameter(param, group);
    return this;
  }
  
  /**
   * Add a number input parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {number} defaultValue - Default value
   * @param {Object} options - Options like min, max, step
   * @param {string} group - Parameter group ('visual', 'structural', 'advanced')
   * @returns {Plugin} This plugin for chaining
   */
  addNumber(id, label, defaultValue, options = {}, group = 'visual') {
    const param = {
      id,
      type: 'number',
      label,
      default: defaultValue
    };
    
    if (options.min !== undefined) param.min = options.min;
    if (options.max !== undefined) param.max = options.max;
    if (options.step !== undefined) param.step = options.step;
    
    this._addParameter(param, group);
    return this;
  }
  
  /**
   * Add a text input parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {string} defaultValue - Default value
   * @param {string} group - Parameter group ('visual', 'structural', 'advanced')
   * @returns {Plugin} This plugin for chaining
   */
  addText(id, label, defaultValue, group = 'visual') {
    const param = {
      id,
      type: 'text',
      label,
      default: defaultValue
    };
    
    this._addParameter(param, group);
    return this;
  }
  
  /**
   * Add a parameter to the appropriate group and register with core
   * @param {Object} param - Parameter definition
   * @param {string} group - Parameter group
   * @private
   */
  _addParameter(param, group) {
    // Store parameter locally for tracking
    switch (group) {
      case 'visual':
        this._visualParameters.push(param);
        break;
      case 'structural':
        this._structuralParameters.push(param);
        break;
      case 'advanced':
        this._advancedParameters.push(param);
        break;
      default:
        console.warn(`Unknown parameter group: ${group}, defaulting to visual`);
        this._visualParameters.push(param);
        group = 'visual';
    }
    
    // Directly register the parameter with the core
    const groupPrefix = group.charAt(0).toUpperCase() + group.slice(1);
    const addMethodName = `addParameters${groupPrefix}`;
    
    if (this.core && typeof this.core[addMethodName] === 'function') {
      this.core[addMethodName]([param]);
    } else {
      console.warn(`Cannot add parameter ${param.id} - no method available for group ${group}`);
    }
  }
  
  // Removed - no longer needed with direct parameter registration
  
  /**
   * Remove a parameter
   * @param {string} id - Parameter ID to remove
   * @param {string} group - Optional parameter group
   * @returns {boolean} Whether the parameter was found and removed
   */
  removeParameter(id, group = null) {
    if (!this.core || typeof this.core.removeParameter !== 'function') {
      console.warn('Core removeParameter method not available');
      return false;
    }
    
    // Use the core's removeParameter method
    const result = this.core.removeParameter(id, group);
    
    if (result) {
      // Update our internal tracking
      const removeFromList = (list) => {
        const index = list.findIndex(p => p.id === id);
        if (index !== -1) {
          list.splice(index, 1);
          return true;
        }
        return false;
      };
      
      if (group) {
        // Remove from specific group
        switch (group) {
          case 'visual':
            removeFromList(this._visualParameters);
            break;
          case 'structural':
            removeFromList(this._structuralParameters);
            break;
          case 'advanced':
            removeFromList(this._advancedParameters);
            break;
        }
      } else {
        // Remove from any group where it exists
        removeFromList(this._visualParameters) || 
        removeFromList(this._structuralParameters) || 
        removeFromList(this._advancedParameters);
      }
    }
    
    return result;
  }
  
  /**
   * Empty all parameters from the core
   * @param {string} group - Optional parameter group to empty ('visual', 'structural', 'advanced')
   * @returns {boolean} Whether the operation was successful
   */
  emptyParameters(group = null) {
    // Clear all tracked parameters
    if (!group) {
      this._visualParameters = [];
      this._structuralParameters = [];
      this._advancedParameters = [];
    } else {
      // Clear only the specified group
      switch (group) {
        case 'visual':
          this._visualParameters = [];
          break;
        case 'structural':
          this._structuralParameters = [];
          break;
        case 'advanced':
          this._advancedParameters = [];
          break;
        default:
          console.warn(`Unknown parameter group: ${group}`);
          return false;
      }
    }
    
    // Call the core method if available
    if (this.core && typeof this.core.emptyParameters === 'function') {
      return this.core.emptyParameters(group);
    } else {
      console.warn('Core emptyParameters method not available');
      return false;
    }
  }
  
  /**
   * Set a parameter value
   * @param {string} id - Parameter ID
   * @param {any} value - New value
   * @returns {boolean} Whether the parameter was found and updated
   */
  setParameter(id, value) {
    if (this.core && typeof this.core.changeParameter === 'function') {
      return this.core.changeParameter(id, value);
    }
    return false;
  }
  
  /**
   * Get a parameter value
   * @param {string} id - Parameter ID
   * @returns {any} Parameter value or undefined if not found
   */
  getParameter(id) {
    if (this.core && typeof this.core.getAllParameters === 'function') {
      const params = this.core.getAllParameters();
      return params[id];
    }
    return undefined;
  }
  
  /**
   * Get all parameter values
   * @returns {Object} All parameter values
   */
  getAllParameters() {
    if (this.core && typeof this.core.getAllParameters === 'function') {
      return this.core.getAllParameters();
    }
    return {};
  }
  
  // ======== ACTION MANAGEMENT HELPER METHODS ========
  
  /**
   * Add an action
   * @param {string} id - Action ID
   * @param {string} label - Display label
   * @param {Function} callback - Function to execute
   * @param {Object} options - Additional options
   * @returns {boolean} Whether the action was added successfully
   */
  addAction(id, label, callback, options = {}) {
    if (this.core && typeof this.core.addAction === 'function') {
      return this.core.addAction(id, label, callback, options);
    }
    return false;
  }
  
  /**
   * Remove an action
   * @param {string} id - Action ID
   * @returns {boolean} Whether the action was found and removed
   */
  removeAction(id) {
    if (this.core && typeof this.core.removeAction === 'function') {
      return this.core.removeAction(id);
    }
    return false;
  }


  
  /**
   * Refreshes the visualization without changing any state
   * Triggers a redraw for Konva or re-render for Three.js
   * @private - Internal use only, but available to subclasses
   */
  refresh() {
    if (!this.renderEnv) return;
    
    if (this.renderEnv.type === '2d') {
      // For Konva, use batchDraw on the layer
      if (this.renderEnv.layer) {
        this.renderEnv.layer.batchDraw();
      }
    } else if (this.renderEnv.type === '3d') {
      // For Three.js, render via the environment
      if (this.core && this.core.environmentManager) {
        const env = this.core.environmentManager.getCurrentEnvironment();
        if (env && typeof env.render === 'function') {
          env.render(this.core.getAllParameters());
        }
      }
    }
  }
  

  // ======== ANIMATION HELPER METHODS ========
  
  /**
   * Request animation
   * @param {Function} callback - Animation callback function that receives deltaTime
   * @returns {Function|null} Animation handler (for cancellation)
   */
  requestAnimation(callback) {
    if (!this.core || !this.core.animationManager || 
        typeof this.core.animationManager.requestAnimation !== 'function') {
      console.warn("Animation manager not available");
      return null;
    }
    
    // Create animation handler
    const handler = this.core.animationManager.requestAnimation(callback);
    
    // Store handler for cleanup
    if (handler) {
      this._animationHandlers.push(handler);
    }
    
    return handler;
  }
  
  /**
   * Cancel animation
   * @param {Function} handler - Animation handler to cancel
   * @returns {boolean} Whether the animation was found and cancelled
   */
  cancelAnimation(handler) {
    if (!this.core || !this.core.animationManager || 
        typeof this.core.animationManager.cancelAnimation !== 'function') {
      return false;
    }
    
    // Cancel animation
    this.core.animationManager.cancelAnimation(handler);
    
    // Remove from our handlers list
    const index = this._animationHandlers.indexOf(handler);
    if (index !== -1) {
      this._animationHandlers.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * Cancel all animations
   * @private
   */
  _cancelAllAnimations() {
    if (!this.core || !this.core.animationManager || 
        typeof this.core.animationManager.cancelAnimation !== 'function') {
      return;
    }
    
    // Cancel all animations
    this._animationHandlers.forEach(handler => {
      this.core.animationManager.cancelAnimation(handler);
    });
    
    // Clear handlers list
    this._animationHandlers = [];
  }
  
  // ======== EVENT MANAGEMENT METHODS ========
  
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
   * Handle user interaction events
   * @param {string} type - Type of interaction (mousedown, mousemove, mouseup, etc.)
   * @param {Object} data - Interaction data
   */
  handleInteraction(type, data) {
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

    /**
   * Internal method to handle parameter changes from AppCore
   * This is called by AppCore but not directly exposed to plugin developers
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New parameter value
   * @param {string} group - Parameter group
   */
  _handleParameterChanged(parameterId, value, group) {
    try {
      // Call the user-defined onParameterChanged method
      if (typeof this.onParameterChanged === 'function') {
        this.onParameterChanged(parameterId, value, group);
      }
      
      // Refresh visualization after parameter handling
      this.refresh();
    } catch (error) {
      console.error(`Error handling parameter change in plugin ${this.id}:`, error);
    }
  }
  
  /**
   * Internal method to handle action execution
   * This is called by AppCore when an action button is pressed
   * @param {string} actionId - ID of the action
   * @param {Array} args - Arguments for the action
   * @returns {any} Result of the action
   */
  _handleActionExecution(actionId, ...args) {
    try {
      // Find the action in the core
      const action = this.core._actions.get(actionId);
      
      if (action && typeof action.callback === 'function') {
        // Execute the action callback
        const result = action.callback(...args);
        
        // Refresh visualization after action execution
        this.refresh();
        
        return result;
      }
    } catch (error) {
      console.error(`Error executing action ${actionId} in plugin ${this.id}:`, error);
      
      // Propagate error to UI if available
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showError(`Action failed: ${error.message}`);
      }
    }
    
    return false;
  }
}