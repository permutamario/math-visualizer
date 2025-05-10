// src/ui/MobileLayout.js

import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Mobile UI layout
 */
export class MobileLayout extends EventEmitter {
  /**
   * Create a new MobileLayout
   * @param {UIManager} uiManager - Reference to the UI manager
   */
  constructor(uiManager) {
    super();
    this.uiManager = uiManager;
    this.builder = uiManager.uiBuilder;
    this.header = null;
    this.optionsButton = null;
    this.exportButton = null;
    this.visualMenu = null;
    this.exportMenu = null;
    this.controls = {};
    this.actions = [];
    this.plugins = [];
    this.initialized = false;
    
    // Bind methods
    this.handleParameterChange = this.handleParameterChange.bind(this);
    this.toggleVisualMenu = this.toggleVisualMenu.bind(this);
    this.toggleExportMenu = this.toggleExportMenu.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
  }
  
  /**
   * Initialize the mobile layout
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Add mobile-device class to body
      document.body.classList.add('mobile-device');
      
      // Create UI elements
      this.createUIElements();
      
      // Add document click listener for closing menus
      document.addEventListener('click', this.handleOutsideClick);
      
      this.initialized = true;
      console.log("Mobile layout initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize mobile layout:", error);
      return false;
    }
  }
  
  /**
   * Create UI elements
   */
  createUIElements() {
    // Remove any existing elements
    this.removeUIElements();
    
    // Create header with structural controls
    this.header = this.createHeader();
    document.body.appendChild(this.header);
    
    // Create options button
    this.optionsButton = this.createOptionsButton();
    document.body.appendChild(this.optionsButton);
    
    // Create visual options menu
    this.visualMenu = this.createVisualMenu();
    document.body.appendChild(this.visualMenu);
    
    // Create export button
    this.exportButton = this.createExportButton();
    document.body.appendChild(this.exportButton);
    
    // Create export menu
    this.exportMenu = this.createExportMenu();
    document.body.appendChild(this.exportMenu);
  }
  
  /**
   * Remove existing UI elements
   */
  removeUIElements() {
    // Remove header
    if (this.header && this.header.parentNode) {
      this.header.parentNode.removeChild(this.header);
    }
    
    // Remove options button
    if (this.optionsButton && this.optionsButton.parentNode) {
      this.optionsButton.parentNode.removeChild(this.optionsButton);
    }
    
    // Remove visual menu
    if (this.visualMenu && this.visualMenu.parentNode) {
      this.visualMenu.parentNode.removeChild(this.visualMenu);
    }
    
    // Remove export button
    if (this.exportButton && this.exportButton.parentNode) {
      this.exportButton.parentNode.removeChild(this.exportButton);
    }
    
    // Remove export menu
    if (this.exportMenu && this.exportMenu.parentNode) {
      this.exportMenu.parentNode.removeChild(this.exportMenu);
    }
  }
  
  /**
   * Create the header with structural controls
   * @returns {HTMLElement} Header element
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'mobile-header';
    
    // Add plugin selector if we have plugins
    if (this.plugins.length > 0) {
      const selectContainer = document.createElement('div');
      selectContainer.className = 'control';
      
      const label = document.createElement('label');
      label.htmlFor = 'plugin-selector-mobile';
      label.textContent = 'Visualization:';
      
      const select = document.createElement('select');
      select.id = 'plugin-selector-mobile';
      
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
      header.appendChild(selectContainer);
    }
    
    // Placeholder for structural controls - will be filled when schema is provided
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No visualization selected.';
    placeholder.style.fontStyle = 'italic';
    placeholder.style.color = '#fff';
    placeholder.style.padding = '8px';
    placeholder.style.textAlign = 'center';
    header.appendChild(placeholder);
    
    return header;
  }
  
  /**
   * Create the options button
   * @returns {HTMLElement} Options button
   */
  createOptionsButton() {
    const button = document.createElement('button');
    button.id = 'mobile-options-button';
    button.textContent = 'Visual Options';
    
    button.addEventListener('click', this.toggleVisualMenu);
    
    return button;
  }
  
  /**
   * Create the visual options menu
   * @returns {HTMLElement} Visual options menu
   */
  createVisualMenu() {
    const menu = document.createElement('div');
    menu.id = 'mobile-visual-menu';
    menu.className = 'mobile-options-menu hidden';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Visual Options';
    menu.appendChild(title);
    
    // Placeholder content - will be filled when schema is provided
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No visual parameters available.';
    placeholder.style.fontStyle = 'italic';
    placeholder.style.color = '#666';
    menu.appendChild(placeholder);
    
    return menu;
  }
  
  /**
   * Create the export button
   * @returns {HTMLElement} Export button
   */
  createExportButton() {
    const button = document.createElement('button');
    button.id = 'mobile-export-button';
    button.textContent = 'Export';
    
    button.addEventListener('click', this.toggleExportMenu);
    
    return button;
  }
  
  /**
   * Create the export menu
   * @returns {HTMLElement} Export menu
   */
  createExportMenu() {
    const menu = document.createElement('div');
    menu.id = 'mobile-export-menu';
    menu.className = 'mobile-options-menu hidden';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Export Options';
    menu.appendChild(title);
    
    // Placeholder content - will be filled when actions are provided
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No export options available.';
    placeholder.style.fontStyle = 'italic';
    placeholder.style.color = '#666';
    menu.appendChild(placeholder);
    
    return menu;
  }
  
  /**
   * Toggle the visual menu
   * @param {Event} event - Click event
   */
  toggleVisualMenu(event) {
    event.stopPropagation();
    
    // Toggle visual menu
    this.visualMenu.classList.toggle('hidden');
    
    // Hide export menu if open
    if (!this.exportMenu.classList.contains('hidden')) {
      this.exportMenu.classList.add('hidden');
    }
  }
  
  /**
   * Toggle the export menu
   * @param {Event} event - Click event
   */
  toggleExportMenu(event) {
    event.stopPropagation();
    
    // Toggle export menu
    this.exportMenu.classList.toggle('hidden');
    
    // Hide visual menu if open
    if (!this.visualMenu.classList.contains('hidden')) {
      this.visualMenu.classList.add('hidden');
    }
  }
  
  /**
   * Handle clicks outside of menus
   * @param {Event} event - Click event
   */
  handleOutsideClick(event) {
    // Check if clicking outside visual menu
    if (!this.visualMenu.classList.contains('hidden') &&
        !this.visualMenu.contains(event.target) &&
        !this.optionsButton.contains(event.target)) {
      this.visualMenu.classList.add('hidden');
    }
    
    // Check if clicking outside export menu
    if (!this.exportMenu.classList.contains('hidden') &&
        !this.exportMenu.contains(event.target) &&
        !this.exportButton.contains(event.target)) {
      this.exportMenu.classList.add('hidden');
    }
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
    
    // Update header with structural controls
    this.updateHeaderControls(schema, values);
    
    // Update visual menu
    this.updateVisualMenu(schema, values);
  }
  
  /**
   * Update header with structural controls
   * @param {ParameterSchema} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  updateHeaderControls(schema, values) {
    // Clear existing controls (except the plugin selector)
    const pluginSelector = this.header.querySelector('.control');
    
    while (this.header.childNodes.length > 0) {
      this.header.removeChild(this.header.lastChild);
    }
    
    // Add back plugin selector if it exists
    if (pluginSelector) {
      this.header.appendChild(pluginSelector);
    }
    
    // Check if we have structural parameters
    if (!schema.structural || schema.structural.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No structural parameters available.';
      message.style.fontStyle = 'italic';
      message.style.color = '#fff';
      message.style.padding = '8px';
      message.style.textAlign = 'center';
      this.header.appendChild(message);
      return;
    }
    
    // Create controls for each parameter
    schema.structural.forEach(param => {
      const control = this.builder.createControl(
        param,
        values[param.id],
        (value) => this.handleParameterChange(param.id, value)
      );
      
      this.header.appendChild(control);
    });
  }
  
  /**
   * Update visual menu with controls
   * @param {ParameterSchema} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  updateVisualMenu(schema, values) {
    // Clear existing controls (except the title)
    while (this.visualMenu.childNodes.length > 1) {
      this.visualMenu.removeChild(this.visualMenu.lastChild);
    }
    
    // Check if we have visual parameters
    if (!schema.visual || schema.visual.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No visual parameters available.';
      message.style.fontStyle = 'italic';
      message.style.color = '#666';
      this.visualMenu.appendChild(message);
      return;
    }
    
    // Create controls for each parameter
    schema.visual.forEach(param => {
      const control = this.builder.createControl(
        param,
        values[param.id],
        (value) => this.handleParameterChange(param.id, value)
      );
      
      this.visualMenu.appendChild(control);
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
      // Try both with and without -mobile suffix
      let element = document.getElementById(id);
      if (!element) {
        element = document.getElementById(`${id}-mobile`);
      }
      
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
    
    // Update export menu
    this.updateExportMenu(actions);
  }
  
  /**
   * Update export menu with actions
   * @param {Array<Action>} actions - Available actions
   */
  updateExportMenu(actions) {
    // Clear existing controls (except the title)
    while (this.exportMenu.childNodes.length > 1) {
      this.exportMenu.removeChild(this.exportMenu.lastChild);
    }
    
    // Check if we have actions
    if (!actions || actions.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No export options available.';
      message.style.fontStyle = 'italic';
      message.style.color = '#666';
      this.exportMenu.appendChild(message);
      return;
    }
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'export-buttons';
    
    // Create buttons for each action
    actions.forEach(action => {
      const button = this.builder.createButton(
        `${action.id}-mobile`,
        action.label,
        () => {
          // Hide menu after action
          this.exportMenu.classList.add('hidden');
          
          // Emit action event
          this.emit('action', action.id);
        }
      );
      
      buttonContainer.appendChild(button);
    });
    
    this.exportMenu.appendChild(buttonContainer);
  }
  
  /**
   * Update available plugins
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePlugins(plugins, activePluginId) {
    // Store plugins
    this.plugins = [...plugins];
    
    // Recreate header with updated plugin list
    if (this.header && this.header.parentNode) {
      this.header.parentNode.removeChild(this.header);
    }
    
    this.header = this.createHeader();
    document.body.appendChild(this.header);
    
    // Update structural controls if we have a schema
    if (this.controls.schema) {
      this.updateHeaderControls(this.controls.schema, this.controls.values);
    }
    
    // Select the active plugin
    if (activePluginId) {
      const select = document.getElementById('plugin-selector-mobile');
      if (select) {
        select.value = activePluginId;
      }
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Nothing special needed for mobile layout
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
    // Remove UI elements
    this.removeUIElements();
    
    // Remove any loading indicator
    this.hideLoading();
    
    // Remove document click listener
    document.removeEventListener('click', this.handleOutsideClick);
    
    // Remove mobile-device class from body
    document.body.classList.remove('mobile-device');
    
    // Reset state
    this.controls = {};
    this.actions = [];
    this.initialized = false;
    
    console.log("Mobile layout disposed");
  }
}
