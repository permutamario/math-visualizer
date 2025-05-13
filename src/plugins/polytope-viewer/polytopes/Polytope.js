// File: polytopes/Polytope.js

// Import ConvexGeometry from THREE examples
// Note: In your actual implementation, you'll need to adjust this import path
// to match your project structure
import { ConvexGeometry } from '../../../../vendors/examples/jsm/geometries/ConvexGeometry.js';
import * as THREE from '../../../../vendors/three.module.js';

export class Polytope {
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
   * Compute the convex hull of the vertices using THREE.ConvexGeometry
   */
  computeHull() {
    // Convert vertices to Vector3 objects for ConvexGeometry
    const vector3Vertices = this.vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
    
    // Create the ConvexGeometry
    const geometry = new ConvexGeometry(vector3Vertices);
    
    // Extract faces from the geometry
    // ConvexGeometry produces triangles, so we need to identify the original faces
    this._extractFacesFromGeometry(geometry);
    
    // Extract edges from faces
    this._extractEdgesFromFaces();
  }

  /**
   * Extract faces from a THREE.js geometry
   * @param {THREE.BufferGeometry} geometry - ConvexGeometry to extract faces from
   * @private
   */
  _extractFacesFromGeometry(geometry) {
    // Get the face indices from the geometry
    const positionAttribute = geometry.getAttribute('position');
    const indices = geometry.getIndex() ? 
      Array.from(geometry.getIndex().array) : 
      Array.from({ length: positionAttribute.count }, (_, i) => i);
    
    // Get all positions as vectors
    const positions = [];
    for (let i = 0; i < positionAttribute.count; i++) {
      positions.push(new THREE.Vector3(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      ));
    }
    
    // Map positions back to original vertex indices
    const positionToVertexMap = positions.map(pos => {
      return this.vertices.findIndex(v => 
        Math.abs(pos.x - v[0]) < 1e-6 && 
        Math.abs(pos.y - v[1]) < 1e-6 && 
        Math.abs(pos.z - v[2]) < 1e-6
      );
    });
    
    // Group triangles into faces
    this._extractFacesFromTriangles(indices, positionToVertexMap);
  }

  /**
   * Extract faces by merging coplanar triangles
   * @param {number[]} triangleIndices - Triangle indices from geometry
   * @param {number[]} vertexMap - Map from position indices to original vertex indices
   * @private
   */
  _extractFacesFromTriangles(triangleIndices, vertexMap) {
    const faces = [];
    const faceNormals = [];
    const triangleCount = triangleIndices.length / 3;
    
    // Helper function to compute face normal
    const computeNormal = (v1, v2, v3) => {
      const a = this.vertices[v1];
      const b = this.vertices[v2];
      const c = this.vertices[v3];
      
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      
      // Cross product
      const normal = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0]
      ];
      
      // Normalize
      const length = Math.sqrt(normal[0]**2 + normal[1]**2 + normal[2]**2);
      return [normal[0] / length, normal[1] / length, normal[2] / length];
    };
    
    // Helper function to check if normals are similar (same face)
    const normalsSimilar = (n1, n2) => {
      const dot = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2];
      return Math.abs(dot) > 0.99; // Allow for small numerical errors
    };
    
    // Process each triangle and assign to a face
    for (let i = 0; i < triangleCount; i++) {
      const idx1 = vertexMap[triangleIndices[i * 3]];
      const idx2 = vertexMap[triangleIndices[i * 3 + 1]];
      const idx3 = vertexMap[triangleIndices[i * 3 + 2]];
      
      // Skip degenerate triangles
      if (idx1 === -1 || idx2 === -1 || idx3 === -1) continue;
      
      const normal = computeNormal(idx1, idx2, idx3);
      
      // Find a matching face with similar normal
      let matchingFaceIndex = -1;
      for (let j = 0; j < faceNormals.length; j++) {
        if (normalsSimilar(normal, faceNormals[j])) {
          matchingFaceIndex = j;
          break;
        }
      }
      
      if (matchingFaceIndex === -1) {
        // Create a new face
        faces.push([idx1, idx2, idx3]);
        faceNormals.push(normal);
      } else {
        // Try to add vertices to existing face
        const face = faces[matchingFaceIndex];
        
        // Add unique vertices to face
        [idx1, idx2, idx3].forEach(idx => {
          if (!face.includes(idx)) {
            face.push(idx);
          }
        });
      }
    }
    
    // Store the computed faces
    this.faces = faces;
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
        const a = face[i], b = face[(i + 1) % n];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        edgeSet.add(key);
      }
    });
    
    this.edges = Array.from(edgeSet, key => key.split('-').map(Number));
  }

  /**
   * Compute center point of the polytope
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
   * Triangulate the polytope faces
   * @returns {number[][]} Array of triangle indices
   */
  triangulate() {
    // Convert vertices to Vector3 objects for ConvexGeometry
    const vector3Vertices = this.vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));
    
    // Create the ConvexGeometry which will automatically triangulate the polytope
    const geometry = new ConvexGeometry(vector3Vertices);
    
    // Get the triangle indices from the geometry
    const indices = geometry.getIndex() ? Array.from(geometry.getIndex().array) : [];
    
    // Convert to our format: array of triangle arrays
    const triangles = [];
    for (let i = 0; i < indices.length; i += 3) {
      triangles.push([indices[i], indices[i+1], indices[i+2]]);
    }
    
    // Clean up 
    geometry.dispose();
    
    return triangles;
  }
}