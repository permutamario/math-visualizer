// src/core/AppCore.js 

import { PluginRegistry } from './PluginRegistry.js';
import { UIManager } from '../ui/UIManager.js';
import { RenderingManager } from '../rendering/RenderingManager.js';
import { ParameterManager } from './ParameterManager.js';
import { StateManager } from './StateManager.js';
import { EventEmitter } from './EventEmitter.js';

/**
 * Main application controller
 * Coordinates between plugins, UI, and rendering
 */
export class AppCore {
  /**
   * AppCore constructor
   */
  constructor() {
    // Create core components
    this.events = new EventEmitter();
    this.state = new StateManager();
    this.pluginRegistry = new PluginRegistry(this);
    this.parameterManager = new ParameterManager(this);
    this.renderingManager = new RenderingManager(this);
    this.uiManager = new UIManager(this);
    
    // Application state
    this.activePlugin = null;
    this.initialized = false;
    
    // Bind methods
    this.activatePlugin = this.activatePlugin.bind(this);
    this.handleParameterChange = this.handleParameterChange.bind(this);
    this.executeAction = this.executeAction.bind(this);
  }
  
  /**
   * Initialize the application
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      console.log("Initializing Math Visualization Framework...");
      
      // Initialize core components
      await this.renderingManager.initialize();
      await this.pluginRegistry.initialize();
      await this.uiManager.initialize();
      
      // Register event handlers
      this.uiManager.on('parameterChange', this.handleParameterChange);
      this.uiManager.on('action', this.executeAction);
      this.uiManager.on('pluginSelect', this.activatePlugin);
      
      // Update UI with available plugins (THIS IS THE FIX)
      const pluginMetadata = this.pluginRegistry.getPluginMetadata();
      this.uiManager.updatePlugins(pluginMetadata, null);
      
      this.initialized = true;
      console.log("Math Visualization Framework initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Math Visualization Framework:", error);
      return false;
    }
  }
  
  /**
   * Activate a plugin by ID
   * @param {string} pluginId - ID of the plugin to activate
   * @returns {Promise<boolean>} Whether activation was successful
   */
  async activatePlugin(pluginId) {
    try {
      // Check if plugin is already active
      if (this.activePlugin && this.activePlugin.constructor.id === pluginId) {
        console.log(`Plugin ${pluginId} is already active`);
        return true;
      }
      
      // Get the plugin instance
      const plugin = this.pluginRegistry.getPlugin(pluginId);
      
      if (!plugin) {
        console.error(`Plugin ${pluginId} not found`);
        return false;
      }
      
      // Deactivate current plugin if any
      if (this.activePlugin) {
        await this.activePlugin.deactivate();
      }
      
      // Setup appropriate rendering environment
      this.renderingManager.setEnvironment(plugin.constructor.renderingType);
      
      // Activate the new plugin
      const success = await plugin.activate();
      
      if (success) {
        this.activePlugin = plugin;
        
        // Update UI with new plugin's parameters
        const paramSchema = plugin.getParameterSchema();
        this.uiManager.buildControlsFromSchema(paramSchema, plugin.parameters);
        
        // Update actions
        const actions = plugin.getActions();
        this.uiManager.updateActions(actions);
        
        // Update UI with currently active plugin (THIS IS ALSO ADDED)
        const pluginMetadata = this.pluginRegistry.getPluginMetadata();
        this.uiManager.updatePlugins(pluginMetadata, pluginId);
        
        // Trigger render
        this.renderingManager.requestRender();
        
        console.log(`Plugin ${pluginId} activated successfully`);
      } else {
        console.error(`Failed to activate plugin ${pluginId}`);
      }
      
      return success;
    } catch (error) {
      console.error(`Error activating plugin ${pluginId}:`, error);
      return false;
    }
  }
  
  /**
   * Handle parameter changes from UI
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value
   */
  handleParameterChange(parameterId, value) {
    if (!this.activePlugin) return;
    
    // Validate parameter value
    const validValue = this.parameterManager.validateParameterValue(
      parameterId, 
      value, 
      this.activePlugin.getParameterSchema()
    );
    
    // Update the plugin
    this.activePlugin.onParameterChanged(parameterId, validValue);
    
    // Request render
    this.renderingManager.requestRender();
  }
  
  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    if (!this.activePlugin) return false;
    
    // Let the plugin handle the action
    return this.activePlugin.executeAction(actionId, ...args);
  }
  
  /**
   * Get the active plugin
   * @returns {Plugin|null} Active plugin instance or null if none
   */
  getActivePlugin() {
    return this.activePlugin;
  }
  
  /**
   * Start the application
   * @returns {Promise<boolean>} Whether startup was successful
   */
  async start() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Start the rendering loop
    this.renderingManager.startRenderLoop();
    
    // Activate default plugin if configured
    const defaultPluginId = this.state.get('defaultPluginId') || 
                           this.pluginRegistry.getFirstPluginId();
    
    if (defaultPluginId) {
      return this.activatePlugin(defaultPluginId);
    }
    
    return true;
  }
}
