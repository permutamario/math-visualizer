// src/ui/BaseLayout.js

import { EventEmitter } from '../core/EventEmitter.js';
import * as layoutUtils from './layoutUtils.js';

/**
 * Base layout class with common functionality for both desktop and mobile layouts
 */
export class BaseLayout extends EventEmitter {
  /**
   * Create a new BaseLayout
   * @param {UIManager} uiManager - Reference to the UI manager
   */
  constructor(uiManager) {
    super();
    this.uiManager = uiManager;
    this.builder = uiManager.uiBuilder;
    this.controls = { schema: null, values: {} };
    this.actions = [];
    this.plugins = [];
    this.activePluginId = null;
    this.initialized = false;
    this.loadingIndicator = null;
    
    // Bind common methods
    this.handleParameterChange = this.handleParameterChange.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
  }
  
  /**
   * Initialize the layout
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    this.initialized = true;
    // Add document click listener for menus
    document.addEventListener('click', this.handleOutsideClick);
    return true;
  }
  
  /**
   * Handle outside clicks to close menus
   * Must be implemented by subclasses
   * @param {Event} event - Click event
   */
  handleOutsideClick(event) {
    // To be implemented by subclasses
  }
  
  /**
   * Build UI controls from schema
   * @param {Object} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  buildControls(schema, values) {
    this.controls = {
      schema,
      values: { ...values }
    };
    // Subclasses should implement specific panel updates
  }
  
  /**
   * Update control values
   * @param {Object} values - New parameter values
   */
  updateControls(values) {
    // Update all controls with new values
    Object.entries(values).forEach(([id, value]) => {
      // Try both with and without -mobile suffix
      let element = document.getElementById(id);
      if (!element) {
        element = document.getElementById(`${id}-mobile`);
      }
      
      layoutUtils.updateControlValue(element, value);
    });
  }
  
  /**
   * Handle parameter change
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New value
   */
  handleParameterChange(parameterId, value) {
    // Update stored value
    this.controls.values[parameterId] = value;
    
    // Emit change event
    this.emit('parameterChange', parameterId, value);
  }
  
  /**
   * Update available actions
   * @param {Array<Object>} actions - Available actions
   */
  updateActions(actions) {
    // Store actions
    this.actions = [...actions];
    // Subclasses should implement specific updates
  }
  
  /**
   * Update available plugins
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePlugins(plugins, activePluginId) {
    // Store plugins and active ID
    this.plugins = [...plugins];
    this.activePluginId = activePluginId;
    // Subclasses should implement specific updates
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Default implementation does nothing
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.builder.createNotification(message, 5000);
  }
  
  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {number} duration - Duration in milliseconds
   */
  showNotification(message, duration = 3000) {
    this.builder.createNotification(message, duration);
  }
  
  /**
   * Show loading indicator
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    // Remove any existing loading indicator
    this.hideLoading();
    
    // Create and store the loading indicator
    this.loadingIndicator = this.builder.createLoadingIndicator(message);
    document.body.appendChild(this.loadingIndicator);
  }
  
  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.loadingIndicator && this.loadingIndicator.parentNode) {
      this.loadingIndicator.parentNode.removeChild(this.loadingIndicator);
      this.loadingIndicator = null;
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Remove document click listener
    document.removeEventListener('click', this.handleOutsideClick);
    
    // Remove any loading indicator
    this.hideLoading();
    
    // Reset state
    this.controls = { schema: null, values: {} };
    this.actions = [];
    this.plugins = [];
    this.activePluginId = null;
    this.initialized = false;
    
    // Subclasses should handle their specific cleanup
  }
}
