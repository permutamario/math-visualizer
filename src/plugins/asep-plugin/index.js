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
    
    // Create visualization instances map (will be populated in initialize)
    this.visualizations = {
      'closed': null
      //'open': null,
      //'circular': null
    };
  }

  async _initializeDefaultVisualization() {
    // Create all visualization types
    this.visualizations = {
      'closed': new ClosedASEPVisualization(this),
      'open': new OpenASEPVisualization(this),
      'circular': new CircularASEPVisualization(this)
    };
    
    // Register all visualizations
    for (const [key, viz] of Object.entries(this.visualizations)) {
      this.registerVisualization(key, viz);
    }
    
    // Get model type from parameters
    const modelType = this.parameters.modelType || 'closed';
    
    // Set initial visualization
    this.currentVisualization = this.visualizations[modelType];
    
    // Initialize the visualization
    await this.currentVisualization.initialize(this.parameters);
  }

  getParameterSchema() {
    return {
      structural: [
        {
          id: 'modelType',
          type: 'dropdown',
          label: 'Model Type',
          options: [
            { value: 'closed', label: 'Closed Linear' },
            { value: 'open', label: 'Open Boundary' },
            { value: 'circular', label: 'Circular' }
          ],
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
        },
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
        },
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
      ],
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
        }
      ]
    };
  }
  
  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value
   */
  onParameterChanged(parameterId, value) {
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Handle model type change (switch visualization)
    if (parameterId === 'modelType') {
      // Get the new visualization
      const newViz = this.visualizations[value];
      
      if (newViz && newViz !== this.currentVisualization) {
        // Deactivate current visualization if needed
        if (this.currentVisualization) {
          this.currentVisualization.dispose();
        }
        
        // Set and initialize the new visualization
        this.currentVisualization = newViz;
        this.currentVisualization.initialize(this.parameters);
      }
    } 
    // Handle pause toggle
    else if (parameterId === 'isPaused' && this.currentVisualization) {
      this.currentVisualization.update({ isPaused: value });
    }
    // Handle structural parameter changes that require reinitializing
    else if (['numBoxes', 'numParticles'].includes(parameterId) && this.currentVisualization) {
      // Reinitialize visualization with updated parameters
      this.currentVisualization.initialize(this.parameters);
    } 
    else if (this.currentVisualization) {
      // For other parameters, just update without reinitializing
      this.currentVisualization.update(this.parameters);
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
   * @param {string} actionId - ID of the action to execute
   */
  executeAction(actionId, ...args) {
    switch (actionId) {
      case 'toggle-simulation':
        if (this.currentVisualization) {
          // Toggle the isPaused parameter which will update the visualization
          this.parameters.isPaused = !this.parameters.isPaused;
          this.currentVisualization.update({ isPaused: this.parameters.isPaused });
          
          // Update UI to reflect the new state
          if (this.core && this.core.uiManager) {
            this.core.uiManager.updateControls(this.parameters);
          }
        }
        return true;
        
      case 'restart-simulation':
        if (this.currentVisualization) {
          this.currentVisualization.initialize(this.parameters);
        }
        return true;
        
      default:
        return super.executeAction(actionId, ...args);
    }
  }
}