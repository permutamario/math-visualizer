// src/plugins/polytope-viewer/index.js
import { Plugin } from '../../core/Plugin.js';

// Import visualization classes
import { PlatonicVisualization } from './visualizations/PlatonicVisualization.js';
import { PermutahedronVisualization } from './visualizations/PermutahedronVisualization.js';
import { RootPolytopeVisualization } from './visualizations/RootPolytopeVisualization.js';
import { StellahedronVisualization } from './visualizations/StellahedronVisualization.js';
import { OrbitPolytopeVisualization } from './visualizations/OrbitPolytopeVisualization.js';
import { AssociahedronVisualization } from './visualizations/AssociahedronVisualization.js';

/**
 * Polytope Viewer Plugin
 * Follows the Math Visualization Framework architecture
 */
export default class PolytopeViewerPlugin extends Plugin {
  // Static metadata required by the framework
  static id = "polytope-viewer";
  static name = "Polytope Viewer";
  static description = "Interactive 3D polytope visualizations";
  static renderingType = "3d"; // Using THREE.js for 3D rendering

  constructor(core) {
    super(core);
    
    // Store visualizations in a Map for easier management
    this.visualizations = new Map();
    this.currentVisualization = null;
    
    // Store visualization metadata for menu
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
    
    // Flag to prevent concurrent operations
    this.operationInProgress = false;
  }

  /**
   * Start the plugin - main entry point
   */
  async start() {
    try {
      console.log("Starting Polytope Viewer plugin...");
      
      // Register parameters with the framework
      this._registerParameters();
      
      // Register actions
      this._registerActions();
      
      // Register all visualizations
      await this._registerVisualizations();
      
      // Initialize the default visualization
      await this._setActiveVisualization(this.pluginParameters.visualizationType);
      
      console.log("Polytope Viewer plugin started successfully");
      return true;
    } catch (error) {
      console.error("Error starting Polytope Viewer plugin:", error);
      return false;
    }
  }

  /**
   * Unload the plugin and clean up resources
   */
  async unload() {
    try {
      console.log("Unloading Polytope Viewer plugin...");
      
      // Dispose current visualization if any
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
        this.currentVisualization = null;
      }
      
      // Clean up all registered visualizations
      for (const visualization of this.visualizations.values()) {
        visualization.dispose();
      }
      
      // Clear the visualization map
      this.visualizations.clear();
      
      return true;
    } catch (error) {
      console.error("Error unloading Polytope Viewer plugin:", error);
      return false;
    }
  }

  /**
   * Register plugin parameters
   */
  _registerParameters() {
    // Plugin parameters
    const pluginParams = [
      {
        id: 'visualizationType',
        type: 'dropdown',
        label: 'Polytope Class',
        default: this.visualizationTypes[0].id,
        options: this.visualizationTypes.map(vt => ({
          value: vt.id,
          label: vt.name
        }))
      },
      {
        id: 'rotation',
        type: 'checkbox',
        label: 'Auto-rotate',
        default: false
      },
      {
        id: 'showEdges',
        type: 'checkbox',
        label: 'Show Edges',
        default: true
      },
      {
        id: 'opacity',
        type: 'slider',
        label: 'Opacity',
        default: 1.0,
        min: 0.1,
        max: 1.0,
        step: 0.1
      },
      {
        id: 'renderMode',
        type: 'dropdown',
        label: 'Render Mode',
        default: 'standard',
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'metallic', label: 'Metallic' },
          { value: 'glass', label: 'Glass' },
          { value: 'toon', label: 'Toon' },
          { value: 'matte', label: 'Matte' }
        ]
      },
      {
        id: 'colorPalette',
        type: 'dropdown',
        label: 'Color Palette',
        default: 'default',
        options: [
          { value: 'default', label: 'Default' },
          { value: 'pastel', label: 'Pastel' },
          { value: 'rainbow', label: 'Rainbow' },
          { value: 'blues', label: 'Blues' },
          { value: 'greens', label: 'Greens' },
          { value: 'reds', label: 'Reds' }
        ]
      }
    ];
    
    // Advanced parameters
    const advancedParams = [
      {
        id: 'particleSize',
        type: 'slider',
        label: 'Vertex Size',
        default: 0.05,
        min: 0.01,
        max: 0.2,
        step: 0.01
      },
      {
        id: 'showVertices',
        type: 'checkbox',
        label: 'Show Vertices',
        default: false
      },
      {
        id: 'wireframe',
        type: 'checkbox',
        label: 'Wireframe Mode',
        default: false
      },
      {
        id: 'vertexColor',
        type: 'color',
        label: 'Vertex Color',
        default: '#e74c3c'
      }
    ];
    
    // Store parameter values
    this.pluginParameters = this._extractDefaultValues(pluginParams);
    this.advancedParameters = this._extractDefaultValues(advancedParams);
    
    // Set initial visualization parameters (empty - will be populated by specific visualization)
    this.visualizationParameters = {};
    
    // Notify the framework about our parameters
    if (this.core && this.core.uiManager) {
      this.core.uiManager.updatePluginParameterGroups({
        pluginParameters: { 
          schema: pluginParams, 
          values: this.pluginParameters 
        },
        visualizationParameters: { 
          schema: [], 
          values: {} 
        },
        advancedParameters: { 
          schema: advancedParams, 
          values: this.advancedParameters 
        }
      }, true);
    }
  }

  /**
   * Register plugin actions
   */
  _registerActions() {
    if (!this.core) return;
    
    // Reset camera action
    this.core.addAction(
      'reset-camera',
      'Reset Camera',
      () => {
        // Get the rendering environment
        const renderEnv = this.core.getRenderingEnvironment();
        if (renderEnv && renderEnv.resetCamera) {
          renderEnv.resetCamera();
          return true;
        }
        return false;
      }
    );
    
    // Toggle rotation action
    this.core.addAction(
      'toggle-rotation',
      'Toggle Rotation',
      () => {
        // Toggle rotation parameter
        const newValue = !this.pluginParameters.rotation;
        this.updateParameter('rotation', newValue, 'plugin', true);
        return true;
      }
    );
    
    // Export as image action
    this.core.addAction(
      'export-image',
      'Export as Image',
      () => {
        if (this.core.renderingManager) {
          return this.core.renderingManager.exportAsPNG();
        }
        return false;
      }
    );
  }

  /**
   * Register all available visualizations
   */
  async _registerVisualizations() {
    for (const vizType of this.visualizationTypes) {
      try {
        // Create visualization instance
        const visualization = new vizType.class(this);
        
        // Add to visualizations map
        this.visualizations.set(vizType.id, visualization);
        
        console.log(`Registered visualization: ${vizType.name}`);
      } catch (error) {
        console.error(`Error registering visualization ${vizType.id}:`, error);
      }
    }
  }

  /**
   * Set the active visualization
   * @param {string} visualizationType - ID of the visualization to activate
   */
  async _setActiveVisualization(visualizationType) {
    // Prevent concurrent operations
    if (this.operationInProgress) {
      console.warn("Visualization change already in progress, ignoring request");
      return false;
    }
    
    this.operationInProgress = true;
    
    try {
      console.log(`Setting active visualization to: ${visualizationType}`);
      
      // Update plugin parameter
      this.pluginParameters.visualizationType = visualizationType;
      
      // Get the requested visualization
      const visualization = this.visualizations.get(visualizationType);
      
      if (!visualization) {
        throw new Error(`Visualization not found: ${visualizationType}`);
      }
      
      // Dispose current visualization if exists
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
      }
      
      // Set new current visualization
      this.currentVisualization = visualization;
      
      // Get visualization parameters
      const vizClass = this.visualizationTypes.find(vt => vt.id === visualizationType)?.class;
      
      if (vizClass && vizClass.getParameters) {
        const vizParams = vizClass.getParameters();
        
        // Extract default values
        this.visualizationParameters = this._extractDefaultValues(vizParams);
        
        // Update UI with new visualization parameters
        if (this.core && this.core.uiManager) {
          this.core.uiManager.updatePluginParameterGroups({
            visualizationParameters: {
              schema: vizParams,
              values: this.visualizationParameters
            }
          }, false);
        }
      }
      
      // Initialize visualization with all parameter groups
      await this.currentVisualization.initialize({
        ...this.pluginParameters,
        ...this.visualizationParameters,
        ...this.advancedParameters
      });
      
      // Request a render to show the new visualization
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
      
      console.log(`Visualization set to ${visualizationType} successfully`);
      return true;
    } catch (error) {
      console.error(`Error setting visualization to ${visualizationType}:`, error);
      
      // Show error to user
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showError(`Failed to change visualization: ${error.message}`);
      }
      
      return false;
    } finally {
      this.operationInProgress = false;
    }
  }

  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value
   * @param {string} group - Parameter group
   */
  onParameterChanged(parameterId, value, group) {
    // First, update our internal parameter storage
    if (group === 'plugin' && this.pluginParameters) {
      this.pluginParameters[parameterId] = value;
      
      // Special handling for visualization type changes
      if (parameterId === 'visualizationType') {
        this._setActiveVisualization(value);
        return;
      }
    } else if (group === 'visualization' && this.visualizationParameters) {
      this.visualizationParameters[parameterId] = value;
    } else if (group === 'advanced' && this.advancedParameters) {
      this.advancedParameters[parameterId] = value;
    }
    
    // Forward the parameter change to current visualization
    if (this.currentVisualization) {
      this.currentVisualization.update({
        [parameterId]: value
      });
    }
    
    // Request a render
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }

  /**
   * Update a parameter value and optionally update the UI
   * @param {string} parameterId - Parameter ID
   * @param {any} value - New parameter value
   * @param {string} group - Parameter group
   * @param {boolean} updateUI - Whether to update the UI
   * @returns {boolean} Whether the parameter was updated successfully
   */
  updateParameter(parameterId, value, group = 'visualization', updateUI = true) {
    // Update internal parameter storage
    let updated = false;
    
    if (group === 'plugin' && this.pluginParameters) {
      this.pluginParameters[parameterId] = value;
      updated = true;
    } else if (group === 'visualization' && this.visualizationParameters) {
      this.visualizationParameters[parameterId] = value;
      updated = true;
    } else if (group === 'advanced' && this.advancedParameters) {
      this.advancedParameters[parameterId] = value;
      updated = true;
    }
    
    // Update UI if requested
    if (updated && updateUI && this.core && this.core.uiManager) {
      this.core.uiManager.updateParameterValue(parameterId, value, group);
    }
    
    // Forward to current visualization
    if (updated && this.currentVisualization) {
      this.currentVisualization.update({ [parameterId]: value });
    }
    
    return updated;
  }

  /**
   * Extract default values from parameter definitions
   * @param {Array} params - Parameter definitions
   * @returns {Object} Default values
   * @private
   */
  _extractDefaultValues(params) {
    const defaults = {};
    
    if (Array.isArray(params)) {
      params.forEach(param => {
        if (param.id !== undefined && param.default !== undefined) {
          defaults[param.id] = param.default;
        }
      });
    }
    
    return defaults;
  }

  /**
   * Animation callback from the framework
   * @param {number} deltaTime - Time since last frame in seconds
   * @returns {boolean} Whether animation should continue
   */
  animate(deltaTime) {
    // Forward to current visualization if it exists
    if (this.currentVisualization) {
      return this.currentVisualization.animate(deltaTime);
    }
    
    return false;
  }
}