// src/plugins/asep-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { ClosedASEPVisualization } from './ClosedASEPVisualization.js';
import { OpenASEPVisualization } from './OpenASEPVisualization.js';
import { CircularASEPVisualization } from './CircularASEPVisualization.js';

export default class ASEPPlugin extends Plugin {
  static id = "asep-plugin";
  static name = "ASEP Simulation";
  static description = "Asymmetric Simple Exclusion Process simulation";
  static renderingType = "2d";

  constructor(core) {
    super(core);
    
    // Initialize the visualization map - but don't create instances yet
    this.visualizationTypes = [
      {
        id: 'closed',
        name: 'Closed Linear',
        class: ClosedASEPVisualization
      },
      {
        id: 'open',
        name: 'Open Boundary',
        class: OpenASEPVisualization
      },
      {
        id: 'circular',
        name: 'Circular',
        class: CircularASEPVisualization
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
      console.log("Loading ASEP plugin...");
      
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
   * Unload the plugin
   * Called when another plugin is selected
   */
  async unload() {
    if (!this.isLoaded) return true;
    
    try {
      console.log("Unloading ASEP plugin...");
      
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
      
      console.log("ASEP plugin unloaded successfully");
      return true;
    } catch (error) {
      console.error(`Error unloading ASEPPlugin:`, error);
      return false;
    }
  }

  /**
   * Initialize the default visualization
   * @private
   */
  async _initializeDefaultVisualization() {
    // Get model type from parameters, defaulting to closed
    const modelType = this.parameters.modelType || 'closed';
    
    // Find visualization info
    const vizInfo = this.visualizationTypes.find(vt => vt.id === modelType) || 
                   this.visualizationTypes[0];
    
    // Create all visualization instances
    for (const vizType of this.visualizationTypes) {
      const visualization = new vizType.class(this);
      this.registerVisualization(vizType.id, visualization);
    }
    
    // Set current visualization
    this.currentVisualization = this.visualizations.get(vizInfo.id);
    
    // Initialize with current parameters
    if (this.currentVisualization) {
      await this.currentVisualization.initialize(this.parameters);
    }
    
    return true;
  }

  /**
   * Get parameter schema
   */
  getParameterSchema() {
    // Common parameters for all models
    const commonParams = [
      {
        id: 'modelType',
        type: 'dropdown',
        label: 'Model Type',
        options: this.visualizationTypes.map(vt => ({
          value: vt.id,
          label: vt.name
        })),
        default: 'closed'
      },
      {
        id: 'numBoxes',
        type: 'slider',
        label: 'Number of Sites',
        min: 5,
        max: 50,
        step: 1,
        default: 20
      },
      {
        id: 'numParticles',
        type: 'slider',
        label: 'Number of Particles',
        min: 1,
        max: 40,
        step: 1,
        default: 10
      },
      {
        id: 'rightJumpRate',
        type: 'slider',
        label: 'Right Jump Rate',
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1.0
      },
      {
        id: 'leftJumpRate',
        type: 'slider',
        label: 'Left Jump Rate',
        min: 0,
        max: 5,
        step: 0.1,
        default: 0.5
      }
    ];
    
    // Model-specific parameters
    let specificParams = [];
    
    // Add model-specific parameters based on current model type
    const currentType = this.parameters?.modelType || 'closed';
    
    if (currentType === 'open') {
      specificParams = [
        {
          id: 'entryRate',
          type: 'slider',
          label: 'Entry Rate (Open)',
          min: 0,
          max: 5,
          step: 0.1,
          default: 0.5
        },
        {
          id: 'exitRate',
          type: 'slider',
          label: 'Exit Rate (Open)',
          min: 0,
          max: 5,
          step: 0.1,
          default: 0.5
        }
      ];
    }
    
    // Combine common and specific parameters
    const allStructuralParams = [...commonParams, ...specificParams];
    
    // Add animation parameters
    allStructuralParams.push(
      {
        id: 'animationSpeed',
        type: 'slider',
        label: 'Animation Speed',
        min: 0.1,
        max: 5,
        step: 0.1,
        default: 1.0
      },
      {
        id: 'isPaused',
        type: 'checkbox',
        label: 'Pause Simulation',
        default: false
      }
    );
    
    return {
      structural: allStructuralParams,
      visual: [
        {
          id: 'particleColor',
          type: 'color',
          label: 'Particle Color',
          default: '#3498db'
        },
        {
          id: 'jumpColor',
          type: 'color',
          label: 'Jump Color',
          default: '#ff5722'
        },
        {
          id: 'boxColor',
          type: 'color',
          label: 'Box Color',
          default: '#2c3e50'
        },
        {
          id: 'portalColor',
          type: 'color',
          label: 'Portal Color (Open)',
          default: '#9C27B0'
        },
        {
          id: 'showLabels',
          type: 'checkbox',
          label: 'Show Labels',
          default: false
        }
      ]
    };
  }

  /**
   * Handle parameter changes
   */
  async onParameterChanged(parameterId, value) {
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Handle model type change (switch visualization)
    if (parameterId === 'modelType') {
      const newViz = this.visualizations.get(value);
      
      if (newViz && newViz !== this.currentVisualization) {
        // Set the new visualization as current
        this.currentVisualization = newViz;
        
        // Initialize the visualization with current parameters
        await this.currentVisualization.initialize(this.parameters);
        
        // Update the parameter schema to reflect the new model type
        this.giveParameters(true);
      }
    } 
    // Handle pause toggle
    else if (parameterId === 'isPaused' && this.currentVisualization) {
      this.currentVisualization.update({ isPaused: value });
    }
    // Handle structural parameter changes that require reinitializing
    else if (['numBoxes', 'numParticles'].includes(parameterId) && this.currentVisualization) {
      // Reinitialize visualization with updated parameters
      await this.currentVisualization.initialize(this.parameters);
    } 
    else if (this.currentVisualization) {
      // For other parameters, just update without reinitializing
      this.currentVisualization.update(this.parameters);
    }
    
    // Update UI (in case parameters affect UI state)
    this.giveParameters(false);
    
    // Request rendering update if needed
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }
  
  /**
   * Get available actions for this plugin
   */
  getActions() {
    return [
      ...super.getActions(),
      {
        id: 'toggle-simulation',
        label: 'Play/Pause Simulation'
      },
      {
        id: 'restart-simulation',
        label: 'Restart Simulation'
      }
    ];
  }
  
  /**
   * Execute an action
   */
  executeAction(actionId, ...args) {
    switch (actionId) {
      case 'toggle-simulation':
        if (this.currentVisualization) {
          // Toggle the isPaused parameter which will update the visualization
          this.parameters.isPaused = !this.parameters.isPaused;
          this.currentVisualization.update({ isPaused: this.parameters.isPaused });
          
          // Update UI to reflect the new state
          this.giveParameters(false);
          
          // Request render update
          if (this.core && this.core.renderingManager) {
            this.core.renderingManager.requestRender();
          }
        }
        return true;
        
      case 'restart-simulation':
        if (this.currentVisualization) {
          this.currentVisualization.initialize(this.parameters);
          
          // Request render update
          if (this.core && this.core.renderingManager) {
            this.core.renderingManager.requestRender();
          }
        }
        return true;
        
      default:
        return super.executeAction(actionId, ...args);
    }
  }
}
