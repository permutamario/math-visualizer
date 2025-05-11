// src/ui/DesktopLayout.js

import { BaseLayout } from './BaseLayout.js';
import * as layoutUtils from './layoutUtils.js';
import { SelectionWindow } from './SelectionWindow.js';

/**
 * Desktop UI layout
 */
export class DesktopLayout extends BaseLayout {
  /**
   * Create a new DesktopLayout
   * @param {UIManager} uiManager - Reference to the UI manager
   */
  constructor(uiManager) {
    super(uiManager);
    this.panels = {};
    this.pluginSelectorButton = null;
    this.selectionWindow = null;
    this.themeToggleButton = null;
    
    // Bind methods
    this.openSelectionWindow = this.openSelectionWindow.bind(this);
  }
  
  /**
   * Initialize the desktop layout
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Call parent initialize first
      await super.initialize();
      
      // Create UI panels
      this.createPanels();
      
      // Create plugin selector button
      this.createPluginSelector();
      
      // Create fullscreen button
      this.createFullscreenButton();
      
      // Create theme toggle button
      this.createThemeToggleButton();
      
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
    this.panels.structural = layoutUtils.createPanel('structural-panel', 'Structural Parameters');
    document.body.appendChild(this.panels.structural);
    
    // Create visual parameters panel
    this.panels.visual = layoutUtils.createPanel('visual-panel', 'Visual Parameters');
    document.body.appendChild(this.panels.visual);
    
    // Create export panel
    this.panels.export = layoutUtils.createPanel('export-panel', 'Export Options');
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
   * Create plugin selector button
   */
  createPluginSelector() {
    // Create plugin selector button
    this.pluginSelectorButton = document.createElement('div');
    this.pluginSelectorButton.className = 'plugin-selector-button';
    this.pluginSelectorButton.title = 'Visualization Selector';
    this.pluginSelectorButton.addEventListener('click', this.openSelectionWindow);
    
    // Add icon to button
    const icon = document.createElement('div');
    icon.className = 'plugin-selector-button-icon';
    this.pluginSelectorButton.appendChild(icon);
    
    // Add button to document
    document.body.appendChild(this.pluginSelectorButton);
    
    // Create selection window
    this.selectionWindow = new SelectionWindow(
      this.plugins,
      this.activePluginId,
      (pluginId) => this.emit('pluginSelect', pluginId),
      null
    );
  }
  
  /**
   * Open the selection window
   */
  /**
   * Open the selection window
   * @param {Event} event - Click event
   */
  openSelectionWindow(event) {
    // Stop event propagation to prevent the event from immediately closing the window
    if (event) {
      event.stopPropagation();
    }
    
    if (this.selectionWindow) {
      // Update plugins and active ID before showing
      this.selectionWindow.update(this.plugins, this.activePluginId);
      this.selectionWindow.show();
    }
  }
  
  /**
   * Create the fullscreen button
   */
  createFullscreenButton() {
    const button = layoutUtils.createFullscreenButton(false, (isFullscreen) => {
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
    this.themeToggleButton = layoutUtils.createThemeToggleButton(this.uiManager.core, false);
    
    if (this.themeToggleButton) {
      document.body.appendChild(this.themeToggleButton);
    }
  }
  
  /**
   * Handle document clicks (not needed for modal selection window)
   * @param {Event} event - Click event
   */
  handleOutsideClick(event) {
    // Selection window handles its own clicks
  }
  
  /**
   * Build UI controls from schema
   * @param {Object} schema - Parameter schema
   * @param {Object} values - Current parameter values
   */
  buildControls(schema, values) {
    // Call parent method to store controls and values
    super.buildControls(schema, values);
    
    // Update structural panel
    this.updateStructuralPanel(schema, values);
    
    // Update visual panel
    this.updateVisualPanel(schema, values);
  }
  
  /**
   * Update structural panel with controls
   * @param {Object} schema - Parameter schema
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
      panel.appendChild(layoutUtils.createPlaceholder('No structural parameters available.'));
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
      
      panel.appendChild(control);
    });
  }
  
  /**
   * Update visual panel with controls
   * @param {Object} schema - Parameter schema
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
      panel.appendChild(layoutUtils.createPlaceholder('No visual parameters available.'));
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
      
      panel.appendChild(control);
    });
  }
  
  /**
   * Update available actions
   * @param {Array<Object>} actions - Available actions
   */
  updateActions(actions) {
    // Call parent method to store actions
    super.updateActions(actions);
    
    // Update export panel
    this.updateExportPanel(actions);
  }
  
  /**
   * Update export panel with actions
   * @param {Array<Object>} actions - Available actions
   */
  updateExportPanel(actions) {
    const panel = this.panels.export;
    
    // Clear existing controls (except the title)
    while (panel.childNodes.length > 1) {
      panel.removeChild(panel.lastChild);
    }
    
    // Check if we have actions
    if (!actions || actions.length === 0) {
      panel.appendChild(layoutUtils.createPlaceholder('No export options available.'));
      return;
    }
    
    // Create buttons for each action
    actions.forEach(action => {
      const button = layoutUtils.createButton(
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
    // Call parent method to store plugins
    super.updatePlugins(plugins, activePluginId);
    
    // Update selection window
    if (this.selectionWindow) {
      this.selectionWindow.update(plugins, activePluginId);
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Call parent dispose
    super.dispose();
    
    // Remove panels
    this.removePanels();
    
    // Remove plugin selector
    if (this.pluginSelectorButton && this.pluginSelectorButton.parentNode) {
      this.pluginSelectorButton.parentNode.removeChild(this.pluginSelectorButton);
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
    
    // Remove fullscreen button
    const fullscreenButton = document.getElementById('desktop-fullscreen-button');
    if (fullscreenButton && fullscreenButton.parentNode) {
      fullscreenButton.parentNode.removeChild(fullscreenButton);
    }
    
    // Remove fullscreen mode if active
    document.body.classList.remove('fullscreen-mode');
    
    console.log("Desktop layout disposed");
  }
}