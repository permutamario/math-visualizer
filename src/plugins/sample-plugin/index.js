// src/plugins/sample-plugin/index.js

import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { SampleVisualization } from './SampleVisualization.js';
import { AlternateVisualization } from './AlternateVisualization.js';

export default class SamplePlugin extends Plugin {
  static id = "sample-plugin";
  static name = "Sample Plugin";
  static description = "Demonstrates the enhanced parameter system";
  static renderingType = "2d";

  constructor(core) {
    super(core);
    
    // Available visualization types
    this.visualizationTypes = [
      {
        id: 'default',
        name: 'Default Visualization',
        class: SampleVisualization
      },
      {
        id: 'alternate',
        name: 'Alternate Visualization',
        class: AlternateVisualization
      }
    ];
  }

  /**
   * Define parameters for this plugin
   * These are the base parameters that apply to all visualizations
   * @returns {ParameterBuilder} Parameter builder
   */
  defineParameters() {
    // Get visualization type from parameters or default to first one
    const visualizationType = this.parameters?.visualizationType || 
                             (this.visualizationTypes.length > 0 ? this.visualizationTypes[0].id : 'default');
    
    // Create base plugin parameter builder
    let params = createParameters()
      .addDropdown('visualizationType', 'Visualization Type', visualizationType, 
        this.visualizationTypes.map(vt => ({
          value: vt.id,
          label: vt.name
        })))
      .addCheckbox('showDebug', 'Show Debug Info', false)
      .addCheckbox('pauseAnimation', 'Pause Animation', false);
    
    // Add standard parameters from the core if available
    if (this.core && this.core.getStandardParameters) {
      const standardParams = this.core.getStandardParameters(this.constructor.renderingType);
      
      // Add standard parameters manually
      Object.values(standardParams).forEach(param => {
        switch (param.type) {
          case 'dropdown':
            params.addDropdown(param.id, param.label, param.default, param.options, param.category);
            break;
          case 'slider':
            params.addSlider(param.id, param.label, param.default, {
              min: param.min,
              max: param.max,
              step: param.step
            }, param.category);
            break;
          case 'checkbox':
            params.addCheckbox(param.id, param.label, param.default, param.category);
            break;
          case 'color':
            params.addColor(param.id, param.label, param.default, param.category);
            break;
        }
      });
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
      
      // Wait for visualization parameters to be ready
      await this._waitForVisualizationParameters();
      
      // Mark as loaded
      this.isLoaded = true;
      
      // Give parameters to UI
      this.giveParameters(true);
      
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
    // Get the selected visualization type or default to first one
    const selectedType = this.parameters.visualizationType || 
                        (this.visualizationTypes.length > 0 ? this.visualizationTypes[0].id : 'default');
    
    // Create and register all visualizations
    for (const vizType of this.visualizationTypes) {
      const visualization = new vizType.class(this);
      this.registerVisualization(vizType.id, visualization);
    }
    
    // Set current visualization
    this.currentVisualization = this.visualizations.get(selectedType);
    
    // Initialize with current parameters
    if (this.currentVisualization) {
      await this.currentVisualization.initialize(this.parameters);
    }
    
    return true;
  }

  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value 
   */
  async onParameterChanged(parameterId, value) {
    // Handle visualization type change specially
    if (parameterId === 'visualizationType') {
      // Update the parameter first
      this.parameters[parameterId] = value;
      
      // Switch visualization
      await this.setVisualization(value);
      return;
    }
    
    // For normal parameters, update state and pass to visualization
    this.parameters[parameterId] = value;
    
    // Update the visualization with just the changed parameter
    if (this.currentVisualization) {
      this.currentVisualization.update({ [parameterId]: value });
    }
    
    // Update UI
    this.giveParameters(false);
    
    // Request render update
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }
  
  /**
   * Preserve common parameters when switching visualizations
   * Override the base class to specify which parameters to preserve
   * @returns {Object} Parameters to preserve
   */
  preserveCommonParameters() {
    // Parameters that should be preserved across visualization switches
    const commonParamIds = [
      'colorPalette', 'showDebug', 'pauseAnimation'
    ];
    
    const preserved = {};
    
    // Copy parameters that exist in current parameters
    commonParamIds.forEach(id => {
      if (this.parameters[id] !== undefined) {
        preserved[id] = this.parameters[id];
      }
    });
    
    return preserved;
  }

  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
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
  }
}