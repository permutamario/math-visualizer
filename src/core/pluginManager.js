// src/core/pluginManager.js
// Updated to automatically discover and load plugins

import { getState } from './stateManager.js';
import { showNotification } from './utils.js';

// Import plugins directly - this is the most reliable approach
import initSquarePlugin from '../plugins/square/index.js';
import initCirclePlugin from '../plugins/circle/index.js';
import initCubePlugin from '../plugins/cube/index.js';
import initInteractivePlugin from '../plugins/interactive/index.js';
import initPolytopeViewerPlugin from '../plugins/polytope-viewer/index.js';

// List of plugin directories to scan
const PLUGINS_PATH = './src/plugins/';

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

    // 2. Use our predefined list of plugins - simplest and most reliable approach
    const plugins = getPluginsList();
    console.log(`Found ${plugins.length} plugins:`, plugins.map(p => p.id));

    const loadedPlugins = [];

    // Log available hooks before loading plugins
    if (app.hooks) {
      app.hooks.listRegisteredHooks();
    }

    for (const plugin of plugins) {
      console.log(`Registering plugin: ${plugin.id}`);
      
      // Register the plugin with the app
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
    
    return loadedPlugins;
    
  } catch (error) {
    console.error('Failed to load plugins:', error);
    showNotification('Failed to load plugins', 3000);
    return [];
  }
}

/**
 * Get the list of plugins with their initialization functions
 * Most reliable approach: direct imports and hardcoded manifests
 */
function getPluginsList() {
  return [
    // Square Plugin
    {
      id: 'square',
      name: 'Square Visualization',
      description: 'A simple square visualization',
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
    
    // Circle Plugin
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
    
    // 3D Cube Plugin
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
    
    // Interactive Shapes Plugin
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
    },
    
    // Polytope Viewer Plugin
    {
      id: 'polytopeViewer',
      name: 'Polytope Viewer',
      description: 'Interactive viewer for 3D polytopes with parametric controls',
      init: initPolytopeViewerPlugin,
      manifest: {
        defaultSettings: {
          polytopeType: "cube",
          wireframe: false,
          showVertices: true,
          vertexSize: 0.1,
          edgeThickness: 1,
          edgeColor: "#000000",
          faceColor: "#3498db",
          faceOpacity: 0.85,
          showFaces: true,
          animation: false,
          size: 1
        },
        environment: {
          type: '3d-camera',
          options: {
            cameraPosition: [0, 0, 5],
            lookAt: [0, 0, 0]
          }
        }
      }
    }
  ];
}
