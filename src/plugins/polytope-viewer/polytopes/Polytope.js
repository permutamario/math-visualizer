// File: polytopes/Polytope.js

// Import ConvexGeometry and ConvexHull from THREE examples
import { ConvexGeometry } from '../../../../vendors/examples/jsm/geometries/ConvexGeometry.js';
import { ConvexHull } from '../../../../vendors/examples/jsm/math/ConvexHull.js';
import * as THREE from '../../../../vendors/three.module.js';

export class Polytope {
  constructor(vertices, options = {}) {
    this.name = options.name || 'Unnamed Polytope';
    this.vertices = vertices;
    this.faces = [];
    this.edges = [];
    this.center = [0, 0, 0];
    this.triangulatedFaces = []; // Store triangulated faces grouped by original face

    // Ensure parameter metadata is always attached
    this.parameters = options.parameters ?? {};
    this.parameterSchema = options.parameterSchema ?? {};

    this.computeHull();
    this.computeCenter();
  }

  /**
   * Compute the convex hull and extract polygonal faces
   */
  computeHull() {
    // Convert vertices to Vector3 objects for ConvexHull
    const vector3Vertices = this.vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
    
    try {
      // Create a ConvexHull instance
      const hull = new ConvexHull();
      hull.setFromPoints(vector3Vertices);
      
      // Extract faces directly from the hull
      this._extractFacesFromHull(hull);
      
      // Extract edges from faces
      this._extractEdgesFromFaces();
      
      // Compute triangulation
      this._triangulateHull(hull);
    } catch (error) {
      console.error("Error computing convex hull:", error);
      // Fallback to simple tetrahedron if convex hull fails
      this.faces = [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]];
      this.edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
      this.triangulatedFaces = this.faces.map(face => [face]); // Each face is a single triangle
    }
  }

  /**
   * Extract polygonal faces from the ConvexHull
   * @param {ConvexHull} hull - THREE.js ConvexHull instance
   * @private
   */
  _extractFacesFromHull(hull) {
    this.faces = [];
    
    // Map hull vertex indices to our original vertex indices
    const hullToOriginalMap = new Map();
    
    // For each vertex in the hull
    const hullVertices = hull.vertices;
    for (let i = 0; i < hullVertices.length; i++) {
      const { x, y, z } = hullVertices[i].point;
      
      // Find the matching vertex in our original vertices array
      const originalIndex = this.vertices.findIndex(v => 
        Math.abs(v[0] - x) < 1e-6 && 
        Math.abs(v[1] - y) < 1e-6 && 
        Math.abs(v[2] - z) < 1e-6
      );
      
      if (originalIndex !== -1) {
        hullToOriginalMap.set(i, originalIndex);
      } else {
        console.warn(`Could not find matching vertex for hull vertex (${x}, ${y}, ${z})`);
        // This should not happen but fall back to using hull indices
        hullToOriginalMap.set(i, i);
      }
    }
    
    // Extract faces from hull faces
    for (let i = 0; i < hull.faces.length; i++) {
      const hullFace = hull.faces[i];
      const face = [];
      
      // Get the face edges in order
      let edge = hullFace.edge;
      do {
        const hullVertexIndex = edge.vertex;
        const originalVertexIndex = hullToOriginalMap.get(hullVertexIndex);
        if (originalVertexIndex !== undefined) {
          face.push(originalVertexIndex);
        }
        edge = edge.next;
      } while (edge !== hullFace.edge);
      
      // Add the face if it has at least 3 vertices
      if (face.length >= 3) {
        this.faces.push(face);
      }
    }
  }

  /**
   * Extract edges from faces
   * @private
   */
  _extractEdgesFromFaces() {
    const edgeSet = new Set();
    
    this.faces.forEach(face => {
      const n = face.length;
      for (let i = 0; i < n; i++) {
        const a = face[i];
        const b = face[(i + 1) % n];
        // Ensure consistent ordering (smaller index first)
        const edge = a < b ? `${a}-${b}` : `${b}-${a}`;
        edgeSet.add(edge);
      }
    });
    
    this.edges = Array.from(edgeSet).map(edge => {
      const [a, b] = edge.split('-').map(Number);
      return [a, b];
    });
  }

  /**
   * Triangulate the hull and organize triangles by face
   * @param {ConvexHull} hull - THREE.js ConvexHull instance
   * @private
   */
  _triangulateHull(hull) {
    this.triangulatedFaces = [];
    
    // For each face, compute a triangulation
    for (let i = 0; i < this.faces.length; i++) {
      const face = this.faces[i];
      const triangles = [];
      
      // Simple fan triangulation for convex faces
      if (face.length >= 3) {
        for (let j = 1; j < face.length - 1; j++) {
          triangles.push([face[0], face[j], face[j + 1]]);
        }
      }
      
      this.triangulatedFaces.push(triangles);
    }
  }

  /**
   * Compute center point of the polytope
   */
  computeCenter() {
    const n = this.vertices.length;
    if (n === 0) return;
    
    const sum = this.vertices.reduce(
      (acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]],
      [0, 0, 0]
    );
    this.center = sum.map(x => x / n);
  }

  /**
   * Get the triangulated faces grouped by original face
   * @returns {number[][][]} Array of arrays of triangles (one array per face)
   */
  triangulate() {
    return this.triangulatedFaces;
  }
}