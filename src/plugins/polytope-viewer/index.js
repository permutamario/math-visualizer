// src/plugins/polytope-viewer/index.js
import { Plugin } from '../../core/Plugin.js';
import { PlatonicVisualization } from './visualizations/PlatonicVisualization.js';
import { PermutahedronVisualization } from './visualizations/PermutahedronVisualization.js';

export default class PolytopeViewerPlugin extends Plugin {
  static id = "polytope-viewer";
  static name = "Polytope Viewer";
  static description = "Interactive 3D polytope visualizations";
  static renderingType = "3d"; // Using THREE.js for 3D rendering

  constructor(core) {
    super(core);
    
    // Initialize the visualization types
    this.visualizationTypes = [
      {
        id: 'platonic',
        name: 'Platonic Solids',
        createVisualization: () => new PlatonicVisualization(this)
      },
      {
        id: 'permutahedron',
        name: 'Permutahedron',
        createVisualization: () => new PermutahedronVisualization(this)
      }
    ];
  }

  async _initializeDefaultVisualization() {
    // Get the selected visualization type
    const selectedType = this.parameters.visualizationType || 'platonic';
    
    // Find the visualization info
    const vizInfo = this.visualizationTypes.find(vt => vt.id === selectedType);
    
    if (!vizInfo) {
      console.error(`Visualization type ${selectedType} not found`);
      return false;
    }
    
    // Create and register the visualization
    const visualization = vizInfo.createVisualization();
    this.registerVisualization(vizInfo.id, visualization);
    
    // Set as current visualization
    this.currentVisualization = visualization;
    
    // Initialize the visualization with parameters
    await this.currentVisualization.initialize(this.parameters);
    
    return true;
  }

  getParameterSchema() {
    // Setup visualization type selector (the only parameter this plugin manages directly)
    const visualizationTypeOptions = this.visualizationTypes.map(vt => ({
      value: vt.id,
      label: vt.name
    }));
    
    // Base structural parameters - just the visualization type selector
    const structural = [
      {
        id: 'visualizationType',
        type: 'dropdown',
        label: 'Visualization Type',
        options: visualizationTypeOptions,
        default: this.visualizationTypes[0].id
      }
    ];
    
    // If we have a current visualization, add its parameters
    if (this.currentVisualization) {
      const vizParams = this.currentVisualization.getParameterSchema();
      
      // Add visualization specific parameters
      if (vizParams.structural) {
        structural.push(...vizParams.structural);
      }
      
      return {
        structural,
        visual: vizParams.visual || []
      };
    }
    
    // Default empty schema if no visualization is active
    return {
      structural,
      visual: []
    };
  }
  
  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value
   */
  onParameterChanged(parameterId, value) {
    // Store previous value for comparison
    const prevValue = this.parameters[parameterId];
    
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Check if changing visualization type
    if (parameterId === 'visualizationType' && value !== prevValue) {
      // Create and initialize the new visualization
      this._handleVisualizationTypeChange(value);
      return;
    }
    
    // Pass other parameter changes to current visualization
    if (this.currentVisualization) {
      this.currentVisualization.onParameterChanged(
        parameterId, 
        value,
        prevValue
      );
      
      // Request a render update
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
    }
  }
  
  /**
   * Handle visualization type change
   * @param {string} newType - New visualization type
   * @private
   */
  async _handleVisualizationTypeChange(newType) {
    try {
      // Find visualization info
      const vizInfo = this.visualizationTypes.find(vt => vt.id === newType);
      
      if (!vizInfo) {
        console.error(`Visualization type ${newType} not found`);
        return;
      }
      
      // Dispose current visualization if exists
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
      }
      
      // Create new visualization instance
      const visualization = vizInfo.createVisualization();
      
      // Register and set as current
      this.registerVisualization(vizInfo.id, visualization);
      this.currentVisualization = visualization;
      
      // Initialize with current parameters
      await this.currentVisualization.initialize(this.parameters);
      
      // Update UI with new parameters schema
      if (this.core && this.core.uiManager) {
        const paramSchema = this.getParameterSchema();
        this.core.uiManager.buildControlsFromSchema(paramSchema, this.parameters);
      }
      
      // Request render
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
    } catch (error) {
      console.error("Error changing visualization type:", error);
    }
  }
  
  /**
   * Get available actions for this plugin
   */
  getActions() {
    // Default actions from parent
    const baseActions = super.getActions();
    
    // If we have a current visualization, include its actions
    if (this.currentVisualization && typeof this.currentVisualization.getActions === 'function') {
      return [...baseActions, ...this.currentVisualization.getActions()];
    }
    
    return baseActions;
  }
  
  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   */
  executeAction(actionId, ...args) {
    // Try parent actions first
    const handled = super.executeAction(actionId, ...args);
    if (handled) return true;
    
    // If not handled by parent and we have a visualization, let it try
    if (this.currentVisualization && 
        typeof this.currentVisualization.executeAction === 'function') {
      return this.currentVisualization.executeAction(actionId, ...args);
    }
    
    return false;
  }
}