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
    this.headerTitle = null;
    this.header = null;
    this.controlBar = null;
    this.optionsButton = null;
    this.exportButton = null;
    this.pluginButton = null;
    this.visualMenu = null;
    this.exportMenu = null;
    this.pluginMenu = null;
    this.controls = {};
    this.actions = [];
    this.plugins = [];
    this.initialized = false;
    
    // Bind methods
    this.handleParameterChange = this.handleParameterChange.bind(this);
    this.toggleVisualMenu = this.toggleVisualMenu.bind(this);
    this.toggleExportMenu = this.toggleExportMenu.bind(this);
    this.togglePluginMenu = this.togglePluginMenu.bind(this);
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

      // Create fullscreen button
    this.createFullscreenButton();
      
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
    
    // Create header title
    this.headerTitle = this.createHeaderTitle();
    document.body.appendChild(this.headerTitle);
    
    // Create header with structural controls
    this.header = this.createHeader();
    document.body.appendChild(this.header);
    
    // Create control bar
    this.controlBar = this.createControlBar();
    document.body.appendChild(this.controlBar);
    
    // Create visual options menu
    this.visualMenu = this.createVisualMenu();
    document.body.appendChild(this.visualMenu);
    
    // Create export menu
    this.exportMenu = this.createExportMenu();
    document.body.appendChild(this.exportMenu);
    
    // Create plugin menu
    this.pluginMenu = this.createPluginMenu();
    document.body.appendChild(this.pluginMenu);
  }
  
  /**
   * Remove existing UI elements
   */
  removeUIElements() {
    // Remove header title
    if (this.headerTitle && this.headerTitle.parentNode) {
      this.headerTitle.parentNode.removeChild(this.headerTitle);
    }
    
    // Remove header
    if (this.header && this.header.parentNode) {
      this.header.parentNode.removeChild(this.header);
    }
    
    // Remove control bar
    if (this.controlBar && this.controlBar.parentNode) {
      this.controlBar.parentNode.removeChild(this.controlBar);
    }
    
    // Remove visual menu
    if (this.visualMenu && this.visualMenu.parentNode) {
      this.visualMenu.parentNode.removeChild(this.visualMenu);
    }
    
    // Remove export menu
    if (this.exportMenu && this.exportMenu.parentNode) {
      this.exportMenu.parentNode.removeChild(this.exportMenu);
    }
    
    // Remove plugin menu
    if (this.pluginMenu && this.pluginMenu.parentNode) {
      this.pluginMenu.parentNode.removeChild(this.pluginMenu);
    }
  }
  
  /**
   * Create the header title
   * @returns {HTMLElement} Header title element
   */
  createHeaderTitle() {
    const headerTitle = document.createElement('div');
    headerTitle.className = 'mobile-header-title';
    
    // Get active plugin name if available
    const activePlugin = this.plugins.find(p => p.id === this.activePluginId) || this.plugins[0];
    headerTitle.textContent = activePlugin ? activePlugin.name : 'Visualization';
    
    return headerTitle;
  }
  
  /**
   * Create the header with structural controls
   * @returns {HTMLElement} Header element
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'mobile-header';
    
    // Placeholder for structural controls - will be filled when schema is provided
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No structural parameters available.';
    placeholder.style.fontStyle = 'italic';
    placeholder.style.color = '#fff';
    placeholder.style.padding = '8px';
    placeholder.style.textAlign = 'center';
    header.appendChild(placeholder);
    
    return header;
  }

  /**
 * Create the fullscreen button
 */
createFullscreenButton() {
  const button = document.createElement('button');
  button.id = 'mobile-fullscreen-button';
  button.className = 'mobile-fullscreen-button';
  button.innerHTML = '<span class="fullscreen-icon">⛶</span>';
  button.title = 'Toggle Fullscreen Mode';
  
  // Handle click
  button.addEventListener('click', () => {
    document.body.classList.toggle('fullscreen-mode');
    
    // Update button position and appearance based on state
    if (document.body.classList.contains('fullscreen-mode')) {
      button.classList.add('fullscreen-active');
      button.innerHTML = '<span class="fullscreen-icon">⤢</span>';
      button.title = 'Exit Fullscreen Mode';
    } else {
      button.classList.remove('fullscreen-active');
      button.innerHTML = '<span class="fullscreen-icon">⛶</span>';
      button.title = 'Enter Fullscreen Mode';
    }
    
    // Emit action event
    this.emit('action', 'toggle-fullscreen');
  });
  
  document.body.appendChild(button);
  this.fullscreenButton = button;
}
  
  /**
   * Create the control bar with buttons
   * @returns {HTMLElement} Control bar element
   */
  createControlBar() {
    const controlBar = document.createElement('div');
    controlBar.className = 'mobile-control-bar';
    
    // Create options button
    this.optionsButton = document.createElement('button');
    this.optionsButton.id = 'mobile-options-button';
    this.optionsButton.textContent = 'Options';
    this.optionsButton.addEventListener('click', this.toggleVisualMenu);
    
    // Create plugin button
    this.pluginButton = document.createElement('div');
    this.pluginButton.id = 'mobile-plugin-button';
    
    const pluginIcon = document.createElement('div');
    pluginIcon.id = 'mobile-plugin-button-icon';
    this.pluginButton.appendChild(pluginIcon);
    this.pluginButton.addEventListener('click', this.togglePluginMenu);
    
    // Create export button
    this.exportButton = document.createElement('button');
    this.exportButton.id = 'mobile-export-button';
    this.exportButton.textContent = 'Export';
    this.exportButton.addEventListener('click', this.toggleExportMenu);
    
    // Add buttons to control bar
    controlBar.appendChild(this.optionsButton);
    controlBar.appendChild(this.pluginButton);
    controlBar.appendChild(this.exportButton);
    
    return controlBar;
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
   * Create the plugin menu
   * @returns {HTMLElement} Plugin menu element
   */
  createPluginMenu() {
    const menu = document.createElement('div');
    menu.id = 'mobile-plugin-menu';
    menu.className = 'mobile-options-menu hidden';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Visualization Types';
    menu.appendChild(title);
    
    // Container for plugin items
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'plugin-items-container';
    menu.appendChild(itemsContainer);
    
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
    
    // Hide other menus if open
    if (!this.exportMenu.classList.contains('hidden')) {
      this.exportMenu.classList.add('hidden');
    }
    
    if (!this.pluginMenu.classList.contains('hidden')) {
      this.pluginMenu.classList.add('hidden');
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
    
    // Hide other menus if open
    if (!this.visualMenu.classList.contains('hidden')) {
      this.visualMenu.classList.add('hidden');
    }
    
    if (!this.pluginMenu.classList.contains('hidden')) {
      this.pluginMenu.classList.add('hidden');
    }
  }
  
  /**
   * Toggle the plugin menu
   * @param {Event} event - Click event
   */
  togglePluginMenu(event) {
    event.stopPropagation();
    
    // Toggle plugin menu
    this.pluginMenu.classList.toggle('hidden');
    
    // Hide other menus if open
    if (!this.visualMenu.classList.contains('hidden')) {
      this.visualMenu.classList.add('hidden');
    }
    
    if (!this.exportMenu.classList.contains('hidden')) {
      this.exportMenu.classList.add('hidden');
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
    
    // Check if clicking outside plugin menu
    if (!this.pluginMenu.classList.contains('hidden') &&
        !this.pluginMenu.contains(event.target) &&
        !this.pluginButton.contains(event.target)) {
      this.pluginMenu.classList.add('hidden');
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
    // Clear existing controls
    while (this.header.childNodes.length > 0) {
      this.header.removeChild(this.header.lastChild);
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
    // Store plugins and active ID
    this.plugins = [...plugins];
    this.activePluginId = activePluginId;
    
    // Update plugin menu
    this.updatePluginMenu(plugins, activePluginId);
    
    // Update header title
    this.updateHeaderTitle(activePluginId);
  }
  
  /**
   * Update header title with active plugin name
   * @param {string} activePluginId - Currently active plugin ID
   */
  updateHeaderTitle(activePluginId) {
    const activePlugin = this.plugins.find(p => p.id === activePluginId);
    if (activePlugin && this.headerTitle) {
      this.headerTitle.textContent = activePlugin.name;
    }
  }
  
  /**
   * Update plugin menu with available plugins
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePluginMenu(plugins, activePluginId) {
    // Get items container
    const itemsContainer = this.pluginMenu.querySelector('.plugin-items-container');
    
    // Clear existing items
    while (itemsContainer.childNodes.length > 0) {
      itemsContainer.removeChild(itemsContainer.lastChild);
    }
    
    // Check if we have plugins
    if (!plugins || plugins.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No visualizations available.';
      message.style.fontStyle = 'italic';
      message.style.color = '#666';
      message.style.padding = '10px 16px';
      itemsContainer.appendChild(message);
      return;
    }
    
    // Create items for each plugin
    plugins.forEach(plugin => {
      const item = document.createElement('div');
      item.className = 'plugin-list-item';
      if (plugin.id === activePluginId) {
        item.classList.add('active');
      }
      
      const title = document.createElement('div');
      title.className = 'plugin-list-item-title';
      title.textContent = plugin.name;
      
      const description = document.createElement('div');
      description.className = 'plugin-list-item-description';
      description.textContent = plugin.description;
      
      item.appendChild(title);
      item.appendChild(description);
      
      // Add click handler
      item.addEventListener('click', () => {
        this.emit('pluginSelect', plugin.id);
        this.pluginMenu.classList.add('hidden');
      });
      
      itemsContainer.appendChild(item);
    });
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

    // Remove fullscreen button
  if (this.fullscreenButton && this.fullscreenButton.parentNode) {
    this.fullscreenButton.parentNode.removeChild(this.fullscreenButton);
  }

  // Remove fullscreen mode if active
  document.body.classList.remove('fullscreen-mode');
    
    // Remove document click listener
    document.removeEventListener('click', this.handleOutsideClick);
    
    // Remove mobile-device class from body
    document.body.classList.remove('mobile-device');
    
    // Reset state
    this.controls = {};
    this.actions = [];
    this.plugins = [];
    this.activePluginId = null;
    this.initialized = false;
    
    console.log("Mobile layout disposed");
  }
}
