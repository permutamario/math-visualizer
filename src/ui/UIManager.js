// src/ui/UIManager.js

import { EventEmitter } from '../core/EventEmitter.js';
import { validateParameterSchema } from '../core/ParameterSchema.js';
import { UIBuilder } from './UIBuilder.js';
import { DesktopLayout } from './DesktopLayout.js';
import { MobileLayout } from './MobileLayout.js';

/**
 * Manages UI creation and event handling
 */
export class UIManager extends EventEmitter {
  /**
   * Create a new UIManager
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    super();
    this.core = core;
    this.uiBuilder = new UIBuilder();
    this.layout = null;
    this.controls = {};
    this.initialized = false;
    
    // Determine if using mobile layout
    this.isMobile = this._detectMobile();
  }
  
  /**
   * Initialize the UIManager
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Create appropriate layout
      if (this.isMobile) {
        this.layout = new MobileLayout(this);
      } else {
        this.layout = new DesktopLayout(this);
      }
      
      // Initialize the layout
      await this.layout.initialize();
      
      // Register layout event handlers
      this.layout.on('parameterChange', (parameterId, value) => {
        this.emit('parameterChange', parameterId, value);
      });
      
      this.layout.on('action', (actionId, ...args) => {
        this.emit('action', actionId, ...args);
      });
      
      this.layout.on('pluginSelect', (pluginId) => {
        this.emit('pluginSelect', pluginId);
      });
      
      // Listen for window resize
      window.addEventListener('resize', this._handleResize.bind(this));
      
      this.initialized = true;
      console.log(`UI manager initialized with ${this.isMobile ? 'mobile' : 'desktop'} layout`);
      return true;
    } catch (error) {
      console.error("Failed to initialize UI manager:", error);
      return false;
    }
  }
  
  /**
   * Build UI controls from parameter schema
   * @param {ParameterSchema} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  buildControlsFromSchema(schema, values) {
    try {
      // Validate schema
      validateParameterSchema(schema);
      
      // Build controls
      this.layout.buildControls(schema, values);
      
      // Store controls state
      this.controls = {
        schema,
        values: { ...values }
      };
      
      console.log("UI controls built from schema");
    } catch (error) {
      console.error("Failed to build controls from schema:", error);
    }
  }
  
  /**
   * Update control values
   * @param {Object} values - New parameter values
   */
  updateControls(values) {
    // Update stored values
    this.controls.values = { ...values };
    
    // Update layout controls
    this.layout.updateControls(values);
  }
  
  /**
   * Update available actions
   * @param {Array<Action>} actions - Available actions
   */
  updateActions(actions) {
    this.layout.updateActions(actions);
  }
  
  /**
   * Update available plugins
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePlugins(plugins, activePluginId) {
    this.layout.updatePlugins(plugins, activePluginId);
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.layout.showError(message);
  }
  
  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  showNotification(message, duration = 3000) {
    this.layout.showNotification(message, duration);
  }
  
  /**
   * Show loading indicator
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    this.layout.showLoading(message);
  }
  
  /**
   * Hide loading indicator
   */
  hideLoading() {
    this.layout.hideLoading();
  }
  
  /**
   * Detect if using mobile device
   * @returns {boolean} Whether using mobile device
   * @private
   */
  _detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth < 768;
  }
  
  /**
   * Handle window resize
   * @private
   */
  _handleResize() {
    // Check if layout should change
    const isMobileNow = this._detectMobile();
    
    if (isMobileNow !== this.isMobile) {
      // Layout needs to change
      this.isMobile = isMobileNow;
      
      // Clean up old layout
      if (this.layout) {
        this.layout.dispose();
      }
      
      // Create new layout
      if (this.isMobile) {
        this.layout = new MobileLayout(this);
      } else {
        this.layout = new DesktopLayout(this);
      }
      
      // Initialize new layout
      this.layout.initialize();
      
      // Register layout event handlers
      this.layout.on('parameterChange', (parameterId, value) => {
        this.emit('parameterChange', parameterId, value);
      });
      
      this.layout.on('action', (actionId, ...args) => {
        this.emit('action', actionId, ...args);
      });
      
      this.layout.on('pluginSelect', (pluginId) => {
        this.emit('pluginSelect', pluginId);
      });
      
      // Rebuild controls
      if (this.controls.schema) {
        this.layout.buildControls(this.controls.schema, this.controls.values);
      }
      
      console.log(`Layout changed to ${this.isMobile ? 'mobile' : 'desktop'}`);
    } else {
      // Just notify layout of resize
      this.layout.handleResize();
    }
  }
}
