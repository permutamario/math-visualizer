// Permutahedron
// src/plugins/polytope-viewer/visualizations/PermutahedronVisualization.js
import { BasePolytopeVisualization } from '../BasePolytopeVisualization.js';

/**
 * Visualization for Permutahedra based on root systems
 */
export class PermutahedronVisualization extends BasePolytopeVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Current root system type
    this.currentRootSystem = 'A3';
  }

  /**
   * Get visualization-specific parameters
   * @returns {Object} Parameter schema with structural and visual parameters
   */
  getVisualizationParameters() {
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
          default: this.currentRootSystem
        }
      ],
      visual: [
        // Any visualization-specific visual parameters would go here
      ]
    };
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Update our current root system
    if (parameters.rootSystem) {
      this.currentRootSystem = parameters.rootSystem;
    }
    
    // Call parent initialization
    await super.initialize(parameters);
    
    return true;
  }

  /**
   * Get the vertices for this permutahedron
   * @param {Object} THREE - THREE.js library
   * @param {Object} parameters - Visualization parameters
   * @returns {Array<THREE.Vector3>} Array of vertices
   */
  getVertices(THREE, parameters) {
    // Get coordinates based on root system type
    let coordinates;
    
    if (this.currentRootSystem === 'BC3') {
      coordinates = this.buildTypeBC();
    } else {
      coordinates = this.buildTypeA();
    }
    
    // Convert to THREE.Vector3 objects
    return coordinates.map(v => new THREE.Vector3(v[0] || 0, v[1] || 0, v[2] || 0));
  }

  /**
   * Should rebuild when root system changes
   * @param {Object} parameters - New parameters
   * @param {Object} prevParameters - Previous parameters
   * @returns {boolean} Whether to rebuild the polytope
   */
  shouldRebuildOnUpdate(parameters, prevParameters) {
    return parameters.rootSystem !== undefined && 
           parameters.rootSystem !== prevParameters?.rootSystem;
  }

  // ---------- Type A (S₄) ----------
  buildTypeA() {
    const perms4 = permutations([1, 2, 3, 4]);
    const basis = [[1, -1, 0, 0], [0, 1, -1, 0], [0, 0, 1, -1]];
    const ons = orthonormalBasis(basis);
    return perms4.map(p => ons.map(e => dot(p, e)));
  }

  // ---------- Type B/C (signed S₃) ----------
  buildTypeBC() {
    const base = [1, 2, 3];
    const pts = signedPermutations(base);
    const centroid = pts.reduce((c, p) => p.map((x, i) => c[i] + x), [0, 0, 0])
                        .map(x => x / pts.length);
    return pts.map(p => p.map((x, i) => x - centroid[i]));
  }
}

// ---------- Common Helpers ----------
function dot(u, v) { return u.reduce((s, ui, k) => s + ui * v[k], 0); }
function sub(u, v) { return u.map((ui, k) => ui - v[k]); }
function scale(u, s) { return u.map(ui => ui * s); }
function norm(u) { return Math.hypot(...u); }
function orthonormalBasis(vectors) {
  const es = [];
  for (let v of vectors) {
    let u = [...v];
    for (let e of es) u = sub(u, scale(e, dot(u, e)));
    const n = norm(u);
    if (n > 1e-8) es.push(scale(u, 1 / n));
  }
  return es;
}
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) =>
    permutations(arr.slice(0, i).concat(arr.slice(i + 1))).map(rest => [x, ...rest])
  );
}
function signedPermutations(arr) {
  const signs = arr.map(() => [-1, 1]);
  const allSigns = signs.reduce((acc, curr) => acc.flatMap(a => curr.map(s => [...a, s])), [[]]);
  return permutations(arr).flatMap(p => allSigns.map(signs => p.map((v, i) => v * signs[i])));
}
