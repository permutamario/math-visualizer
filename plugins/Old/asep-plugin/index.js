// src/plugins/asep-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { CircularASEPVisualization } from './CircularASEPVisualization.js';

/**
 * ASEP (Asymmetric Simple Exclusion Process) visualization plugin
 * Showcases particle dynamics with different boundary conditions
 */
export default class ASEPPlugin extends Plugin {
  static id = "asep-plugin";
  static name = "ASEP Visualization";
  static description = "Asymmetric Simple Exclusion Process particle dynamics";
  static renderingType = "2d";

  constructor(core) {
    super(core);
    
    // Define available visualization types
    this.visualizationTypes = [
      {
        id: 'circular',
        name: 'Circular System',
        class: CircularASEPVisualization
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
      .addSlider('animationSpeed', 'Animation Speed', 1.0, { min: 0.1, max: 3.0, step: 0.1 })
      .addCheckbox('pauseSimulation', 'Pause Simulation', false)
      .addCheckbox('showLabels', 'Show Labels', false)
      .build();
  }
  
  /**
   * Define advanced parameters
   * @returns {Array} Array of parameter definitions
   */
  defineAdvancedParameters() {
    return createParameters()
      .addCheckbox('debugMode', 'Debug Mode', false)
      .addNumber('seed', 'Random Seed', 42, { min: 0, max: 1000, step: 1 })
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
        id: 'reset-simulation',
        label: 'Reset Simulation'
      },
      {
        id: 'toggle-pause',
        label: 'Toggle Pause'
      }
    ];
  }

  /**
   * Load the plugin
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log("Loading ASEP plugin...");
      
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
      
      console.log("ASEP plugin loaded successfully");
      return true;
    } catch (error) {
      console.error(`Error loading ASEPPlugin:`, error);
      
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
      // Create the visualization instance
      const visualization = new CircularASEPVisualization(this);
      this.registerVisualization('circular', visualization);
      
      // Set as current visualization
      this.currentVisualization = visualization;
      
      // Initialize with all parameters
      await this.currentVisualization.initialize({
        ...this.pluginParameters,
        ...this.visualizationParameters,
        ...this.advancedParameters
      });
      
      return true;
    } catch (error) {
      console.error("Error initializing visualization:", error);
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
      case 'reset-simulation':
        // Reset the simulation
        if (this.currentVisualization) {
          console.log("Resetting simulation");
          
          // Re-initialize with current parameters
          this.currentVisualization.initialize({
            ...this.pluginParameters,
            ...this.visualizationParameters,
            ...this.advancedParameters
          });
          
          // Request a render
          if (this.core && this.core.renderingManager) {
            this.core.renderingManager.requestRender();
          }
          
          // Show notification to user
          if (this.core && this.core.uiManager) {
            this.core.uiManager.showNotification('Simulation reset');
          }
        }
        return true;
        
      case 'toggle-pause':
        // Toggle simulation pause state
        if (this.currentVisualization) {
          const isPaused = !this.pluginParameters.pauseSimulation;
          this.updateParameter('pauseSimulation', isPaused, 'plugin');
          
          // Show notification to user
          if (this.core && this.core.uiManager) {
            this.core.uiManager.showNotification(
              `Simulation ${isPaused ? 'paused' : 'running'}`
            );
          }
        }
        return true;
        
      default:
        // Let parent handle other actions
        return super.executeAction(actionId, ...args);
    }
  }
}