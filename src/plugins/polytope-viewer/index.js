// src/plugins/polytope-viewer/index.js
import { Plugin } from '../../core/Plugin.js';
import { BasePolytopeVisualization } from './BasePolytopeVisualization.js';

// Import all visualization classes directly
import { PlatonicVisualization } from './visualizations/PlatonicVisualization.js';
import { PermutahedronVisualization } from './visualizations/PermutahedronVisualization.js';
import { RootPolytopeVisualization } from './visualizations/RootPolytopeVisualization.js';
import { StellahedronVisualization } from './visualizations/StellahedronVisualization.js';
import { OrbitPolytopeVisualization } from './visualizations/OrbitPolytopeVisualization.js';
import { AssociahedronVisualization } from './visualizations/AssociahedronVisualization.js';

/**
 * PolytopeViewerPlugin - A plugin for viewing 3D polytopes
 */
export default class PolytopeViewerPlugin extends Plugin {
  static id = "polytope-viewer";
  static name = "Polytope Viewer";
  static description = "Interactive 3D polytope visualizations";
  static renderingType = "3d"; // Using THREE.js for 3D rendering

  constructor(core) {
    super(core);
    
    // Define visualization registry with clear metadata and classes
    this.visualizationRegistry = [
      {
        id: 'platonic',
        name: 'Platonic Solids',
        description: 'The five regular polyhedra: tetrahedron, cube, octahedron, dodecahedron, and icosahedron',
        class: PlatonicVisualization
      },
      {
        id: 'permutahedron',
        name: 'Permutahedron',
        description: 'Polytopes derived from permutation groups',
        class: PermutahedronVisualization
      },
      {
        id: 'rootpolytope',
        name: 'Root Polytope',
        description: 'Polytopes based on root systems',
        class: RootPolytopeVisualization
      },
      {
        id: 'stellahedron',
        name: 'Stellahedron',
        description: 'Star-like polytope constructed using Minkowski sums',
        class: StellahedronVisualization
      },
      {
        id: 'orbitpolytope',
        name: 'Orbit Polytope',
        description: 'Polytopes derived from the orbit of a point under group action',
        class: OrbitPolytopeVisualization
      },
      {
        id: 'associahedron',
        name: 'Associahedron',
        description: 'Polytope related to associations in bracket expressions',
        class: AssociahedronVisualization
      }
    ];
    
    // Current visualization type
    this.currentVisualizationType = 'platonic';
  }

  /**
   * Load the plugin
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log("Loading polytope viewer plugin...");
      
      // Build parameter schema for all visualization types
      const schema = this.getParameterSchema();
      
      // Initialize parameters with defaults from schema
      this.parameters = this._getDefaultParametersFromSchema(schema);
      
      // Default to first visualization type if not set
      this.currentVisualizationType = this.parameters.visualizationType || this.visualizationRegistry[0].id;
      
      // Initialize the visualization
      await this._initializeVisualization(this.currentVisualizationType);
      
      // Mark as loaded
      this.isLoaded = true;
      
      // Give parameters to UI
      this.giveParameters(true);
      
      // Update actions
      if (this.core && this.core.uiManager) {
        const actions = this.getActions();
        this.core.uiManager.updateActions(actions);
      }
      
      console.log("Polytope viewer plugin loaded successfully");
      return true;
    } catch (error) {
      console.error("Error loading polytope viewer plugin:", error);
      
      // Ensure clean state on failure
      await this.unload();
      return false;
    }
  }

  /**
   * Unload the plugin
   */
  async unload() {
    if (!this.isLoaded) return true;
    
    try {
      console.log("Unloading polytope viewer plugin...");
      
      // Clean up current visualization
      if (this.currentVisualization) {
        this.currentVisualization.dispose();
        this.currentVisualization = null;
      }
      
      // Clear all visualizations
      this.visualizations.clear();
      
      // Reset parameters
      this.parameters = {};
      
      // Reset current visualization type
      this.currentVisualizationType = this.visualizationRegistry[0].id;
      
      // Mark as unloaded
      this.isLoaded = false;
      
      console.log("Polytope viewer plugin unloaded successfully");
      return true;
    } catch (error) {
      console.error("Error unloading polytope viewer plugin:", error);
      return false;
    }
  }

  /**
   * Initialize visualization with the specified type
   * @param {string} visualizationType - ID of visualization type to initialize
   * @private
   */
  async _initializeVisualization(visualizationType) {
    // Get visualization info
    const vizInfo = this._getVisualizationInfo(visualizationType);
    if (!vizInfo) {
      throw new Error(`Visualization type '${visualizationType}' not found`);
    }
    
    // Clean up current visualization if it exists
    if (this.currentVisualization) {
      this.currentVisualization.dispose();
    }
    
    console.log(`Initializing ${vizInfo.name} visualization`);
    
    // Create new visualization instance
    const vizInstance = new vizInfo.class(this);
    
    // Register and set as current
    this.registerVisualization(vizInfo.id, vizInstance);
    this.currentVisualization = vizInstance;
    this.currentVisualizationType = vizInfo.id;
    
    // Initialize with current parameters
    await this.currentVisualization.initialize(this.parameters);
    
    return true;
  }

  /**
   * Get visualization info by ID
   * @param {string} id - Visualization ID
   * @returns {Object|null} Visualization info or null if not found
   * @private
   */
  _getVisualizationInfo(id) {
    return this.visualizationRegistry.find(viz => viz.id === id) || null;
  }

  /**
   * Generate the parameter schema for this plugin
   * Combines core plugin parameters with visualization parameters
   */
  getParameterSchema() {
    // Create visualization type dropdown options
    const vizTypeOptions = this.visualizationRegistry.map(viz => ({
      value: viz.id,
      label: viz.name
    }));
    
    // Plugin's own parameters
    const pluginParams = {
      structural: [
        {
          id: 'visualizationType',
          type: 'dropdown',
          label: 'Polytope Type',
          options: vizTypeOptions,
          default: this.currentVisualizationType || this.visualizationRegistry[0].id
        }
      ],
      visual: []
    };
    
    // Get base parameters common to all polytopes
    const baseParams = BasePolytopeVisualization.getBaseParameters();
    
    // Get visualization-specific parameters
    let vizParams = { structural: [], visual: [] };
    const currentVizInfo = this._getVisualizationInfo(this.currentVisualizationType);
    
    if (currentVizInfo && currentVizInfo.class && typeof currentVizInfo.class.getParameters === 'function') {
      vizParams = currentVizInfo.class.getParameters();
    }
    
    // Combine all parameters
    return {
      structural: [
        ...pluginParams.structural,
        ...baseParams.structural,
        ...vizParams.structural
      ],
      visual: [
        ...baseParams.visual,
        ...vizParams.visual
      ]
    };
  }

  /**
   * Handle parameter changes
   */
  async onParameterChanged(parameterId, value) {
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Handle visualization type change specially
    if (parameterId === 'visualizationType' && value !== this.currentVisualizationType) {
      try {
        // Initialize the new visualization type
        await this._initializeVisualization(value);
        
        // Update UI with new parameter schema
        this.giveParameters(true);
      } catch (error) {
        console.error(`Error changing visualization type to ${value}:`, error);
        
        // Revert to previous visualization type in parameters
        this.parameters.visualizationType = this.currentVisualizationType;
        
        // Show error to user
        if (this.core && this.core.uiManager) {
          this.core.uiManager.showError(`Failed to change visualization type: ${error.message}`);
        }
      }
    } else if (this.currentVisualization) {
      // For all other parameters, just update the visualization
      this.currentVisualization.update({ [parameterId]: value });
      
      // Request render update
      if (this.core && this.core.renderingManager) {
        this.core.renderingManager.requestRender();
      }
    }
  }

  /**
   * Get available actions for this plugin
   */
  getActions() {
    return [
      ...super.getActions(),
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
   * Execute an action
   */
  executeAction(actionId, ...args) {
    switch (actionId) {
      case 'toggle-rotation':
        // Toggle rotation parameter
        const newRotationValue = !this.parameters.rotation;
        this.parameters.rotation = newRotationValue;
        
        // Update visualization
        if (this.currentVisualization) {
          this.currentVisualization.update({ rotation: newRotationValue });
        }
        
        // Update UI
        this.giveParameters(false);
        
        return true;
        
      case 'reset-camera':
        // Reset camera position
        if (this.core && this.core.renderingManager) {
          const environment = this.core.renderingManager.getCurrentEnvironment();
          
          if (environment) {
            // Try different camera reset methods
            if (environment.getControls && typeof environment.getControls === 'function') {
              const controls = environment.getControls();
              if (controls && typeof controls.reset === 'function') {
                controls.reset();
              } else if (controls && typeof controls.setLookAt === 'function') {
                // For camera-controls
                controls.setLookAt(0, 1, 5, 0, 0, 0);
              }
            }
            
            // Also try to reset camera directly
            if (environment.getCamera && typeof environment.getCamera === 'function') {
              const camera = environment.getCamera();
              if (camera) {
                camera.position.set(0, 1, 5);
                camera.lookAt(0, 0, 0);
                if (camera.updateProjectionMatrix) {
                  camera.updateProjectionMatrix();
                }
              }
            }
            
            // Request a render update
            this.core.renderingManager.requestRender();
          }
        }
        return true;
        
      default:
        // Let parent handle standard actions
        return super.executeAction(actionId, ...args);
    }
  }

  /**
   * Initialize the default visualization
   * Required by Plugin base class
   * @private
   */
  async _initializeDefaultVisualization() {
    return this._initializeVisualization(this.currentVisualizationType);
  }
}
