// src/plugins/asep-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
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
   * Define parameters for this plugin
   * @returns {ParameterBuilder} Parameter builder
   */
  defineParameters() {
    // Get model type from parameters, defaulting to closed
    const modelType = this.parameters?.modelType || 'closed';
    
    // Create builder and add common parameters
    const params = createParameters()
      .addDropdown('modelType', 'Model Type', modelType, 
        this.visualizationTypes.map(vt => ({
          value: vt.id,
          label: vt.name
        })))
      .addSlider('numBoxes', 'Number of Sites', 20, { min: 5, max: 50, step: 1 })
      .addSlider('numParticles', 'Number of Particles', 10, { min: 1, max: 40, step: 1 })
      .addSlider('rightJumpRate', 'Right Jump Rate', 1.0, { min: 0.1, max: 5, step: 0.1 })
      .addSlider('leftJumpRate', 'Left Jump Rate', 0.5, { min: 0, max: 5, step: 0.1 });
    
    // Add model-specific parameters
    if (modelType === 'open') {
      params
        .addSlider('entryRate', 'Entry Rate (Open)', 0.5, { min: 0, max: 5, step: 0.1 })
        .addSlider('exitRate', 'Exit Rate (Open)', 0.5, { min: 0, max: 5, step: 0.1 });
    }
    
    // Add animation parameters
    params
      .addSlider('animationSpeed', 'Animation Speed', 1.0, { min: 0.1, max: 5, step: 0.1 })
      .addCheckbox('isPaused', 'Pause Simulation', false, 'structural')
      .addCheckbox('showLabels', 'Show Labels', false);
    
    // Add color palette from core
    if (this.core && this.core.colorSchemeManager) {
      params.addDropdown('colorPalette', 'Color Palette', 'default', 
        this.core.colorSchemeManager.getPaletteNames().map(name => ({
          value: name, 
          label: name
        })), 'visual');
    }
    
    return params;
  }
  
  /**
   * Define available actions for this plugin
   * @returns {Array<Action>} List of available actions
   */
  defineActions() {
    return [
      ...super.defineActions(),
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
   * Load the plugin
   * Called when the plugin is selected
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log("Loading ASEP plugin...");
      
      // Set up default parameters from parameter builder
      const schema = this.defineParameters().build();
      this.parameters = this._getDefaultParametersFromSchema(schema);
      
      // Add default colors for backward compatibility if not using core
      if (!this.core || !this.core.colorSchemeManager) {
        this.parameters.particleColor = '#3498db';
        this.parameters.jumpColor = '#ff5722';
        this.parameters.boxColor = '#2c3e50';
        this.parameters.portalColor = '#9C27B0';
      }
      
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
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value 
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
      // For other parameters, just update with the changed parameter
      this.currentVisualization.update({ [parameterId]: value });
    }
    
    // Update UI
    this.giveParameters(false);
    
    // Request rendering update
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
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