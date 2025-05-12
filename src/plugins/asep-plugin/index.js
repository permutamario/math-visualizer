// src/plugins/asep-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { ClosedASEPVisualization } from './ClosedASEPVisualization.js';
import { OpenASEPVisualization } from './OpenASEPVisualization.js';
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
        id: 'closed',
        name: 'Closed System',
        class: ClosedASEPVisualization
      },
      {
        id: 'open',
        name: 'Open System',
        class: OpenASEPVisualization
      },
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
      .addDropdown('currentVisualization', 'System Type', 'closed', [
        { value: 'closed', label: 'Closed System' },
        { value: 'open', label: 'Open System' },
        { value: 'circular', label: 'Circular System' }
      ])
      .addCheckbox('showBoundingBox', 'Show Bounding Box', false)
      .addSlider('animationSpeed', 'Animation Speed', 1.0, { min: 0.1, max: 3.0, step: 0.1 })
      .addCheckbox('isPaused', 'Pause Simulation', false)
      .addCheckbox('showLabels', 'Show Labels', false)
      .addSlider('animationSpeed', 'Animation Speed', 1.0, { min: 0.1, max: 3.0, step: 0.1 })
      .addCheckbox('isPaused', 'Pause Simulation', false)
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
      // Create all visualization instances
      for (const vizType of this.visualizationTypes) {
        const visualization = new vizType.class(this);
        this.registerVisualization(vizType.id, visualization);
      }
      
      // Set current visualization based on parameter or default to first one
      const currentVizId = this.pluginParameters.currentVisualization || 'closed';
      
      this.currentVisualization = this.visualizations.get(currentVizId) || 
                                 this.visualizations.get(this.visualizationTypes[0].id);
      
      // Log the visualization initialization
      console.log(`Initializing ASEP visualization: ${currentVizId}`);
      
      // Make sure we have some default parameter values for visualization parameters
      if (!this.visualizationParameters.numBoxes) {
        this.visualizationParameters.numBoxes = 10;
      }
      
      if (!this.visualizationParameters.numParticles) {
        this.visualizationParameters.numParticles = 5;
      }
      
      // Set up mandatory visualization parameters if missing
      if (!this.visualizationParameters.rightJumpRate) {
        this.visualizationParameters.rightJumpRate = 0.8;
      }
      
      if (!this.visualizationParameters.leftJumpRate) {
        this.visualizationParameters.leftJumpRate = 0.2;
      }
      
      if (currentVizId === 'open') {
        if (!this.visualizationParameters.entryRate) {
          this.visualizationParameters.entryRate = 0.5;
        }
        
        if (!this.visualizationParameters.exitRate) {
          this.visualizationParameters.exitRate = 0.5;
        }
      }
      
      // Initialize with all parameters
      console.log("Initializing with parameters:", {
        plugin: this.pluginParameters,
        visualization: this.visualizationParameters,
        advanced: this.advancedParameters
      });
      
      await this.currentVisualization.initialize({
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
   * Handle parameter changes
   * Override to provide better logging and parameter management
   */
  onParameterChanged(parameterId, value, parameterGroup = null) {
    console.log(`Parameter changed: ${parameterId} = ${value} (group: ${parameterGroup})`);
    
    // Special case for visualization switching
    if (parameterId === 'currentVisualization' && this.visualizations.has(value)) {
      console.log(`Switching visualization to ${value}`);
      this.setVisualization(value);
      return;
    }
    
    // Use parent implementation for other parameters
    super.onParameterChanged(parameterId, value, parameterGroup);
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
        if (this.currentVisualization && 
            typeof this.currentVisualization.toggleSimulation === 'function') {
          console.log("Toggling simulation pause state");
          this.currentVisualization.toggleSimulation();
          
          // Show notification to user
          if (this.core && this.core.uiManager) {
            const isPaused = this.visualizationParameters.isPaused;
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