// src/plugins/polytope-viewer/visualizations/PlatonicVisualization.js
import { BasePolytopeVisualization } from '../BasePolytopeVisualization.js';

/**
 * Visualization for Platonic solids
 */
export class PlatonicVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
    this.solidType = 'tetrahedron';
  }

  /**
   * Get specific parameters for this visualization
   */
  static getParameters() {
    return {
      structural: [
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
      ],
      visual: []
    };
  }

  /**
   * Initialize the visualization
   */
  async initialize(parameters) {
    await super.initialize(parameters);
    this.solidType = parameters.solidType || 'tetrahedron';
    return true;
  }

  /**
   * Update the visualization
   */
  update(parameters) {
    super.update(parameters);
    if (parameters.solidType !== undefined) {
      this.solidType = parameters.solidType;
    }
  }

  /**
   * Get the vertices for this platonic solid
   */
  getVertices(THREE, parameters) {
    // Get the solid type from parameters, falling back to instance state
    const solidType = parameters.solidType || this.solidType;
    
    // Create geometry based on selected solid type
    let geometry;
    
    switch (solidType) {
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(1, 0);
        break;
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(1, 0);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(1, 0);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(1, 0);
        break;
      default:
        geometry = new THREE.TetrahedronGeometry(1, 0);
    }
    
    // Extract unique vertices from the geometry
    const vertices = this.extractVertices(THREE, geometry);
    
    // Clean up temporary geometry
    geometry.dispose();
    
    return vertices;
  }

  /**
   * Extract unique vertices from a geometry
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
