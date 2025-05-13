// src/core/PluginLoader.js - Updated version without visualizations

/**
 * Manages plugin discovery, loading and lifecycle
 * Provides a cleaner API-driven approach to plugin management
 */
export class PluginLoader {
  /**
   * Create a new PluginLoader
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    this.core = core;
    this.plugins = []; // Available plugins metadata
    this.currentPlugin = null; // Currently active plugin instance
    this.loading = false; // Flag to prevent concurrent loading
  }
  
  /**
   * Discover available plugins
   * @returns {Promise<Array>} Array of plugin metadata
   */
  async discoverPlugins() {
    try {
      console.log("Discovering plugins...");
      
      // Fetch plugin list from plugin_list.json
      const response = await fetch('src/plugins/plugin_list.json');
      if (!response.ok) {
        throw new Error(`Failed to load plugin list: ${response.statusText}`);
      }
      
      const pluginList = await response.json();
      const discoveredPlugins = [];
      
      // Load metadata for each plugin
      for (const pluginId of pluginList) {
        try {
          // Dynamic import of the plugin module
          const module = await import(`../plugins/${pluginId}/index.js`);
          const PluginClass = module.default;
          
          // Validate plugin class
          if (!PluginClass || !PluginClass.id || !PluginClass.name) {
            console.error(`Invalid plugin: ${pluginId}`);
            continue;
          }
          
          // Extract metadata
          discoveredPlugins.push({
            id: PluginClass.id,
            name: PluginClass.name,
            description: PluginClass.description,
            renderingType: PluginClass.renderingType || '2d',
            PluginClass // Store the class for instantiation later
          });
          
          console.log(`Discovered plugin: ${PluginClass.name} (${PluginClass.id})`);
        } catch (error) {
          console.error(`Error loading plugin ${pluginId}:`, error);
        }
      }
      
      this.plugins = discoveredPlugins;
      return discoveredPlugins;
    } catch (error) {
      console.error("Error discovering plugins:", error);
      return [];
    }
  }
  
  /**
   * Load a plugin by ID
   * @param {string} pluginId - ID of the plugin to load
   * @returns {Promise<boolean>} Whether loading was successful
   */
  async loadPlugin(pluginId) {
    // Check if already loading
    if (this.loading) {
      console.warn("Plugin loading already in progress, ignoring request");
      return false;
    }
    
    // Find plugin metadata by ID
    const pluginMeta = this.plugins.find(p => p.id === pluginId);
    if (!pluginMeta) {
      console.error(`Plugin not found: ${pluginId}`);
      return false;
    }
    
    try {
      // Set loading flag
      this.loading = true;
      
      // Show loading indicator if UI manager available
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showLoading(`Loading ${pluginMeta.name}...`);
      }
      
      // Unload current plugin if any
      await this.unloadCurrentPlugin();
      
      console.log(`Loading plugin: ${pluginMeta.name} (${pluginMeta.id})`);
      
      // Set rendering environment based on plugin's preferred type
      if (this.core && this.core.environmentManager) {
        await this.core.environmentManager.setEnvironment(pluginMeta.renderingType || '2d');
      }
      
      // Instantiate plugin with core reference
      const pluginInstance = new pluginMeta.PluginClass(this.core);
      
      // Initialize and load the plugin
      const success = await pluginInstance.load();
      
      if (success) {
        // Store current plugin
        this.currentPlugin = pluginInstance;
        

        console.log(`Plugin ${pluginMeta.name} loaded successfully`);
        return true;
      } else {
        console.error(`Plugin ${pluginMeta.id} failed to load`);
        return false;
      }
    } catch (error) {
      console.error(`Error loading plugin ${pluginId}:`, error);
      
      // Show error notification
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showError(`Failed to load plugin: ${error.message}`);
      }
      
      return false;
    } finally {
      // Clear loading flag
      this.loading = false;
      
      // Hide loading indicator
      if (this.core && this.core.uiManager) {
        this.core.uiManager.hideLoading();
      }
    }
  }
  
  /**
   * Unload the current plugin
   * @returns {Promise<boolean>} Whether unloading was successful
   */
  async unloadCurrentPlugin() {
    if (!this.currentPlugin) return true;
    
    try {
      console.log(`Unloading plugin: ${this.currentPlugin.constructor.name}`);
      
      // Call plugin's unload method
      if (typeof this.currentPlugin.unload === 'function') {
        await this.currentPlugin.unload();
      }
      
      // Clear Actions
      this.core.clearActions();
      
      // Clear the plugin reference
      this.currentPlugin = null;
      
      return true;
    } catch (error) {
      console.error("Error unloading plugin:", error);
      return false;
    }
  }
  
  /**
   * Get the currently loaded plugin
   * @returns {Object|null} Current plugin instance or null
   */
  getCurrentPlugin() {
    return this.currentPlugin;
  }
  
  /**
   * Get the metadata for a plugin by ID
   * @param {string} pluginId - Plugin ID to look up
   * @returns {Object|null} Plugin metadata or null if not found
   */
  getPluginMetadata(pluginId) {
    return this.plugins.find(p => p.id === pluginId) || null;
  }
  
  /**
   * Get the first available plugin ID
   * @returns {string|null} First plugin ID or null if none available
   */
  getFirstPluginId() {
    return this.plugins.length > 0 ? this.plugins[0].id : null;
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    // Unload current plugin
    this.unloadCurrentPlugin().catch(error => {
      console.error("Error unloading plugin during cleanup:", error);
    });
    
    // Reset state
    this.plugins = [];
    this.currentPlugin = null;
    this.loading = false;
    
    console.log("Plugin loader cleaned up");
  }
}