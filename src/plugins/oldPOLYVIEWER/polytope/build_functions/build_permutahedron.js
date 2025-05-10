// src/plugins/polytope-viewer/polytope/build_functions/build_permutahedron.js
// Builder for permutahedra based on root systems

import { Polytope } from '../Polytope.js';

// ---------- Common Helpers ----------
function dot(u, v) { return u.reduce((s, ui, k) => s + ui * v[k], 0); }
function sub(u, v) { return u.map((ui, k) => ui - v[k]); }
function scale(u, s) { return u.map(ui => ui * s); }
function norm(u) { return Math.hypot(...u); }

/**
 * Compute an orthonormal basis from a set of vectors
 * @param {Array} vectors - Input vectors
 * @returns {Array} Orthonormal basis
 */
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

/**
 * Generate all permutations of an array
 * @param {Array} arr - Input array
 * @returns {Array} All permutations
 */
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) =>
    permutations(arr.slice(0, i).concat(arr.slice(i + 1))).map(rest => [x, ...rest])
  );
}

/**
 * Generate all signed permutations of an array
 * @param {Array} arr - Input array
 * @returns {Array} All signed permutations
 */
function signedPermutations(arr) {
  const signs = arr.map(() => [-1, 1]);
  const allSigns = signs.reduce((acc, curr) => acc.flatMap(a => curr.map(s => [...a, s])), [[]]);
  return permutations(arr).flatMap(p => allSigns.map(signs => p.map((v, i) => v * signs[i])));
}

// ---------- Type A (S₄) Permutahedron ----------
function buildTypeA(size = 1) {
  const perms4 = permutations([1, 2, 3, 4]);
  const basis = [[1, -1, 0, 0], [0, 1, -1, 0], [0, 0, 1, -1]];
  const ons = orthonormalBasis(basis);
  const vertices = perms4.map(p => ons.map(e => dot(p, e) * size));
  return vertices;
}

// ---------- Type B/C (signed S₃) Permutahedron ----------
function buildTypeBC(size = 1) {
  const base = [1, 2, 3];
  const pts = signedPermutations(base);
  const centroid = pts.reduce((c, p) => p.map((x, i) => c[i] + x), [0, 0, 0])
                      .map(x => x / pts.length);
  const vertices = pts.map(p => p.map((x, i) => (x - centroid[i]) * size));
  return vertices;
}

// ---------- Type H3 Permutahedron ----------
// Simplified version - just a subset of vertices for an icosidodecahedron
function buildTypeH3(size = 1) {
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
  
  // Subset of vertices based on the H3 root system
  const vertices = [
    // 12 vertices from icosahedron
    [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
    [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1],
    
    // 20 vertices from dodecahedron
    [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
    [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
    [0, phi, 1/phi], [0, phi, -1/phi], [0, -phi, 1/phi], [0, -phi, -1/phi],
    [1/phi, 0, phi], [1/phi, 0, -phi], [-1/phi, 0, phi], [-1/phi, 0, -phi],
    [phi, 1/phi, 0], [phi, -1/phi, 0], [-phi, 1/phi, 0], [-phi, -1/phi, 0]
  ].map(v => v.map(x => x * size));
  
  return vertices;
}

/**
 * Build a permutahedron based on a root system
 * @param {Object} params - Construction parameters
 * @returns {Polytope} The constructed permutahedron
 */
export function build_permutahedron(params = { type: 'A3', size: 1 }) {
  const type = params.type || 'A3';
  const size = params.size || 1;
  
  let vertices;
  switch (type) {
    case 'B3/C3':
      vertices = buildTypeBC(size);
      break;
    case 'H3':
      vertices = buildTypeH3(size);
      break;
    case 'A3':
    default:
      vertices = buildTypeA(size);
      break;
  }

  return new Polytope(vertices, {
    name: `${type} Permutahedron`,
    parameters: params,
    parameterSchema: build_permutahedron.defaults
  });
}

// Define parameter schema for permutahedra
build_permutahedron.defaults = {
  type: {
    type: 'dropdown',
    options: ['A3', 'B3/C3', 'H3'],
    default: 'A3',
    name: 'Coxeter Type',
    description: 'Selects the root system that defines the permutahedron'
  },
  size: {
    type: 'slider',
    min: 0.1,
    max: 2,
    step: 0.1,
    default: 1,
    name: 'Size',
    description: 'Scale factor for the permutahedron'
  }
};
