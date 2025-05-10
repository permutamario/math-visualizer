// src/core/app.js
import { initState, getState, getStateValue, changeState, subscribe } from './stateManager.js';
import { initializeHooks } from './hooks.js';
import { CanvasManager } from './canvasManager.js';
import { showNotification } from './utils.js';
import { setupDesktopUI } from '../ui/desktopUI.js';
import { setupMobileUI } from '../ui/mobileUI.js';
import { detectPlatform } from './utils.js';
import { PluginControllerRegistry } from './PluginControllerRegistry.js';

// App instance for singleton access
let appInstance = null;

/**
 * App class - Main application controller with Plugin Controller support
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
    this.pluginRegistry = null;
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
    
    // 2. Initialize state with defaults
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
      
      // Debug options
      debugMode: false,
      debugOptions: this.getDefaultDebugOptions()
    });
    
    // 3. Initialize canvas manager
    this.canvasManager = new CanvasManager('viewer-canvas');
    
    // 4. Initialize plugin registry
    this.pluginRegistry = new PluginControllerRegistry(this);
    
    // 5. Register event listeners
    this.registerEventListeners();
    
    this.initialized = true;
    console.log("App initialized with Plugin Controller Registry");
    return this;
  }
  
  /**
   * Register event listeners
   */
  registerEventListeners() {
    // Listen for plugin activation events
    subscribe('pluginActivated', ({ pluginId }) => {
      // Track the active plugin
      this.activePlugin = getStateValue(`plugins.${pluginId}`);
      
      // Trigger UI rebuild
      this.rebuildUI();
      
      // Trigger render
      if (this.canvasManager) {
        setTimeout(() => {
          this.canvasManager.render();
        }, 50);
      }
    });
    
    // Listen for setting changes
    subscribe('stateChanged', ({ path, value }) => {
      if (path.startsWith('settings.')) {
        const settingPath = path.replace('settings.', '');
        
        // Update the setting in the active plugin controller
        if (this.pluginRegistry && this.pluginRegistry.activeController) {
          this.pluginRegistry.updateActiveSetting(settingPath, value);
        }
        
        // Trigger render
        if (this.canvasManager) {
          this.canvasManager.render();
        }
      }
      
      // Handle rebuildUI state changes
      if (path === 'rebuildUI' && value === true) {
        this.rebuildUI();
        // Reset the flag
        changeState('rebuildUI', false);
      }
    });
  }
  
  /**
   * Rebuild the UI based on current state
   */
  rebuildUI() {
    const isMobile = detectPlatform();
    
    // Rebuild UI based on platform
    if (isMobile) {
      setupMobileUI(this.canvasManager);
    } else {
      setupDesktopUI(this.canvasManager);
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
   * Register a plugin
   * @param {Object} plugin - Plugin object to register
   */
  registerPlugin(plugin) {
    if (!plugin.id) {
      console.error('Cannot register plugin without an ID');
      return;
    }
    
    // Register with the Plugin Controller Registry
    const controller = this.pluginRegistry.registerPlugin(plugin);
    
    if (!controller) {
      console.error(`Failed to create controller for plugin ${plugin.id}`);
      return;
    }
    
    // Ensure plugin has a manifest
    if (!plugin.manifest) {
      plugin.manifest = {};
    }
    
    // Store plugin in state for backwards compatibility
    changeState(`plugins.${plugin.id}`, plugin);
    
    // Add to available plugins list
    const availablePlugins = [...getStateValue('availablePlugins')];
    availablePlugins.push({
      id: plugin.id,
      name: plugin.name || plugin.id,
      description: plugin.description || ''
    });
    changeState('availablePlugins', availablePlugins);
  }
  
  /**
   * Activate a plugin by ID (with lazy initialization)
   * @param {string} pluginId - ID of the plugin to activate
   * @returns {Promise<boolean>} Success status
   */
  async activatePlugin(pluginId) {
    const plugins = getStateValue('plugins');
    
    if (!plugins[pluginId]) {
      console.error(`Plugin "${pluginId}" not found`);
      showNotification(`Plugin "${pluginId}" not found`, 3000);
      return false;
    }
    
    // Use the plugin registry to activate the plugin
    try {
      // Show loading indicator
      this.showPluginLoading(pluginId);
      
      // Store previous plugin ID 
      const currentPluginId = getStateValue('activePluginId');
      if (currentPluginId && currentPluginId !== pluginId) {
        changeState('previousPluginId', currentPluginId);
      }
      
      // Activate the plugin through the registry
      const success = await this.pluginRegistry.activatePlugin(pluginId);
      
      // Hide loading indicator
      this.hidePluginLoading();
      
      if (!success) {
        console.error(`Failed to activate plugin ${pluginId}`);
        showNotification(`Failed to activate plugin: ${pluginId}`, 3000);
      }
      
      return success;
    } catch (error) {
      // Hide loading indicator
      this.hidePluginLoading();
      
      console.error(`Error during plugin activation: ${error.message}`);
      showNotification(`Plugin activation error: ${pluginId}`, 3000);
      return false;
    }
  }
  
  /**
   * Set debug mode
   * @param {boolean} enabled - Whether debug mode should be enabled
   */
  setDebugMode(enabled) {
    // Cast to boolean
    const enableDebug = !!enabled;
    
    // If turning off debug mode, also disable debug-related settings
    if (!enableDebug) {
      const debugOptions = this.getDefaultDebugOptions();
      const settings = getState().settings || {};
      
      debugOptions.forEach(option => {
        if (settings[option.setting]) {
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
