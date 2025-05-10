// src/core/pluginManager.js
import { getState } from './stateManager.js';
import { showNotification } from './utils.js';

// Cache for loaded plugin manifests
const manifestCache = new Map();

/**
 * Load and register all available plugins without initializing them
 * @returns {Promise<Array>} Array of registered plugins
 */
export async function loadPlugins() {
  try {
    console.log("Discovering and registering plugins");
    
    // 1. Get app instance
    const app = window.AppInstance;
    if (!app) {
      throw new Error('App instance not found');
    }

    // 2. Load plugin_list.json to get available plugins
    const pluginList = await loadPluginList();
    if (!pluginList || !Array.isArray(pluginList) || pluginList.length === 0) {
      throw new Error('Failed to load plugin list or no plugins found');
    }
    
    console.log(`Found ${pluginList.length} plugins in plugin_list.json:`, pluginList);
    
    // 3. Create plugin objects for each plugin ID
    const plugins = [];
    for (const pluginId of pluginList) {
      try {
        // Try to load manifest first to get metadata
        const manifest = await loadPluginManifest(pluginId);
        
        // Create plugin object
        const plugin = {
          id: pluginId,
          name: manifest?.name || pluginId,
          description: manifest?.description || `${pluginId} visualization`,
          manifest: manifest,
          init: null // Will be dynamically imported below
        };
        
        plugins.push(plugin);
      } catch (error) {
        console.error(`Error creating plugin object for ${pluginId}:`, error);
      }
    }
    
    // 4. Try to load manifests and implementation files for each plugin
    const registeredPlugins = [];
    
    for (const plugin of plugins) {
      try {
        // Dynamically import the plugin's index.js
        const moduleUrl = `/src/plugins/${plugin.id}/index.js`;
        const module = await import(moduleUrl);
        
        // Get the default export as the init function
        if (module.default && typeof module.default === 'function') {
          plugin.init = module.default;
          
          // Register the plugin with the app
          app.registerPlugin(plugin);
          registeredPlugins.push(plugin);
          
          console.log(`Successfully registered plugin: ${plugin.id}`);
        } else {
          console.error(`Plugin ${plugin.id} has no valid init function`);
        }
      } catch (error) {
        console.error(`Failed to load implementation for plugin ${plugin.id}:`, error);
      }
    }

    console.log(`Registered ${registeredPlugins.length} plugins`);
    return registeredPlugins;
    
  } catch (error) {
    console.error('Failed to load plugins:', error);
    showNotification('Failed to load plugins', 3000);
    return [];
  }
}

/**
 * Load the plugin list from plugin_list.json
 * @returns {Promise<Array<string>>} Array of plugin IDs
 */
async function loadPluginList() {
  try {
    const response = await fetch('/src/plugins/plugin_list.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load plugin list: ${response.statusText}`);
    }
    
    const pluginList = await response.json();
    return pluginList;
  } catch (error) {
    console.error('Error loading plugin list:', error);
    return [];
  }
}

/**
 * Load a plugin's manifest file
 * @param {string} pluginId - Plugin ID
 * @returns {Promise<Object|null>} Manifest object or null if not found
 */
async function loadPluginManifest(pluginId) {
  // Check cache first
  if (manifestCache.has(pluginId)) {
    return manifestCache.get(pluginId);
  }
  
  // Try to load manifest
  try {
    const manifestUrl = `/src/plugins/${pluginId}/manifest.json`;
    const response = await fetch(manifestUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.statusText}`);
    }
    
    const manifest = await response.json();
    
    // Cache the result
    manifestCache.set(pluginId, manifest);
    
    console.log(`Loaded manifest for plugin: ${pluginId}`);
    return manifest;
  } catch (error) {
    console.warn(`Could not load manifest for ${pluginId}:`, error.message);
    return null;
  }
}

/**
 * Discover plugin implementations and manifests from a directory
 * @param {string} pluginId - Plugin ID and directory name
 * @returns {Promise<Object>} Plugin implementation functions and manifest
 */
export async function discoverPlugin(pluginId) {
  try {
    // Load the plugin's manifest
    const manifest = await loadPluginManifest(pluginId);
    
    if (!manifest) {
      throw new Error(`No manifest found for plugin: ${pluginId}`);
    }
    
    // Helper function to load implementation files
    const loadImplementation = async (fileName) => {
      try {
        const module = await import(`/src/plugins/${pluginId}/${fileName}.js`);
        return module;
      } catch (error) {
        console.warn(`Could not load ${fileName}.js for ${pluginId}:`, error);
        return {};
      }
    };
    
    // Load implementation files
    const [requiredFunctions, exportActions, interactionHandlers] = await Promise.all([
      loadImplementation('requiredFunctions'),
      loadImplementation('exportActions'),
      loadImplementation('interactionHandlers')
    ]);
    
    // Combine all implementation functions
    const implementation = {
      ...requiredFunctions,
      ...exportActions,
      ...interactionHandlers
    };
    
    return {
      manifest,
      implementation
    };
  } catch (error) {
    console.error(`Error discovering plugin ${pluginId}:`, error);
    return null;
  }
}

/**
 * Register a plugin from its manifest file
 * @param {string} pluginId - Plugin ID
 * @returns {Promise<boolean>} Success status
 */
export async function registerPluginFromManifest(pluginId) {
  try {
    const app = window.AppInstance;
    if (!app) {
      throw new Error('App instance not found');
    }
    
    // Discover the plugin
    const plugin = await discoverPlugin(pluginId);
    
    if (!plugin) {
      throw new Error(`Failed to discover plugin: ${pluginId}`);
    }
    
    // Register with the app
    app.pluginRegistry.registerPluginFromManifest(
      plugin.manifest,
      plugin.implementation
    );
    
    console.log(`Registered plugin ${pluginId} from manifest`);
    return true;
  } catch (error) {
    console.error(`Error registering plugin ${pluginId} from manifest:`, error);
    return false;
  }
}
