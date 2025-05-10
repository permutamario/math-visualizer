// src/plugins/polytope-viewer/Polytope.js
// Representation of a polytope with methods to compute faces, edges, etc.

import { ConvexHull } from '../../../vendors/examples/jsm/math/ConvexHull.js';

/**
 * Class representing a 3D polytope
 */
export class Polytope {
  /**
   * Create a new Polytope
   * @param {Array<Array<number>>} vertices - Array of [x,y,z] vertices
   * @param {Object} options - Additional options
   * @param {string} options.name - Name of the polytope
   * @param {Object} options.parameters - Parameters used to generate the polytope
   * @param {Object} options.parameterSchema - Schema for the parameters
   */
  constructor(vertices, options = {}) {
    this.name = options.name || 'Unnamed Polytope';
    this.vertices = vertices;
    this.faces = [];
    this.edges = [];
    this.center = [0, 0, 0];

    // Ensure parameter metadata is always attached
    this.parameters = options.parameters ?? {};
    this.parameterSchema = options.parameterSchema ?? {};

    this.computeHull();
    this.computeCenter();
  }

  /**
   * Compute the convex hull of the vertices using Three.js ConvexHull
   */
  computeHull() {
    // Convert vertices to THREE.Vector3 objects
    const THREE = window.THREE; // Access global THREE
    if (!THREE) {
      console.error('THREE.js not available');
      return;
    }
    
    try {
      const points = this.vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
      
      // Create a new ConvexHull instance
      const hull = new ConvexHull();
      
      // Set the points and compute the hull
      hull.setFromPoints(points);
      
      // Get the faces from the hull
      const hullFaces = hull.faces;
      
      // Extract faces (arrays of vertex indices)
      this.faces = [];
      
      // Create a map of vertices for quick lookup
      const vertexMap = new Map();
      this.vertices.forEach((vertex, index) => {
        const key = `${vertex[0]},${vertex[1]},${vertex[2]}`;
        vertexMap.set(key, index);
      });
      
      // Process the faces from the hull
      for (const face of hullFaces) {
        // Get the vertices from the face's half-edges
        const edge = face.edge;
        const vertices = [];
        
        // Start at the first edge and traverse
        let currentEdge = edge;
        let iterations = 0; // Safety check to avoid infinite loops
        
        do {
          const vertex = currentEdge.vertex;
          const point = vertex.point;
          const key = `${point.x},${point.y},${point.z}`;
          
          // Find the index of this vertex in our original vertices array
          const vertexIndex = vertexMap.get(key);
          if (vertexIndex !== undefined) {
            vertices.push(vertexIndex);
          }
          
          currentEdge = currentEdge.next;
          iterations++;
          
          // Safety check - this should never happen with valid data
          if (iterations > 100) {
            console.error('Possible infinite loop in face traversal');
            break;
          }
        } while (currentEdge !== edge);
        
        if (vertices.length >= 3) {
          this.faces.push(vertices);
        }
      }
      
      // Extract edges from faces
      this.computeEdgesFromFaces();
    } catch (error) {
      console.error('Error computing convex hull:', error);
      
      // Fallback: create a simple triangulation
      if (this.vertices.length >= 4) {
        this.createSimpleTetrahedron();
      }
    }
  }
  
  /**
   * Compute edges from faces
   */
  computeEdgesFromFaces() {
    const edgeSet = new Set();
    
    this.faces.forEach(face => {
      const n = face.length;
      for (let i = 0; i < n; i++) {
        const a = face[i];
        const b = face[(i + 1) % n];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        edgeSet.add(key);
      }
    });
    
    this.edges = Array.from(edgeSet, key => key.split('-').map(Number));
  }
  
  /**
   * Fallback method to create a simple tetrahedron if hull computation fails
   */
  createSimpleTetrahedron() {
    // Use the first 4 vertices to make a tetrahedron
    if (this.vertices.length >= 4) {
      this.faces = [
        [0, 1, 2], 
        [0, 3, 1], 
        [1, 3, 2], 
        [0, 2, 3]
      ];
      
      this.computeEdgesFromFaces();
    }
  }

  /**
   * Compute the center of the polytope
   */
  computeCenter() {
    const n = this.vertices.length;
    const sum = this.vertices.reduce(
      (acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]],
      [0, 0, 0]
    );
    this.center = sum.map(x => x / n);
  }

  /**
   * Triangulate the faces into triangles
   * @returns {Array<Array<number>>} Array of triangular faces
   */
  triangulate() {
    const tris = [];
    for (const face of this.faces) {
      if (face.length === 3) {
        tris.push([...face]);
      } else if (face.length > 3) {
        const [a, ...rest] = face;
        for (let i = 0; i < rest.length - 1; i++) {
          tris.push([a, rest[i], rest[i + 1]]);
        }
      }
    }
    return tris;
  }

  /**
   * Convert the polytope to JSON
   * @returns {Object} JSON representation of the polytope
   */
  toJSON() {
    return {
      name: this.name,
      vertices: this.vertices,
      faces: this.faces,
      edges: this.edges,
      center: this.center,
      parameters: this.parameters,
      parameterSchema: this.parameterSchema,
    };
  }
}
