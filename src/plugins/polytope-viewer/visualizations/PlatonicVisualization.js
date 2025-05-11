// Platonic
import { BasePolytopeVisualization } from '../BasePolytopeVisualization.js';

/**
 * Visualization for Platonic solids
 */
export class PlatonicVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Current solid type
    this.solidType = 'tetrahedron';
  }

  /**
   * Get visualization-specific parameters
   * @returns {Object} Parameter schema with structural and visual parameters
   */
  getVisualizationParameters() {
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
          default: this.solidType
        }
      ],
      visual: []
    };
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Update solid type if provided
    if (parameters.solidType) {
      this.solidType = parameters.solidType;
    }
    
    // Call parent initialization
    await super.initialize(parameters);
    
    return true;
  }

  /**
   * Determine if the polytope should be rebuilt after a parameter change
   * @param {Object} parameters - New parameters
   * @param {Object} prevParameters - Previous parameters
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters, prevParameters) {
    return parameters.solidType !== undefined && 
           parameters.solidType !== prevParameters?.solidType;
  }

  /**
   * Get the vertices for this platonic solid
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Get the current solid type
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
        // Default to tetrahedron if type is unknown
        geometry = new THREE.TetrahedronGeometry(1, 0);
    }
    
    // Extract unique vertices from the geometry
    const vertices = this.getUniqueVertices(THREE, geometry);
    
    // Clean up temporary geometry
    geometry.dispose();
    
    return vertices;
  }
  
  /**
   * Get unique vertices from a geometry
   * @param {Object} THREE - THREE.js library
   * @param {THREE.BufferGeometry} geometry - Geometry to extract vertices from
   * @returns {Array<THREE.Vector3>} Array of unique vertices
   */
  getUniqueVertices(THREE, geometry, precision = 5) {
    const vertices = [];
    const uniqueVertices = new Set();
    const positionAttribute = geometry.getAttribute('position');
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const vertexKey = `${positionAttribute.getX(i).toFixed(precision)},${
                        positionAttribute.getY(i).toFixed(precision)},${
                        positionAttribute.getZ(i).toFixed(precision)}`;
      
      if (!uniqueVertices.has(vertexKey)) {
        uniqueVertices.add(vertexKey);
        vertices.push(new THREE.Vector3(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        ));
      }
    }
    
    return vertices;
  }

  /**
   * Get any extra meshes for this platonic solid
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {THREE.Object3D|null} Extra mesh or null
   */
  getExtraMesh(THREE, parameters) {
    // Create a group for extra visualization elements
    const extraGroup = new THREE.Group();
    
    // Add coordinate axes if requested
    if (parameters.showAxes) {
      const axesHelper = new THREE.AxesHelper(1.5);
      extraGroup.add(axesHelper);
    }
    
    return extraGroup.children.length > 0 ? extraGroup : null;
  }
}
