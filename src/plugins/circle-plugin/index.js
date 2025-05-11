// src/plugins/circle-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { CircleVisualization } from './CircleVisualization.js';

export default class CirclePlugin extends Plugin {
  static id = "circle-plugin";
  static name = "Circle Test";
  static description = "A simple circle visualization";
  static renderingType = "2d";

  constructor(core) {
    super(core);
    
    // Store visualization types
    this.visualizationTypes = [
      {
        id: 'default',
        name: 'Circle',
        class: CircleVisualization
      }
    ];
  }

  /**
   * Define plugin-level parameters
   * @returns {Array} Array of parameter definitions
   */
  definePluginParameters() {
    return createParameters()
      .addCheckbox('showLabels', 'Show Labels', false)
      .build();
  }
  
  /**
   * Define advanced parameters
   * @returns {Array} Array of parameter definitions
   */
  defineAdvancedParameters() {
    // No advanced parameters for this simple plugin
    return [];
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
   * Initialize the default visualization
   * @private
   */
  async _initializeDefaultVisualization() {
    const visualization = new CircleVisualization(this);
    this.registerVisualization('default', visualization);
    this.currentVisualization = visualization;
    
    // Initialize with all parameters
    await visualization.initialize({
      ...this.pluginParameters,
      ...this.visualizationParameters,
      ...this.advancedParameters
    });
    
    return true;
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
      
      // Update the parameter in visualization parameters
      this.updateParameter('fillColor', randomColor, 'visualization', true);
      
      return true;
    }
    
    // Let parent handle standard actions
    return super.executeAction(actionId, ...args);
  }
}