// src/ui/MobileLayout.js

import { BaseLayout } from './BaseLayout.js';
import * as layoutUtils from './layoutUtils.js';
import { SelectionWindow } from './SelectionWindow.js';

/**
 * Mobile UI layout
 */
export class MobileLayout extends BaseLayout {
  /**
   * Create a new MobileLayout
   * @param {UIManager} uiManager - Reference to the UI manager
   */
  constructor(uiManager) {
    super(uiManager);
    this.headerTitle = null;
    this.header = null;
    this.controlBar = null;
    this.optionsButton = null;
    this.exportButton = null;
    this.pluginButton = null;
    this.visualMenu = null;
    this.actionsMenu = null;
    this.selectionWindow = null;
    this.themeToggleButton = null;
    
    // Parameter groups storage
    this.parameterGroups = {
      visual: { schema: [], values: {} },
      structural: { schema: [], values: {} },
      advanced: { schema: [], values: {} }
    };
    
    // Bind methods
    this.toggleVisualMenu = this.toggleVisualMenu.bind(this);
    this.toggleActionsMenu = this.toggleActionsMenu.bind(this);
    this.openSelectionWindow = this.openSelectionWindow.bind(this);
  }
  
  /**
   * Initialize the mobile layout
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Call parent initialize first
      await super.initialize();
      
      // Add mobile-device class to body
      document.body.classList.add('mobile-device');
      
      // Create UI elements
      this.createUIElements();
      
      // Create fullscreen button
      this.createFullscreenButton();
      
      // Create theme toggle button
      this.createThemeToggleButton();
      
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
    
    // Create header with structural parameters (previously visualization)
    this.header = this.createHeader();
    document.body.appendChild(this.header);
    
    // Create control bar
    this.controlBar = this.createControlBar();
    document.body.appendChild(this.controlBar);
    
    // Create visual options menu (now for visual parameters, previously plugin)
    this.visualMenu = this.createVisualMenu();
    document.body.appendChild(this.visualMenu);
    
    // Create actions menu (previously export menu)
    this.actionsMenu = this.createActionsMenu();
    document.body.appendChild(this.actionsMenu);
    
    // Create selection window
    this.selectionWindow = new SelectionWindow(
      this.plugins,
      this.activePluginId,
      (pluginId) => this.emit('pluginSelect', pluginId),
      null
    );
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
    
    // Remove actions menu
    if (this.actionsMenu && this.actionsMenu.parentNode) {
      this.actionsMenu.parentNode.removeChild(this.actionsMenu);
    }
    
    // Dispose of selection window
    if (this.selectionWindow) {
      this.selectionWindow.dispose();
      this.selectionWindow = null;
    }
    
    // Remove theme toggle button
    if (this.themeToggleButton && this.themeToggleButton.parentNode) {
      this.themeToggleButton.parentNode.removeChild(this.themeToggleButton);
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
    
    // Apply background color
    headerTitle.style.backgroundColor = 'var(--control-bg)';
    headerTitle.style.color = 'var(--text-color)';
    
    return headerTitle;
  }
  
  /**
   * Create the header with structural parameters (previously visualization)
   * @returns {HTMLElement} Header element
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'mobile-header';
    
    // Apply background color
    header.style.backgroundColor = 'var(--control-bg)';
    header.style.color = 'var(--text-color)';
    
    // Placeholder for structural parameters - will be filled when schema is provided
    header.appendChild(layoutUtils.createPlaceholder('No structural parameters available.'));
    
    return header;
  }
  
  /**
   * Create the fullscreen button
   */
  createFullscreenButton() {
    const button = layoutUtils.createFullscreenButton(true, (isFullscreen) => {
      // Notify that fullscreen mode was toggled
      this.emit('action', 'toggle-fullscreen');
    });
    
    document.body.appendChild(button);
  }
  
  /**
   * Create the theme toggle button
   */
  createThemeToggleButton() {
    // Remove any existing button
    if (this.themeToggleButton && this.themeToggleButton.parentNode) {
      this.themeToggleButton.parentNode.removeChild(this.themeToggleButton);
    }
    
    // Create new button
    this.themeToggleButton = layoutUtils.createThemeToggleButton(this.uiManager.core, true);
    
    if (this.themeToggleButton) {
      document.body.appendChild(this.themeToggleButton);
    }
  }
  
  /**
   * Create the control bar with buttons
   * @returns {HTMLElement} Control bar element
   */
  createControlBar() {
    const controlBar = document.createElement('div');
    controlBar.className = 'mobile-control-bar';
    
    // Create options button for visual parameters
    this.optionsButton = document.createElement('button');
    this.optionsButton.id = 'mobile-options-button';
    this.optionsButton.textContent = 'Options';
    this.optionsButton.style.backgroundColor = 'var(--control-bg)';
    this.optionsButton.style.color = 'var(--text-color)';
    this.optionsButton.addEventListener('click', this.toggleVisualMenu);
    
    // Create plugin button
    this.pluginButton = document.createElement('div');
    this.pluginButton.id = 'mobile-plugin-button';
    this.pluginButton.style.backgroundColor = 'var(--control-bg)';
    
    const pluginIcon = document.createElement('div');
    pluginIcon.id = 'mobile-plugin-button-icon';
    pluginIcon.style.backgroundColor = 'var(--accent-color)';
    this.pluginButton.appendChild(pluginIcon);
    this.pluginButton.addEventListener('click', this.openSelectionWindow);
    
    // Create actions button (previously export button)
    this.exportButton = document.createElement('button');
    this.exportButton.id = 'mobile-export-button';
    this.exportButton.textContent = 'Actions';
    this.exportButton.style.backgroundColor = 'var(--control-bg)';
    this.exportButton.style.color = 'var(--text-color)';
    this.exportButton.addEventListener('click', this.toggleActionsMenu);
    
    // Add buttons to control bar
    controlBar.appendChild(this.optionsButton);
    controlBar.appendChild(this.pluginButton);
    controlBar.appendChild(this.exportButton);
    
    return controlBar;
  }
  
  /**
   * Create the visual options menu (previously plugin parameters)
   * @returns {HTMLElement} Visual options menu
   */
  createVisualMenu() {
    const menu = document.createElement('div');
    menu.id = 'mobile-visual-menu';
    menu.className = 'mobile-options-menu hidden';
    
    // Apply background color
    menu.style.backgroundColor = 'var(--control-bg)';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Visual Options';
    title.style.color = 'var(--text-color)';
    menu.appendChild(title);
    
    // Placeholder content - will be filled when schema is provided
    menu.appendChild(layoutUtils.createPlaceholder('No visual parameters available.'));
    
    return menu;
  }
  
  /**
   * Create the actions menu (previously export menu)
   * @returns {HTMLElement} Actions menu
   */
  createActionsMenu() {
    const menu = document.createElement('div');
    menu.id = 'mobile-export-menu';
    menu.className = 'mobile-options-menu hidden';
    
    // Apply background color
    menu.style.backgroundColor = 'var(--control-bg)';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Actions';
    title.style.color = 'var(--text-color)';
    menu.appendChild(title);
    
    // Placeholder content - will be filled when actions are provided
    menu.appendChild(layoutUtils.createPlaceholder('No actions available.'));
    
    return menu;
  }
  
  /**
   * Open the selection window
   * @param {Event} event - Click event
   */
  openSelectionWindow(event) {
    // Stop event propagation to prevent the event from immediately closing the window
    if (event) {
      event.stopPropagation();
    }
    
    // Close any open menus
    this.visualMenu.classList.add('hidden');
    this.actionsMenu.classList.add('hidden');
    
    if (this.selectionWindow) {
      // Update plugins and active ID before showing
      this.selectionWindow.update(this.plugins, this.activePluginId);
      this.selectionWindow.show();
    }
  }
  
  /**
   * Toggle the visual menu (visual parameters)
   * @param {Event} event - Click event
   */
  toggleVisualMenu(event) {
    event.stopPropagation();
    
    // Toggle visual menu
    this.visualMenu.classList.toggle('hidden');
    
    // Hide other menus if open
    if (!this.actionsMenu.classList.contains('hidden')) {
      this.actionsMenu.classList.add('hidden');
    }
  }
  
  /**
   * Toggle the actions menu
   * @param {Event} event - Click event
   */
  toggleActionsMenu(event) {
    event.stopPropagation();
    
    // Toggle actions menu
    this.actionsMenu.classList.toggle('hidden');
    
    // Hide other menus if open
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
    
    // Check if clicking outside actions menu
    if (!this.actionsMenu.classList.contains('hidden') &&
        !this.actionsMenu.contains(event.target) &&
        !this.exportButton.contains(event.target)) {
      this.actionsMenu.classList.add('hidden');
    }
  }
  
  /**
   * Update UI with parameter groups
   * @param {Object} parameterGroups - Parameter groups data
   * @param {boolean} rebuild - Whether to rebuild all controls
   */
  updateParameterGroups(parameterGroups, rebuild = false) {
    // Store parameter groups
    this.parameterGroups = parameterGroups;
    
    // Update header with structural parameters (previously visualization)
    this.updateHeaderControls(parameterGroups.structural.schema, parameterGroups.structural.values);
    
    // Update visual menu with visual parameters (previously plugin)
    this.updateVisualMenu(parameterGroups.visual.schema, parameterGroups.visual.values);
    
    // Update actions panel
    this.updateActionsMenu(this.actions);
    
    // For advanced parameters, if they exist we could add them to the visual menu or create a separate menu
    if (parameterGroups.advanced.schema && parameterGroups.advanced.schema.length > 0) {
      // For simplicity, add advanced params to the visual menu for now
      this.addAdvancedParamsToVisualMenu(parameterGroups.advanced.schema, parameterGroups.advanced.values);
    }
  }
  
  /**
   * Update a single parameter value
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New value
   * @param {string} group - Parameter group
   */
  updateParameterValue(parameterId, value, group) {
    // Update the value in the stored parameter groups
    if (group && this.parameterGroups[group]) {
      this.parameterGroups[group].values[parameterId] = value;
    }
    
    // Find the control element with possible group prefix
    let controlId = `${group}-${parameterId}`;
    
    // Try to find the element with group prefix first
    let element = document.getElementById(controlId);
    
    // If not found, try without prefix
    if (!element) {
      element = document.getElementById(parameterId);
    }
    
    // Update the control if found
    if (element) {
      layoutUtils.updateControlValue(element, value);
    }
  }
  
  /**
   * Update header with structural parameters (previously visualization)
   * @param {Array} schema - Parameter schema
   * @param {Object} values - Current values
   */
  updateHeaderControls(schema, values) {
    // Clear existing controls
    while (this.header.childNodes.length > 0) {
      this.header.removeChild(this.header.lastChild);
    }
    
    // Check if we have structural parameters
    if (!schema || schema.length === 0) {
      this.header.appendChild(layoutUtils.createPlaceholder('No structural parameters available.'));
      return;
    }
    
    // Create controls for each parameter
    schema.forEach(param => {
      const controlId = `structural-${param.id}`;
      const control = layoutUtils.createControl(
        this.builder,
        { ...param, id: controlId }, // Add group prefix to ID
        values[param.id],
        (value) => this.handleParameterChange(param.id, value, 'structural')
      );
      
      this.header.appendChild(control);
    });
  }
  
  /**
   * Update visual menu with visual parameters (previously plugin)
   * @param {Array} schema - Parameter schema
   * @param {Object} values - Current values
   */
  updateVisualMenu(schema, values) {
    // Clear existing controls (except the title)
    while (this.visualMenu.childNodes.length > 1) {
      this.visualMenu.removeChild(this.visualMenu.lastChild);
    }
    
    // Check if we have visual parameters
    if (!schema || schema.length === 0) {
      this.visualMenu.appendChild(layoutUtils.createPlaceholder('No visual parameters available.'));
      return;
    }
    
    // Create controls for each parameter
    schema.forEach(param => {
      const controlId = `visual-${param.id}`;
      const control = layoutUtils.createControl(
        this.builder,
        { ...param, id: controlId }, // Add group prefix to ID
        values[param.id],
        (value) => this.handleParameterChange(param.id, value, 'visual')
      );
      
      this.visualMenu.appendChild(control);
    });
  }
  
  /**
   * Add advanced parameters to the visual menu
   * @param {Array} schema - Parameter schema
   * @param {Object} values - Current values
   */
  addAdvancedParamsToVisualMenu(schema, values) {
    // Add a divider if there are already other controls
    if (this.visualMenu.childNodes.length > 1) {
      const divider = document.createElement('hr');
      divider.style.margin = '15px 0';
      divider.style.borderTop = '1px solid var(--border-color)';
      this.visualMenu.appendChild(divider);
      
      // Add advanced header
      const advancedHeader = document.createElement('h4');
      advancedHeader.textContent = 'Advanced Options';
      advancedHeader.style.color = 'var(--text-color)';
      advancedHeader.style.marginTop = '10px';
      this.visualMenu.appendChild(advancedHeader);
    }
    
    // Create controls for each advanced parameter
    schema.forEach(param => {
      const controlId = `advanced-${param.id}`;
      const control = layoutUtils.createControl(
        this.builder,
        { ...param, id: controlId }, // Add group prefix to ID
        values[param.id],
        (value) => this.handleParameterChange(param.id, value, 'advanced')
      );
      
      this.visualMenu.appendChild(control);
    });
  }
  
  /**
   * Update available actions
   * @param {Array<Object>} actions - Available actions
   */
  updateActions(actions) {
    // Call parent method to store actions
    super.updateActions(actions);
    
    // Update actions menu
    this.updateActionsMenu(actions);
  }
  
  /**
   * Update actions menu with actions
   * @param {Array<Object>} actions - Available actions
   */
  updateActionsMenu(actions) {
    // Clear existing controls (except the title)
    while (this.actionsMenu.childNodes.length > 1) {
      this.actionsMenu.removeChild(this.actionsMenu.lastChild);
    }
    
    // Check if we have actions
    if (!actions || actions.length === 0) {
      this.actionsMenu.appendChild(layoutUtils.createPlaceholder('No actions available.'));
      return;
    }
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'export-buttons';
    
    // Create buttons for each action
    actions.forEach(action => {
      const button = layoutUtils.createButton(
        `${action.id}-mobile`,
        action.label,
        () => {
          // Hide menu after action
          this.actionsMenu.classList.add('hidden');
          
          // Emit action event
          this.emit('action', action.id);
        }
      );
      
      buttonContainer.appendChild(button);
    });
    
    this.actionsMenu.appendChild(buttonContainer);
  }
  
  /**
   * Handle parameter changes
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New value
   * @param {string} group - Parameter group
   */
  handleParameterChange(parameterId, value, group) {
    // Update stored value
    if (group && this.parameterGroups[group]) {
      this.parameterGroups[group].values[parameterId] = value;
    }
    
    // Emit change event with group
    this.emit('parameterChange', parameterId, value, group);
  }
  
  /**
   * Update available plugins
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePlugins(plugins, activePluginId) {
    // Call parent method to store plugins and active ID
    super.updatePlugins(plugins, activePluginId);
    
    // Update selection window
    if (this.selectionWindow) {
      this.selectionWindow.update(plugins, activePluginId);
    }
    
    // Update header title with active plugin name
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
   * Clean up resources
   */
  dispose() {
    // Call parent dispose
    super.dispose();
    
    // Remove UI elements
    this.removeUIElements();
    
    // Remove fullscreen button
    const fullscreenButton = document.getElementById('mobile-fullscreen-button');
    if (fullscreenButton && fullscreenButton.parentNode) {
      fullscreenButton.parentNode.removeChild(fullscreenButton);
    }
    
    // Remove mobile-device class from body
    document.body.classList.remove('mobile-device');
    
    // Remove fullscreen mode if active
    document.body.classList.remove('fullscreen-mode');
    
    console.log("Mobile layout disposed");
  }
}