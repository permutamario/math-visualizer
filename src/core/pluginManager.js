// src/core/pluginManager.js
// Updated to include environment settings in plugin manifests

import { getState } from './stateManager.js';
import { showNotification } from './utils.js';

// List of plugin directories to scan
const PLUGIN_DIRECTORIES = ['./src/plugins'];

// Import plugins directly for this implementation
// In a more dynamic implementation, these would be loaded from filesystem
import initSquarePlugin from '../plugins/square/index.js';
import initCirclePlugin from '../plugins/circle/index.js';
import initCubePlugin from '../plugins/cube/index.js';
import initInteractivePlugin from '../plugins/interactive/index.js';

// Plugin registry - in a real implementation, this would be populated dynamically
// Now includes environment settings
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
      },
      environment: {
        type: '2d-camera',
        options: {}
      }
    }
  },
  {
    id: 'circle',
    name: 'Circle Visualization',
    description: 'A sectioned circle visualization with interaction',
    init: initCirclePlugin,
    manifest: {
      defaultSettings: {
        circleRadius: 100,
        circleColor: '#4285f4',
        circleOpacity: 1.0,
        circleSections: 4,
        backgroundColor: '#f5f5f5',
        showBorder: true,
        borderColor: '#000000',
        borderWidth: 2,
        highlightColor: '#ff5722',
        animation: false
      },
      environment: {
        type: '2d-event',
        options: {}
      }
    }
  },
  {
    id: 'cube',
    name: '3D Cube Visualization',
    description: 'A 3D cube visualization with camera controls',
    init: initCubePlugin,
    manifest: {
      defaultSettings: {
        cubeSize: 100,
        cubeColor: '#3498db',
        opacity: 1.0,
        wireframe: true,
        wireframeColor: '#000000',
        rotation: true,
        backgroundColor: '#f5f5f5'
      },
      environment: {
        type: '3d-camera',
        options: {
          cameraPosition: [0, 0, 5],
          lookAt: [0, 0, 0]
        }
      }
    }
  },
  {
    id: 'interactive',
    name: 'Interactive Shapes',
    description: 'Interactive shapes that can be clicked and dragged',
    init: initInteractivePlugin,
    manifest: {
      defaultSettings: {
        defaultColor: '#3498db',
        selectedColor: '#e74c3c',
        snapToGrid: false,
        gridSize: 20,
        backgroundColor: '#f5f5f5'
      },
      environment: {
        type: '2d-event',
        options: {}
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
      
      // Make sure the plugin has environment settings
      if (!plugin.manifest.environment) {
        console.log(`No environment specified for plugin ${plugin.id}, defaulting to 2d-camera`);
        plugin.manifest.environment = {
          type: '2d-camera',
          options: {}
        };
      }
      
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
    path: `./src/plugins/${plugin.id}/`,
    environment: plugin.manifest?.environment || { type: '2d-camera', options: {} }
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
