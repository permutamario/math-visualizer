// src/core/pluginManager.js
// Handles discovery, loading, and management of plugins with strict isolation

import { getState } from './stateManager.js';
import { showNotification } from './utils.js';

// List of plugin directories to scan
const PLUGIN_DIRECTORIES = ['./src/plugins'];

// Import plugins directly for this implementation
// In a more dynamic implementation, these would be loaded from filesystem
import initSquarePlugin from '../plugins/square/index.js';
import initCirclePlugin from '../plugins/circle/index.js';

// Plugin registry - in a real implementation, this would be populated dynamically
const PLUGINS = [
  {
    id: 'square',
    name: 'Square Visualization',
    description: 'Displays a simple square visualization',
    init: initSquarePlugin,
    manifest: {
      defaultSettings: {
        squareSize: 100,
        squareColor: '#156289',
        squareOpacity: 1.0,
        squareRotation: 0,
        backgroundColor: '#f5f5f5',
        showBorder: true,
        borderColor: '#000000',
        borderWidth: 2,
      }
    }
  },
  {
    id: 'circle',
    name: 'Circle Visualization',
    description: 'A sectioned circle visualization',
    init: initCirclePlugin,
    manifest: {
      defaultSettings: {
        circleRadius: 100,
        circleColor: '#4285f4',
        circleOpacity: 1.0,
        circleSections: 1,
        backgroundColor: '#f5f5f5',
        showBorder: true,
        borderColor: '#000000',
        borderWidth: 2,
      }
    }
  }
];

/**
 * Load and initialize all available plugins
 * @returns {Promise<Array>} Array of loaded plugins
 */
export async function loadPlugins() {
  try {
    console.log("Loading plugins...");
    
    // 1. Get app instance
    const app = window.AppInstance;
    if (!app) {
      throw new Error('App instance not found');
    }
    
    // Make sure app is initialized
    if (!app.initialized) {
      await app.initialize();
    }

    // 2. Initialize each plugin
    const loadedPlugins = [];

    // Log available hooks before loading plugins
    if (app.hooks) {
      app.hooks.listRegisteredHooks();
    }

    for (const plugin of PLUGINS) {
      console.log(`Registering plugin: ${plugin.id}`);
      
      // Register the plugin with the app (but don't activate it yet)
      app.registerPlugin(plugin);
      
      // Initialize the plugin
      const core = {
        hooks: app.hooks,
        state: {
          getState,
        },
        canvas: app.canvasManager
      };
      
      if (typeof plugin.init === 'function') {
        try {
          await plugin.init(core);
          console.log(`Initialized plugin: ${plugin.id}`);
        } catch (error) {
          console.error(`Error initializing plugin ${plugin.id}:`, error);
        }
      }
      
      loadedPlugins.push(plugin);
    }

    // After loading, log the registered hooks
    if (app.hooks) {
      console.log("Registered hooks after plugin initialization:");
      app.hooks.listRegisteredHooks();
    }

    console.log(`Loaded ${loadedPlugins.length} plugins`);
    
    // Note: We no longer auto-activate the first plugin here
    // This will be handled in index.js after UI setup
    
    return loadedPlugins;
    
  } catch (error) {
    console.error('Failed to load plugins:', error);
    showNotification('Failed to load plugins', 3000);
    return [];
  }
}

/**
 * In a real implementation, this function would scan the filesystem
 * for plugin directories and load manifests
 * @returns {Promise<Array>} Array of plugin manifests
 */
async function discoverPlugins() {
  // This would dynamically scan plugin directories
  // For this example, we're using the hardcoded PLUGINS array
  return PLUGINS.map(plugin => ({
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    path: `./src/plugins/${plugin.id}/`
  }));
}

/**
 * Load a plugin from its manifest
 * @param {Object} manifest - Plugin manifest
 * @returns {Promise<Object>} Loaded plugin
 */
async function loadPlugin(manifest) {
  try {
    // In a real implementation, you would dynamically import
    // the plugin's index.js and load its manifest.json
    const plugin = PLUGINS.find(p => p.id === manifest.id);
    
    if (!plugin) {
      throw new Error(`Plugin not found: ${manifest.id}`);
    }
    
    return plugin;
  } catch (error) {
    console.error(`Failed to load plugin "${manifest.id}":`, error);
    return null;
  }
}
