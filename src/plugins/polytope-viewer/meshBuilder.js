// File: src/render/meshBuilder.js

/**
 * Build a THREE.Group with geometries for the polytope
 * Sets colors for faces/edges but lets the renderer handle materials
 *
 * @param {import('../../polytopes/Polytope.js').Polytope} polytope - The polytope to render
 * @param {Object} settings - Rendering settings
 * @param {string[]} settings.colorPalette - Color palette from ColorSchemeManager
 * @param {number} settings.faceOpacity - Opacity for faces (0-1)
 * @param {string} settings.renderMode - Material render mode (only used to determine wireframe vs solid)
 * @param {Object} renderEnv - The rendering environment with THREE.js
 * @returns {THREE.Group} A group containing the mesh representation
 */
export function buildMesh(polytope, settings, renderEnv) {
  const { colorPalette, faceOpacity, renderMode } = settings;
  const { THREE } = renderEnv;
  const group = new THREE.Group();

  // WIREFRAME MODE: create edges using Line objects
  if (renderMode === 'wireframe') {
    polytope.edges.forEach((edge, idx) => {
      // Get endpoints
      const vA = new THREE.Vector3(...polytope.vertices[edge[0]]);
      const vB = new THREE.Vector3(...polytope.vertices[edge[1]]);
      
      // Create geometry from two points
      const geometry = new THREE.BufferGeometry().setFromPoints([vA, vB]);
      
      // Each edge gets its own color from the palette
      const color = new THREE.Color(colorPalette[idx % colorPalette.length]);
      
      // Create a simple material - render system will handle specifics
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: faceOpacity < 1,
        opacity: faceOpacity,
        linewidth: 2
      });
      
      // Create the line and add to group
      const line = new THREE.Line(geometry, material);
      group.add(line);
    });
    
    return group;
  }
  
  // SOLID MESH MODE: create one mesh per face
  polytope.faces.forEach((faceIndices, faceIndex) => {
    // Get color for this face
    const color = new THREE.Color(colorPalette[faceIndex % colorPalette.length]);
    
    // Create a Shape from the face vertices
    const shape = new THREE.Shape();
    
    // Project face vertices onto a 2D plane for ShapeGeometry
    // First, compute face normal by taking cross product of two edges
    const v0 = new THREE.Vector3(...polytope.vertices[faceIndices[0]]);
    const v1 = new THREE.Vector3(...polytope.vertices[faceIndices[1]]);
    const v2 = new THREE.Vector3(...polytope.vertices[faceIndices[2]]);
    
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    
    // Create a rotation matrix to project onto the XY plane
    const rotationMatrix = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 0, 1);
    
    if (Math.abs(normal.dot(up)) < 0.9) {
      // If not already facing up/down, compute rotation
      const axis = new THREE.Vector3().crossVectors(normal, up).normalize();
      const angle = Math.acos(normal.dot(up));
      rotationMatrix.makeRotationAxis(axis, angle);
    } else if (normal.dot(up) < 0) {
      // If facing down, rotate 180 degrees around X
      rotationMatrix.makeRotationX(Math.PI);
    }
    
    // Project and add vertices to shape
    const faceVertices = faceIndices.map(idx => 
      new THREE.Vector3(...polytope.vertices[idx]).applyMatrix4(rotationMatrix)
    );
    
    // Move to first vertex
    shape.moveTo(faceVertices[0].x, faceVertices[0].y);
    
    // Add remaining vertices
    for (let i = 1; i < faceVertices.length; i++) {
      shape.lineTo(faceVertices[i].x, faceVertices[i].y);
    }
    
    // Close the shape
    shape.closePath();
    
    // Create geometry
    const geometry = new THREE.ShapeGeometry(shape);
    
    // Apply inverse rotation to get back to original orientation
    const inverseRotation = new THREE.Matrix4().copy(rotationMatrix).invert();
    geometry.applyMatrix4(inverseRotation);
    
    // Create material
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: faceOpacity < 1,
      opacity: faceOpacity,
      side: THREE.DoubleSide
    });
    
    // Create mesh and add to group
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  });
  
  return group;
}