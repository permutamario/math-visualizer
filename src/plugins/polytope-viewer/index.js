// src/plugins/polytope-viewer/index.js
import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { BasePolytopeVisualization } from './BasePolytopeVisualization.js';

// Import visualization classes directly to ensure they're available
import { PlatonicVisualization } from './visualizations/PlatonicVisualization.js';
import { PermutahedronVisualization } from './visualizations/PermutahedronVisualization.js';
import { RootPolytopeVisualization } from './visualizations/RootPolytopeVisualization.js';
import { StellahedronVisualization } from './visualizations/StellahedronVisualization.js';
import { OrbitPolytopeVisualization } from './visualizations/OrbitPolytopeVisualization.js';
import { AssociahedronVisualization } from './visualizations/AssociahedronVisualization.js';

export default class PolytopeViewerPlugin extends Plugin {
  static id = "polytope-viewer";
  static name = "Polytope Viewer";
  static description = "Interactive 3D polytope visualizations";
  static renderingType = "3d"; // Using THREE.js for 3D rendering

  constructor(core) {
    super(core);
    
    // Initialize with known visualizations to avoid empty array issues
    this.visualizationTypes = [
      {
        id: 'platonic',
        name: 'Platonic Solids',
        class: PlatonicVisualization
      },
      {
        id: 'permutahedron',
        name: 'Permutahedron',
        class: PermutahedronVisualization
      },
      {
        id: 'rootpolytope',
        name: 'Root Polytope',
        class: RootPolytopeVisualization
      },
      {
        id: 'stellahedron',
        name: 'Stellahedron',
        class: StellahedronVisualization
      },
      {
        id: 'orbitpolytope',
        name: 'Orbit Polytope',
        class: OrbitPolytopeVisualization
      },
      {
        id: 'associahedron',
        name: 'Associahedron',
        class: AssociahedronVisualization
      }
    ];
    
    // Flag to track visualization switching in progress
    this.isSwitchingVisualization = false;
  }

  /**
   * Define plugin-level parameters
   * @returns {Array} Array of parameter definitions
   */
  definePluginParameters() {
    // Visualization type selector options
    const visualizationTypeOptions = this.visualizationTypes.map(vt => ({
      value: vt.id,
      label: vt.name
    }));
    
    // Current visualization type, defaulting to first one if not set
    const currentType = this.pluginParameters?.visualizationType || 
                      (this.visualizationTypes.length > 0 ? 
                       this.visualizationTypes[0].id : '');
    
    // Create parameter builder with plugin-specific parameters
    return createParameters()
      .addDropdown('visualizationType', 'Polytope Class', currentType, visualizationTypeOptions)
      .addCheckbox('rotation', 'Auto-rotate', false)
      .addCheckbox('showEdges', 'Show Edges', true)
      .build();
  }
  
  /**
   * Define advanced parameters
   * @returns {Array} Array of parameter definitions
   */
  defineAdvancedParameters() {
    // Add advanced parameters if needed 
    return createParameters()
      .addSlider('particleSize', 'Vertex Size', 0.05, { min: 0.01, max: 0.2, step: 0.01 })
      .addCheckbox('showVertices', 'Show Vertices', false)
      .addColor('vertexColor', 'Vertex Color', '#e74c3c')
      .build();
  }

  /**
   * Define available actions
   * @returns {Array<Action>} List of available actions
   */
  defineActions() {
    return [
      ...super.defineActions(),
      {
        id: 'reset-camera',
        label: 'Reset Camera'
      },
      {
        id: 'toggle-rotation',
        label: 'Toggle Rotation'
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
      console.log("Loading polytope-viewer plugin...");
      
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
      
      console.log("Polytope-viewer plugin loaded successfully");
      return true;
    } catch (error) {
      console.error(`Error loading PolytopeViewerPlugin:`, error);
      
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
    // Create and register all visualization instances
    for (const vizType of this.visualizationTypes) {
      const visualization = new vizType.class(this);
      this.registerVisualization(vizType.id, visualization);
    }
    
    // Set the default visualization as current
    const selectedType = this.pluginParameters.visualizationType || this.visualizationTypes[0].id;
    this.currentVisualization = this.visualizations.get(selectedType);
    
    if (!this.currentVisualization) {
      // Fallback to first visualization if selected type wasn't found
      this.currentVisualization = this.visualizations.get(this.visualizationTypes[0].id);
    }
    
    // Initialize current visualization with all parameters
    await this.currentVisualization.initialize({
      ...this.pluginParameters,
      ...this.visualizationParameters,
      ...this.advancedParameters
    });
    
    return true;
  } catch (error) {
    console.error("Error initializing visualizations:", error);
    return false;
  }
}

  /**
   * Handle parameter changes for visualization type
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value 
   * @param {string} parameterGroup - Which group the parameter belongs to
   */
  onParameterChanged(parameterId, value, parameterGroup = null) {
    // Check if we're in the middle of a visualization switch
    if (this.isSwitchingVisualization) {
      console.log(`Parameter change for ${parameterId} ignored during visualization switch`);
      return;
    }
    
    // Special handling for visualization type changes
    if (parameterId === 'visualizationType' && parameterGroup === 'plugin') {
      // First update the parameter using parent method
      super.onParameterChanged(parameterId, value, parameterGroup);
      
      // Then switch visualization
      this.switchVisualization(value);
      return;
    }
    
    // For normal parameters, use the parent implementation
    super.onParameterChanged(parameterId, value, parameterGroup);
  }
  
  /**
   * Switch to a new visualization type
   * @param {string} visualizationType - ID of the visualization type to switch to
   */
  async switchVisualization(visualizationType) {
    if (this.isSwitchingVisualization) {
      console.log(`Visualization switch to ${visualizationType} ignored, another switch in progress`);
      return;
    }
    
    this.isSwitchingVisualization = true;
    console.log(`Switching visualization to ${visualizationType}...`);
    
    try {
      // Just use the setVisualization method from the parent class
      const success = await this.setVisualization(visualizationType);
      
      if (success) {
        console.log(`Visualization switched to ${visualizationType} successfully`);
      } else {
        console.error(`Failed to switch visualization to ${visualizationType}`);
      }
    } catch (error) {
      console.error(`Error switching visualization to ${visualizationType}:`, error);
      
      // Notify the user of the error
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showError(`Failed to switch visualization: ${error.message}`);
      }
    } finally {
      // Always clear the switching flag when done
      this.isSwitchingVisualization = false;
    }
  }
  
  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    // Don't process actions during visualization switching
    if (this.isSwitchingVisualization) {
      console.log(`Action ${actionId} ignored during visualization switch`);
      return false;
    }
    
    if (actionId === 'toggle-rotation') {
      // Toggle rotation parameter
      const newValue = !this.pluginParameters.rotation;
      this.updateParameter('rotation', newValue, 'plugin', true);
      return true;
    } 
    else if (actionId === 'reset-camera') {
      // Reset camera if the RenderingManager has access to it
      if (this.core && this.core.renderingManager) {
        const env = this.core.renderingManager.getCurrentEnvironment();
        if (env && env.getControls && typeof env.getControls === 'function') {
          const controls = env.getControls();
          if (controls && typeof controls.reset === 'function') {
            controls.reset();
            return true;
          }
        }
      }
      return true;
    }
    
    return super.executeAction(actionId, ...args);
  }
}