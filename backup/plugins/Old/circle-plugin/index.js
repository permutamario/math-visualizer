// src/plugins/circle-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { CircleVisualization } from './CircleVisualization.js';

/**
 * A simple plugin demonstrating a basic circle visualization
 * Following the Math Visualization Framework philosophy
 */
export default class CirclePlugin extends Plugin {
  static id = "circle-plugin";
  static name = "Circle Visualization";
  static description = "A simple circle visualization demo";
  static renderingType = "2d";

  constructor(core) {
    super(core);
    
    // Store visualizations in a Map for easier management
    this.visualizations = new Map();
    this.currentVisualization = null;
    
    // Register this plugin's actions with the core
    this._registerActions();
  }

  /**
   * Plugin's main entry point - called by the framework when plugin is loaded
   * @returns {Promise<boolean>} Whether start was successful
   */
  async start() {
    try {
      console.log("Starting Circle plugin...");
      
      // Create and register the visualization
      const visualization = new CircleVisualization(this);
      this.visualizations.set('default', visualization);
      this.currentVisualization = visualization;
      
      // Register parameters
      this._registerParameters();
      
      // Initialize the visualization with current parameters
      await this.currentVisualization.initialize({
        ...this.pluginParameters,
        ...this.visualizationParameters,
        ...this.advancedParameters
      });
      
      console.log("Circle plugin started successfully");
      return true;
    } catch (error) {
      console.error("Error starting Circle plugin:", error);
      return false;
    }
  }

  /**
   * Called by the framework when plugin is unloaded
   * Clean up all resources to prevent memory leaks
   * @returns {Promise<boolean>} Whether unload was successful
   */
  async unload() {
    try {
      console.log("Unloading Circle plugin...");
      
      // Clean up all visualizations
      for (const visualization of this.visualizations.values()) {
        visualization.dispose();
      }
      
      // Clear visualization references
      this.visualizations.clear();
      this.currentVisualization = null;
      
      return true;
    } catch (error) {
      console.error("Error unloading Circle plugin:", error);
      return false;
    }
  }

  /**
   * Register parameters with the framework
   * @private
   */
  _registerParameters() {
    // Get visualization-specific parameters
    const visualizationParams = CircleVisualization.getParameters();
    
    // Define plugin-level parameters
    const pluginParams = [
      {
        id: 'showBoundingBox',
        type: 'checkbox',
        label: 'Show Bounding Box',
        default: false
      },
      {
        id: 'showLabels',
        type: 'checkbox',
        label: 'Show Labels',
        default: false
      },
      {
        id: 'globalScale',
        type: 'slider',
        label: 'Global Scale',
        default: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.1
      }
    ];
    
    // Define advanced parameters
    const advancedParams = [
      {
        id: 'debugMode',
        type: 'checkbox',
        label: 'Debug Mode',
        default: false
      }
    ];
    
    // Store parameters internally
    this.pluginParameters = this._extractDefaultValues(pluginParams);
    this.visualizationParameters = this._extractDefaultValues(visualizationParams);
    this.advancedParameters = this._extractDefaultValues(advancedParams);
    
    // Notify the framework of our parameters
    if (this.core && this.core.uiManager) {
      this.core.uiManager.updatePluginParameterGroups({
        pluginParameters: { schema: pluginParams, values: this.pluginParameters },
        visualizationParameters: { schema: visualizationParams, values: this.visualizationParameters },
        advancedParameters: { schema: advancedParams, values: this.advancedParameters }
      }, true);
    }
  }

  /**
   * Extract default values from parameter definitions
   * @param {Array} params - Parameter definitions
   * @returns {Object} Default values
   * @private
   */
  _extractDefaultValues(params) {
    const defaults = {};
    
    params.forEach(param => {
      if (param.id !== undefined && param.default !== undefined) {
        defaults[param.id] = param.default;
      }
    });
    
    return defaults;
  }

  /**
   * Register actions with the framework
   * @private
   */
  _registerActions() {
    if (!this.core) return;
    
    // Register reset view action
    this.core.addAction(
      'reset-view', 
      'Reset View', 
      () => {
        // Reset the camera/view in the rendering environment
        const renderEnv = this.core.getRenderingEnvironment();
        if (renderEnv && typeof renderEnv.resetCamera === 'function') {
          renderEnv.resetCamera();
          return true;
        }
        return false;
      }
    );
    
    // Register randomize color action
    this.core.addAction(
      'randomize-color',
      'Randomize Color',
      () => {
        // Generate a random color
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        // Update the visualization parameter
        this.updateParameter('fillColor', randomColor, 'visualization', true);
        
        // Show notification to user
        if (this.core && this.core.uiManager) {
          this.core.uiManager.showNotification(`Color updated to ${randomColor}`);
        }
        
        return true;
      }
    );
  }

  /**
   * Handle parameter changes from the UI or framework
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New value
   * @param {string} group - Parameter group
   */
  onParameterChanged(parameterId, value, group) {
    // First update our internal parameter storage
    if (group === 'plugin' && this.pluginParameters) {
      this.pluginParameters[parameterId] = value;
    } else if (group === 'visualization' && this.visualizationParameters) {
      this.visualizationParameters[parameterId] = value;
    } else if (group === 'advanced' && this.advancedParameters) {
      this.advancedParameters[parameterId] = value;
    }
    
    // Then forward to the current visualization
    if (this.currentVisualization) {
      this.currentVisualization.update({ [parameterId]: value });
    }
    
    // Also request a render
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }

  /**
   * Update a parameter value and optionally update the UI
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New parameter value
   * @param {string} group - Parameter group ('plugin', 'visualization', 'advanced')
   * @param {boolean} updateUI - Whether to update the UI
   * @returns {boolean} Whether the parameter was updated successfully
   */
  updateParameter(parameterId, value, group = 'visualization', updateUI = true) {
    // Update internal parameter storage
    let updated = false;
    
    if (group === 'plugin' && this.pluginParameters) {
      this.pluginParameters[parameterId] = value;
      updated = true;
    } else if (group === 'visualization' && this.visualizationParameters) {
      this.visualizationParameters[parameterId] = value;
      updated = true;
    } else if (group === 'advanced' && this.advancedParameters) {
      this.advancedParameters[parameterId] = value;
      updated = true;
    }
    
    // Update UI if requested
    if (updated && updateUI && this.core && this.core.uiManager) {
      this.core.uiManager.updateParameterValue(parameterId, value, group);
    }
    
    // Forward to visualization
    if (updated && this.currentVisualization) {
      this.currentVisualization.update({ [parameterId]: value });
    }
    
    return updated;
  }

  /**
   * Animation loop callback from the framework
   * @param {number} deltaTime - Time since last frame in seconds
   * @returns {boolean} Whether the animation should continue
   */
  animate(deltaTime) {
    // Forward to current visualization
    if (this.currentVisualization && typeof this.currentVisualization.animate === 'function') {
      return this.currentVisualization.animate(deltaTime);
    }
    
    return false;
  }
}