// src/core/app.js
// Updated to support lazy plugin initialization

import { initState, getState, getStateValue, changeState, subscribe } from './stateManager.js';
import { initializeHooks } from './hooks.js';
import { CanvasManager } from './canvasManager.js';
import { showNotification } from './utils.js';
import { setupDesktopUI } from '../ui/desktopUI.js';
import { setupMobileUI } from '../ui/mobileUI.js';
import { detectPlatform } from './utils.js';
import { initializePlugin } from './pluginManager.js'; // Import the initialization function

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
    this.isLoadingPlugin = false;
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
    
    // 2. Initialize state with defaults - explicitly setting debug mode to false
    initState({
      // Core state
      plugins: {},
      activePluginId: null,
      previousPluginId: null,
      
      // UI state
      availablePlugins: [],
      rebuildUI: false,
      pluginLoading: false,
      loadingPluginId: null,
      
      // Environment state
      currentEnvironment: null,
      
      // Settings and metadata - these will be plugin-specific
      settings: {},
      settingsMetadata: {},
      exportOptions: [],
      
      // Debug options - explicitly setting debug mode to false by default
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
      
      // Log debug mode changes to trace where they happen
      if (path === 'debugMode') {
        console.log(`DEBUG MODE changed to: ${value}`);
      }
      
      // Handle rebuildUI state changes
      if (path === 'rebuildUI' && value === true) {
        console.log("rebuildUI state changed, rebuilding UI");
        this.rebuildUI();
        // Reset the flag
        changeState('rebuildUI', false);
      }
    });
    
    // Add hook for plugin metadata updates
    if (this.hooks) {
      this.hooks.addAction('pluginMetadataUpdated', 'app', ({ pluginId, metadata }) => {
        console.log(`Updating metadata for plugin ${pluginId} via hook`);
        
        // Only update if this is the active plugin
        if (getStateValue('activePluginId') === pluginId) {
          changeState('settingsMetadata', metadata);
          this.rebuildUI();
        }
      });
    }
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
    
    // Ensure the canvas is fully cleared, but only if we have a valid context
    if (this.canvasManager) {
      const ctx = this.canvasManager.ctx;
      // Add a null check before using the ctx object
      if (ctx) {
        ctx.clearRect(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);
      }
    }
    
    // Store as previous plugin
    changeState('previousPluginId', pluginId);
  }
  
  /**
   * Set plugin lifecycle state
   * @param {string} pluginId - Plugin ID
   * @param {string} state - New lifecycle state ('registered', 'initializing', 'ready', 'error')
   */
  setPluginLifecycleState(pluginId, state) {
    const plugin = getStateValue(`plugins.${pluginId}`);
    
    if (!plugin) {
      console.error(`Cannot set lifecycle state - plugin ${pluginId} not found`);
      return;
    }
    
    //console.log(`Changing plugin ${pluginId} lifecycle state: ${plugin.lifecycleState} -> ${state}`);
    
    // Update plugin object directly
    plugin.lifecycleState = state;
    
    // Store in state as well for reactive updates
    changeState(`plugins.${pluginId}.lifecycleState`, state);
    
    // If changing to ready state, update UI if this is the active plugin
    if (state === 'ready' && getStateValue('activePluginId') === pluginId) {
      console.log(`Plugin ${pluginId} is now ready, updating settings and UI`);
      
      // Trigger settings update from plugin
      this.hooks.doAction('onPluginReady', { pluginId });
      
      // Request metadata again now that plugin is ready
      const metadata = this.hooks.applyFilters('settingsMetadata', {}, pluginId);
      if (metadata && Object.keys(metadata).length > 0) {
        changeState('settingsMetadata', metadata);
      }
      
      // Rebuild UI with complete plugin data
      this.rebuildUI();
    }
  }
  
  /**
   * Show loading screen for a plugin
   * @param {string} pluginId - ID of the plugin being loaded
   */
  showPluginLoading(pluginId) {
    changeState('pluginLoading', true);
    changeState('loadingPluginId', pluginId);
    
    // Get plugin name for display
    const plugin = getStateValue(`plugins.${pluginId}`);
    const pluginName = plugin ? plugin.name || pluginId : pluginId;
    
    // Create or update the loading overlay
    this.createLoadingOverlay(pluginName);
  }
  
  /**
   * Hide plugin loading screen
   */
  hidePluginLoading() {
    changeState('pluginLoading', false);
    changeState('loadingPluginId', null);
    
    // Remove the loading overlay
    const loadingOverlay = document.getElementById('plugin-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => {
        if (loadingOverlay.parentNode) {
          loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
      }, 500);
    }
  }
  
  /**
   * Create or update the loading overlay
   * @param {string} pluginName - Name of the plugin to display
   */
  createLoadingOverlay(pluginName) {
    // Remove existing overlay if any
    let loadingOverlay = document.getElementById('plugin-loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.parentNode.removeChild(loadingOverlay);
    }
    
    // Create new overlay
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'plugin-loading-overlay';
    loadingOverlay.style.position = 'fixed';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.flexDirection = 'column';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.zIndex = '9999';
    loadingOverlay.style.opacity = '0';
    loadingOverlay.style.transition = 'opacity 0.3s ease';
    
    // Create content
    const content = document.createElement('div');
    content.style.backgroundColor = '#ffffff';
    content.style.borderRadius = '8px';
    content.style.padding = '30px';
    content.style.textAlign = 'center';
    content.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    content.style.maxWidth = '80%';
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = `Loading ${pluginName}`;
    title.style.margin = '0 0 20px 0';
    title.style.color = '#333';
    content.appendChild(title);
    
    // Create spinner
    const spinner = document.createElement('div');
    spinner.style.border = '5px solid #f3f3f3';
    spinner.style.borderTop = '5px solid #3498db';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '50px';
    spinner.style.height = '50px';
    spinner.style.margin = '0 auto 20px auto';
    spinner.style.animation = 'spin 1s linear infinite';
    content.appendChild(spinner);
    
    // Create message
    const message = document.createElement('p');
    message.textContent = 'This may take a few moments...';
    message.style.color = '#666';
    content.appendChild(message);
    
    // Add spinner keyframes if not already in document
    if (!document.getElementById('loading-spinner-keyframes')) {
      const style = document.createElement('style');
      style.id = 'loading-spinner-keyframes';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add to overlay and document
    loadingOverlay.appendChild(content);
    document.body.appendChild(loadingOverlay);
    
    // Trigger reflow before setting opacity for transition to work
    loadingOverlay.offsetWidth;
    loadingOverlay.style.opacity = '1';
  }
  
  /**
   * Activate a plugin by ID (with lazy initialization)
   * @param {string} pluginId - ID of the plugin to activate
   * @returns {Promise<boolean>} Success status
   */
  async activatePlugin(pluginId) {
console.log('------------------');
console.log('------------------');
    console.log(`Activating plugin: ${pluginId}`);
    
    const plugins = getStateValue('plugins');
    
    if (!plugins[pluginId]) {
      console.error(`Plugin "${pluginId}" not found`);
      showNotification(`Plugin "${pluginId}" not found`, 3000);
      return false;
    }
    
    // Get plugin lifecycle state
    const plugin = plugins[pluginId];
    const lifecycleState = plugin.lifecycleState || 'registered';
    
    // Get current plugin ID before changing it
    const currentPluginId = getStateValue('activePluginId');
    
    // Only proceed with deactivation if we're actually changing plugins
    if (currentPluginId && currentPluginId !== pluginId) {
      // Clean up state from previous plugin first
      this.cleanupPluginState(currentPluginId);
    }
    
    // Initialize the plugin if not already initialized
    if (lifecycleState === 'registered') {
      //console.log(`Plugin ${pluginId} needs initialization first`);
      
      // Show loading screen
      this.showPluginLoading(pluginId);
      
      try {
        // Initialize the plugin
        const success = await initializePlugin(pluginId);
        if (!success) {
          this.hidePluginLoading();
          console.error(`Failed to initialize plugin: ${pluginId}`);
          showNotification(`Failed to initialize plugin: ${pluginId}`, 3000);
          return false;
        }
      } catch (error) {
        this.hidePluginLoading();
        console.error(`Error during plugin initialization: ${error.message}`);
        showNotification(`Plugin initialization error: ${pluginId}`, 3000);
        return false;
      }
      
      // Hide loading screen
      this.hidePluginLoading();
    } else if (lifecycleState === 'initializing') {
      console.log(`Plugin ${pluginId} is already initializing, waiting...`);
      
      // Show loading screen
      this.showPluginLoading(pluginId);
      
      // Wait for the plugin to become ready (polling approach)
      const maxWaitTime = 30000; // 30 seconds max wait
      const pollInterval = 100; // 100ms between checks
      let elapsedTime = 0;
      
      while (elapsedTime < maxWaitTime) {
        // Check if plugin state has changed
        const currentState = getStateValue(`plugins.${pluginId}.lifecycleState`);
        if (currentState === 'ready' || currentState === 'active') {
          console.log(`Plugin ${pluginId} is now ready`);
          break;
        } else if (currentState === 'error') {
          this.hidePluginLoading();
          console.error(`Plugin ${pluginId} failed to initialize`);
          showNotification(`Plugin failed to initialize: ${pluginId}`, 3000);
          return false;
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        elapsedTime += pollInterval;
      }
      
      // Check if we timed out
      if (elapsedTime >= maxWaitTime) {
        this.hidePluginLoading();
        console.error(`Timed out waiting for plugin ${pluginId} to initialize`);
        showNotification(`Plugin initialization timeout: ${pluginId}`, 3000);
        return false;
      }
      
      // Hide loading screen
      this.hidePluginLoading();

	//Add some time to wait for the hooks to register
	await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Set the new active plugin ID
    changeState('activePluginId', pluginId);
    
    // IMPORTANT: First apply default settings from manifest directly
    if (plugin.manifest && plugin.manifest.defaultSettings) {
      const defaultSettings = plugin.manifest.defaultSettings;
      //console.log(`Applying default settings for plugin ${pluginId}:`, defaultSettings);
      
      // Use a fresh settings object - NOT merged with current settings
      changeState('settings', {...defaultSettings});
    } else {
      console.warn(`No default settings found for plugin ${pluginId}`);
      changeState('settings', {});
    }
    
    // Then get settings metadata from hook - ONLY if plugin is ready
    if (this.hooks && (lifecycleState === 'ready' || lifecycleState === 'active')) {
      const metadata = this.hooks.applyFilters('settingsMetadata', {}, pluginId);
      //console.log(`Settings metadata from plugin ${pluginId}:`, metadata);
      
      if (metadata && Object.keys(metadata).length > 0) {
        // This ensures metadata is available for UI
        changeState('settingsMetadata', metadata);
      } else {
        console.warn(`No settings metadata found for plugin ${pluginId}`);
	await this.pollForPluginMetadata(pluginId);
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
    } else {
      // If plugin is in error state, show empty UI
      console.log(`Plugin ${pluginId} is in state: ${lifecycleState}, showing minimal UI`);
      changeState('settingsMetadata', {});
      changeState('exportOptions', []);
    }
    
    // Set up environment based on plugin requirements
    this.setupEnvironmentForPlugin(pluginId);
    
    // Trigger plugin activated action
    this.hooks.doAction('activatePlugin', { pluginId });
    
    // Update plugin lifecycle state to active
    plugin.lifecycleState = 'active';
    changeState(`plugins.${pluginId}.lifecycleState`, 'active');
    
    // Notify about plugin activation
    changeState('pluginActivated', { pluginId });
    
	//Build UI After activiation
	setTimeout(() => {
	  //console.log("Performing delayed UI rebuild to ensure all plugin state is captured");
	  this.rebuildUI();
	}, 200);
    
    console.log(`Plugin ${pluginId} activated with settings:`, getStateValue('settings'));
    console.log(`Plugin ${pluginId} metadata:`, getStateValue('settingsMetadata'));
    
    // Ensure the visualization is rendered
    if (this.canvasManager) {
      setTimeout(() => {
        this.canvasManager.render();
      }, 0);
    }
    
    return true;
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
    
    // Add lifecycle state if not already present
    if (!plugin.lifecycleState) {
      plugin.lifecycleState = 'registered';
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
 * Poll for plugin metadata if not immediately available
 * @param {string} pluginId - Plugin ID
 * @returns {Promise<void>}
 */
async pollForPluginMetadata(pluginId, maxAttempts = 5) {
  console.log(`Polling for metadata for plugin ${pluginId}`);
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Metadata poll attempt ${attempts}/${maxAttempts}`);
    
    // Try to get metadata again
    const metadata = this.hooks.applyFilters('settingsMetadata', {}, pluginId);
    
    if (metadata && Object.keys(metadata).length > 0) {
      console.log(`Got metadata on poll attempt ${attempts}`);
      changeState('settingsMetadata', metadata);
      return;
    }
    
    // Wait a bit before trying again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.warn(`Failed to get metadata after ${maxAttempts} attempts`);
}
  /**
   * Set debug mode
   * @param {boolean} enabled - Whether debug mode should be enabled
   */
  setDebugMode(enabled) {
    // Cast to boolean and log the change
    const enableDebug = !!enabled;
    console.log(`Setting debug mode to: ${enableDebug}`);
    
    // If turning off debug mode, also disable debug-related settings
    if (!enableDebug) {
      const debugOptions = this.getDefaultDebugOptions();
      const settings = getState().settings || {};
      
      debugOptions.forEach(option => {
        if (settings[option.setting]) {
          console.log(`Disabling debug setting: ${option.setting}`);
          changeState(`settings.${option.setting}`, false);
        }
      });
    }
    
    // Update the debug mode state
    changeState('debugMode', enableDebug);
    
    // Trigger UI rebuild to show/hide debug panel
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
