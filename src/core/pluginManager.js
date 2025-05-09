// src/core/pluginManager.js
// Updated to support deferred plugin initialization

import { getState } from './stateManager.js';
import { showNotification } from './utils.js';

// Import plugins directly - this is the most reliable approach
import initSquarePlugin from '../plugins/square/index.js';
import initCirclePlugin from '../plugins/circle/index.js';
import initCubePlugin from '../plugins/cube/index.js';
import initInteractivePlugin from '../plugins/interactive/index.js';
import initPolytopeViewerPlugin from '../plugins/polytope-viewer/index.js';

/**
 * Load and register all available plugins without initializing them
 * @returns {Promise<Array>} Array of registered plugins
 */
export async function loadPlugins() {
  try {
    console.log("Registering plugins...");
    
    // 1. Get app instance
    const app = window.AppInstance;
    if (!app) {
      throw new Error('App instance not found');
    }
    
    // Make sure app is initialized
    if (!app.initialized) {
      await app.initialize();
    }

    // 2. Use our predefined list of plugins
    const plugins = getPluginsList();
    //console.log(`Found ${plugins.length} plugins:`, plugins.map(p => p.id));

    const registeredPlugins = [];

    // Log available hooks before loading plugins
    if (app.hooks) {
      app.hooks.listRegisteredHooks();
    }

    for (const plugin of plugins) {
      //console.log(`Registering plugin: ${plugin.id}`);
      
      // Set lifecycle state to 'registered' but not initialized
      plugin.lifecycleState = 'registered';
      
      // Register the plugin with the app (but don't initialize)
      app.registerPlugin(plugin);
      
      registeredPlugins.push(plugin);
    }

    return registeredPlugins;
    
  } catch (error) {
    console.error('Failed to register plugins:', error);
    showNotification('Failed to register plugins', 3000);
    return [];
  }
}

/**
 * Initialize a specific plugin
 * @param {string} pluginId - ID of the plugin to initialize
 * @returns {Promise<boolean>} Success status
 */
export async function initializePlugin(pluginId) {
  try {
    console.log(`Initializing plugin: ${pluginId}`);
    
    // Get app instance
    const app = window.AppInstance;
    if (!app) {
      throw new Error('App instance not found');
    }
    
    // Get the plugin
    const plugin = getState().plugins[pluginId];
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    // Skip if already initialized
    if (plugin.lifecycleState === 'ready' || plugin.lifecycleState === 'active') {
      console.log(`Plugin ${pluginId} already initialized`);
      return true;
    }
    
    // Check if the plugin has an init function
    if (typeof plugin.init !== 'function') {
      console.log(`Plugin ${pluginId} has no init function, marking as ready`);
      app.setPluginLifecycleState(pluginId, 'ready');
      return true;
    }
    
    // Set up initialization context
    const core = {
      hooks: app.hooks,
      state: {
        getState,
      },
      canvas: app.canvasManager,
      lifecycle: {
        setPluginState: (state) => app.setPluginLifecycleState(pluginId, state)
      }
    };
    
    // Set to initializing state
    app.setPluginLifecycleState(pluginId, 'initializing');
    
    // Show loading indicator for the plugin
    app.showPluginLoading(pluginId);
    
    // Initialize the plugin
    const initResult = plugin.init(core);
    
    // If init returns a promise, wait for it
    if (initResult instanceof Promise) {
      await initResult;
 	await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // If plugin didn't explicitly set state to ready, do it now
    if (plugin.lifecycleState === 'initializing') {
      app.setPluginLifecycleState(pluginId, 'ready');
    }
    
    // Hide loading indicator
    app.hidePluginLoading();
    
    console.log(`Plugin ${pluginId} initialized successfully`);
    return true;
    
  } catch (error) {
    console.error(`Error initializing plugin ${pluginId}:`, error);
    const app = window.AppInstance;
    
    if (app) {
      app.setPluginLifecycleState(pluginId, 'error');
      app.hidePluginLoading();
    }
    
    showNotification(`Failed to initialize plugin: ${pluginId}`, 3000);
    return false;
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
