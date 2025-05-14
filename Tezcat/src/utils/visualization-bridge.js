// src/utils/visualization-bridge.js
import { AppCore } from '../lib/core/AppCore.js';

class VisualizationBridge {
  constructor() {
    this.core = null;
    this.initialized = false;
  }

  async initialize(containerElement) {
    if (this.initialized) return Promise.resolve(this.core);
    
    try {
      console.log("Initializing visualization bridge...");
      
      // Create and initialize the core
      this.core = new AppCore();
      await this.core.initialize();
      
      // Add event listeners for container if needed
      if (containerElement) {
        // Any container-specific setup (not needed for now)
      }
      
      console.log("Visualization bridge initialized successfully");
      this.initialized = true;
      
      // Return the core for direct access
      return this.core;
    } catch (error) {
      console.error("Failed to initialize visualization bridge:", error);
      throw error;
    }
  }

  // Load a plugin by ID
  async loadPlugin(pluginId) {
    if (!this.core) {
      throw new Error("Core not initialized");
    }
    
    try {
      console.log(`Loading plugin: ${pluginId}`);
      const success = await this.core.loadPlugin(pluginId);
      
      if (!success) {
        throw new Error(`Failed to load plugin: ${pluginId}`);
      }
      
      return success;
    } catch (error) {
      console.error(`Error loading plugin ${pluginId}:`, error);
      throw error;
    }
  }

  // Get available plugins from the core
  getPlugins() {
    if (!this.core) return [];
    return this.core.availablePlugins || [];
  }

  // Get active plugin
  getActivePlugin() {
    if (!this.core) return null;
    return this.core.getActivePlugin();
  }

  // Set parameter value
  setParameter(id, value, group) {
    if (!this.core) return false;
    return this.core.changeParameter(id, value, group);
  }

  // Execute an action
  executeAction(actionId, ...args) {
    if (!this.core) return false;
    return this.core.executeAction(actionId, ...args);
  }

  // Get parameters for a specific group
  getParameters(group) {
    if (!this.core) return { schema: [], values: {} };
    
    switch(group) {
      case 'visual':
        return this.core.visualParameters || { schema: [], values: {} };
      case 'structural':
        return this.core.structuralParameters || { schema: [], values: {} };
      case 'advanced':
        return this.core.advancedParameters || { schema: [], values: {} };
      default:
        // Return all parameters merged
        return this.core.getAllParameters ? 
          { values: this.core.getAllParameters() } : 
          { schema: [], values: {} };
    }
  }

  // Get actions from the core
  getActions() {
    if (!this.core) return [];
    return this.core.getActions();
  }

  // Unload the current plugin
  async unloadPlugin() {
    if (!this.core || !this.core.pluginLoader) return false;
    return await this.core.pluginLoader.unloadCurrentPlugin();
  }

  // Cleanup the bridge
  cleanup() {
    if (this.core) {
      this.core.cleanup();
      this.core = null;
    }
    this.initialized = false;
  }
}

// Export a singleton instance
export default new VisualizationBridge();
