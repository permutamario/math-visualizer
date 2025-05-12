// src/core/AppCore.js

import { EventEmitter } from './EventEmitter.js';
import { StateManager } from './StateManager.js';
import { UIManager } from '../ui/UIManager.js';
import { RenderingManager } from '../rendering/RenderingManager.js';
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
    this.renderingManager = null; // Initialize later to avoid circular dependencies
    this.uiManager = null; // Initialize later to avoid circular dependencies
    this.colorSchemeManager = new ColorSchemeManager(this);
    this.renderModeManager = null; // Initialize later to avoid circular dependencies
    this.pluginLoader = new PluginLoader(this);
    
    // Parameter collections
    this.visualParameters = { schema: [], values: {} };
    this.structuralParameters = { schema: [], values: {} };
    
    // Callback collections
    this._parameterCallbacks = [];
    this._actionCallbacks = [];
    
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
      this.renderingManager = new RenderingManager(this);
      this.uiManager = new UIManager(this);
      this.renderModeManager = new RenderModeManager(this);
      
      // Initialize core components
      await this.renderingManager.initialize();
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
  async start() {
    try {
      if (!this.isInitialStartup) {
        console.warn("Application already started");
        return true;
      }
      
      // Start the rendering loop
      this.renderingManager.startRenderLoop();
      
      // Show the "Select a Plugin" message
      this.renderingManager.requestRender();
      
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

  /**
   * Cleans up resources when the application is shutting down
   */
  cleanup() {
    // Unload active plugin
    this.pluginLoader.unloadCurrentPlugin().catch(error => {
      console.error("Error unloading current plugin during cleanup:", error);
    });
    
    // Clean up rendering
    if (this.renderingManager) {
      this.renderingManager.cleanup();
      this.renderingManager = null;
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
    
    // Clear callbacks
    this._parameterCallbacks = [];
    this._actionCallbacks = [];
    
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
        this.renderingManager.requestRender();
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
   * Registers action buttons for the UI
   * @param {Array<Object>} actions - Array of action definitions
   */
  registerActions(actions) {
    if (!Array.isArray(actions)) {
      console.error("Actions must be an array");
      return;
    }
    
    // Update UI
    if (this.uiManager) {
      this.uiManager.updateActions(actions);
    }
  }

  /**
   * Registers a callback for action execution
   * @param {Function} callback - Function to call when an action is executed
   * @returns {Function} The callback function for removal reference
   */
  onAction(callback) {
    if (typeof callback !== 'function') {
      console.error("Action callback must be a function");
      return null;
    }
    
    this._actionCallbacks.push(callback);
    return callback; // Return for later removal
  }

  /**
   * Removes an action callback
   * @param {Function} callback - The callback to remove
   * @returns {boolean} Whether the callback was found and removed
   */
  removeActionCallback(callback) {
    const index = this._actionCallbacks.indexOf(callback);
    if (index !== -1) {
      this._actionCallbacks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Executes an action and notifies listeners
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    let handled = false;
    
    // Call plugin's action handler if available
    const activePlugin = this.getActivePlugin();
    if (activePlugin && typeof activePlugin.executeAction === 'function') {
      try {
        handled = activePlugin.executeAction(actionId, ...args) || handled;
      } catch (error) {
        console.error(`Error executing action ${actionId} in plugin:`, error);
      }
    }
    
    // Call registered callbacks
    handled = this._triggerActionCallbacks(actionId, ...args) || handled;
    
    return handled;
  }

  /**
   * Triggers action callbacks
   * @param {string} actionId - Action ID
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether any callback returned true
   * @private
   */
  _triggerActionCallbacks(actionId, ...args) {
    let handled = false;
    
    this._actionCallbacks.forEach(callback => {
      try {
        handled = callback(actionId, ...args) || handled;
      } catch (error) {
        console.error("Error in action callback:", error);
      }
    });
    
    return handled;
  }

  /**
   * Gets access to the current rendering environment
   * @returns {Object|null} Rendering environment interface
   */
  getRenderingEnvironment() {
    if (!this.renderingManager) {
      return null;
    }
    
    return this.renderingManager.getEnvironmentForPlugin();
  }
}