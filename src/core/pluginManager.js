// src/core/pluginManager.js
import { getState } from './stateManager.js';
import { showNotification } from './utils.js';

// Import plugins directly
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
    console.log("Registering plugins with Plugin Controller Registry");
    
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

    const registeredPlugins = [];

    for (const plugin of plugins) {
      // Set lifecycle state to 'registered' but not initialized
      plugin.lifecycleState = 'registered';
      
      // Register the plugin with the app (now uses Plugin Controller Registry)
      app.registerPlugin(plugin);
      
      registeredPlugins.push(plugin);
    }

    return registeredPlugins;
    
  } catch (error) {
    console.error('Failed to register plugins with registry:', error);
    showNotification('Failed to register plugins', 3000);
    return [];
  }
}

/**
 * Initialize a specific plugin using the Plugin Controller Registry
 * @param {string} pluginId - ID of the plugin to initialize
 * @returns {Promise<boolean>} Success status
 */
export async function initializePlugin(pluginId) {
  try {
    console.log(`Initializing plugin through registry: ${pluginId}`);
    
    // Get app instance
    const app = window.AppInstance;
    if (!app) {
      throw new Error('App instance not found');
    }
    
    // Use the registry to initialize the plugin
    const controller = await app.pluginRegistry.initializePlugin(pluginId);
    
    if (controller) {
      return true;
    } else {
      console.error(`Failed to initialize plugin ${pluginId} through registry`);
      return false;
    }
    
  } catch (error) {
    console.error(`Error initializing plugin ${pluginId} through registry:`, error);
    showNotification(`Failed to initialize plugin: ${pluginId}`, 3000);
    return false;
  }
}

/**
 * Get the list of plugins with their initialization functions
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
