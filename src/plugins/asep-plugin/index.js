// src/plugins/asep-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { ASEPOpenVisualization } from './ASEPOpenVisualization.js';
import { ASEPCircularVisualization } from './ASEPCircularVisualization.js';

export default class ASEPPlugin extends Plugin {
  static id = "asep-plugin";
  static name = "Asymmetric Simple Exclusion Process";
  static description = "Simulate and visualize the ASEP model with open or circular boundary conditions";
  static renderingType = "2d";

  async _initializeDefaultVisualization() {
    // Create both visualizations
    const openVisualization = new ASEPOpenVisualization(this);
    const circularVisualization = new ASEPCircularVisualization(this);
    
    // Register visualizations
    this.registerVisualization('open', openVisualization);
    this.registerVisualization('circular', circularVisualization);
    
    // Set default visualization based on parameters
    if (this.parameters.boundaryType === 'circular') {
      this.currentVisualization = circularVisualization;
    } else {
      this.currentVisualization = openVisualization;
    }
    
    // Initialize the current visualization
    await this.currentVisualization.initialize(this.parameters);
  }

  getParameterSchema() {
    return {
      structural: [
        {
          id: 'boundaryType',
          type: 'dropdown',
          label: 'Boundary Type',
          options: [
            { value: 'open', label: 'Open (with reservoirs)' },
            { value: 'circular', label: 'Circular (periodic)' }
          ],
          default: 'open'
        },
        {
          id: 'latticeSize',
          type: 'slider',
          label: 'Lattice Size',
          min: 10,
          max: 200,
          step: 5,
          default: 50
        },
        {
          id: 'particleDensity',
          type: 'slider',
          label: 'Initial Particle Density',
          min: 0.1,
          max: 0.9,
          step: 0.05,
          default: 0.5
        },
        {
          id: 'rightHopRate',
          type: 'slider',
          label: 'Right Hop Rate',
          min: 0,
          max: 1,
          step: 0.05,
          default: 0.75
        },
        {
          id: 'leftHopRate',
          type: 'slider',
          label: 'Left Hop Rate',
          min: 0,
          max: 1,
          step: 0.05,
          default: 0.25
        },
        {
          id: 'simulationSpeed',
          type: 'slider',
          label: 'Simulation Speed',
          min: 0.1,
          max: 5,
          step: 0.1,
          default: 1
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
          id: 'emptyColor',
          type: 'color',
          label: 'Empty Site Color',
          default: '#f5f5f5'
        },
        {
          id: 'showDensityProfile',
          type: 'checkbox',
          label: 'Show Density Profile',
          default: true
        },
        {
          id: 'showCurrentProfile',
          type: 'checkbox',
          label: 'Show Current Profile',
          default: true
        },
        {
          id: 'siteSize',
          type: 'slider',
          label: 'Site Size',
          min: 5,
          max: 30,
          step: 1,
          default: 12
        }
      ]
    };
  }

  onParameterChanged(parameterId, value) {
    // Update parameter
    this.parameters[parameterId] = value;
    
    // Switch visualization if boundary type changes
    if (parameterId === 'boundaryType' && this.isActive) {
      const visType = value === 'circular' ? 'circular' : 'open';
      this.setVisualization(visType);
    } else if (this.currentVisualization) {
      // Update current visualization with new parameters
      this.currentVisualization.update(this.parameters);
    }
  }

  getActions() {
    return [
      ...super.getActions(),
      {
        id: 'reset-simulation',
        label: 'Reset Simulation'
      },
      {
        id: 'toggle-pause',
        label: 'Play/Pause Simulation'
      }
    ];
  }

  executeAction(actionId, ...args) {
    switch (actionId) {
      case 'reset-simulation':
        if (this.currentVisualization) {
          this.currentVisualization.resetSimulation();
        }
        return true;
        
      case 'toggle-pause':
        if (this.currentVisualization) {
          this.currentVisualization.togglePause();
        }
        return true;
    }
    
    // Let parent handle other actions
    return super.executeAction(actionId, ...args);
  }
}