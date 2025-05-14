// src/core/PluginDiscovery.js

/**
 * Discover available plugins and return their metadata
 * @returns {Promise<Array<Object>>} Array of plugin metadata objects
 */
export async function discoverPlugins() {
  try {
    // Load the plugin list from plugin_list.json
    const response = await fetch('math-visualizer/plugins/plugin_list.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load plugin list: ${response.statusText}`);
    }
    
    const pluginList = await response.json();
    console.log(`Discovered ${pluginList.length} plugins in plugin list`);
    
    // Collect metadata for each plugin
    const pluginMetadata = [];
    
    for (const pluginId of pluginList) {
      try {
        // Dynamically import the plugin module
        const module = await import(`../../plugins/${pluginId}/index.js`);
        
        // Get the plugin class (expecting it to be the default export)
        const PluginClass = module.default;
        
        if (!PluginClass || typeof PluginClass !== 'function') {
          console.error(`Invalid plugin module for ${pluginId}: No plugin class exported`);
          continue;
        }
        
        // Extract metadata
        pluginMetadata.push({
          id: PluginClass.id,
          name: PluginClass.name,
          description: PluginClass.description,
          renderingType: PluginClass.renderingType,
          PluginClass: PluginClass // Store the class for instantiation later
        });
        
        console.log(`Discovered plugin: ${PluginClass.name} (${PluginClass.id})`);
      } catch (error) {
        console.error(`Error loading plugin ${pluginId}:`, error);
      }
    }
    
    return pluginMetadata;
  } catch (error) {
    console.error("Error discovering plugins:", error);
    return [];
  }
}

/**
 * Get the first available plugin ID
 * @param {Array<Object>} pluginMetadata - Plugin metadata
 * @returns {string|null} First plugin ID or null if none
 */
export function getFirstPluginId(pluginMetadata) {
  return pluginMetadata.length > 0 ? pluginMetadata[0].id : null;
}
