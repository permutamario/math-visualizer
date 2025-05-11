// src/plugins/circle-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { CircleVisualization } from './CircleVisualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

export default class CirclePlugin extends Plugin {
  static id = "circle-plugin";
  static name = "Circle Test";
  static description = "A simple circle visualization";
  static renderingType = "2d";

  /**
   * Define parameters for this plugin
   * @returns {ParameterBuilder} Parameter builder
   */
  defineParameters() {
    return createParameters()
      .addSlider('radius', 'Radius', 100, { min: 10, max: 200, step: 5 })
      .addColor('fillColor', 'Fill Color', '#3498db')
      .addCheckbox('stroke', 'Show Outline', true)
      .addColor('strokeColor', 'Outline Color', '#000000');
  }
  
  /**
   * Define available actions for this plugin
   * @returns {Array<Action>} List of available actions
   */
  defineActions() {
    return [
      ...super.defineActions(),
      {
        id: 'randomize-color',
        label: 'Randomize Color'
      }
    ];
  }

  /**
   * Load the plugin
   * Called when the plugin is selected
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log("Loading circle plugin...");
      
      // Set up default parameters from parameter builder
      const schema = this.defineParameters().build();
      this.parameters = this._getDefaultParametersFromSchema(schema);
      
      // Initialize default visualization
      await this._initializeDefaultVisualization();
      
      // Mark as loaded
      this.isLoaded = true;
      
      // Give parameters to UI
      this.giveParameters(true);
      
      // Update actions
      if (this.core && this.core.uiManager) {
        const actions = this.defineActions();
        this.core.uiManager.updateActions(actions);
      }
      
      console.log("Circle plugin loaded successfully");
      return true;
    } catch (error) {
      console.error(`Error loading CirclePlugin:`, error);
      
      // Ensure clean state on failure
      await this.unload();
      return false;
    }
  }

  /**
   * Unload the plugin
   * Called when another plugin is selected
   */
  async unload() {
    if (!this.isLoaded) return true;
    
    try {
      console.log("Unloading circle plugin...");
      
      // Clean up current visualization
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
        this.currentVisualization = null;
      }
      
      // Clear all visualizations
      this.visualizations.clear();
      
      // Clear parameters
      this.parameters = {};
      
      // Mark as unloaded
      this.isLoaded = false;
      
      console.log("Circle plugin unloaded successfully");
      return true;
    } catch (error) {
      console.error(`Error unloading CirclePlugin:`, error);
      return false;
    }
  }

  /**
   * Initialize the default visualization
   * @private
   */
  async _initializeDefaultVisualization() {
    const visualization = new CircleVisualization(this);
    this.registerVisualization('default', visualization);
    this.currentVisualization = visualization;
    await visualization.initialize(this.parameters);
  }

  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value 
   */
  onParameterChanged(parameterId, value) {
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Update visualization with just the changed parameter
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
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    if (actionId === 'randomize-color') {
      // Generate a random color
      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      
      // Update the parameter
      this.parameters.fillColor = randomColor;
      
      // Update the visualization with just the changed parameter
      if (this.currentVisualization) {
        this.currentVisualization.update({ fillColor: randomColor });
      }
      
      // Update UI
      this.giveParameters(false);
      
      // Request render
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
      
      return true;
    }
    
    // Let parent handle standard actions
    return super.executeAction(actionId, ...args);
  }
}