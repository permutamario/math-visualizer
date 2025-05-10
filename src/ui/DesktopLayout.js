// src/ui/DesktopLayout.js - Modified version with plugin selector button

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
    
    // New plugin selector elements
    this.pluginSelectorButton = null;
    this.pluginList = null;
    
    // Bind methods
    this.handleParameterChange = this.handleParameterChange.bind(this);
    this.togglePluginList = this.togglePluginList.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
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
      
      // Create plugin selector button and list
      this.createPluginSelector();

      // Create fullscreen button
    this.createFullscreenButton();
    
      
      // Add document click listener for closing plugin list
      document.addEventListener('click', this.handleDocumentClick);
      
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
   * Create plugin selector button and list
   */
  createPluginSelector() {
    // Create plugin selector button
    this.pluginSelectorButton = document.createElement('div');
    this.pluginSelectorButton.className = 'plugin-selector-button';
    this.pluginSelectorButton.title = 'Visualization Selector';
    this.pluginSelectorButton.addEventListener('click', this.togglePluginList);
    
    // Add icon to button
    const icon = document.createElement('div');
    icon.className = 'plugin-selector-button-icon';
    this.pluginSelectorButton.appendChild(icon);
    
    // Add button to document
    document.body.appendChild(this.pluginSelectorButton);
    
    // Create plugin list
    this.pluginList = document.createElement('div');
    this.pluginList.className = 'plugin-list hidden';
    
    // Add header to list
    const header = document.createElement('div');
    header.className = 'plugin-list-header';
    
    const title = document.createElement('h3');
    title.className = 'plugin-list-title';
    title.textContent = 'Visualization Tools';
    
    header.appendChild(title);
    this.pluginList.appendChild(header);
    
    // Add container for list items
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'plugin-list-items';
    this.pluginList.appendChild(itemsContainer);
    
    // Add list to document
    document.body.appendChild(this.pluginList);
    
    // Update list with available plugins
    this.updatePluginList(this.plugins, null);
  }
  
  /**
   * Toggle plugin list visibility
   * @param {Event} event - Click event
   */
  togglePluginList(event) {
    event.stopPropagation();
    this.pluginList.classList.toggle('hidden');
  }
  
  /**
   * Handle document clicks to close plugin list
   * @param {Event} event - Click event
   */
  handleDocumentClick(event) {
    // Close plugin list if clicking outside
    if (!this.pluginList.classList.contains('hidden') &&
        !this.pluginList.contains(event.target) &&
        !this.pluginSelectorButton.contains(event.target)) {
      this.pluginList.classList.add('hidden');
    }
  }
  
  /**
   * Update plugin list with available plugins
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePluginList(plugins, activePluginId) {
    // Get list items container
    const itemsContainer = this.pluginList.querySelector('.plugin-list-items');
    
    // Clear existing items
    while (itemsContainer.firstChild) {
      itemsContainer.removeChild(itemsContainer.firstChild);
    }
    
    // Add item for each plugin
    plugins.forEach(plugin => {
      const item = document.createElement('div');
      item.className = 'plugin-list-item';
      if (plugin.id === activePluginId) {
        item.classList.add('active');
      }
      
      const itemTitle = document.createElement('h4');
      itemTitle.className = 'plugin-list-item-title';
      itemTitle.textContent = plugin.name;
      
      const itemDescription = document.createElement('p');
      itemDescription.className = 'plugin-list-item-description';
      itemDescription.textContent = plugin.description;
      
      item.appendChild(itemTitle);
      item.appendChild(itemDescription);
      
      // Add click handler
      item.addEventListener('click', () => {
        this.emit('pluginSelect', plugin.id);
        this.pluginList.classList.add('hidden');
      });
      
      itemsContainer.appendChild(item);
    });
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
 * Toggle fullscreen mode
 * @returns {boolean} New fullscreen state
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
    
    // Update plugin list
    this.updatePluginList(plugins, activePluginId);
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
    
    // Remove plugin selector
    if (this.pluginSelectorButton && this.pluginSelectorButton.parentNode) {
      this.pluginSelectorButton.parentNode.removeChild(this.pluginSelectorButton);
    }
    
    if (this.pluginList && this.pluginList.parentNode) {
      this.pluginList.parentNode.removeChild(this.pluginList);
    }
    
     // Remove fullscreen button
  if (this.fullscreenButton && this.fullscreenButton.parentNode) {
    this.fullscreenButton.parentNode.removeChild(this.fullscreenButton);
  
    // Remove document click listener
    document.removeEventListener('click', this.handleDocumentClick);
    
    // Remove any loading indicator
    this.hideLoading();
    
    // Reset state
    this.controls = {};
    this.actions = [];
    this.initialized = false;
    // Remove fullscreen mode if active
  document.body.classList.remove('fullscreen-mode');
  
    console.log("Desktop layout disposed");
  }
}
