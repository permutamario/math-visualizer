// src/core/AppCore.js 

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
    this.renderingManager = new RenderingManager(this);
    this.uiManager = new UIManager(this);
    this.colorSchemeManager = new ColorSchemeManager(this);
    this.renderModeManager = new RenderModeManager(this);
    
    // Application state
    this.loadedPlugin = null;
    this.previousPluginId = null; // Store previous plugin ID for recovery
    this.availablePlugins = []; // Plugin metadata
    this.initialized = false;
    
    // Bind methods
    this.loadPlugin = this.loadPlugin.bind(this);
    this.handleParameterChange = this.handleParameterChange.bind(this);
    this.executeAction = this.executeAction.bind(this);
  }
  
  /**
   * Initialize the application
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      console.log("Initializing Math Visualization Framework...");
      
      // Initialize core components
      await this.colorSchemeManager.initialize(); // Initialize color schemes first
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
      standardParams.colorPalette = {
        id: 'colorPalette',
        type: 'dropdown',
        label: 'Color Palette',
        options: this.colorSchemeManager.getPaletteNames().map(name => ({
          value: name, 
          label: name
        })),
        default: 'default',
        category: 'visual'
      };
    }
    
    // Add 3D-specific parameters
    if (renderingType === '3d' && this.renderModeManager) {
      standardParams.renderMode = {
        id: 'renderMode',
        type: 'dropdown',
        label: 'Render Style',
        options: this.renderModeManager.getAvailableModes(),
        default: 'standard',
        category: 'visual'
      };
      
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
      
      try {
        // Show loading indicator
        this.uiManager.showLoading(`Loading ${pluginMetadata.name}...`);
        
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
          
          // Restore rendering if it was active
          if (wasRendering) {
            this.renderingManager.startRenderLoop();
          }
          
          this.uiManager.hideLoading();
          return false;
        }
        
        // Create new plugin instance
        const plugin = new pluginMetadata.PluginClass(this);
        
        // Load the plugin
        try {
          const success = await plugin.load();
          
          if (success) {
            this.loadedPlugin = plugin;
            
            // Update UI with currently active plugin
            this.uiManager.updatePlugins(this.availablePlugins, pluginId);
            
            // Update actions
            const actions = this.loadedPlugin.defineActions();
            this.uiManager.updateActions(actions);

            this.exposeDebugInfo(); //Expose to debugger.
            
            // Restore rendering if it was active
            if (wasRendering) {
              this.renderingManager.startRenderLoop();
            } else {
              // Force a single render to show the new plugin
              this.renderingManager.requestRender();
            }
            
            console.log(`Plugin ${pluginId} loaded successfully`);
            this.uiManager.hideLoading();
            this.uiManager.showNotification(`${pluginMetadata.name} loaded successfully`);
          } else {
            this.uiManager.hideLoading();
            this.uiManager.showError(`Failed to load plugin "${pluginMetadata.name}"`);
            console.error(`Failed to load plugin ${pluginId}`);
            
            // Restore rendering if it was active
            if (wasRendering) {
              this.renderingManager.startRenderLoop();
            }
          }
          
          return success;
        } catch (loadError) {
          // Show detailed error message to user
          this.uiManager.hideLoading();
          this.uiManager.showError(`Error loading plugin "${pluginMetadata.name}": ${loadError.message}`);
          
          // Log detailed error
          console.error(`Error loading plugin ${pluginId}:`, loadError);
          
          // Restore rendering if it was active
          if (wasRendering) {
            this.renderingManager.startRenderLoop();
          }
          
          // If a previous plugin was active, try to reload it
          if (this.previousPluginId) {
            console.log(`Attempting to reload previous plugin ${this.previousPluginId}`);
            const previousId = this.previousPluginId;
            this.previousPluginId = null; // Prevent loop if reloading fails
            return this.loadPlugin(previousId);
          }
          
          return false;
        }
      } finally {
        // Ensure loading indicator is hidden in all cases
        this.uiManager.hideLoading();
      }
    } catch (error) {
      // Show error message to user for any other errors
      this.uiManager.hideLoading();
      this.uiManager.showError(`Error loading plugin "${pluginId}": ${error.message}`);
      
      console.error(`Error loading plugin ${pluginId}:`, error);
      return false;
    }
  }
  
  /**
   * Toggle Fullscreen mode
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
   * Expose debug information
   * Makes the app, current plugin info, and parameters available in the console
   */
  exposeDebugInfo() {
    try {
      // Create debug object with core app reference
      window.__debugInfo = {
        app: this,
        currentPlugin: null,
        parameterSchema: null
      };
      
      // Add current plugin info if available
      if (this.loadedPlugin) {
        window.__debugInfo.currentPlugin = {
          id: this.loadedPlugin.constructor.id,
          name: this.loadedPlugin.constructor.name,
          parameters: this.loadedPlugin.parameters,
          instance: this.loadedPlugin
        };
        
        // Add parameter schema
        window.__debugInfo.parameterSchema = this.loadedPlugin.defineParameters().build();
      }
      
      console.log('Debug info exposed. Access via window.__debugInfo');
      return window.__debugInfo;
    } catch (error) {
      console.error('Error exposing debug info:', error);
      return null;
    }
  }
  
  /**
   * Handle parameter changes from UI
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value
   */
  handleParameterChange(parameterId, value) {
    if (!this.loadedPlugin) return;
    
    try {
      // Update parameter value and notify the plugin
      this.loadedPlugin.onParameterChanged(parameterId, value);
      
      // Request render
      this.renderingManager.requestRender();
    } catch (error) {
      console.error(`Error handling parameter change for ${parameterId}:`, error);
      this.uiManager.showError(`Error updating parameter "${parameterId}": ${error.message}`);
    }
  }
  
  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    if (!this.loadedPlugin) return false;
    
    try {
      // Handle app-level actions
      if (actionId === 'toggle-theme') {
        const currentScheme = this.colorSchemeManager.getActiveScheme();
        const newScheme = currentScheme.id === 'light' ? 'dark' : 'light';
        
        this.colorSchemeManager.setActiveScheme(newScheme);
        return true;
      }
      
      // Let the plugin handle the action
      return this.loadedPlugin.executeAction(actionId, ...args);
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
      this.uiManager.showError(`Error executing action "${actionId}": ${error.message}`);
      return false;
    }
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
      
      // Load default plugin if configured
      const defaultPluginId = this.state.get('defaultPluginId') || 
                              getFirstPluginId(this.availablePlugins);
      
      if (defaultPluginId) {
        return this.loadPlugin(defaultPluginId);
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
    // Clean up rendering
    if (this.renderingManager) {
      this.renderingManager.cleanup();
    }
    
    // Unload loaded plugin
    if (this.loadedPlugin) {
      this.loadedPlugin.unload();
    }
    
    // Clean up UI
    if (this.uiManager) {
      this.uiManager.cleanup();
    }
    
    // Reset state
    this.loadedPlugin = null;
    this.previousPluginId = null;
    this.availablePlugins = [];
    this.initialized = false;
    
    console.log("Application cleaned up");
  }
}