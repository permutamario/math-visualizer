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
    
    // Add fullscreen button after initialization
    this.addFullscreenButton();
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
   * Add fullscreen toggle button to the UI
   */
  addFullscreenButton() {
    // Check if button already exists
    if (document.getElementById('fullscreen-button')) {
      return;
    }
    
    // Create button element
    const button = document.createElement('button');
    button.id = 'fullscreen-button';
    button.classList.add('fullscreen-button');
    button.innerHTML = '<span class="fullscreen-icon">⛶</span>';
    button.title = 'Toggle Fullscreen Mode';
    
    // Add styles for the button
    const style = document.createElement('style');
    style.textContent = `
      .fullscreen-button {
        position: fixed;
        z-index: 9999;
        background-color: rgba(26, 36, 51, 0.7);
        border: none;
        border-radius: 4px;
        color: white;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s, transform 0.1s;
      }
      
      .fullscreen-icon {
        font-size: 20px;
      }
      
      .fullscreen-button:hover {
        background-color: rgba(26, 36, 51, 0.9);
      }
      
      .fullscreen-button:active {
        transform: scale(0.95);
      }
      
      /* Desktop position */
      body:not(.mobile-device) .fullscreen-button {
        top: 20px;
        right: 20px;
      }
      
      /* Mobile position */
      body.mobile-device .fullscreen-button {
        top: 45px;
        right: 20px;
      }
      
      /* Fullscreen mode active */
      body.fullscreen-mode:not(.mobile-device) .control-panel {
        display: none !important;
      }
      
      body.fullscreen-mode .plugin-selector-button {
        opacity: 0.3;
      }
      
      body.fullscreen-mode .plugin-selector-button:hover {
        opacity: 1;
      }
      
      /* Mobile fullscreen mode */
      body.fullscreen-mode.mobile-device .mobile-header,
      body.fullscreen-mode.mobile-device .mobile-header-title,
      body.fullscreen-mode.mobile-device .mobile-control-bar {
        display: none !important;
      }
      
      body.fullscreen-mode.mobile-device .fullscreen-button {
        top: 10px;
        right: 10px;
        background-color: rgba(26, 36, 51, 0.5);
      }
    `;
    
    document.head.appendChild(style);
    
    // Handle click event
    button.addEventListener('click', () => {
      document.body.classList.toggle('fullscreen-mode');
      
      // Change button position in mobile fullscreen mode
      if (document.body.classList.contains('mobile-device') && 
          document.body.classList.contains('fullscreen-mode')) {
        button.style.top = '10px';
        button.style.right = '10px';
      } else if (document.body.classList.contains('mobile-device')) {
        button.style.top = '45px';
        button.style.right = '20px';
      }
    });
    
    // Add button to document
    document.body.appendChild(button);
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
      },
      {
        id: 'toggle-fullscreen',
        label: 'Toggle Fullscreen Mode'
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
          this.core.uiManager.updateControls(this.parameters);
        }
        return true;
        
      case 'restart-simulation':
        if (this.currentVisualization) {
          this.currentVisualization.initialize(this.parameters);
        }
        return true;
        
      case 'toggle-fullscreen':
        // Trigger the fullscreen button click
        const fullscreenButton = document.getElementById('fullscreen-button');
        if (fullscreenButton) {
          fullscreenButton.click();
        }
        return true;
        
      default:
        return super.executeAction(actionId, ...args);
    }
  }
  
  /**
   * Cleanup when plugin is deactivated
   */
  async deactivate() {
    // Remove fullscreen button when plugin is deactivated
    const fullscreenButton = document.getElementById('fullscreen-button');
    if (fullscreenButton) {
      fullscreenButton.remove();
    }
    
    // Remove fullscreen-mode class from body
    document.body.classList.remove('fullscreen-mode');
    
    // Remove style tag
    const style = document.querySelector('style[data-asep-styles]');
    if (style) {
      style.remove();
    }
    
    return await super.deactivate();
  }
}