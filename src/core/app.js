// src/core/app.js
// Updated to support rendering environments for plugins

import { initState, getState, getStateValue, changeState, subscribe } from './stateManager.js';
import { initializeHooks } from './hooks.js';
import { CanvasManager } from './canvasManager.js';
import { showNotification } from './utils.js';
import { setupDesktopUI } from '../ui/desktopUI.js';
import { setupMobileUI } from '../ui/mobileUI.js';
import { detectPlatform } from './utils.js';

// App instance for singleton access
let appInstance = null;

/**
 * App class - Main application controller
 */
class App {
  /**
   * Create a new App instance
   */
  constructor() {
    if (appInstance) {
      return appInstance;
    }
    
    this.initialized = false;
    this.activePlugin = null;
    this.hooks = null;
    this.canvasManager = null;
    appInstance = this;
  }
  
  /**
   * Initialize the application
   * @returns {Promise<App>} The initialized app instance
   */
  async initialize() {
    if (this.initialized) {
      return this;
    }
    
    // 1. Initialize the hook system
    this.hooks = initializeHooks();
    
    // 2. Initialize state with defaults
    initState({
      // Core state
      plugins: {},
      activePluginId: null,
      previousPluginId: null,
      
      // UI state
      availablePlugins: [],
      rebuildUI: false,
      
      // Environment state
      currentEnvironment: null,
      
      // Settings and metadata - these will be plugin-specific
      settings: {},
      settingsMetadata: {},
      exportOptions: [],
      
      // Debug options
      debugMode: false,
      debugOptions: this.getDefaultDebugOptions()
    });
    
    // 3. Initialize canvas manager
    this.canvasManager = new CanvasManager('viewer-canvas');
    
    // 4. Register event listeners
    this.registerEventListeners();
    
    this.initialized = true;
    console.log("App initialized successfully");
    return this;
  }
  
  /**
   * Register event listeners
   */
  registerEventListeners() {
    // Listen for plugin activation events
    subscribe('pluginActivated', ({ pluginId }) => {
      this.activePlugin = getStateValue(`plugins.${pluginId}`);
      console.log(`Plugin activated: ${pluginId}`);
      
      // Set up environment based on plugin requirements
      this.setupEnvironmentForPlugin(pluginId);
      
      // Trigger UI rebuild
      changeState('rebuildUI', true);
      
      // IMPORTANT: Rebuild UI immediately after plugin activation
      this.rebuildUI();
      
      // Trigger render
      if (this.canvasManager) {
        console.log("Triggering render after plugin activation");
        setTimeout(() => {
          this.canvasManager.render();
        }, 50); // Small delay to allow UI updates to complete
      }
    });
    
    // Listen for setting changes
    subscribe('stateChanged', ({ path, value }) => {
      if (path.startsWith('settings.')) {
        // Notify the active plugin about the setting change
        const activePluginId = getStateValue('activePluginId');
        if (activePluginId) {
          this.hooks.doAction('onSettingChanged', { path, value, pluginId: activePluginId });
        }
        
        // Trigger render
        if (this.canvasManager) {
          this.canvasManager.render();
        }
      }
      
      // Handle rebuildUI state changes
      if (path === 'rebuildUI' && value === true) {
        console.log("rebuildUI state changed, rebuilding UI");
        this.rebuildUI();
        // Reset the flag
        changeState('rebuildUI', false);
      }
    });
  }
  
  /**
   * Set up environment based on plugin requirements
   * @param {string} pluginId - ID of active plugin
   */
  setupEnvironmentForPlugin(pluginId) {
    const plugin = getStateValue(`plugins.${pluginId}`);
    
    if (!plugin) {
      console.error(`Cannot set up environment - plugin ${pluginId} not found`);
      return;
    }
    
    // Get environment requirements from plugin manifest
    const environmentType = plugin.manifest?.environment?.type || '2d-camera';
    const environmentOptions = plugin.manifest?.environment?.options || {};
    
    console.log(`Setting up environment for plugin ${pluginId}: ${environmentType}`);
    
    // Set up the environment in canvas manager
    if (this.canvasManager) {
      this.canvasManager.setupEnvironment(environmentType, environmentOptions);
    }
  }
  
  /**
   * Rebuild the UI based on current state
   */
  rebuildUI() {
    console.log("Rebuilding UI with current state");
    const isMobile = detectPlatform();
    
    // Rebuild UI based on platform
    if (isMobile) {
      setupMobileUI(this.canvasManager);
      console.log('Mobile UI rebuilt');
    } else {
      setupDesktopUI(this.canvasManager);
      console.log('Desktop UI rebuilt');
    }
  }
  
  /**
   * Clean up state for plugin deactivation
   * @param {string} pluginId - ID of plugin being deactivated
   */
  cleanupPluginState(pluginId) {
    if (!pluginId) return;
    
    console.log(`Cleaning up state for plugin: ${pluginId}`);
    
    // Trigger plugin deactivated action BEFORE resetting settings
    // so the hook handler can still access state if needed
    this.hooks.doAction('deactivatePlugin', { pluginId });
    
    // Reset settings and metadata completely to avoid any leftover settings
    changeState('settings', {});
    changeState('settingsMetadata', {});
    changeState('exportOptions', []);
    
    // Ensure the canvas is fully cleared
    if (this.canvasManager) {
      const ctx = this.canvasManager.ctx;
      ctx.clearRect(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);
    }
    
    // Store as previous plugin
    changeState('previousPluginId', pluginId);
  }
  
  /**
   * Activate a plugin by ID
   * @param {string} pluginId - ID of the plugin to activate
   */
  activatePlugin(pluginId) {
    console.log(`Activating plugin: ${pluginId}`);
    
    const plugins = getStateValue('plugins');
    
    if (!plugins[pluginId]) {
      console.error(`Plugin "${pluginId}" not found`);
      showNotification(`Plugin "${pluginId}" not found`, 3000);
      return;
    }
    
    // Get current plugin ID before changing it
    const currentPluginId = getStateValue('activePluginId');
    
    // Only proceed with deactivation if we're actually changing plugins
    if (currentPluginId && currentPluginId !== pluginId) {
      // Clean up state from previous plugin first
      this.cleanupPluginState(currentPluginId);
    }
    
    // Set the new active plugin ID
    changeState('activePluginId', pluginId);
    
    // Get plugin metadata from state
    const plugin = plugins[pluginId];
    
    // IMPORTANT: First apply default settings from manifest directly
    if (plugin.manifest && plugin.manifest.defaultSettings) {
      const defaultSettings = plugin.manifest.defaultSettings;
      console.log(`Applying default settings for plugin ${pluginId}:`, defaultSettings);
      
      // Use a fresh settings object - NOT merged with current settings
      changeState('settings', {...defaultSettings});
    } else {
      console.warn(`No default settings found for plugin ${pluginId}`);
      changeState('settings', {});
    }
    
    // Then get settings metadata from hook - ONLY for this plugin
    if (this.hooks) {
      const metadata = this.hooks.applyFilters('settingsMetadata', {}, pluginId);
      console.log(`Settings metadata from plugin ${pluginId}:`, metadata);
      
      if (metadata && Object.keys(metadata).length > 0) {
        // This ensures metadata is available for UI
        changeState('settingsMetadata', metadata);
      } else {
        console.warn(`No settings metadata found for plugin ${pluginId}`);
        changeState('settingsMetadata', {});
      }
      
      // Get export options from hook - ONLY for this plugin
      const exportOptions = this.hooks.applyFilters('exportOptions', [], pluginId);
      if (exportOptions && exportOptions.length > 0) {
        changeState('exportOptions', exportOptions);
      } else {
        console.warn(`No export options found for plugin ${pluginId}`);
        changeState('exportOptions', []);
      }
    }
    
    // Set up environment based on plugin requirements
    this.setupEnvironmentForPlugin(pluginId);
    
    // Trigger plugin activated action
    this.hooks.doAction('activatePlugin', { pluginId });
    
    // Notify about plugin activation
    changeState('pluginActivated', { pluginId });
    
    // IMPORTANT: Directly trigger UI rebuild after activation
    this.rebuildUI();
    
    console.log(`Plugin ${pluginId} activated with settings:`, getStateValue('settings'));
    console.log(`Plugin ${pluginId} metadata:`, getStateValue('settingsMetadata'));
    
    // Ensure the visualization is rendered
    if (this.canvasManager) {
      setTimeout(() => {
        this.canvasManager.render();
      }, 0);
    }
  }
  
  /**
   * Register a plugin
   * @param {Object} plugin - Plugin object to register
   */
  registerPlugin(plugin) {
    if (!plugin.id) {
      console.error('Cannot register plugin without an ID');
      return;
    }
    
    // Ensure plugin has a manifest
    if (!plugin.manifest) {
      plugin.manifest = {};
    }
    
    // Ensure manifest has environment field
    if (!plugin.manifest.environment) {
      plugin.manifest.environment = {
        type: '2d-camera',
        options: {}
      };
    }
    
    // Store plugin in state
    changeState(`plugins.${plugin.id}`, plugin);
    
    // Add to available plugins list
    const availablePlugins = [...getStateValue('availablePlugins')];
    availablePlugins.push({
      id: plugin.id,
      name: plugin.name || plugin.id,
      description: plugin.description || ''
    });
    changeState('availablePlugins', availablePlugins);
    
    console.log(`Plugin registered: ${plugin.id}`);
  }
  
  /**
   * Set debug mode
   * @param {boolean} enabled - Whether debug mode should be enabled
   */
  setDebugMode(enabled) {
    changeState('debugMode', enabled);
    changeState('rebuildUI', true);
  }
  
  /**
   * Get default debug options
   * @returns {Array} Default debug options
   */
  getDefaultDebugOptions() {
    return [
      {
        id: 'show-fps',
        label: 'Show FPS',
        type: 'debug',
        setting: 'showFPS'
      },
      {
        id: 'show-bounds',
        label: 'Show Boundaries',
        type: 'debug',
        setting: 'showBounds'
      },
      {
        id: 'log-events',
        label: 'Log State Events',
        type: 'debug',
        setting: 'logEvents'
      }
    ];
  }
}

/**
 * Initialize the app
 * @returns {Promise<App>} The initialized app instance
 */
export async function initializeApp() {
  const app = new App();
  return app.initialize();
}

// For global access
if (typeof window !== 'undefined') {
  window.AppInstance = new App();
}
