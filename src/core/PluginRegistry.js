// src/core/PluginRegistry.js

/**
 * Manages plugin discovery and registration
 */
export class PluginRegistry {
  /**
   * Create a new PluginRegistry
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    this.core = core;
    this.plugins = new Map();
    this.pluginsById = new Map();
    this.pluginClasses = new Map();
    this.initialized = false;
  }
  
  /**
   * Initialize the plugin registry
   * Discovers available plugins
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Discover plugins in the plugins directory
      await this.discoverPlugins();
      
      this.initialized = true;
      console.log(`Plugin registry initialized with ${this.pluginClasses.size} plugins`);
      return true;
    } catch (error) {
      console.error("Failed to initialize plugin registry:", error);
      return false;
    }
  }
  
  /**
   * Discover available plugins
   * @returns {Promise<boolean>} Whether discovery was successful
   */
  async discoverPlugins() {
    try {
      // Load the plugin list from plugin_list.json
      const response = await fetch('src/plugins/plugin_list.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load plugin list: ${response.statusText}`);
      }
      
      const pluginList = await response.json();
      console.log(`Discovered ${pluginList.length} plugins in plugin list`);
      
      // Register each plugin class
      for (const pluginId of pluginList) {
        try {
          // Dynamically import the plugin module
          const module = await import(`/src/plugins/${pluginId}/index.js`);
          
          // Get the plugin class (expecting it to be the default export)
          const PluginClass = module.default;
          
          if (!PluginClass || typeof PluginClass !== 'function') {
            console.error(`Invalid plugin module for ${pluginId}: No plugin class exported`);
            continue;
          }
          
          // Register the plugin class
          this.registerPluginClass(PluginClass);
        } catch (error) {
          console.error(`Error loading plugin ${pluginId}:`, error);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error discovering plugins:", error);
      return false;
    }
  }
  
  /**
   * Register a plugin class
   * @param {Class} PluginClass - Plugin class to register
   * @returns {boolean} Whether registration was successful
   */
  registerPluginClass(PluginClass) {
    // Validate the plugin class
    if (!PluginClass.id) {
      console.error("Cannot register plugin class without id");
      return false;
    }
    
    // Check if plugin is already registered
    if (this.pluginClasses.has(PluginClass.id)) {
      console.warn(`Plugin ${PluginClass.id} is already registered`);
      return false;
    }
    
    // Register the plugin class
    this.pluginClasses.set(PluginClass.id, PluginClass);
    console.log(`Registered plugin class: ${PluginClass.id}`);
    
    return true;
  }
  
  /**
   * Get a plugin instance by ID
   * Creates the instance if it doesn't exist
   * @param {string} pluginId - Plugin ID
   * @returns {Plugin|null} Plugin instance or null if not found
   */
  getPlugin(pluginId) {
    // Check if plugin instance already exists
    if (this.pluginsById.has(pluginId)) {
      return this.pluginsById.get(pluginId);
    }
    
    // Check if plugin class is registered
    if (!this.pluginClasses.has(pluginId)) {
      console.error(`Plugin ${pluginId} not found`);
      return null;
    }
    
    try {
      // Create a new plugin instance
      const PluginClass = this.pluginClasses.get(pluginId);
      const plugin = new PluginClass(this.core);
      
      // Initialize the plugin
      plugin.initialize();
      
      // Store the plugin instance
      this.pluginsById.set(pluginId, plugin);
      
      return plugin;
    } catch (error) {
      console.error(`Error creating plugin instance for ${pluginId}:`, error);
      return null;
    }
  }
  
  /**
   * Get all registered plugin classes
   * @returns {Map<string, Class>} Map of plugin IDs to plugin classes
   */
  getAllPluginClasses() {
    return new Map(this.pluginClasses);
  }
  
  /**
   * Get the first available plugin ID
   * @returns {string|null} First plugin ID or null if none
   */
  getFirstPluginId() {
    const ids = Array.from(this.pluginClasses.keys());
    return ids.length > 0 ? ids[0] : null;
  }
  
  /**
   * Get plugin metadata for all registered plugins
   * @returns {Array<Object>} Array of plugin metadata objects
   */
  getPluginMetadata() {
    return Array.from(this.pluginClasses.entries()).map(([id, PluginClass]) => ({
      id: PluginClass.id,
      name: PluginClass.name,
      description: PluginClass.description,
      renderingType: PluginClass.renderingType
    }));
  }
}
