// src/core/AppCore.js - Improved version

import { discoverPlugins, getFirstPluginId } from './PluginDiscovery.js';
import { UIManager } from '../ui/UIManager.js';
import { RenderingManager } from '../rendering/RenderingManager.js';
import { StateManager } from './StateManager.js';
import { EventEmitter } from './EventEmitter.js';
import { ColorSchemeManager } from './ColorSchemeManager.js';
import { RenderModeManager } from '../rendering/RenderModeManager.js';

/**
 * Main application controller
 * Coordinates between plugins, UI, and rendering
 */
export class AppCore {
  /**
   * AppCore constructor
   */
  constructor() {
    // Create core components
    this.events = new EventEmitter();
    this.state = new StateManager();
    this.renderingManager = null; // Initialize in initialize() to avoid circular dependencies
    this.uiManager = null; // Initialize in initialize() to avoid circular dependencies
    this.colorSchemeManager = new ColorSchemeManager(this);
    this.renderModeManager = null; // Initialize in initialize() to avoid circular dependencies
    
    // Application state
    this.loadedPlugin = null;
    this.previousPluginId = null; // Store previous plugin ID for recovery
    this.availablePlugins = []; // Plugin metadata
    this.initialized = false;
    
    // Flag to track if this is initial startup
    this.isInitialStartup = true;
    
    // Bind methods
    this.loadPlugin = this.loadPlugin.bind(this);
    this.handleParameterChange = this.handleParameterChange.bind(this);
    this.executeAction = this.executeAction.bind(this);
    this.showPluginSelector = this.showPluginSelector.bind(this);
  }
  
  /**
   * Initialize the application
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      console.log("Initializing Math Visualization Framework...");
      
      // Initialize color schemes first (UI appearance depends on this)
      await this.colorSchemeManager.initialize();
      
      // Initialize managers that depend on this reference
      this.renderingManager = new RenderingManager(this);
      this.uiManager = new UIManager(this);
      this.renderModeManager = new RenderModeManager(this);
      
      // Initialize other core components
      await this.renderingManager.initialize();
      await this.uiManager.initialize();
      
      // Discover available plugins
      this.availablePlugins = await discoverPlugins();
      
      if (this.availablePlugins.length === 0) {
        console.warn("No plugins discovered");
      } else {
        console.log(`Discovered ${this.availablePlugins.length} plugins`);
      }
      
      // Register event handlers
      this.uiManager.on('parameterChange', this.handleParameterChange);
      this.uiManager.on('action', this.executeAction);
      this.uiManager.on('pluginSelect', this.loadPlugin);
      
      // Update UI with available plugins
      this.uiManager.updatePlugins(this.availablePlugins, null);
      
      this.initialized = true;
      console.log("Math Visualization Framework initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Math Visualization Framework:", error);
      if (this.uiManager) {
        this.uiManager.showError(`Initialization failed: ${error.message}`);
      }
      return false;
    }
  }
  
  /**
   * Get standard visual parameters based on rendering type
   * @param {string} renderingType - '2d' or '3d'
   * @returns {Object} Standard parameter definitions
   */
  getStandardParameters(renderingType = '2d') {
    const standardParams = {};
    
    // Add color palette parameter for all rendering types
    if (this.colorSchemeManager) {
      const paletteNames = this.colorSchemeManager.getPaletteNames();
      if (paletteNames && paletteNames.length > 0) {
        standardParams.colorPalette = {
          id: 'colorPalette',
          type: 'dropdown',
          label: 'Color Palette',
          options: paletteNames.map(name => ({
            value: name, 
            label: name
          })),
          default: 'default',
          category: 'visual'
        };
      }
    }
    
    // Add 3D-specific parameters
    if (renderingType === '3d' && this.renderModeManager) {
      const renderModes = this.renderModeManager.getAvailableModes();
      if (renderModes && renderModes.length > 0) {
        standardParams.renderMode = {
          id: 'renderMode',
          type: 'dropdown',
          label: 'Render Style',
          options: renderModes,
          default: 'standard',
          category: 'visual'
        };
      }
      
      standardParams.opacity = {
        id: 'opacity',
        type: 'slider',
        label: 'Opacity',
        min: 0.1,
        max: 1.0,
        step: 0.1,
        default: 1.0,
        category: 'visual'
      };
    }
    
    return standardParams;
  }
  
  /**
   * Load a plugin by ID
   * @param {string} pluginId - ID of the plugin to load
   * @returns {Promise<boolean>} Whether loading was successful
   */
  async loadPlugin(pluginId) {
    if (!pluginId) {
      console.error("Cannot load plugin: No plugin ID provided");
      return false;
    }
    
    try {
      // Store reference to previous plugin for recovery if needed
      if (this.loadedPlugin) {
        this.previousPluginId = this.loadedPlugin.constructor.id;
      }
      
      // Check if plugin is already loaded
      if (this.loadedPlugin && this.loadedPlugin.constructor.id === pluginId) {
        console.log(`Plugin ${pluginId} is already loaded`);
        return true;
      }
      
      // Find plugin metadata
      const pluginMetadata = this.availablePlugins.find(p => p.id === pluginId);
      
      if (!pluginMetadata) {
        this.uiManager.showError(`Plugin "${pluginId}" not found`);
        console.error(`Plugin ${pluginId} not found`);
        return false;
      }
      
      // Pause rendering during plugin transition
      const wasRendering = this.renderingManager.rendering;
      if (wasRendering) {
        this.renderingManager.stopRenderLoop();
      }
      
      // Show loading indicator
      this.uiManager.showLoading(`Loading ${pluginMetadata.name}...`);
      
      try {
        // Unload current plugin if any
        if (this.loadedPlugin) {
          try {
            await this.loadedPlugin.unload();
            this.loadedPlugin = null;
          } catch (unloadError) {
            console.error(`Error unloading previous plugin:`, unloadError);
            // Continue with loading the new plugin even if unloading failed
          }
        }
        
        // Setup appropriate rendering environment
        try {
          await this.renderingManager.setEnvironment(pluginMetadata.renderingType);
        } catch (renderingError) {
          this.uiManager.showError(`Error setting up rendering environment: ${renderingError.message}`);
          console.error(`Error setting up rendering environment:`, renderingError);
          
          if (wasRendering) {
            this.renderingManager.startRenderLoop();
          }
          
          this.uiManager.hideLoading();
          return false;
        }
        
        // Create new plugin instance
        const plugin = new pluginMetadata.PluginClass(this);
        
        // Load the plugin
        const success = await plugin.load();
        
        if (success) {
          this.loadedPlugin = plugin;
          
          // Update UI with currently active plugin
          this.uiManager.updatePlugins(this.availablePlugins, pluginId);
          
          // Update actions
          const actions = this.loadedPlugin.defineActions();
          this.uiManager.updateActions(actions);
          
          // Restore rendering if it was active or force a single render
          if (wasRendering) {
            this.renderingManager.startRenderLoop();
          } else {
            this.renderingManager.requestRender();
          }
          
          this.uiManager.hideLoading();
          this.uiManager.showNotification(`${pluginMetadata.name} loaded successfully`);
          
          return true;
        } else {
          console.error(`Plugin ${pluginId} load() returned false`);
          this.tryRecoverPreviousPlugin();
          this.uiManager.showError(`Failed to load plugin "${pluginMetadata.name}"`);
          return false;
        }
      } catch (error) {
        console.error(`Error loading plugin ${pluginId}:`, error);
        this.uiManager.showError(`Error loading plugin "${pluginMetadata.name}": ${error.message}`);
        this.tryRecoverPreviousPlugin();
        return false;
      } finally {
        // Ensure loading indicator is hidden in all cases
        this.uiManager.hideLoading();
        
        // Ensure rendering is restored if it was active
        if (wasRendering && !this.renderingManager.rendering) {
          this.renderingManager.startRenderLoop();
        }
      }
    } catch (error) {
      console.error(`Uncaught error in loadPlugin for ${pluginId}:`, error);
      this.uiManager.hideLoading();
      this.uiManager.showError(`Error loading plugin "${pluginId}": ${error.message}`);
      return false;
    }
  }
  
  /**
   * Try to recover by loading the previous plugin
   * @private
   */
  tryRecoverPreviousPlugin() {
    // If a previous plugin was active, try to reload it
    if (this.previousPluginId) {
      console.log(`Attempting to reload previous plugin ${this.previousPluginId}`);
      const previousId = this.previousPluginId;
      this.previousPluginId = null; // Prevent loop if reloading fails
      
      // Use setTimeout to break the call stack and prevent recursion issues
      setTimeout(() => {
        this.loadPlugin(previousId).catch(err => {
          console.error("Failed to recover previous plugin:", err);
          // Don't show additional error to user to avoid error spam
        });
      }, 100);
    }
  }
  
  /**
   * Show the plugin selector window
   */
  showPluginSelector() {
    if (this.uiManager && this.uiManager.layout) {
      if (typeof this.uiManager.layout.openSelectionWindow === 'function') {
        this.uiManager.layout.openSelectionWindow();
      }
    }
  }
  
  /**
   * Toggle Fullscreen mode
   * @returns {boolean} Whether fullscreen mode is now enabled
   */
  toggleFullscreenMode() {
    const isFullscreen = !this.state.get('isFullscreen', false);
    this.state.set('isFullscreen', isFullscreen);
    
    // Update body class - actual UI changes are handled by CSS
    if (isFullscreen) {
      document.body.classList.add('fullscreen-mode');
    } else {
      document.body.classList.remove('fullscreen-mode');
    }
    
    // Emit event for any listeners
    this.events.emit('fullscreenToggled', isFullscreen);
    
    return isFullscreen;
  }
  
  /**
   * Handle parameter changes from UI
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value
   * @param {string} group - Parameter group (optional)
   */
  handleParameterChange(parameterId, value, group) {
    if (!this.loadedPlugin) return;
    
    try {
      // Update parameter value in the plugin
      this.loadedPlugin.onParameterChanged(parameterId, value, group);
      
      // Request render
      if (this.renderingManager) {
        this.renderingManager.requestRender();
      }
    } catch (error) {
      console.error(`Error handling parameter change for ${parameterId}:`, error);
      if (this.uiManager) {
        this.uiManager.showError(`Error updating parameter "${parameterId}": ${error.message}`);
      }
    }
  }
  
  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    // Handle app-level actions
    if (actionId === 'toggle-theme') {
      if (this.colorSchemeManager) {
        const currentScheme = this.colorSchemeManager.getActiveScheme();
        const newScheme = currentScheme.id === 'light' ? 'dark' : 'light';
        this.colorSchemeManager.setActiveScheme(newScheme);
        return true;
      }
      return false;
    }
    
    if (actionId === 'toggle-fullscreen') {
      this.toggleFullscreenMode();
      return true;
    }
    
    // Delegate to plugin if one is loaded
    if (this.loadedPlugin) {
      try {
        return this.loadedPlugin.executeAction(actionId, ...args);
      } catch (error) {
        console.error(`Error executing action ${actionId}:`, error);
        this.uiManager.showError(`Error executing action "${actionId}": ${error.message}`);
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Get the active plugin
   * @returns {Plugin|null} Loaded plugin instance or null if none
   */
  getActivePlugin() {
    return this.loadedPlugin;
  }
  
  /**
   * Start the application
   * @returns {Promise<boolean>} Whether startup was successful
   */
  async start() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Start the rendering loop
      this.renderingManager.startRenderLoop();
      
      // Just show the "Select a Plugin" message initially
      this.renderingManager.requestRender();
      
      // Show the plugin selector after a short delay if this is initial startup
      if (this.isInitialStartup) {
        setTimeout(() => {
          this.showPluginSelector();
          this.isInitialStartup = false;
        }, 500);
      }
      
      return true;
    } catch (error) {
      console.error("Failed to start application:", error);
      if (this.uiManager) {
        this.uiManager.showError(`Failed to start application: ${error.message}`);
      }
      return false;
    }
  }
  
  /**
   * Clean up resources when the application is shutting down
   */
  cleanup() {
    // Unload loaded plugin first
    if (this.loadedPlugin) {
      try {
        this.loadedPlugin.unload();
      } catch (error) {
        console.error("Error unloading plugin during cleanup:", error);
      }
      this.loadedPlugin = null;
    }
    
    // Clean up rendering
    if (this.renderingManager) {
      this.renderingManager.cleanup();
      this.renderingManager = null;
    }
    
    // Clean up UI
    if (this.uiManager) {
      this.uiManager.cleanup();
      this.uiManager = null;
    }
    
    // Clean up color scheme manager
    if (this.colorSchemeManager) {
      this.colorSchemeManager.cleanup();
    }
    
    // Reset state
    this.previousPluginId = null;
    this.availablePlugins = [];
    this.initialized = false;
    this.isInitialStartup = true;
    
    console.log("Application cleaned up");
  }
}