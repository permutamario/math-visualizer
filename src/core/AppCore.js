// src/core/AppCore.js 

import { PluginRegistry } from './PluginRegistry.js';
import { UIManager } from '../ui/UIManager.js';
import { RenderingManager } from '../rendering/RenderingManager.js';
import { ParameterManager } from './ParameterManager.js';
import { StateManager } from './StateManager.js';
import { EventEmitter } from './EventEmitter.js';
import { ColorSchemeManager } from './ColorSchemeManager.js';

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
    this.pluginRegistry = new PluginRegistry(this);
    this.parameterManager = new ParameterManager(this);
    this.renderingManager = new RenderingManager(this);
    this.uiManager = new UIManager(this);
    this.colorSchemeManager = new ColorSchemeManager(this);
    
    // Application state
    this.loadedPlugin = null;
    this.previousPluginId = null; // Store previous plugin ID for recovery
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
      await this.pluginRegistry.initialize();
      await this.uiManager.initialize();
      
      // Register event handlers
      this.uiManager.on('parameterChange', this.handleParameterChange);
      this.uiManager.on('action', this.executeAction);
      this.uiManager.on('pluginSelect', this.loadPlugin);
      
      // Update UI with available plugins
      const pluginMetadata = this.pluginRegistry.getPluginMetadata();
      this.uiManager.updatePlugins(pluginMetadata, null);
      
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
      
      // Get the plugin instance
      const plugin = this.pluginRegistry.getPlugin(pluginId);
      
      if (!plugin) {
        // Show error notification
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
        this.uiManager.showLoading(`Loading ${plugin.constructor.name}...`);
        
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
          await this.renderingManager.setEnvironment(plugin.constructor.renderingType);
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
        
        // Load the new plugin
        try {
          const success = await plugin.load();
          
          if (success) {
            this.loadedPlugin = plugin;
            
            // Update UI with currently active plugin
            try {
              const pluginMetadata = this.pluginRegistry.getPluginMetadata();
              this.uiManager.updatePlugins(pluginMetadata, pluginId);
            } catch (pluginsError) {
              console.error(`Error updating plugin UI:`, pluginsError);
              // Continue even if plugin UI update has errors
            }
            
            // Restore rendering if it was active
            if (wasRendering) {
              this.renderingManager.startRenderLoop();
            } else {
              // Force a single render to show the new plugin
              this.renderingManager.requestRender();
            }
            
            console.log(`Plugin ${pluginId} loaded successfully`);
            this.uiManager.hideLoading();
            this.uiManager.showNotification(`${plugin.constructor.name} loaded successfully`);
          } else {
            this.uiManager.hideLoading();
            this.uiManager.showError(`Failed to load plugin "${plugin.constructor.name}"`);
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
          this.uiManager.showError(`Error loading plugin "${plugin.constructor.name}": ${loadError.message}`);
          
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
   * Toggles Fullscreen mode
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
   */
  handleParameterChange(parameterId, value) {
    if (!this.loadedPlugin) return;
    
    try {
      // Validate parameter value
      const validValue = this.parameterManager.validateParameterValue(
        parameterId, 
        value, 
        this.loadedPlugin.getParameterSchema()
      );
      
      // Update the plugin
      this.loadedPlugin.onParameterChanged(parameterId, validValue);
      
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
   * Get the loaded plugin
   * @returns {Plugin|null} Loaded plugin instance or null if none
   */
  getLoadedPlugin() {
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
                              this.pluginRegistry.getFirstPluginId();
      
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
    this.initialized = false;
    
    console.log("Application cleaned up");
  }
}
