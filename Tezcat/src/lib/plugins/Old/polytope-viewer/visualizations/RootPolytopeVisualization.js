// Root Polytope Visualization
import { BasePolytopeVisualization } from '../BasePolytopeVisualization.js';
import { createParameters } from '../../../ui/ParameterBuilder.js';
/**
 * Visualization for root system polytopes
 */
export class RootPolytopeVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Current root system type
    this.rootType = 'A3';
  }

  /**
   * Get visualization-specific parameters
   * @returns {Object} Parameter schema with structural and visual parameters
   */

  static getParameters() {
  return createParameters()
    .addDropdown('rootSystem', 'Root System', 'A3', [
      { value: 'A3', label: 'Type A3' },
      { value: 'BC', label: 'Type B3' },
      { value: 'C3', label: 'Type C3' },
      { value: 'D3', label: 'Type D3' },
      { value: 'H3', label: 'Type H3' }
    ])
    .build();
}

  /**
   * Initialize the visualization
   * @param {Object} parameters - Visualization parameters
   */
  async initialize(parameters) {
    // Call parent initialization first
    await super.initialize(parameters);
    
    // Update root type if provided
    if (parameters.rootType) {
      this.rootType = parameters.rootType;
    }
    
    return true;
  }

  /**
   * Handle specific parameter updates
   * @param {Object} parameters - Changed parameters only
   */
  handleParameterUpdate(parameters) {
    // Check if root type has changed
    if (parameters.rootType !== undefined) {
      this.rootType = parameters.rootType;
    }
  }

  /**
   * Determine if the polytope should be rebuilt after a parameter change
   * @param {Object} parameters - New parameters (only changed ones)
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters) {
    return parameters.rootType !== undefined || 
           super.shouldRebuildOnUpdate(parameters);
  }

  /**
   * Get the vertices for this root polytope
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Get the current root system type
    const rootType = parameters.rootType || this.rootType;
    
    // Generate vertices based on root system type
    let vertices = this.buildRootPolytope(rootType);
    
    // Convert to THREE.Vector3 objects
    return vertices.map(v => new THREE.Vector3(v[0] || 0, v[1] || 0, v[2] || 0));
  }

  /**
   * Build a root system polytope
   * @param {string} type - Root system type
   * @returns {Array<Array<number>>} Array of vertex coordinates
   */
  buildRootPolytope(type) {
    let vertices = [];

    switch (type) {
      case 'A3': {
        const roots4 = [];
        for (let i = 0; i < 4; i++) {
          for (let j = i + 1; j < 4; j++) {
            const v = [0, 0, 0, 0]; 
            v[i] = 1; 
            v[j] = -1;
            roots4.push(v); 
            roots4.push(v.map(x => -x));
          }
        }
        
        const basis4 = [
          [1, -1, 0, 0],
          [0, 1, -1, 0],
          [0, 0, 1, -1]
        ];
        
        const ons = this.orthonormalBasis(basis4);
        vertices = roots4.map(v4 => ons.map(e => this.dot(v4, e)));
        break;
      }

      case 'B3': {
        const roots = [];
        for (let i = 0; i < 3; i++) {
          const v = [0, 0, 0]; 
          v[i] = 1;
          roots.push([...v]); 
          roots.push(v.map(x => -x));
        }
        
        for (let i = 0; i < 3; i++) {
          for (let j = i + 1; j < 3; j++) {
            for (const si of [-1, 1]) {
              for (const sj of [-1, 1]) {
                const v = [0, 0, 0]; 
                v[i] = si; 
                v[j] = sj;
                roots.push(v);
              }
            }
          }
        }
        
        vertices = roots;
        break;
      }

      case 'C3': {
        const roots = [];
        for (let i = 0; i < 3; i++) {
          const v = [0, 0, 0]; 
          v[i] = 2;
          roots.push([...v]); 
          roots.push(v.map(x => -x));
        }
        
        for (let i = 0; i < 3; i++) {
          for (let j = i + 1; j < 3; j++) {
            for (const si of [-1, 1]) {
              for (const sj of [-1, 1]) {
                const v = [0, 0, 0]; 
                v[i] = si; 
                v[j] = sj;
                roots.push(v);
              }
            }
          }
        }
        
        for (let i = 0; i < 3; i++) {
          const v = [0, 0, 0]; 
          v[i] = 1;
          roots.push([...v]); 
          roots.push(v.map(x => -x));
        }
        
        vertices = roots;
        break;
      }

      case 'D3': {
        const roots = [];
        for (let i = 0; i < 3; i++) {
          for (let j = i + 1; j < 3; j++) {
            for (const si of [-1, 1]) {
              for (const sj of [-1, 1]) {
                const v = [0, 0, 0]; 
                v[i] = si; 
                v[j] = sj;
                roots.push(v);
              }
            }
          }
        }
        
        vertices = roots;
        break;
      }

      case 'H3': {
        const phi = (1 + Math.sqrt(5)) / 2;
        const icosaVerts = [
          [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
          [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
          [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]
        ];
        
        let edgeLen = Infinity;
        for (let i = 0; i < icosaVerts.length; i++) {
          for (let j = i + 1; j < icosaVerts.length; j++) {
            const dx = icosaVerts[i][0] - icosaVerts[j][0];
            const dy = icosaVerts[i][1] - icosaVerts[j][1];
            const dz = icosaVerts[i][2] - icosaVerts[j][2];
            const dist = Math.hypot(dx, dy, dz);
            if (dist > 1e-6 && dist < edgeLen) {
              edgeLen = dist;
            }
          }
        }
        
        const mids = [];
        for (let i = 0; i < icosaVerts.length; i++) {
          for (let j = i + 1; j < icosaVerts.length; j++) {
            const a = icosaVerts[i], b = icosaVerts[j];
            const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
            const dist = Math.hypot(dx, dy, dz);
            if (Math.abs(dist - edgeLen) < 1e-6) {
              mids.push([
                (a[0] + b[0]) / 2,
                (a[1] + b[1]) / 2,
                (a[2] + b[2]) / 2
              ]);
            }
          }
        }
        
        vertices = mids;
        break;
      }

      default:
        console.warn(`Unknown root system type: ${type}, defaulting to A3`);
        return this.buildRootPolytope('A3');
    }

    return vertices;
  }

  // Utility functions
  dot(u, v) {
    return u.reduce((s, ui, k) => s + ui * v[k], 0);
  }

  sub(u, v) {
    return u.map((ui, k) => ui - v[k]);
  }

  scale(u, s) {
    return u.map(ui => ui * s);
  }

  norm(u) {
    return Math.hypot(...u);
  }

  orthonormalBasis(vectors) {
    const es = [];
    vectors.forEach(v => {
      let u = [...v];
      es.forEach(e => {
        const p = this.dot(u, e);
        u = this.sub(u, this.scale(e, p));
      });
      const n = this.norm(u);
      if (n > 1e-8) {
        es.push(this.scale(u, 1 / n));
      }
    });
    return es;
  }
}