// src/plugins/circle-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { CircleVisualization } from './CircleVisualization.js';

export default class CirclePlugin extends Plugin {
  static id = "circle-plugin";
  static name = "Circle Test";
  static description = "A simple circle visualization";
  static renderingType = "2d";

  /**
   * Load the plugin
   * Called when the plugin is selected
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log("Loading circle plugin...");
      
      // Set up default parameters from schema
      const schema = this.getParameterSchema();
      this.parameters = this._getDefaultParametersFromSchema(schema);
      
      // Initialize default visualization
      await this._initializeDefaultVisualization();
      
      // Mark as loaded
      this.isLoaded = true;
      
      // Give parameters to UI
      this.giveParameters(true);
      
      // Update actions
      if (this.core && this.core.uiManager) {
        const actions = this.getActions();
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
   * Get parameter schema
   */
  getParameterSchema() {
    return {
      structural: [
        {
          id: 'radius',
          type: 'slider',
          label: 'Radius',
          min: 10,
          max: 200,
          step: 5,
          default: 100
        }
      ],
      visual: [
        {
          id: 'fillColor',
          type: 'color',
          label: 'Fill Color',
          default: '#3498db'
        },
        {
          id: 'stroke',
          type: 'checkbox',
          label: 'Show Outline',
          default: true
        },
        {
          id: 'strokeColor',
          type: 'color',
          label: 'Outline Color',
          default: '#000000'
        }
      ]
    };
  }

  /**
   * Handle parameter changes
   */
  onParameterChanged(parameterId, value) {
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Update visualization
    if (this.currentVisualization) {
      this.currentVisualization.update(this.parameters);
    }
    
    // Update UI
    this.giveParameters(false);
    
    // Request render update
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }

  /**
   * Get custom actions
   */
  getActions() {
    return [
      ...super.getActions(),
      {
        id: 'randomize-color',
        label: 'Randomize Color'
      }
    ];
  }

  /**
   * Execute an action
   */
  executeAction(actionId, ...args) {
    if (actionId === 'randomize-color') {
      // Generate a random color
      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      
      // Update the parameter
      this.parameters.fillColor = randomColor;
      
      // Update the visualization
      if (this.currentVisualization) {
        this.currentVisualization.update(this.parameters);
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
