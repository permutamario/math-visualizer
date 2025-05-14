// src/plugins/polytope-viewer/visualizations/PlatonicVisualization.js
import { BasePolytopeVisualization } from '../BasePolytopeVisualization.js';
import { createParameters } from '../../../ui/ParameterBuilder.js';

/**
 * Visualization for Platonic solids
 */
export class PlatonicVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
    this.solidType = 'tetrahedron';
  }

  /**
   * Get parameters specific to this visualization
   * @returns {Array} Array of parameter definitions
   * @static
   */
  static getParameters() {
    return createParameters()
      .addDropdown('solidType', 'Solid Type', 'tetrahedron', [
        { value: 'tetrahedron', label: 'Tetrahedron (4 faces)' },
        { value: 'cube', label: 'Cube (6 faces)' },
        { value: 'octahedron', label: 'Octahedron (8 faces)' },
        { value: 'dodecahedron', label: 'Dodecahedron (12 faces)' },
        { value: 'icosahedron', label: 'Icosahedron (20 faces)' }
      ])
      .addSlider('size', 'Size', 1, { min: 0.5, max: 3, step: 0.1 })
      .build();
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Visualization parameters
   */
  async initialize(parameters) {
    // Call parent initialization first
    await super.initialize(parameters);
    
    // Set solid type from parameters
    this.solidType = parameters.solidType || 'tetrahedron';
    
    return true;
  }

  /**
   * Handle specific parameter updates
   * @param {Object} parameters - Changed parameters only
   */
  update(parameters) {
    // First, call the parent update method
    super.update(parameters);
    
    // Check if solid type has changed
    if (parameters.solidType !== undefined) {
      this.solidType = parameters.solidType;
    }
  }

  /**
   * Get the vertices for this platonic solid
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Get the solid type from parameters, falling back to instance state
    const solidType = parameters.solidType || this.solidType;
    const size = parameters.size || 1;
    
    // Create geometry based on selected solid type
    let geometry;
    
    switch (solidType) {
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(size, 0);
        break;
      case 'cube':
        geometry = new THREE.BoxGeometry(size, size, size);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(size, 0);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(size, 0);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(size, 0);
        break;
      default:
        geometry = new THREE.TetrahedronGeometry(size, 0);
    }
    
    // Extract unique vertices from the geometry
    const vertices = this.extractVertices(THREE, geometry);
    
    // Clean up temporary geometry
    geometry.dispose();
    
    return vertices;
  }

  /**
   * Extract unique vertices from a geometry
   * @param {Object} THREE - THREE.js library
   * @param {THREE.BufferGeometry} geometry - Geometry to extract vertices from
   * @returns {Array<THREE.Vector3>} Array of unique vertices
   */
  extractVertices(THREE, geometry) {
    const vertices = [];
    const uniqueVertices = new Set();
    const positionAttribute = geometry.getAttribute('position');
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      
      // Create a unique key for this vertex (with limited precision)
      const key = `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;
      
      if (!uniqueVertices.has(key)) {
        uniqueVertices.add(key);
        vertices.push(new THREE.Vector3(x, y, z));
      }
    }
    
    return vertices;
  }
}