// src/core/AppCore.js

import { EventEmitter } from './EventEmitter.js';
import { StateManager } from './StateManager.js';
import { UIManager } from '../ui/UIManager.js';
import { EnvironmentManager } from '../rendering/EnvironmentManager.js';
import { AnimationManager } from '../rendering/AnimationManager.js';
import { ColorSchemeManager } from './ColorSchemeManager.js';
import { RenderModeManager } from '../rendering/RenderModeManager.js';
import { PluginLoader } from './PluginLoader.js';

/**
 * Main application controller providing API services to plugins
 * Coordinates between plugins, UI, and rendering
 */
export class AppCore {
  /**
   * Creates a new AppCore instance
   */
  constructor() {
    // Core system components
    this.events = new EventEmitter();
    this.state = new StateManager();
    this.environmentManager = null; // Initialize later to avoid circular dependencies
    this.animationManager = null;
    this.uiManager = null; // Initialize later to avoid circular dependencies
    this.colorSchemeManager = new ColorSchemeManager(this);
    this.renderModeManager = null; // Initialize later to avoid circular dependencies
    this.pluginLoader = new PluginLoader(this);
    
    // Parameter collections
    this.visualParameters = { schema: [], values: {} };
    this.structuralParameters = { schema: [], values: {} };
    
    // Action management
    this._actions = new Map(); // Store actions by ID
    
    // Callback collections
    this._parameterCallbacks = [];
    
    // Plugin data
    this.availablePlugins = [];
    
    // Initial startup flag
    this.isInitialStartup = true;
  }

  /**
   * Initializes the application and all core components
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      console.log("Initializing Math Visualization Framework...");
      
      // Initialize color schemes first (UI appearance depends on this)
      await this.colorSchemeManager.initialize();
      
      // Initialize managers that depend on this reference
      this.environmentManager = new EnvironmentManager(this);
      this.animationManager = new AnimationManager(this);
      this.uiManager = new UIManager(this);
      this.renderModeManager = new RenderModeManager(this);
      
      // Initialize core components
      await this.environmentManager.initialize();
      await this.animationManager.initialize();
      await this.uiManager.initialize();
      
      // Discover available plugins
      this.availablePlugins = await this.pluginLoader.discoverPlugins();
      
      if (this.availablePlugins.length === 0) {
        console.warn("No plugins discovered");
      } else {
        console.log(`Discovered ${this.availablePlugins.length} plugins`);
      }
      
      // Update UI with available plugins
      this.uiManager.updatePlugins(this.availablePlugins, null);
      
      console.log("Math Visualization Framework initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Math Visualization Framework:", error);
      if (this.uiManager) {
        this.uiManager.showError(`Initialization failed: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Starts the application
   * @returns {Promise<boolean>} Whether startup was successful
   */
  
/**
 * Starts the application
 * @returns {Promise<boolean>} Whether startup was successful
 */
async start() {
  try {
    if (!this.isInitialStartup) {
      console.warn("Application already started");
      return true;
    }
    
    // Instead of calling a non-existent startRenderLoop method,
    // request a single frame to kickstart the rendering process
    this.animationManager.requestFrame(() => {
      // Show the "Select a Plugin" message
      this.requestRenderRefresh();
    });
    
    this.isInitialStartup = false;
    return true;
  } catch (error) {
    console.error("Failed to start application:", error);
    if (this.uiManager) {
      this.uiManager.showError(`Failed to start application: ${error.message}`);
    }
    return false;
  }
}


  // Add this method to AppCore.js

/**
 * Request a refresh of the current rendering
 * Called when parameters change or other events that require re-rendering
 */
requestRenderRefresh() {
  // Return early if no environment manager
  if (!this.environmentManager) return;
  
  // Get current plugin
  const plugin = this.getActivePlugin();
  
  // Get current parameters
  const parameters = this.getAllParameters();
  
  // Render with current environment
  this.environmentManager.renderWithCurrentEnvironment(plugin, parameters);
}

  /**
   * Cleans up resources when the application is shutting down
   */
  cleanup() {
    // Unload active plugin
    this.pluginLoader.unloadCurrentPlugin().catch(error => {
      console.error("Error unloading current plugin during cleanup:", error);
    });
    
    // Clean up rendering
    if (this.environmentManager) {
      this.environmentManager.cleanup();
      this.environmentManager = null;
    }

        // Clean up animation
    if (this.animationManager) {
      this.animationManager.cleanup();
      this.animationManager = null;
    }
    
    // Clean up UI
    if (this.uiManager) {
      this.uiManager.cleanup();
      this.uiManager = null;
    }
    
    // Clean up color scheme manager
    if (this.colorSchemeManager) {
      this.colorSchemeManager.cleanup();
    }
    
    // Clear callbacks and actions
    this._parameterCallbacks = [];
    this.clearActions();
    
    // Reset state
    this.availablePlugins = [];
    this.isInitialStartup = true;
    
    console.log("Application cleaned up");
  }

  /**
   * Loads a plugin by ID
   * @param {string} pluginId - ID of the plugin to load
   * @returns {Promise<boolean>} Whether loading was successful
   */
  async loadPlugin(pluginId) {
    try {
      // Show loading indicator 
      if (this.uiManager) {
        this.uiManager.showLoading(`Loading plugin...`);
      }
      
      // Clear any existing actions before loading the new plugin
      this.clearActions();
      
      const success = await this.pluginLoader.loadPlugin(pluginId);
      
      // Hide loading indicator
      if (this.uiManager) {
        this.uiManager.hideLoading();
      }
      
      if (success) {
        // Update UI with currently active plugin
        const activePlugin = this.getActivePlugin();
        this.uiManager.updatePlugins(this.availablePlugins, activePlugin?.id || null);
        
        // Request a render to show the plugin content
        this.requestRenderRefresh();
      } else {
        this.uiManager.showError(`Failed to load plugin "${pluginId}"`);
      }
      
      return success;
    } catch (error) {
      console.error(`Error loading plugin ${pluginId}:`, error);
      
      if (this.uiManager) {
        this.uiManager.hideLoading();
        this.uiManager.showError(`Error loading plugin: ${error.message}`);
      }
      
      return false;
    }
  }

  /**
   * Gets the currently active plugin
   * @returns {Object|null} The active plugin or null if none is active
   */
  getActivePlugin() {
    return this.pluginLoader.getCurrentPlugin();
  }

  /**
   * Adds visual parameters to the application
   * @param {Array<Object>} parameters - Array of parameter definitions
   */
  addParametersVisual(parameters) {
    if (!Array.isArray(parameters)) {
      console.error("Visual parameters must be an array");
      return;
    }
    
    this._processParameters(parameters, 'visual');
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.updateParameterGroups({
        visual: { schema: this.visualParameters.schema, values: this.visualParameters.values }
      });
    }
  }

  /**
   * Adds structural parameters to the application
   * @param {Array<Object>} parameters - Array of parameter definitions
   */
  addParametersStructural(parameters) {
    if (!Array.isArray(parameters)) {
      console.error("Structural parameters must be an array");
      return;
    }
    
    this._processParameters(parameters, 'structural');
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.updateParameterGroups({
        structural: { schema: this.structuralParameters.schema, values: this.structuralParameters.values }
      });
    }
  }

  /**
   * Processes and stores parameter definitions
   * @param {Array<Object>} parameters - Array of parameter definitions
   * @param {string} group - Parameter group ('visual' or 'structural')
   * @private
   */
  _processParameters(parameters, group) {
    // Ensure group property exists
    if (!this[`${group}Parameters`]) {
      this[`${group}Parameters`] = { schema: [], values: {} };
    }
    
    // Add parameters to schema
    this[`${group}Parameters`].schema = [...this[`${group}Parameters`].schema, ...parameters];
    
    // Extract default values
    parameters.forEach(param => {
      if (param.id && param.default !== undefined) {
        this[`${group}Parameters`].values[param.id] = param.default;
      }
    });
  }

  /**
   * Changes a parameter value and notifies listeners
   * @param {string} id - Parameter ID
   * @param {any} value - New parameter value
   * @param {string|null} group - Parameter group ('visual' or 'structural')
   * @returns {boolean} Whether the parameter was found and updated
   */
  changeParameter(id, value, group = null) {
    // Find parameter group if not specified
    if (!group) {
      if (this.visualParameters?.values.hasOwnProperty(id)) {
        group = 'visual';
      } else if (this.structuralParameters?.values.hasOwnProperty(id)) {
        group = 'structural';
      } else {
        console.warn(`Parameter ${id} not found in any group`);
        return false;
      }
    }
    
    // Update parameter value
    if (group && this[`${group}Parameters`]?.values) {
      this[`${group}Parameters`].values[id] = value;
      
      // Update UI
      if (this.uiManager) {
        this.uiManager.updateParameterValue(id, value, group);
      }
      
      // Notify listeners
      this._triggerParameterChanged(id, value, group);
      
      return true;
    }
    
    return false;
  }

  /**
 * Removes a parameter from the application
 * @param {string} id - Parameter ID to remove
 * @param {string|null} group - Parameter group ('visual' or 'structural')
 * @returns {boolean} Whether the parameter was found and removed
 */
removeParameter(id, group = null) {
  // Find parameter group if not specified
  if (!group) {
    if (this.visualParameters?.values.hasOwnProperty(id)) {
      group = 'visual';
    } else if (this.structuralParameters?.values.hasOwnProperty(id)) {
      group = 'structural';
    } else {
      console.warn(`Parameter ${id} not found in any group`);
      return false;
    }
  }
  
  const groupKey = `${group}Parameters`;
  
  // Check if parameter exists
  if (!this[groupKey]?.values.hasOwnProperty(id)) {
    console.warn(`Parameter ${id} not found in ${group} group`);
    return false;
  }
  
  // Remove from schema
  this[groupKey].schema = this[groupKey].schema.filter(param => param.id !== id);
  
  // Remove from values
  delete this[groupKey].values[id];
  
  // Update UI
  if (this.uiManager) {
    const parameterGroups = {};
    parameterGroups[group] = {
      schema: this[groupKey].schema,
      values: this[groupKey].values
    };
    
    this.uiManager.updatePluginParameterGroups({
      [`${group}Parameters`]: this[groupKey] 
    });
  }
  
  return true;
}

/**
 * Resets parameters to their default values
 * @param {string|null} group - Parameter group to reset ('visual', 'structural', or null for all)
 * @returns {boolean} Whether the reset was successful
 */
resetParameters(group = null) {
  const groups = group ? [group] : ['visual', 'structural'];
  let success = true;
  
  groups.forEach(grp => {
    const groupKey = `${grp}Parameters`;
    
    // Skip if group doesn't exist
    if (!this[groupKey]) {
      success = false;
      return;
    }
    
    // Reset each parameter to its default value
    this[groupKey].schema.forEach(param => {
      if (param.id && param.default !== undefined) {
        this[groupKey].values[param.id] = param.default;
        
        // Trigger parameter change notification
        this._triggerParameterChanged(param.id, param.default, grp);
      }
    });
    
    // Update UI
    if (this.uiManager) {
      const parameterGroups = {};
      parameterGroups[grp] = {
        schema: this[groupKey].schema,
        values: this[groupKey].values
      };
      
      this.uiManager.updatePluginParameterGroups({
        [`${grp}Parameters`]: this[groupKey]
      });
    }
  });
  
  return success;
}

  /**
   * Registers a callback for parameter changes
   * @param {Function} callback - Function to call when parameters change
   * @returns {Function} The callback function for removal reference
   */
  onParameterChanged(callback) {
    if (typeof callback !== 'function') {
      console.error("Parameter change callback must be a function");
      return null;
    }
    
    this._parameterCallbacks.push(callback);
    return callback; // Return for later removal
  }

  /**
   * Removes a parameter change callback
   * @param {Function} callback - The callback to remove
   * @returns {boolean} Whether the callback was found and removed
   */
  removeParameterCallback(callback) {
    const index = this._parameterCallbacks.indexOf(callback);
    if (index !== -1) {
      this._parameterCallbacks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Triggers parameter change callbacks
   * @param {string} id - Parameter ID
   * @param {any} value - New parameter value
   * @param {string} group - Parameter group
   * @private
   */
  _triggerParameterChanged(id, value, group) {
    // Call registered callbacks
    this._parameterCallbacks.forEach(callback => {
      try {
        callback(id, value, group);
      } catch (error) {
        console.error("Error in parameter change callback:", error);
      }
    });
    
    // Notify active plugin
    const activePlugin = this.getActivePlugin();
    if (activePlugin && typeof activePlugin.onParameterChanged === 'function') {
      try {
        activePlugin.onParameterChanged(id, value, group);
      } catch (error) {
        console.error("Error in plugin's onParameterChanged handler:", error);
      }
    }
  }

  /**
   * Gets all parameter values merged into a single object
   * @returns {Object} Combined parameter values
   */
  getAllParameters() {
    return {
      ...this.structuralParameters?.values || {},
      ...this.visualParameters?.values || {}
    };
  }

  /**
   * Add an action to the application
   * @param {string} id - Unique action identifier
   * @param {string} label - Human-readable label
   * @param {Function} callback - Function to execute when action is triggered
   * @param {Object} options - Additional options (icon, shortcut, etc.)
   * @returns {boolean} Whether the action was added successfully
   */
  addAction(id, label, callback, options = {}) {
    if (!id || typeof id !== 'string') {
      console.error("Action ID must be a non-empty string");
      return false;
    }
    
    if (typeof callback !== 'function') {
      console.error("Action callback must be a function");
      return false;
    }
    
    // Create action definition
    const action = {
      id,
      label: label || id,
      callback,
      ...options
    };
    
    // Store the action
    this._actions.set(id, action);
    
    // Notify UI of action change
    this._notifyActionsChanged();
    
    return true;
  }
  
  /**
   * Remove an action by ID
   * @param {string} id - Action ID to remove
   * @returns {boolean} Whether the action was found and removed
   */
  removeAction(id) {
    const removed = this._actions.delete(id);
    
    if (removed) {
      // Notify UI of action change
      this._notifyActionsChanged();
    }
    
    return removed;
  }
  
  /**
   * Clear all registered actions
   */
  clearActions() {
    const hadActions = this._actions.size > 0;
    
    this._actions.clear();
    
    if (hadActions) {
      // Notify UI of action change
      this._notifyActionsChanged();
    }
  }
  
  /**
   * Get all registered actions
   * @returns {Array<Object>} Array of action definitions
   */
  getActions() {
    return Array.from(this._actions.values());
  }
  
  /**
   * Notify UI that actions have changed
   * @private
   */
  _notifyActionsChanged() {
    const actions = this.getActions();
    
    // Emit action changed event
    if (this.events) {
      this.events.emit('actionsChanged', actions);
    }
    
    // Update UI with new actions
    if (this.uiManager) {
      this.uiManager.updateActions(actions);
    }
  }

  /**
   * Executes an action by ID
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Arguments to pass to the action callback
   * @returns {any} Result of the action execution
   */
  executeAction(actionId, ...args) {
    const action = this._actions.get(actionId);
    
    if (action && typeof action.callback === 'function') {
      try {
        return action.callback(...args);
      } catch (error) {
        console.error(`Error executing action ${actionId}:`, error);
        
        // Notify user of error
        if (this.uiManager) {
          this.uiManager.showError(`Action failed: ${error.message}`);
        }
        
        return false;
      }
    }
    
    console.warn(`Action not found: ${actionId}`);
    return false;
  }

  /**
   * Gets access to the current rendering environment
   * @returns {Object|null} Rendering environment interface
   */
  getRenderingEnvironment() {
    if (!this.environmentManager) {
      return null;
    }
    
    return this.environmentManager.getEnvironmentForPlugin();
  }
}