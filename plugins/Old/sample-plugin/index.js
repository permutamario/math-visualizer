// src/plugins/sample-plugin/index.js

import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { SampleVisualization } from './SampleVisualization.js';

export default class SamplePlugin extends Plugin {
  static id = "sample-plugin";
  static name = "Sample Plugin";
  static description = "Demonstrates the enhanced parameter system";
  static renderingType = "2d";

  constructor(core) {
    super(core);
    
    // Available visualization types - simplified to just one for troubleshooting
    this.visualizationTypes = [
      {
        id: 'default',
        name: 'Default Visualization',
        class: SampleVisualization
      }
    ];
  }

  /**
   * Define parameters for this plugin
   * These are the base parameters that apply to all visualizations
   * @returns {ParameterBuilder} Parameter builder
   */
  defineParameters() {
    // Start with basic parameters
    let params = createParameters()
      .addCheckbox('showDebug', 'Show Debug Info', false)
      .addCheckbox('pauseAnimation', 'Pause Animation', false);
    
    // Add standard parameters from the core if available
    if (this.core && this.core.getStandardParameters) {
      try {
        const standardParams = this.core.getStandardParameters(this.constructor.renderingType);
        
        // Add standard parameters
        if (standardParams.colorPalette) {
          params.addDropdown(
            standardParams.colorPalette.id,
            standardParams.colorPalette.label,
            standardParams.colorPalette.default,
            standardParams.colorPalette.options,
            standardParams.colorPalette.category
          );
        }
      } catch (error) {
        console.warn('Error adding standard parameters:', error);
      }
    }
    
    return params;
  }

  /**
   * Define available actions
   * @returns {Array<Action>} List of available actions
   */
  defineActions() {
    return [
      ...super.defineActions(),
      {
        id: 'toggle-debug',
        label: 'Toggle Debug Info'
      }
    ];
  }

  /**
   * Load the plugin
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log("Loading sample plugin...");
      
      // Set up default parameters from parameter builder
      const schema = this.defineParameters().build();
      this.parameters = this._getDefaultParametersFromSchema(schema);
      
      // Initialize default visualization
      await this._initializeDefaultVisualization();
      
      // Mark as loaded
      this.isLoaded = true;
      
      // Give parameters to UI with a short delay to ensure visualization is ready
      setTimeout(() => {
        this.giveParameters(true);
      }, 100);
      
      // Update actions
      if (this.core && this.core.uiManager) {
        const actions = this.defineActions();
        this.core.uiManager.updateActions(actions);
      }
      
      console.log("Sample plugin loaded successfully");
      return true;
    } catch (error) {
      console.error(`Error loading SamplePlugin:`, error);
      
      // Ensure clean state on failure
      await this.unload();
      return false;
    }
  }

  /**
   * Initialize the default visualization
   * @private
   */
  async _initializeDefaultVisualization() {
    try {
      // Create a single visualization instance for simplicity
      const visualization = new SampleVisualization(this);
      this.registerVisualization('default', visualization);
      
      // Set current visualization
      this.currentVisualization = visualization;
      
      // Initialize with current parameters
      await visualization.initialize(this.parameters);
      
      return true;
    } catch (error) {
      console.error("Error initializing visualization:", error);
      throw error;
    }
  }

  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value 
   */
  async onParameterChanged(parameterId, value) {
    try {
      // Update parameter value
      this.parameters[parameterId] = value;
      
      // Update the visualization with the changed parameter
      if (this.currentVisualization) {
        this.currentVisualization.update({ [parameterId]: value });
      }
      
      // Update UI
      this.giveParameters(false);
      
      // Request render update
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
    } catch (error) {
      console.error(`Error handling parameter change for ${parameterId}:`, error);
    }
  }

  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    try {
      if (actionId === 'toggle-debug') {
        // Toggle debug parameter
        const newValue = !this.parameters.showDebug;
        this.parameters.showDebug = newValue;
        
        // Update visualization
        if (this.currentVisualization) {
          this.currentVisualization.update({ showDebug: newValue });
        }
        
        // Update UI
        this.giveParameters(false);
        
        // Request render
        if (this.core && this.core.renderingManager) {
          this.core.renderingManager.requestRender();
        }
        
        return true;
      }
      
      // Let parent handle other actions
      return super.executeAction(actionId, ...args);
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
      return false;
    }
  }
  
  /**
   * Override parent method to get merged parameters
   * Enhanced with better error handling
   */
  getMergedParameterSchema() {
    try {
      // Start with plugin's base parameters
      const pluginSchema = this.defineParameters().build();
      
      // If no current visualization, just return plugin parameters
      if (!this.currentVisualization) {
        return pluginSchema;
      }
      
      // Get visualization-specific parameters
      const vizClass = this.currentVisualization.constructor;
      let vizSchema = null;
      
      // Check if the visualization class has a static getParameters method
      if (vizClass && typeof vizClass.getParameters === 'function') {
        vizSchema = vizClass.getParameters();
      }
      
      // If no visualization schema, just return plugin schema
      if (!vizSchema) {
        return pluginSchema;
      }
      
      // Create merged schema with defensive programming
      const mergedSchema = {
        structural: [...(Array.isArray(pluginSchema.structural) ? pluginSchema.structural : [])],
        visual: [...(Array.isArray(pluginSchema.visual) ? pluginSchema.visual : [])]
      };
      
      // Add visualization structural parameters (avoiding duplicates by ID)
      if (vizSchema.structural && Array.isArray(vizSchema.structural)) {
        const existingIds = new Set(mergedSchema.structural.map(p => p.id));
        
        vizSchema.structural.forEach(param => {
          if (param && param.id && !existingIds.has(param.id)) {
            mergedSchema.structural.push(param);
            existingIds.add(param.id);
          }
        });
      }
      
      // Add visualization visual parameters (avoiding duplicates by ID)
      if (vizSchema.visual && Array.isArray(vizSchema.visual)) {
        const existingIds = new Set(mergedSchema.visual.map(p => p.id));
        
        vizSchema.visual.forEach(param => {
          if (param && param.id && !existingIds.has(param.id)) {
            mergedSchema.visual.push(param);
            existingIds.add(param.id);
          }
        });
      }
      
      return mergedSchema;
    } catch (error) {
      console.error('Error merging parameter schemas:', error);
      // Return plugin schema as fallback
      return this.defineParameters().build();
    }
  }
}