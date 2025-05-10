// src/plugins/polytope-viewer/PolytopeRenderer.js
// Converts Polytope objects into THREE.js visualizations

import { ConvexGeometry } from '../../../vendors/examples/jsm/geometries/ConvexGeometry.js';

/**
 * Class to handle rendering of Polytope objects with THREE.js
 */
export class PolytopeRenderer {
  /**
   * Create a new PolytopeRenderer
   * @param {Object} THREE - THREE.js library
   * @param {MaterialManager} materialManager - Material manager instance
   */
  constructor(THREE, materialManager) {
    this.THREE = THREE;
    this.materialManager = materialManager;
    this.meshRefs = {}; // Store mesh references for cleanup
  }
  
  /**
   * Create THREE.js visualization from a Polytope
   * @param {Polytope} polytope - Polytope to render
   * @param {Object} options - Visual options
   * @returns {THREE.Group} Group containing the polytope visualization
   */
  createFromPolytope(polytope, options = {}) {
    const group = new this.THREE.Group();
    
    // Create faces
    if (options.showFaces !== false) {
      const faceMeshes = this.createFaceMeshes(polytope, options);
      group.add(faceMeshes);
    }
    
    // Create edges
    if (options.showEdges !== false) {
      const edgeMeshes = this.createEdgeMeshes(polytope, options);
      group.add(edgeMeshes);
    }
    
    // Create vertices
    if (options.showVertices) {
      const vertexMeshes = this.createVertexMeshes(polytope, options);
      group.add(vertexMeshes);
    }
    
    // Store references for later updates and cleanup
    this.meshRefs = {
      group,
      faces: group.children[0],
      edges: options.showEdges !== false ? group.children[1] : null,
      vertices: options.showVertices ? group.children[options.showEdges !== false ? 2 : 1] : null
    };
    
    return group;
  }
  
  /**
   * Create face meshes for the polytope
   * @param {Polytope} polytope - Polytope to render
   * @param {Object} options - Visual options
   * @returns {THREE.Group} Group containing face meshes
   */
  createFaceMeshes(polytope, options = {}) {
    const group = new this.THREE.Group();
    group.name = 'faces';
    
    // Get options
    const wireframe = options.wireframe === true;
    const opacity = options.faceOpacity !== undefined ? options.faceOpacity : 0.85;
    const transparent = opacity < 1;
    const colorMode = options.faceColorMode || 'uniform';
    const baseColor = options.faceColor || '#3498db';
    
    // Convert vertices to THREE.Vector3 objects
    const vectors = polytope.vertices.map(v => new this.THREE.Vector3(v[0], v[1], v[2]));
    
    // Method 1: Use ConvexGeometry for a single mesh
    if (colorMode === 'uniform') {
      // Create a single convex geometry
      const geometry = new ConvexGeometry(vectors);
      
      // Create material
      const material = this.materialManager.createFaceMaterial({
        color: baseColor,
        opacity,
        transparent,
        wireframe
      });
      
      // Create mesh
      const mesh = new this.THREE.Mesh(geometry, material);
      mesh.name = 'unified-faces';
      group.add(mesh);
    }
    // Method 2: Create individual face meshes for separate coloring
    else {
      // Create material for each face
      const faces = polytope.faces;
      
      faces.forEach((face, index) => {
        // Create a geometry for this face
        const faceGeometry = new this.THREE.BufferGeometry();
        
        // Triangulate the face if it has more than 3 vertices
        let triangles = [];
        if (face.length === 3) {
          triangles = [face];
        } else {
          // Basic fan triangulation
          for (let i = 1; i < face.length - 1; i++) {
            triangles.push([face[0], face[i], face[i + 1]]);
          }
        }
        
        // Convert triangles to vertices
        const vertices = [];
        triangles.forEach(triangle => {
          triangle.forEach(vertexIndex => {
            const vertex = polytope.vertices[vertexIndex];
            vertices.push(vertex[0], vertex[1], vertex[2]);
          });
        });
        
        // Set position attribute
        faceGeometry.setAttribute(
          'position',
          new this.THREE.Float32BufferAttribute(vertices, 3)
        );
        
        // Compute vertex normals
        faceGeometry.computeVertexNormals();
        
        // Create material with appropriate color
        let faceColor = baseColor;
        
        // Change color based on color mode
        if (colorMode === 'by_face') {
          // Use a different color for each face based on its index
          const hue = (index / faces.length) * 360;
          faceColor = `hsl(${hue}, 70%, 60%)`;
        } else if (colorMode === 'by_face_size') {
          // Use color based on number of vertices in the face
          const hue = ((face.length - 3) * 30) % 360; // 3 sides = 0°, 4 sides = 30°, etc.
          faceColor = `hsl(${hue}, 70%, 60%)`;
        }
        
        const material = this.materialManager.createFaceMaterial({
          color: faceColor,
          opacity,
          transparent,
          wireframe
        });
        
        // Create mesh
        const mesh = new this.THREE.Mesh(faceGeometry, material);
        mesh.name = `face-${index}`;
        group.add(mesh);
      });
    }
    
    return group;
  }
  
  /**
   * Create edge meshes for the polytope
   * @param {Polytope} polytope - Polytope to render
   * @param {Object} options - Visual options
   * @returns {THREE.Group} Group containing edge meshes
   */
  createEdgeMeshes(polytope, options = {}) {
    const group = new this.THREE.Group();
    group.name = 'edges';
    
    // Get options
    const color = options.edgeColor || '#000000';
    const thickness = options.edgeThickness || 1;
    
    // Create material
    const material = this.materialManager.createEdgeMaterial({
      color,
      linewidth: thickness
    });
    
    // Create a single geometry for all edges
    const geometry = new this.THREE.BufferGeometry();
    
    // Prepare positions array
    const positions = [];
    
    // Add each edge
    polytope.edges.forEach(edge => {
      const v1 = polytope.vertices[edge[0]];
      const v2 = polytope.vertices[edge[1]];
      
      // Add vertices to positions array
      positions.push(v1[0], v1[1], v1[2]);
      positions.push(v2[0], v2[1], v2[2]);
    });
    
    // Set geometry attributes
    geometry.setAttribute('position', new this.THREE.Float32BufferAttribute(positions, 3));
    
    // Create line segments
    const lines = new this.THREE.LineSegments(geometry, material);
    lines.name = 'edge-lines';
    
    group.add(lines);
    return group;
  }
  
  /**
   * Create vertex meshes for the polytope
   * @param {Polytope} polytope - Polytope to render
   * @param {Object} options - Visual options
   * @returns {THREE.Group} Group containing vertex meshes
   */
  createVertexMeshes(polytope, options = {}) {
    const group = new this.THREE.Group();
    group.name = 'vertices';
    
    // Get options
    const color = options.vertexColor || '#ffffff';
    const size = options.vertexSize || 0.05;
    
    // Create common geometry for all vertices
    const geometry = new this.THREE.SphereGeometry(size, 8, 8);
    
    // Create material
    const material = this.materialManager.createVertexMaterial({
      color
    });
    
    // Create a mesh for each vertex
    polytope.vertices.forEach((vertex, index) => {
      const mesh = new this.THREE.Mesh(geometry, material);
      mesh.position.set(vertex[0], vertex[1], vertex[2]);
      mesh.name = `vertex-${index}`;
      group.add(mesh);
    });
    
    return group;
  }
  
  /**
   * Update visual properties of an existing polytope visualization
   * @param {THREE.Group} group - Group containing the polytope visualization
   * @param {Object} options - New visual options
   */
  updateVisualProperties(group, options = {}) {
    if (!group || !this.meshRefs) return;
    
    // Get the mesh groups
    const { faces, edges, vertices } = this.meshRefs;
    
    // Update face properties
    if (faces && options.showFaces !== false) {
      const wireframe = options.wireframe === true;
      const opacity = options.faceOpacity !== undefined ? options.faceOpacity : 0.85;
      const transparent = opacity < 1;
      const baseColor = options.faceColor || '#3498db';
      
      // Update materials for all face meshes
      faces.traverse(child => {
        if (child.isMesh) {
          child.visible = true;
          
          // Update material properties
          if (child.material) {
            child.material.wireframe = wireframe;
            child.material.opacity = opacity;
            child.material.transparent = transparent;
            
            // Only update color for uniform color mode
            if (options.faceColorMode === 'uniform') {
              child.material.color.set(baseColor);
            }
            
            child.material.needsUpdate = true;
          }
        }
      });
    } else if (faces) {
      // Hide faces
      faces.visible = false;
    }
    
    // Update edge properties
    if (edges && options.showEdges !== false) {
      edges.visible = true;
      
      const color = options.edgeColor || '#000000';
      const thickness = options.edgeThickness || 1;
      
      // Update materials for all edge meshes
      edges.traverse(child => {
        if (child.isLine) {
          // Update material properties
          if (child.material) {
            child.material.color.set(color);
            child.material.linewidth = thickness;
            child.material.needsUpdate = true;
          }
        }
      });
    } else if (edges) {
      // Hide edges
      edges.visible = false;
    }
    
    // Update vertex properties
    if (vertices && options.showVertices) {
      vertices.visible = true;
      
      const color = options.vertexColor || '#ffffff';
      const size = options.vertexSize || 0.05;
      
      // Update materials for all vertex meshes
      vertices.traverse(child => {
        if (child.isMesh) {
          // Update material properties
          if (child.material) {
            child.material.color.set(color);
            child.material.needsUpdate = true;
          }
          
          // Update size if changed significantly
          if (Math.abs(child.geometry.parameters?.radius - size) > 0.001) {
            // Replace geometry with new size
            const oldGeometry = child.geometry;
            child.geometry = new this.THREE.SphereGeometry(size, 8, 8);
            oldGeometry.dispose();
          }
        }
      });
    } else if (vertices) {
      // Hide vertices
      vertices.visible = false;
    }
  }
  
  /**
   * Dispose of all resources
   */
  dispose() {
    if (!this.meshRefs) return;
    
    // Dispose of all geometries and materials
    const { faces, edges, vertices } = this.meshRefs;
    
    if (faces) {
      faces.traverse(child => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          child.material.dispose();
        }
      });
    }
    
    if (edges) {
      edges.traverse(child => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          child.material.dispose();
        }
      });
    }
    
    if (vertices) {
      vertices.traverse(child => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          child.material.dispose();
        }
      });
    }
    
    this.meshRefs = {};
  }
}
