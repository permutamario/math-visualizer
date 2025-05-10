// src/core/pluginManager.js
import { getState } from './stateManager.js';
import { showNotification } from './utils.js';

// Import plugins directly
import initSquarePlugin from '../plugins/square/index.js';
import initCirclePlugin from '../plugins/circle/index.js';
import initCubePlugin from '../plugins/cube/index.js';
import initInteractivePlugin from '../plugins/interactive/index.js';
import initPolytopeViewerPlugin from '../plugins/polytope-viewer/index.js';

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

    // 2. Use our predefined list of plugins
    const plugins = getPluginsList();
    
    // 3. Try to load manifests for each plugin
    const manifestPromises = plugins.map(plugin => loadPluginManifest(plugin.id));
    const manifests = await Promise.allSettled(manifestPromises);
    
    const registeredPlugins = [];

    // 4. Register each plugin with its manifest if available
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      
      // If manifest was loaded successfully, use it
      if (manifests[i].status === 'fulfilled' && manifests[i].value) {
        plugin.manifest = manifests[i].value;
      }
      
      // Register the plugin with the app
      app.registerPlugin(plugin);
      registeredPlugins.push(plugin);
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
    const manifestUrl = `src/plugins/${pluginId}/manifest.json`;
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
        const module = await import(`../plugins/${pluginId}/${fileName}.js`);
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
      init: initSquarePlugin
    },
    
    // Circle Plugin
    {
      id: 'circle',
      name: 'Circle Visualization',
      description: 'A sectioned circle visualization with interaction',
      init: initCirclePlugin
    },
    
    // 3D Cube Plugin
    {
      id: 'cube',
      name: '3D Cube Visualization',
      description: 'A 3D cube visualization with camera controls',
      init: initCubePlugin
    },
    
    // Interactive Shapes Plugin
    {
      id: 'interactive',
      name: 'Interactive Shapes',
      description: 'Interactive shapes that can be clicked and dragged',
      init: initInteractivePlugin
    },
    
    // Polytope Viewer Plugin
    {
      id: 'polytopeViewer',
      name: 'Polytope Viewer',
      description: 'Interactive viewer for 3D polytopes with parametric controls',
      init: initPolytopeViewerPlugin
    }
  ];
}
