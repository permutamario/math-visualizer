// src/plugins/polytope-viewer/index.js
import { Plugin } from '../../core/Plugin.js';
import { PlatonicVisualization } from './visualizations/PlatonicVisualization.js';
import { PermutahedronVisualization } from './visualizations/PermutahedronVisualization.js';

export default class PolytopeViewerPlugin extends Plugin {
  static id = "polytope-viewer";
  static name = "Polytope Viewer";
  static description = "Interactive 3D polytope visualizations";
  static renderingType = "3d"; // Using THREE.js for 3D rendering

  async _initializeDefaultVisualization() {
    // Create visualizations
    const platonicViz = new PlatonicVisualization(this);
    const permutahedronViz = new PermutahedronVisualization(this);
    
    // Register visualizations
    this.registerVisualization('platonic', platonicViz);
    this.registerVisualization('permutahedron', permutahedronViz);
    
    // Get polytope type from parameters
    const polytopeType = this.parameters.polytopeType || 'platonic';
    
    // Set initial visualization based on selected type
    switch (polytopeType) {
      case 'permutahedron':
        this.currentVisualization = permutahedronViz;
        break;
      case 'platonic':
      default:
        this.currentVisualization = platonicViz;
        break;
    }
    
    // Initialize the visualization
    await this.currentVisualization.initialize(this.parameters);
  }

  getParameterSchema() {
    // Common parameters for all polytope visualizations
    const commonStructural = [
      {
        id: 'polytopeType',
        type: 'dropdown',
        label: 'Polytope Type',
        options: [
          { value: 'platonic', label: 'Platonic Solids' },
          { value: 'permutahedron', label: 'Type A Permutahedron' }
        ],
        default: 'platonic'
      }
    ];
    
    // Type-specific parameters
    let typeSpecificStructural = [];
    
    // Add type-specific parameters based on current type
    if (this.parameters && this.parameters.polytopeType === 'permutahedron') {
      typeSpecificStructural = [
        {
          id: 'dimension',
          type: 'slider',
          label: 'Dimension',
          min: 3,
          max: 5,
          step: 1,
          default: 4
        }
      ];
    } else {
      // Default to platonic solid parameters
      typeSpecificStructural = [
        {
          id: 'solidType',
          type: 'dropdown',
          label: 'Solid Type',
          options: [
            { value: 'tetrahedron', label: 'Tetrahedron (4 faces)' },
            { value: 'cube', label: 'Cube (6 faces)' },
            { value: 'octahedron', label: 'Octahedron (8 faces)' },
            { value: 'dodecahedron', label: 'Dodecahedron (12 faces)' },
            { value: 'icosahedron', label: 'Icosahedron (20 faces)' }
          ],
          default: 'tetrahedron'
        }
      ];
    }
    
    // Combine common and specific parameters
    const structural = [...commonStructural, ...typeSpecificStructural];
    
    // Add size/rotation parameters
    structural.push(
      {
        id: 'size',
        type: 'slider',
        label: 'Size',
        min: 0.5,
        max: 3,
        step: 0.1,
        default: 1
      },
      {
        id: 'rotation',
        type: 'checkbox',
        label: 'Auto-rotate',
        default: true
      }
    );
    
    // Visual parameters common to all polytopes
    const visual = [
      {
        id: 'wireframe',
        type: 'checkbox',
        label: 'Wireframe',
        default: false
      },
      {
        id: 'showVertices',
        type: 'checkbox',
        label: 'Show Vertices',
        default: true
      },
      {
        id: 'vertexSize',
        type: 'slider',
        label: 'Vertex Size',
        min: 0.01,
        max: 0.2,
        step: 0.01,
        default: 0.05
      },
      {
        id: 'faceColor',
        type: 'color',
        label: 'Face Color',
        default: '#3498db'
      },
      {
        id: 'edgeColor',
        type: 'color',
        label: 'Edge Color',
        default: '#2c3e50'
      },
      {
        id: 'vertexColor',
        type: 'color',
        label: 'Vertex Color',
        default: '#e74c3c'
      },
      {
        id: 'opacity',
        type: 'slider',
        label: 'Opacity',
        min: 0.1,
        max: 1,
        step: 0.1,
        default: 0.85
      }
    ];
    
    return {
      structural,
      visual
    };
  }
  
  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New parameter value
   */
  onParameterChanged(parameterId, value) {
    // Store the previous value for comparison
    const prevValue = this.parameters[parameterId];
    
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Handle polytope type change (switch visualization)
    if (parameterId === 'polytopeType' && value !== prevValue) {
      const newViz = this.visualizations.get(value);
      
      if (newViz && newViz !== this.currentVisualization) {
        // Deactivate current visualization
        if (this.currentVisualization) {
          this.currentVisualization.dispose();
        }
        
        // Set and initialize the new visualization
        this.currentVisualization = newViz;
        this.currentVisualization.initialize(this.parameters);
        
        // Update parameter schema to reflect the new type
        if (this.core && this.core.uiManager) {
          const paramSchema = this.getParameterSchema();
          this.core.uiManager.buildControlsFromSchema(paramSchema, this.parameters);
        }
      }
    } 
    // Update current visualization with changed parameter
    else if (this.currentVisualization) {
      this.currentVisualization.update(this.parameters, 
        { ...this.parameters, [parameterId]: prevValue });
    }
  }
  
  /**
   * Get available actions for this plugin
   */
  getActions() {
    return [
      ...super.getActions(),
      {
        id: 'toggle-rotation',
        label: 'Toggle Rotation'
      },
      {
        id: 'toggle-wireframe',
        label: 'Toggle Wireframe'
      }
    ];
  }
  
  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   */
  executeAction(actionId, ...args) {
    switch (actionId) {
      case 'toggle-rotation':
        if (this.currentVisualization) {
          // Toggle rotation
          this.parameters.rotation = !this.parameters.rotation;
          this.currentVisualization.update({ rotation: this.parameters.rotation });
          
          // Update UI to reflect the new state
          if (this.core && this.core.uiManager) {
            this.core.uiManager.updateControls(this.parameters);
          }
        }
        return true;
        
      case 'toggle-wireframe':
        if (this.currentVisualization) {
          // Toggle wireframe
          this.parameters.wireframe = !this.parameters.wireframe;
          this.currentVisualization.update({ wireframe: this.parameters.wireframe });
          
          // Update UI to reflect the new state
          if (this.core && this.core.uiManager) {
            this.core.uiManager.updateControls(this.parameters);
          }
        }
        return true;
        
      default:
        return super.executeAction(actionId, ...args);
    }
  }
}