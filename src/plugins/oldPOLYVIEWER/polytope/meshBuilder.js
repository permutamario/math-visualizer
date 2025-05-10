// src/plugins/polytope-viewer/polytope/meshBuilder.js
// Converts Polytope objects into THREE.js meshes

import * as THREE from '../../../../vendors/three.module.js';

/**
 * Create a THREE.js mesh for a Polytope
 * @param {Polytope} polytope - The polytope object
 * @param {Object} settings - Render settings
 * @returns {THREE.Group} A THREE.js group containing the mesh
 */
export function createPolytopeMesh(polytope, settings) {
  const group = new THREE.Group();
  
  // Extract settings
  const {
    wireframe = false,
    showFaces = true,
    faceColor = '#3498db',
    faceOpacity = 0.85,
    showVertices = true,
    vertexSize = 0.1,
    edgeThickness = 1,
    edgeColor = '#000000'
  } = settings;
  
  // Add faces if enabled
  if (showFaces && !wireframe) {
    const facesMesh = createFacesMesh(polytope, faceColor, faceOpacity);
    group.add(facesMesh);
  }
  
  // Add edges
  const edgesMesh = createEdgesMesh(polytope, edgeColor, edgeThickness, wireframe);
  group.add(edgesMesh);
  
  // Add vertices if enabled
  if (showVertices) {
    const verticesMesh = createVerticesMesh(polytope, edgeColor, vertexSize);
    group.add(verticesMesh);
  }
  
  return group;
}

/**
 * Create a mesh for the faces of a polytope
 * @param {Polytope} polytope - The polytope object
 * @param {string} color - Face color (hex)
 * @param {number} opacity - Face opacity
 * @returns {THREE.Mesh} A THREE.js mesh for the faces
 */
function createFacesMesh(polytope, color, opacity) {
  // Create a material for the faces
  const material = new THREE.MeshPhongMaterial({
    color: new THREE.Color(color),
    side: THREE.DoubleSide,
    transparent: opacity < 1,
    opacity: opacity,
    flatShading: true
  });
  
  // We need to triangulate the faces
  const triangulatedFaces = polytope.triangulate();
  
  // Create a geometry from the triangulated faces
  const geometry = new THREE.BufferGeometry();
  
  // Extract vertices for each triangle face
  const vertices = [];
  const normals = [];
  
  triangulatedFaces.forEach(face => {
    // Get three points for the face
    const points = face.map(index => polytope.vertices[index]);
    
    // Add vertices to the array
    points.forEach(point => {
      vertices.push(point[0], point[1], point[2]);
    });
    
    // Calculate face normal for flat shading
    const v1 = new THREE.Vector3().fromArray(points[0]);
    const v2 = new THREE.Vector3().fromArray(points[1]);
    const v3 = new THREE.Vector3().fromArray(points[2]);
    
    const normal = new THREE.Vector3()
      .crossVectors(
        new THREE.Vector3().subVectors(v2, v1),
        new THREE.Vector3().subVectors(v3, v1)
      )
      .normalize();
    
    // Add the same normal for each vertex
    for (let i = 0; i < 3; i++) {
      normals.push(normal.x, normal.y, normal.z);
    }
  });
  
  // Set attributes for the geometry
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  
  // Create the mesh
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

/**
 * Create a mesh for the edges of a polytope
 * @param {Polytope} polytope - The polytope object
 * @param {string} color - Edge color (hex)
 * @param {number} thickness - Edge thickness
 * @param {boolean} wireframe - Whether in wireframe mode
 * @returns {THREE.LineSegments} A THREE.js line segments object for the edges
 */
function createEdgesMesh(polytope, color, thickness, wireframe) {
  // Create material for edges
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    linewidth: thickness
  });
  
  // In wireframe mode, use a brighter material
  if (wireframe) {
    material.color = new THREE.Color(0xffffff);
  }
  
  // Extract edge vertices
  const vertices = [];
  
  polytope.edges.forEach(edge => {
    const [i, j] = edge;
    const v1 = polytope.vertices[i];
    const v2 = polytope.vertices[j];
    
    // Add both vertices for the line segment
    vertices.push(v1[0], v1[1], v1[2]);
    vertices.push(v2[0], v2[1], v2[2]);
  });
  
  // Create geometry for edges
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  
  // Create the line segments
  const lines = new THREE.LineSegments(geometry, material);
  return lines;
}

/**
 * Create a mesh for the vertices of a polytope
 * @param {Polytope} polytope - The polytope object
 * @param {string} color - Vertex color (hex)
 * @param {number} size - Vertex size
 * @returns {THREE.Points} A THREE.js points object for the vertices
 */
function createVerticesMesh(polytope, color, size) {
  // Create material for vertices
  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: size,
    sizeAttenuation: true
  });
  
  // Extract vertex positions
  const vertices = [];
  
  polytope.vertices.forEach(vertex => {
    vertices.push(vertex[0], vertex[1], vertex[2]);
  });
  
  // Create geometry for vertices
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  
  // Create the points
  const points = new THREE.Points(geometry, material);
  return points;
}

/**
 * Dispose of a polytope mesh and its resources
 * @param {THREE.Group} mesh - The mesh to dispose
 */
export function disposePolytopeMesh(mesh) {
  if (!mesh) return;
  
  // Dispose of all geometries and materials
  mesh.traverse(obj => {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => mat.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}
