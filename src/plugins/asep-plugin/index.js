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
      
      // Initialize with all parameters
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