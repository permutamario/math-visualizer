// src/plugins/circle-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { CircleVisualization } from './CircleVisualization.js';

/**
 * A simple plugin demonstrating a basic circle visualization
 */
export default class CirclePlugin extends Plugin {
  static id = "circle-plugin";
  static name = "Circle Visualization";
  static description = "A simple circle visualization demo";
  static renderingType = "2d";

  constructor(core) {
    super(core);
    
    // Define available visualization types
    this.visualizationTypes = [
      {
        id: 'default',
        name: 'Basic Circle',
        class: CircleVisualization
      }
    ];
  }

  /**
   * Define plugin-level parameters that affect all visualizations
   * @returns {Array} Array of parameter definitions
   */
  definePluginParameters() {
    return createParameters()
      .addCheckbox('showBoundingBox', 'Show Bounding Box', false)
      .addCheckbox('showLabels', 'Show Labels', false)
      .addSlider('globalScale', 'Global Scale', 1.0, { min: 0.5, max: 2.0, step: 0.1 })
      .build();
  }
  
  /**
   * Define advanced parameters
   * @returns {Array} Array of parameter definitions
   */
  defineAdvancedParameters() {
    return createParameters()
      .addCheckbox('debugMode', 'Debug Mode', false)
      .build();
  }

  /**
   * Define available actions
   * @returns {Array<Action>} List of available actions
   */
  defineActions() {
    return [
      ...super.defineActions(), // Include default actions (export, reset)
      {
        id: 'randomize-color',
        label: 'Randomize Color'
      },
      {
        id: 'reset-view',
        label: 'Reset View'
      }
    ];
  }

  /**
   * Load the plugin
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log("Loading Circle plugin...");
      
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
    try {
      // Create and register the visualization
      const visualization = new CircleVisualization(this);
      this.registerVisualization('default', visualization);
      
      // Set current visualization
      this.currentVisualization = visualization;
      
      // Initialize with all parameters
      await visualization.initialize({
        ...this.pluginParameters,
        ...this.visualizationParameters,
        ...this.advancedParameters
      });
      
      return true;
    } catch (error) {
      console.error("Error initializing default visualization:", error);
      throw error;
    }
  }

  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    switch (actionId) {
      case 'randomize-color':
        // Generate a random color
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        // Update the visualization parameter
        this.updateParameter('fillColor', randomColor, 'visualization', true);
        
        // Show notification to user
        if (this.core && this.core.uiManager) {
          this.core.uiManager.showNotification(`Color updated to ${randomColor}`);
        }
        
        return true;
        
      case 'reset-view':
        // Reset camera/view in the rendering manager
        if (this.core && this.core.renderingManager) {
          const environment = this.core.renderingManager.getCurrentEnvironment();
          if (environment && typeof environment.resetCamera === 'function') {
            environment.resetCamera();
          }
        }
        return true;
        
      default:
        // Let parent handle other actions
        return super.executeAction(actionId, ...args);
    }
  }
}