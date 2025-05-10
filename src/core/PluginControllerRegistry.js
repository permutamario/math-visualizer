// src/core/PluginControllerRegistry.js
import { PluginController } from './PluginController.js';

/**
 * Registry that manages all plugin controllers
 */
export class PluginControllerRegistry {
  /**
   * Create a new PluginControllerRegistry
   * @param {Object} core - Core framework APIs
   */
  constructor(core) {
    this.core = core;
    this.controllers = new Map();
    this.activeController = null;
    console.log('Plugin Controller Registry initialized');
  }
  
  /**
   * Register a plugin and create a controller for it
   * @param {Object} plugin - Plugin definition
   * @returns {PluginController} Plugin controller
   */
  registerPlugin(plugin) {
    if (!plugin.id) {
      console.error('Cannot register plugin without an ID');
      return null;
    }
    
    // Check if controller already exists
    if (this.controllers.has(plugin.id)) {
      console.log(`Controller for plugin ${plugin.id} already exists`);
      return this.controllers.get(plugin.id);
    }
    
    // Create a new controller
    const controller = new PluginController(plugin, this.core);
    this.controllers.set(plugin.id, controller);
    
    console.log(`Registered plugin ${plugin.id} with controller`);
    return controller;
  }
  
  /**
   * Initialize a specific plugin
   * @param {string} pluginId - ID of the plugin to initialize
   * @returns {Promise<PluginController>} Plugin controller
   */
  async initializePlugin(pluginId) {
    const controller = this.controllers.get(pluginId);
    if (!controller) {
      console.error(`Plugin ${pluginId} not found in registry`);
      return null;
    }
    
    // Initialize the controller
    try {
      await controller.initialize();
      return controller;
    } catch (error) {
      console.error(`Failed to initialize plugin ${pluginId}:`, error);
      return null;
    }
  }
  
  /**
   * Get a plugin controller by ID
   * @param {string} pluginId - Plugin ID
   * @returns {PluginController|null} Plugin controller or null if not found
   */
  getController(pluginId) {
    return this.controllers.get(pluginId) || null;
  }
  
  /**
   * Activate a plugin by ID
   * @param {string} pluginId - Plugin ID
   * @returns {Promise<boolean>} Success status
   */
  async activatePlugin(pluginId) {
    console.log(`Registry activating plugin: ${pluginId}`);
    
    // Get the controller
    const controller = this.controllers.get(pluginId);
    if (!controller) {
      console.error(`Plugin ${pluginId} not found in registry`);
      return false;
    }
    
    // If there's an active controller and it's different
    if (this.activeController && this.activeController.id !== pluginId) {
      console.log(`Deactivating current plugin: ${this.activeController.id}`);
      await this.activeController.deactivate();
    }
    
    // Set plugin loading state
    window.changeState('pluginLoading', true);
    window.changeState('loadingPluginId', pluginId);
    
    try {
      // Activate the controller
      const success = await controller.activate();
      
      if (success) {
        this.activeController = controller;
        console.log(`Plugin ${pluginId} is now the active plugin`);
      } else {
        console.error(`Failed to activate plugin ${pluginId}`);
      }
      
      return success;
    } catch (error) {
      console.error(`Error activating plugin ${pluginId}:`, error);
      return false;
    } finally {
      // Clear loading state
      window.changeState('pluginLoading', false);
      window.changeState('loadingPluginId', null);
    }
  }
  
  /**
   * Deactivate the active plugin if any
   * @returns {Promise<boolean>} Success status
   */
  async deactivateActivePlugin() {
    if (!this.activeController) {
      return true; // No active plugin to deactivate
    }
    
    const pluginId = this.activeController.id;
    console.log(`Registry deactivating plugin: ${pluginId}`);
    
    try {
      const success = await this.activeController.deactivate();
      
      if (success) {
        this.activeController = null;
      }
      
      return success;
    } catch (error) {
      console.error(`Error deactivating plugin ${pluginId}:`, error);
      return false;
    }
  }
  
  /**
   * Update a setting for the active plugin
   * @param {string} path - Setting path
   * @param {*} value - New value
   * @returns {boolean} Success status
   */
  updateActiveSetting(path, value) {
    if (!this.activeController) {
      console.warn('No active plugin to update settings for');
      return false;
    }
    
    this.activeController.updateSetting(path, value);
    return true;
  }
  
  /**
   * Reset settings for the active plugin
   * @returns {boolean} Success status
   */
  resetActiveSettings() {
    if (!this.activeController) {
      console.warn('No active plugin to reset settings for');
      return false;
    }
    
    this.activeController.resetSettings();
    return true;
  }
  
  /**
   * Get all registered plugin IDs
   * @returns {string[]} Array of plugin IDs
   */
  getPluginIds() {
    return Array.from(this.controllers.keys());
  }
  
  /**
   * Check if a plugin is active
   * @param {string} pluginId - Plugin ID
   * @returns {boolean} True if plugin is active
   */
  isPluginActive(pluginId) {
    return this.activeController && this.activeController.id === pluginId;
  }
}
