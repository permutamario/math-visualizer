// src/ui/DesktopLayout.js

import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Desktop UI layout
 */
export class DesktopLayout extends EventEmitter {
  /**
   * Create a new DesktopLayout
   * @param {UIManager} uiManager - Reference to the UI manager
   */
  constructor(uiManager) {
    super();
    this.uiManager = uiManager;
    this.builder = uiManager.uiBuilder;
    this.panels = {};
    this.controls = {};
    this.actions = [];
    this.plugins = [];
    this.initialized = false;
    
    // Bind methods
    this.handleParameterChange = this.handleParameterChange.bind(this);
  }
  
  /**
   * Initialize the desktop layout
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Create UI panels
      this.createPanels();
      
      this.initialized = true;
      console.log("Desktop layout initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize desktop layout:", error);
      return false;
    }
  }
  
  /**
   * Create UI panels
   */
  createPanels() {
    // Remove any existing panels
    this.removePanels();
    
    // Create plugin selector panel
    this.panels.pluginSelector = this.createPluginSelectorPanel();
    document.body.appendChild(this.panels.pluginSelector);
    
    // Create structural parameters panel
    this.panels.structural = this.createStructuralPanel();
    document.body.appendChild(this.panels.structural);
    
    // Create visual parameters panel
    this.panels.visual = this.createVisualPanel();
    document.body.appendChild(this.panels.visual);
    
    // Create export panel
    this.panels.export = this.createExportPanel();
    document.body.appendChild(this.panels.export);
  }
  
  /**
   * Remove existing panels
   */
  removePanels() {
    // Remove existing panels
    Object.values(this.panels).forEach(panel => {
      if (panel && panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
    });
    
    // Reset panels object
    this.panels = {};
  }
  
  /**
   * Create the plugin selector panel
   * @returns {HTMLElement} Plugin selector panel
   */
  createPluginSelectorPanel() {
    const panel = document.createElement('div');
    panel.id = 'plugin-selector-panel';
    panel.className = 'vis-selector-panel';
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Visualization Type';
    panel.appendChild(title);
    
    // Create dropdown if we have plugins
    if (this.plugins.length > 0) {
      const selectContainer = document.createElement('div');
      selectContainer.className = 'control';
      
      const label = document.createElement('label');
      label.htmlFor = 'plugin-selector';
      label.textContent = 'Select Visualization:';
      
      const select = document.createElement('select');
      select.id = 'plugin-selector';
      
      // Add plugin options
      this.plugins.forEach(plugin => {
        const option = document.createElement('option');
        option.value = plugin.id;
        option.textContent = plugin.name;
        select.appendChild(option);
      });
      
      // Handle change events
      select.addEventListener('change', (e) => {
        const pluginId = e.target.value;
        this.emit('pluginSelect', pluginId);
      });
      
      selectContainer.appendChild(label);
      selectContainer.appendChild(select);
      panel.appendChild(selectContainer);
    } else {
      // No plugins message
      const message = document.createElement('p');
      message.textContent = 'No visualizations available.';
      message.style.fontStyle = 'italic';
      message.style.color = '#666';
      panel.appendChild(message);
    }
    
    return panel;
  }
  
  /**
   * Create the structural parameters panel
   * @returns {HTMLElement} Structural parameters panel
   */
  createStructuralPanel() {
    const panel = document.createElement('div');
    panel.id = 'structural-panel';
    panel.className = 'control-panel';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Structural Parameters';
    panel.appendChild(title);
    
    // Placeholder content - will be filled when schema is provided
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No visualization selected.';
    placeholder.style.fontStyle = 'italic';
    placeholder.style.color = '#666';
    panel.appendChild(placeholder);
    
    return panel;
  }
  
  /**
   * Create the visual parameters panel
   * @returns {HTMLElement} Visual parameters panel
   */
  createVisualPanel() {
    const panel = document.createElement('div');
    panel.id = 'visual-panel';
    panel.className = 'control-panel';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Visual Parameters';
    panel.appendChild(title);
    
    // Placeholder content - will be filled when schema is provided
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No visualization selected.';
    placeholder.style.fontStyle = 'italic';
    placeholder.style.color = '#666';
    panel.appendChild(placeholder);
    
    return panel;
  }
  
  /**
   * Create the export panel
   * @returns {HTMLElement} Export panel
   */
  createExportPanel() {
    const panel = document.createElement('div');
    panel.id = 'export-panel';
    panel.className = 'control-panel';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Export Options';
    panel.appendChild(title);
    
    // Placeholder content - will be filled when actions are provided
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No export options available.';
    placeholder.style.fontStyle = 'italic';
    placeholder.style.color = '#666';
    panel.appendChild(placeholder);
    
    return panel;
  }
  
  /**
   * Build UI controls from schema
   * @param {ParameterSchema} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  buildControls(schema, values) {
    // Store controls and their values
    this.controls = {
      schema,
      values: { ...values }
    };
    
    // Update structural panel
    this.updateStructuralPanel(schema, values);
    
    // Update visual panel
    this.updateVisualPanel(schema, values);
  }
  
  /**
   * Update structural panel with controls
   * @param {ParameterSchema} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  updateStructuralPanel(schema, values) {
    const panel = this.panels.structural;
    
    // Clear existing controls (except the title)
    while (panel.childNodes.length > 1) {
      panel.removeChild(panel.lastChild);
    }
    
    // Check if we have structural parameters
    if (!schema.structural || schema.structural.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No structural parameters available.';
      message.style.fontStyle = 'italic';
      message.style.color = '#666';
      panel.appendChild(message);
      return;
    }
    
    // Create controls for each parameter
    schema.structural.forEach(param => {
      const control = this.builder.createControl(
        param,
        values[param.id],
        (value) => this.handleParameterChange(param.id, value)
      );
      
      panel.appendChild(control);
    });
  }
  
  /**
   * Update visual panel with controls
   * @param {ParameterSchema} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  updateVisualPanel(schema, values) {
    const panel = this.panels.visual;
    
    // Clear existing controls (except the title)
    while (panel.childNodes.length > 1) {
      panel.removeChild(panel.lastChild);
    }
    
    // Check if we have visual parameters
    if (!schema.visual || schema.visual.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No visual parameters available.';
      message.style.fontStyle = 'italic';
      message.style.color = '#666';
      panel.appendChild(message);
      return;
    }
    
    // Create controls for each parameter
    schema.visual.forEach(param => {
      const control = this.builder.createControl(
        param,
        values[param.id],
        (value) => this.handleParameterChange(param.id, value)
      );
      
      panel.appendChild(control);
    });
  }
  
  /**
   * Update control values
   * @param {Object} values - New parameter values
   */
  updateControls(values) {
    // Update stored values
    this.controls.values = { ...values };
    
    // Update control elements
    this.updateControlElements(values);
  }
  
  /**
   * Update control elements with new values
   * @param {Object} values - New parameter values
   */
  updateControlElements(values) {
    // Update each control element
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (!element) return;
      
      // Update based on element type
      switch (element.type) {
        case 'range':
        case 'number':
        case 'text':
          element.value = value;
          
          // Update value display for sliders
          if (element.type === 'range') {
            const valueDisplay = element.parentElement.querySelector('.value-display');
            if (valueDisplay) {
              valueDisplay.textContent = value;
            }
          }
          break;
          
        case 'checkbox':
          element.checked = value;
          break;
          
        case 'color':
          element.value = value;
          break;
          
        case 'select-one':
          element.value = value;
          break;
      }
    });
  }
  
  /**
   * Update available actions
   * @param {Array<Action>} actions - Available actions
   */
  updateActions(actions) {
    // Store actions
    this.actions = [...actions];
    
    // Update export panel
    this.updateExportPanel(actions);
  }
  
  /**
   * Update export panel with actions
   * @param {Array<Action>} actions - Available actions
   */
  updateExportPanel(actions) {
    const panel = this.panels.export;
    
    // Clear existing controls (except the title)
    while (panel.childNodes.length > 1) {
      panel.removeChild(panel.lastChild);
    }
    
    // Check if we have actions
    if (!actions || actions.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No export options available.';
      message.style.fontStyle = 'italic';
      message.style.color = '#666';
      panel.appendChild(message);
      return;
    }
    
    // Create buttons for each action
    actions.forEach(action => {
      const button = this.builder.createButton(
        action.id,
        action.label,
        () => this.emit('action', action.id)
      );
      
      panel.appendChild(button);
    });
  }
  
  /**
   * Update available plugins
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePlugins(plugins, activePluginId) {
    // Store plugins
    this.plugins = [...plugins];
    
    // Update plugin selector panel
    this.updatePluginSelectorPanel(plugins, activePluginId);
  }
  
  /**
   * Update plugin selector panel
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePluginSelectorPanel(plugins, activePluginId) {
    // Recreate the panel
    if (this.panels.pluginSelector && this.panels.pluginSelector.parentNode) {
      this.panels.pluginSelector.parentNode.removeChild(this.panels.pluginSelector);
    }
    
    this.panels.pluginSelector = this.createPluginSelectorPanel();
    document.body.appendChild(this.panels.pluginSelector);
    
    // Select the active plugin
    if (activePluginId) {
      const select = document.getElementById('plugin-selector');
      if (select) {
        select.value = activePluginId;
      }
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Nothing special needed for desktop layout
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
    // Remove panels
    this.removePanels();
    
    // Remove any loading indicator
    this.hideLoading();
    
    // Reset state
    this.controls = {};
    this.actions = [];
    this.initialized = false;
    
    console.log("Desktop layout disposed");
  }
}
