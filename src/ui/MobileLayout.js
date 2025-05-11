// src/ui/MobileLayout.js

import { BaseLayout } from './BaseLayout.js';
import * as layoutUtils from './layoutUtils.js';

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
    this.exportMenu = null;
    this.pluginMenu = null;
    this.themeToggleButton = null;
    
    // Bind methods
    this.toggleVisualMenu = this.toggleVisualMenu.bind(this);
    this.toggleExportMenu = this.toggleExportMenu.bind(this);
    this.togglePluginMenu = this.togglePluginMenu.bind(this);
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
   * Create the header with structural controls
   * @returns {HTMLElement} Header element
   */
  createHeader() {
    const header = document.createElement('div');
    header.className = 'mobile-header';
    
    // Apply background color
    header.style.backgroundColor = 'var(--control-bg)';
    header.style.color = 'var(--text-color)';
    
    // Placeholder for structural controls - will be filled when schema is provided
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
    
    // Create options button
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
    this.pluginButton.addEventListener('click', this.togglePluginMenu);
    
    // Create export button
    this.exportButton = document.createElement('button');
    this.exportButton.id = 'mobile-export-button';
    this.exportButton.textContent = 'Export';
    this.exportButton.style.backgroundColor = 'var(--control-bg)';
    this.exportButton.style.color = 'var(--text-color)';
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
   * Create the export menu
   * @returns {HTMLElement} Export menu
   */
  createExportMenu() {
    const menu = document.createElement('div');
    menu.id = 'mobile-export-menu';
    menu.className = 'mobile-options-menu hidden';
    
    // Apply background color
    menu.style.backgroundColor = 'var(--control-bg)';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Export Options';
    title.style.color = 'var(--text-color)';
    menu.appendChild(title);
    
    // Placeholder content - will be filled when actions are provided
    menu.appendChild(layoutUtils.createPlaceholder('No export options available.'));
    
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
    
    // Apply background color
    menu.style.backgroundColor = 'var(--control-bg)';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Visualization Types';
    title.style.color = 'var(--text-color)';
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
   * @param {Object} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  buildControls(schema, values) {
    // Call parent method to store controls and values
    super.buildControls(schema, values);
    
    // Update header with structural controls
    this.updateHeaderControls(schema, values);
    
    // Update visual menu
    this.updateVisualMenu(schema, values);
  }
  
  /**
   * Update header with structural controls
   * @param {Object} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  updateHeaderControls(schema, values) {
    // Clear existing controls
    while (this.header.childNodes.length > 0) {
      this.header.removeChild(this.header.lastChild);
    }
    
    // Check if we have structural parameters
    if (!schema.structural || schema.structural.length === 0) {
      this.header.appendChild(layoutUtils.createPlaceholder('No structural parameters available.'));
      return;
    }
    
    // Create controls for each parameter
    schema.structural.forEach(param => {
      const control = layoutUtils.createControl(
        this.builder,
        param,
        values[param.id],
        (value) => this.handleParameterChange(param.id, value)
      );
      
      this.header.appendChild(control);
    });
  }
  
  /**
   * Update visual menu with controls
   * @param {Object} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  updateVisualMenu(schema, values) {
    // Clear existing controls (except the title)
    while (this.visualMenu.childNodes.length > 1) {
      this.visualMenu.removeChild(this.visualMenu.lastChild);
    }
    
    // Check if we have visual parameters
    if (!schema.visual || schema.visual.length === 0) {
      this.visualMenu.appendChild(layoutUtils.createPlaceholder('No visual parameters available.'));
      return;
    }
    
    // Create controls for each parameter
    schema.visual.forEach(param => {
      const control = layoutUtils.createControl(
        this.builder,
        param,
        values[param.id],
        (value) => this.handleParameterChange(param.id, value)
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
    
    // Update export menu
    this.updateExportMenu(actions);
  }
  
  /**
   * Update export menu with actions
   * @param {Array<Object>} actions - Available actions
   */
  updateExportMenu(actions) {
    // Clear existing controls (except the title)
    while (this.exportMenu.childNodes.length > 1) {
      this.exportMenu.removeChild(this.exportMenu.lastChild);
    }
    
    // Check if we have actions
    if (!actions || actions.length === 0) {
      this.exportMenu.appendChild(layoutUtils.createPlaceholder('No export options available.'));
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
    // Call parent method to store plugins and active ID
    super.updatePlugins(plugins, activePluginId);
    
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
      itemsContainer.removeChild(itemsContainer.firstChild);
    }
    
    // Check if we have plugins
    if (!plugins || plugins.length === 0) {
      const message = layoutUtils.createPlaceholder('No visualizations available.');
      message.style.padding = '10px 16px';
      itemsContainer.appendChild(message);
      return;
    }
    
    // Create items for each plugin
    plugins.forEach(plugin => {
      const item = layoutUtils.createPluginListItem(plugin, activePluginId, (pluginId) => {
        this.emit('pluginSelect', pluginId);
        this.pluginMenu.classList.add('hidden');
      });
      
      itemsContainer.appendChild(item);
    });
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