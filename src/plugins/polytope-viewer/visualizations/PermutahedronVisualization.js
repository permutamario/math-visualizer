// src/plugins/polytope-viewer/visualizations/PermutahedronVisualization.js
import { BasePolytopeVisualization } from './BasePolytopeVisualization.js';
import { PolytopeUtils } from '../PolytopeUtils.js';

/**
 * Visualization for Permutahedra based on root systems
 */
export class PermutahedronVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Set default parameters
    this.params = {
      rootSystem: 'A3',
      size: 1.0,
      rotation: true,
      showAxes: false,
      wireframe: false,
      showVertices: true,
      vertexSize: 0.05,
      faceColor: '#3498db',
      edgeColor: '#2c3e50',
      vertexColor: '#e74c3c',
      opacity: 0.85
    };
  }

  /**
   * Get the parameter schema for this visualization
   * @returns {Object} Parameter schema with structural and visual parameters
   */
  getParameterSchema() {
    return {
      structural: [
        {
          id: 'rootSystem',
          type: 'dropdown',
          label: 'Root System',
          options: [
            { value: 'A3', label: 'Type A3' },
            { value: 'BC3', label: 'Type B3/C3' }
          ],
          default: this.params.rootSystem
        },
        {
          id: 'size',
          type: 'slider',
          label: 'Size',
          min: 0.5,
          max: 3,
          step: 0.1,
          default: this.params.size
        },
        {
          id: 'rotation',
          type: 'checkbox',
          label: 'Auto-rotate',
          default: this.params.rotation
        },
        {
          id: 'showAxes',
          type: 'checkbox',
          label: 'Show Coordinate Axes',
          default: this.params.showAxes
        }
      ],
      visual: [
        {
          id: 'wireframe',
          type: 'checkbox',
          label: 'Wireframe',
          default: this.params.wireframe
        },
        {
          id: 'showVertices',
          type: 'checkbox',
          label: 'Show Vertices',
          default: this.params.showVertices
        },
        {
          id: 'vertexSize',
          type: 'slider',
          label: 'Vertex Size',
          min: 0.01,
          max: 0.2,
          step: 0.01,
          default: this.params.vertexSize
        },
        {
          id: 'faceColor',
          type: 'color',
          label: 'Face Color',
          default: this.params.faceColor
        },
        {
          id: 'edgeColor',
          type: 'color',
          label: 'Edge Color',
          default: this.params.edgeColor
        },
        {
          id: 'vertexColor',
          type: 'color',
          label: 'Vertex Color',
          default: this.params.vertexColor
        },
        {
          id: 'opacity',
          type: 'slider',
          label: 'Opacity',
          min: 0.1,
          max: 1,
          step: 0.1,
          default: this.params.opacity
        }
      ]
    };
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values from plugin
   */
  async initialize(parameters) {
    // Merge incoming parameters with defaults
    this.params = { ...this.params, ...parameters };
    
    // Call parent initialization
    await super.initialize(this.params);
    
    // Set animation state based on parameters
    this.state.isAnimating = this.params.rotation;
    
    return true;
  }

  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of the changed parameter
   * @param {any} value - New value
   * @param {any} prevValue - Previous value
   */
  onParameterChanged(parameterId, value, prevValue) {
    // Update parameter
    this.params[parameterId] = value;
    
    // Handle animation state
    if (parameterId === 'rotation') {
      this.state.isAnimating = value;
    }
    
    // Check if we need to rebuild
    const needsRebuild = this.shouldRebuildOnUpdate(
      { [parameterId]: value },
      { [parameterId]: prevValue }
    );
    
    if (needsRebuild) {
      // Clean up and reinitialize
      this.cleanupMeshes();
    } else {
      // Just update materials, etc.
      this.updateMaterials(this.params);
      this.updateVertexVisibility(this.params);
    }
  }

  /**
   * Get the vertices for this permutahedron
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Get root system type
    const rootSystem = parameters.rootSystem || 'A3';
    const size = parameters.size || 1;
    
    // Generate the permutation vertices based on root system type
    let vertices;
    
    if (rootSystem === 'BC3') {
      // B3/C3 permutahedron: signed permutations of [1,2,3]
      vertices = PolytopeUtils.createTypeBCPermutahedronVertices(3);
    } else {
      // A3 permutahedron: permutations of [1,2,3,4] projected to hyperplane
      vertices = PolytopeUtils.createTypeAPermutahedronVertices(4);
    }
    
    // Scale the vertices
    const scaledVertices = PolytopeUtils.scaleVertices(vertices, size);
    
    // Convert to THREE.Vector3 objects
    return PolytopeUtils.verticesToPoints(THREE, scaledVertices);
  }
  
  /**
   * Get any extra meshes for this permutahedron
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Object3D|null} Extra mesh or null
   */
  getExtraMesh(THREE, parameters) {
    // Create a group for extra visualization elements
    const extraGroup = new THREE.Group();
    
    // Add coordinate axes if requested
    if (parameters.showAxes) {
      const axesHelper = new THREE.AxesHelper(parameters.size * 1.5);
      extraGroup.add(axesHelper);
    }
    
    return extraGroup.children.length > 0 ? extraGroup : null;
  }
  
  /**
   * Determine if the polytope should be rebuilt after a parameter change
   * @param {Object} parameters - New parameters
   * @param {Object} prevParameters - Previous parameters
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters, prevParameters) {
    // Rebuild if root system, size, or showAxes changes
    return !prevParameters || 
           parameters.rootSystem !== prevParameters.rootSystem ||
           parameters.size !== prevParameters.size ||
           parameters.showAxes !== prevParameters.showAxes;
  }
  
  /**
   * Get actions specific to this visualization
   * @returns {Array<Object>} Action definitions
   */
  getActions() {
    return [
      {
        id: 'toggle-permutahedron-rotation',
        label: 'Toggle Rotation'
      },
      {
        id: 'toggle-permutahedron-wireframe',
        label: 'Toggle Wireframe'
      },
      {
        id: 'toggle-permutahedron-axes',
        label: 'Toggle Axes'
      }
    ];
  }
  
  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId) {
    switch (actionId) {
      case 'toggle-permutahedron-rotation':
        this.params.rotation = !this.params.rotation;
        this.state.isAnimating = this.params.rotation;
        
        // Update plugin parameters
        if (this.plugin && this.plugin.parameters) {
          this.plugin.parameters.rotation = this.params.rotation;
        }
        
        // Update UI if possible
        if (this.plugin && this.plugin.core && this.plugin.core.uiManager) {
          this.plugin.core.uiManager.updateControls({
            rotation: this.params.rotation
          });
        }
        return true;
        
      case 'toggle-permutahedron-wireframe':
        this.params.wireframe = !this.params.wireframe;
        this.updateMaterials(this.params);
        
        // Update plugin parameters
        if (this.plugin && this.plugin.parameters) {
          this.plugin.parameters.wireframe = this.params.wireframe;
        }
        
        // Update UI if possible
        if (this.plugin && this.plugin.core && this.plugin.core.uiManager) {
          this.plugin.core.uiManager.updateControls({
            wireframe: this.params.wireframe
          });
        }
        return true;
        
      case 'toggle-permutahedron-axes':
        this.params.showAxes = !this.params.showAxes;
        
        // Need to rebuild to create/remove axes
        this.cleanupMeshes();
        
        // Update plugin parameters
        if (this.plugin && this.plugin.parameters) {
          this.plugin.parameters.showAxes = this.params.showAxes;
        }
        
        // Update UI if possible
        if (this.plugin && this.plugin.core && this.plugin.core.uiManager) {
          this.plugin.core.uiManager.updateControls({
            showAxes: this.params.showAxes
          });
        }
        return true;
    }
    
    return false;
  }
}