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
    
    // Parameter groups storage
    this.parameterGroups = {
      plugin: { schema: [], values: {} },
      visualization: { schema: [], values: {} },
      advanced: { schema: [], values: {} }
    };
    
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
    
    // Create plugin parameters panel (left side)
    this.panels.plugin = layoutUtils.createPanel('plugin-panel', 'Plugin Parameters', 'control-panel');
    document.body.appendChild(this.panels.plugin);
    
    // Create visualization parameters panel (right side)
    this.panels.visualization = layoutUtils.createPanel('visualization-panel', 'Visualization Parameters', 'control-panel right-panel');
    document.body.appendChild(this.panels.visualization);
    
    // Create export panel (left side, below plugin panel)
    this.panels.export = layoutUtils.createPanel('export-panel', 'Export Options', 'control-panel export-panel');
    document.body.appendChild(this.panels.export);
    
    // Only create advanced panel if needed (bottom right)
    /** 
    *if (this.parameterGroups.advanced.schema.length > 0) {
    *  this.panels.advanced = layoutUtils.createPanel('advanced-panel', 'Advanced Options', 'control-panel advanced-panel');
    *  document.body.appendChild(this.panels.advanced);
    *}
    */
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
   * Update UI with parameter groups
   * @param {Object} parameterGroups - Parameter groups data
   * @param {boolean} rebuild - Whether to rebuild all controls
   */
  updateParameterGroups(parameterGroups, rebuild = false) {
    // Store parameter groups
    this.parameterGroups = parameterGroups;
    
    // Rebuild panels if needed or if they don't exist
    if (rebuild || !this.panels.plugin || !this.panels.visualization) {
      this.createPanels();
    }
    
    // Update plugin parameters panel
    this.updatePluginPanel(parameterGroups.plugin.schema, parameterGroups.plugin.values);
    
    // Update visualization parameters panel
    this.updateVisualizationPanel(parameterGroups.visualization.schema, parameterGroups.visualization.values);
    
    // Update advanced panel if needed
    if (parameterGroups.advanced.schema.length > 0) {
      if (!this.panels.advanced) {
        this.panels.advanced = layoutUtils.createPanel('advanced-panel', 'Advanced Options', 'control-panel advanced-panel');
        document.body.appendChild(this.panels.advanced);
      }
      this.updateAdvancedPanel(parameterGroups.advanced.schema, parameterGroups.advanced.values);
    } else if (this.panels.advanced) {
      // Remove advanced panel if no longer needed
      if (this.panels.advanced.parentNode) {
        this.panels.advanced.parentNode.removeChild(this.panels.advanced);
      }
      delete this.panels.advanced;
    }
    
    // Update the export panel with actions
    this.updateExportPanel(this.actions);
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
    
    // Find the control element
    let controlId = parameterId;
    if (group) {
      controlId = `${group}-${parameterId}`;
    }
    
    // Try to find the element - it might have group prefix or not
    let element = document.getElementById(controlId);
    if (!element) {
      element = document.getElementById(parameterId);
    }
    
    // Update the control if found
    if (element) {
      layoutUtils.updateControlValue(element, value);
    }
  }
  
  /**
   * Update plugin parameters panel
   * @param {Array} schema - Parameter schema
   * @param {Object} values - Current values
   */
  updatePluginPanel(schema, values) {
    const panel = this.panels.plugin;
    
    // Clear existing controls (except the title)
    while (panel.childNodes.length > 1) {
      panel.removeChild(panel.lastChild);
    }
    
    // Check if we have plugin parameters
    if (!schema || schema.length === 0) {
      panel.appendChild(layoutUtils.createPlaceholder('No plugin parameters available.'));
      return;
    }
    
    // Create controls for each parameter
    schema.forEach(param => {
      const controlId = `plugin-${param.id}`;
      const control = layoutUtils.createControl(
        this.builder,
        { ...param, id: controlId }, // Add group prefix to ID
        values[param.id],
        (value) => this.handleParameterChange(param.id, value, 'plugin')
      );
      
      panel.appendChild(control);
    });
  }
  
  /**
   * Update visualization parameters panel
   * @param {Array} schema - Parameter schema
   * @param {Object} values - Current values
   */
  updateVisualizationPanel(schema, values) {
    const panel = this.panels.visualization;
    
    // Clear existing controls (except the title)
    while (panel.childNodes.length > 1) {
      panel.removeChild(panel.lastChild);
    }
    
    // Check if we have visualization parameters
    if (!schema || schema.length === 0) {
      panel.appendChild(layoutUtils.createPlaceholder('No visualization parameters available.'));
      return;
    }
    
    // Create controls for each parameter
    schema.forEach(param => {
      const controlId = `visualization-${param.id}`;
      const control = layoutUtils.createControl(
        this.builder,
        { ...param, id: controlId }, // Add group prefix to ID
        values[param.id],
        (value) => this.handleParameterChange(param.id, value, 'visualization')
      );
      
      panel.appendChild(control);
    });
  }
  
  /**
   * Update advanced parameters panel
   * @param {Array} schema - Parameter schema
   * @param {Object} values - Current values
   */
  updateAdvancedPanel(schema, values) {
    const panel = this.panels.advanced;
    
    // Clear existing controls (except the title)
    while (panel.childNodes.length > 1) {
      panel.removeChild(panel.lastChild);
    }
    
    // Check if we have advanced parameters
    if (!schema || schema.length === 0) {
      panel.appendChild(layoutUtils.createPlaceholder('No advanced parameters available.'));
      return;
    }
    
    // Create controls for each parameter
    schema.forEach(param => {
      const controlId = `advanced-${param.id}`;
      const control = layoutUtils.createControl(
        this.builder,
        { ...param, id: controlId }, // Add group prefix to ID
        values[param.id],
        (value) => this.handleParameterChange(param.id, value, 'advanced')
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