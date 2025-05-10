// src/plugins/polytope-viewer/utils/convex.js
// Utilities for working with convex hulls

import { ConvexHull } from '../../../../vendors/examples/jsm/math/ConvexHull.js';

/**
 * Convert vertices to THREE.Vector3 objects
 * @param {Array<Array<number>>} vertices - Vertices as [x,y,z] arrays
 * @param {Object} THREE - THREE.js library
 * @returns {Array<THREE.Vector3>} Vertices as THREE.Vector3 objects
 */
export function verticesToVector3(vertices, THREE) {
  return vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
}

/**
 * Compute convex hull using THREE.js implementation
 * @param {Array<THREE.Vector3>} points - Points as THREE.Vector3 objects
 * @returns {Object} THREE.js ConvexHull object
 */
export function computeConvexHull(points) {
  const hull = new ConvexHull();
  hull.setFromPoints(points);
  hull.makeHull();
  return hull;
}

/**
 * Check if a point is inside a convex hull
 * @param {Array<number>} point - Point to check
 * @param {Array<Array<number>>} vertices - Vertices of the convex hull
 * @param {Array<Array<number>>} faces - Faces of the convex hull
 * @returns {boolean} True if point is inside hull
 */
export function isPointInsideHull(point, vertices, faces) {
  // Simple implementation for checking if a point is inside a convex hull
  // This uses the fact that for a convex hull, a point is inside if and only if
  // it is on the same side of all faces
  
  const THREE = window.THREE;
  if (!THREE) return false;
  
  const pointVec = new THREE.Vector3(point[0], point[1], point[2]);
  
  // For each face, check if the point is on the "inside" side
  for (const face of faces) {
    // Get three vertices of the face
    const v0 = new THREE.Vector3(vertices[face[0]][0], vertices[face[0]][1], vertices[face[0]][2]);
    const v1 = new THREE.Vector3(vertices[face[1]][0], vertices[face[1]][1], vertices[face[1]][2]);
    const v2 = new THREE.Vector3(vertices[face[2]][0], vertices[face[2]][1], vertices[face[2]][2]);
    
    // Compute face normal
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    
    // Vector from a face vertex to the point
    const toPoint = new THREE.Vector3().subVectors(pointVec, v0);
    
    // Dot product with normal determines which side of the face the point is on
    // For a convex hull, the normals point outward, so negative dot product means "inside"
    if (normal.dot(toPoint) > 0) {
      return false; // Point is outside this face
    }
  }
  
  return true; // Point is inside all faces
}

/**
 * Generate a convex hull from points
 * @param {Array<Array<number>>} points - Points as [x,y,z] arrays
 * @param {Object} THREE - THREE.js library
 * @returns {Object} Hull object with faces, edges, etc.
 */
export function generateConvexHull(points, THREE) {
  // Convert to THREE.Vector3
  const vectors = verticesToVector3(points, THREE);
  
  // Compute hull
  const hull = computeConvexHull(vectors);
  
  // Extract faces
  const faces = hull.faces.map(face => [face.a, face.b, face.c]);
  
  // Compute edges
  const edgeSet = new Set();
  faces.forEach(face => {
    const n = face.length;
    for (let i = 0; i < n; i++) {
      const a = face[i], b = face[(i + 1) % n];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      edgeSet.add(key);
    }
  });
  const edges = Array.from(edgeSet, key => key.split('-').map(Number));
  
  return {
    vertices: points,
    faces,
    edges
  };
}
