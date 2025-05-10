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
   * Register a plugin from a manifest and implementation
   * @param {Object} manifest - Plugin manifest
   * @param {Object} implementation - Plugin implementation functions
   * @returns {PluginController} Plugin controller
   */
  registerPluginFromManifest(manifest, implementation) {
    if (!manifest.id) {
      console.error('Cannot register plugin without an ID in manifest');
      return null;
    }
    
    // Check if controller already exists
    if (this.controllers.has(manifest.id)) {
      console.log(`Controller for plugin ${manifest.id} already exists`);
      return this.controllers.get(manifest.id);
    }
    
    // Create a plugin object from manifest
    const plugin = {
      id: manifest.id,
      name: manifest.name || manifest.id,
      description: manifest.description || '',
      manifest: manifest,
      init: () => implementation
    };
    
    // Create a new controller
    const controller = new PluginController(plugin, this.core);
    controller.implementation = implementation;
    this.controllers.set(manifest.id, controller);
    
    console.log(`Registered plugin ${manifest.id} from manifest`);
    return controller;
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
   * Executes an export action for the active plugin
   * @param {string} actionId - Export action ID
   * @returns {boolean} Success status
   */
  executeExportAction(actionId) {
    if (!this.activeController) {
      console.warn('No active plugin to execute export action for');
      return false;
    }
    
    const manifest = this.activeController.manifest;
    const implementation = this.activeController.implementation;
    
    // Try to find the export action in the manifest
    if (manifest && manifest.exportOptions) {
      const exportOption = manifest.exportOptions.find(option => option.id === actionId);
      
      if (exportOption && exportOption.handler && implementation[exportOption.handler]) {
        // Execute the handler function
        return implementation[exportOption.handler]() || true;
      }
    }
    
    // If not found in manifest, try the hooks system for backwards compatibility
    return this.core.hooks.doAction('exportAction', actionId);
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
