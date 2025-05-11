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
    this.activePlugin = null;
    this.previousActivePlugin = null; // Store previous plugin for recovery
    this.initialized = false;
    
    // Bind methods
    this.activatePlugin = this.activatePlugin.bind(this);
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
      this.uiManager.on('pluginSelect', this.activatePlugin);
      
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
 * Activate a plugin by ID
 * @param {string} pluginId - ID of the plugin to activate
 * @returns {Promise<boolean>} Whether activation was successful
 */
async activatePlugin(pluginId) {
  try {
    // Store reference to previous active plugin for recovery if needed
    if (this.activePlugin && this.activePlugin.constructor.id !== pluginId) {
      this.previousActivePlugin = this.activePlugin;
    }
    
    // Check if plugin is already active
    if (this.activePlugin && this.activePlugin.constructor.id === pluginId) {
      console.log(`Plugin ${pluginId} is already active`);
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
      
      // Deactivate current plugin if any
      if (this.activePlugin) {
        try {
          await this.activePlugin.deactivate();
        } catch (deactivateError) {
          console.error(`Error deactivating previous plugin:`, deactivateError);
          // Continue with activating the new plugin even if deactivation failed
        }
      }
      
      // Setup appropriate rendering environment
      // This now fully disposes and recreates the environment
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
      
      // Activate the new plugin
      try {
        const success = await plugin.activate();
        
        if (success) {
          this.activePlugin = plugin;
          
          // Update UI with new plugin's parameters
          try {
            const paramSchema = plugin.getParameterSchema();
            this.uiManager.buildControlsFromSchema(paramSchema, plugin.parameters);
          } catch (uiError) {
            console.error(`Error building UI for plugin ${pluginId}:`, uiError);
            // Continue even if UI building has errors
          }
          
          // Update actions
          try {
            const actions = plugin.getActions();
            this.uiManager.updateActions(actions);
          } catch (actionsError) {
            console.error(`Error setting up actions for plugin ${pluginId}:`, actionsError);
            // Continue even if actions have errors
          }
          
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
          
          console.log(`Plugin ${pluginId} activated successfully`);
          this.uiManager.hideLoading();
          this.uiManager.showNotification(`${plugin.constructor.name} loaded successfully`);
        } else {
          this.uiManager.hideLoading();
          this.uiManager.showError(`Failed to activate plugin "${plugin.constructor.name}"`);
          console.error(`Failed to activate plugin ${pluginId}`);
          
          // Restore rendering if it was active
          if (wasRendering) {
            this.renderingManager.startRenderLoop();
          }
        }
        
        return success;
      } catch (activationError) {
        // Show detailed error message to user
        this.uiManager.hideLoading();
        this.uiManager.showError(`Error loading plugin "${plugin.constructor.name}": ${activationError.message}`);
        
        // Log detailed error
        console.error(`Error activating plugin ${pluginId}:`, activationError);
        
        // Restore rendering if it was active
        if (wasRendering) {
          this.renderingManager.startRenderLoop();
        }
        
        // If a previous plugin was active, try to reactivate it
        if (this.previousActivePlugin) {
          console.log(`Attempting to reactivate previous plugin ${this.previousActivePlugin.constructor.id}`);
          const previousId = this.previousActivePlugin.constructor.id;
          this.previousActivePlugin = null; // Prevent loop if reactivation fails
          return this.activatePlugin(previousId);
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
    
    console.error(`Error activating plugin ${pluginId}:`, error);
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
    if (!this.activePlugin) return;
    
    try {
      // Validate parameter value
      const validValue = this.parameterManager.validateParameterValue(
        parameterId, 
        value, 
        this.activePlugin.getParameterSchema()
      );
      
      // Update the plugin
      this.activePlugin.onParameterChanged(parameterId, validValue);
      
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
    if (!this.activePlugin) return false;
    
    try {
      // Handle app-level actions
      if (actionId === 'toggle-theme') {
        const currentScheme = this.colorSchemeManager.getActiveScheme();
        const newScheme = currentScheme.id === 'light' ? 'dark' : 'light';
        
        this.colorSchemeManager.setActiveScheme(newScheme);
        return true;
      }
      
      // Let the plugin handle the action
      return this.activePlugin.executeAction(actionId, ...args);
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
      this.uiManager.showError(`Error executing action "${actionId}": ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get the active plugin
   * @returns {Plugin|null} Active plugin instance or null if none
   */
  getActivePlugin() {
    return this.activePlugin;
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
      
      // Activate default plugin if configured
      const defaultPluginId = this.state.get('defaultPluginId') || 
                             this.pluginRegistry.getFirstPluginId();
      
      if (defaultPluginId) {
        return this.activatePlugin(defaultPluginId);
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
    
    // Deactivate active plugin
    if (this.activePlugin) {
      this.activePlugin.deactivate();
    }
    
    // Clean up UI
    if (this.uiManager) {
      this.uiManager.cleanup();
    }
    
    // Reset state
    this.activePlugin = null;
    this.previousActivePlugin = null;
    this.initialized = false;
    
    console.log("Application cleaned up");
  }
}
