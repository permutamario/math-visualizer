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
   * Define parameters for this plugin
   * @returns {ParameterBuilder} Parameter builder
   */
  defineParameters() {
    // Visualization type selector options
    const visualizationTypeOptions = this.visualizationTypes.map(vt => ({
      value: vt.id,
      label: vt.name
    }));
    
    // Current visualization type, defaulting to first one if not set
    const currentType = this.parameters?.visualizationType || 
                      (this.visualizationTypes.length > 0 ? 
                       this.visualizationTypes[0].id : '');
    
    // Create parameter builder
    const params = createParameters()
      .addDropdown('visualizationType', 'Polytope Class', currentType, visualizationTypeOptions)
      .addCheckbox('wireframe', 'Wireframe', false, 'visual')
      .addCheckbox('rotation', 'Auto-rotate', false, 'visual')
      .addCheckbox('showEdges', 'Show Edges', true, 'visual')
      .addCheckbox('showVertices', 'Show Vertices', false, 'visual')
      .addSlider('vertexSize', 'Vertex Size', 0.05, { min: 0.01, max: 0.2, step: 0.01 }, 'visual')
      .addColor('faceColor', 'Face Color', '#3498db', 'visual')
      .addColor('edgeColor', 'Edge Color', '#2c3e50', 'visual')
      .addColor('vertexColor', 'Vertex Color', '#e74c3c', 'visual')
      .addSlider('opacity', 'Opacity', 1, { min: 0.1, max: 1, step: 0.1 }, 'visual')
      .addDropdown('usePalette', 'Use Color Palette', 'none', [
  { value: 'none', label: 'Single Color' },
  { value: 'true', label: 'Use Palette' }
], 'visual')
.addDropdown('colorPalette', 'Color Palette', 'default', [
  { value: 'default', label: 'Default' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'blues', label: 'Blues' },
  { value: 'greens', label: 'Greens' },
  { value: 'reds', label: 'Reds' },
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'sequential', label: 'Sequential' },
  { value: 'diverging', label: 'Diverging' }
], 'visual');
      
    
    // Add visualization-specific parameters if available
    if (this.currentVisualization) {
      const vizClass = this.currentVisualization.constructor;
      
      // Check if the visualization class has static parameters method
      if (vizClass && typeof vizClass.getParameters === 'function') {
        const vizParams = vizClass.getParameters();
        
        // Add visualization-specific structural parameters
        if (vizParams.structural && vizParams.structural.length > 0) {
          for (const param of vizParams.structural) {
            // Add to our parameter builder based on type
            switch(param.type) {
              case 'dropdown':
                params.addDropdown(param.id, param.label, param.default, param.options);
                break;
              case 'slider':
                params.addSlider(param.id, param.label, param.default, { 
                  min: param.min, 
                  max: param.max, 
                  step: param.step 
                });
                break;
              case 'text':
                params.addText(param.id, param.label, param.default);
                break;
              // Add other types as needed
            }
          }
        }
        
        // Add visualization-specific visual parameters
        if (vizParams.visual && vizParams.visual.length > 0) {
          for (const param of vizParams.visual) {
            // Add to our parameter builder based on type
            switch(param.type) {
              case 'checkbox':
                params.addCheckbox(param.id, param.label, param.default, 'visual');
                break;
              case 'slider':
                params.addSlider(param.id, param.label, param.default, { 
                  min: param.min, 
                  max: param.max, 
                  step: param.step 
                }, 'visual');
                break;
              case 'color':
                params.addColor(param.id, param.label, param.default, 'visual');
                break;
              // Add other types as needed
            }
          }
        }
      }
    }
    
    return params;
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
      
      // Try to discover more visualizations from manifest
      try {
        await this.discoverVisualizations();
      } catch (error) {
        console.warn("Could not discover visualizations from manifest:", error);
        // Continue with hard-coded visualizations
      }
      
      // Set up default parameters from parameter builder
      const schema = this.defineParameters().build();
      this.parameters = this._getDefaultParametersFromSchema(schema);
      
      // Set default visualization type if not already set
      if (!this.parameters.visualizationType) {
        this.parameters.visualizationType = this.visualizationTypes[0].id;
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
    if (this.visualizationTypes.length === 0) {
      console.error("No visualizations available to initialize");
      return false;
    }
    
    // Get the selected visualization type
    const selectedType = this.parameters.visualizationType || this.visualizationTypes[0].id;
    
    // Find the visualization info
    const vizInfo = this.visualizationTypes.find(vt => vt.id === selectedType) || 
                   this.visualizationTypes[0];
    
    // Create and register visualization
    const visualization = new vizInfo.class(this);
    this.registerVisualization(vizInfo.id, visualization);
    this.currentVisualization = visualization;
    
    // Initialize with current parameters
    await visualization.initialize(this.parameters);
    
    return true;
  }

  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value 
   */
  async onParameterChanged(parameterId, value) {
    // Check if we're in the middle of a visualization switch
    if (this.isSwitchingVisualization) {
      console.log(`Parameter change for ${parameterId} ignored during visualization switch`);
      return;
    }
    
    // Update the parameter value
    this.parameters[parameterId] = value;
    
    // Special handling for visualization type changes
    if (parameterId === 'visualizationType') {
      await this.switchVisualization(value);
      return;
    }
    
    // Update visualization with only the changed parameter
    if (this.currentVisualization) {
      // Create a parameter update object with just the changed parameter
      const paramUpdate = { [parameterId]: value };
      this.currentVisualization.update(paramUpdate);
      
      // Update UI with changed parameters
      this.giveParameters(false);
      
      // Request a render update
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
    }
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
      // Update our parameter tracking
      this.parameters.visualizationType = visualizationType;
      
      // Find visualization info
      const vizInfo = this.visualizationTypes.find(vt => vt.id === visualizationType);
      
      if (!vizInfo) {
        throw new Error(`Visualization type ${visualizationType} not found`);
      }
      
      // Check if this visualization already exists
      if (!this.visualizations.has(visualizationType)) {
        // Create new visualization instance
        const visualization = new vizInfo.class(this);
        this.registerVisualization(visualizationType, visualization);
      }
      
      // Save current visualization to dispose later
      const oldVisualization = this.currentVisualization;
      
      // Get the visualization instance
      this.currentVisualization = this.visualizations.get(visualizationType);
      
      // Preserve common parameters across visualizations
      const commonParams = this.preserveCommonParameters(this.parameters);
      
      // Get a fresh set of parameters for the new visualization
      const schema = this.defineParameters().build();
      const defaultParams = this._getDefaultParametersFromSchema(schema);
      
      // Merge with preserved common parameters
      const mergedParams = {
        ...defaultParams,
        ...commonParams,
        visualizationType // Ensure this is set correctly
      };
      
      // Update our parameters object with the merged parameters
      this.parameters = mergedParams;
      
      // Initialize with merged parameters - await this to ensure visualization is ready
      await this.currentVisualization.initialize(this.parameters);
      
      // Dispose old visualization now that new one is initialized
      if (oldVisualization && oldVisualization !== this.currentVisualization) {
        oldVisualization.dispose();
      }
      
      // Now that initialization is complete, update UI with new schema
      this.giveParameters(true);
      
      // Request a render
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
      
      console.log(`Visualization switched to ${visualizationType} successfully`);
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
   * Preserve common parameters when switching visualizations
   * @param {Object} currentParams - Current parameter values
   * @returns {Object} Common parameters to preserve
   */
  preserveCommonParameters(currentParams) {
    // Parameters that should be preserved across visualization switches
    const commonParamIds = [
      'wireframe', 'rotation', 'showEdges', 'showVertices',
      'vertexSize', 'faceColor', 'edgeColor', 'vertexColor', 'opacity'
    ];
    
    const preserved = {};
    
    // Copy parameters that exist in current parameters
    commonParamIds.forEach(id => {
      if (currentParams[id] !== undefined) {
        preserved[id] = currentParams[id];
      }
    });
    
    return preserved;
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
      // Toggle rotation
      const newValue = !this.parameters.rotation;
      this.parameters.rotation = newValue;
      
      // Update visualization with just the changed parameter
      if (this.currentVisualization) {
        this.currentVisualization.update({ rotation: newValue });
      }
      
      // Update UI
      this.giveParameters(false);
      
      // Request render
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
      
      return true;
    } else if (actionId === 'reset-camera') {
      // Reset camera (implementation depends on the 3D environment setup)
      if (this.core && this.core.renderingManager) {
        const environment = this.core.renderingManager.getCurrentEnvironment();
        if (environment && typeof environment.getCamera === 'function') {
          const camera = environment.getCamera();
          if (camera) {
            // Reset camera position
            camera.position.set(0, 0, 5);
            camera.lookAt(0, 0, 0);
          }
          
          // Try to use camera controls if available
          if (environment.getControls && typeof environment.getControls === 'function') {
            const controls = environment.getControls();
            if (controls && typeof controls.reset === 'function') {
              controls.reset();
            } else if (controls && typeof controls.setLookAt === 'function') {
              controls.setLookAt(0, 1, 5, 0, 0, 0);
            }
          }
        }
        
        // Request render update
        this.core.renderingManager.requestRender();
      }
      return true;
    }
    
    return super.executeAction(actionId, ...args);
  }
}