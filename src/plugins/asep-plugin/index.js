// src/plugins/asep-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { LinearASEPVisualization } from './LinearASEPVisualization.js';

export default class ASEPPlugin extends Plugin {
  static id = "asep-plugin";
  static name = "ASEP Simulation";
  static description = "Asymmetric Simple Exclusion Process simulation";
  static renderingType = "2d";

  async _initializeDefaultVisualization() {
    const visualization = new LinearASEPVisualization(this);
    this.registerVisualization('linear', visualization);
    this.currentVisualization = visualization;
    await visualization.initialize(this.parameters);
  }

  getParameterSchema() {
    return {
      structural: [
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
      ],
      visual: [
        {
          id: 'boxWidth',
          type: 'slider',
          label: 'Box Width',
          min: 20,
          max: 100,
          step: 5,
          default: 50
        },
        {
          id: 'boxHeight',
          type: 'slider',
          label: 'Box Height',
          min: 20,
          max: 100,
          step: 5,
          default: 40
        },
        {
          id: 'particleRadius',
          type: 'slider',
          label: 'Particle Size',
          min: 5,
          max: 25,
          step: 1,
          default: 15
        },
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
    
    // Handle structural parameter changes that require reinitializing
    const structuralParams = ['numBoxes', 'numParticles', 'rightJumpRate', 'leftJumpRate'];
    if (structuralParams.includes(parameterId) && this.currentVisualization) {
      // Reinitialize visualization with updated parameters
      this.currentVisualization.initialize(this.parameters);
    } else if (this.currentVisualization) {
      // For visual parameters, just update without reinitializing
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
        label: 'Toggle Simulation'
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
          this.currentVisualization.toggleSimulation();
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