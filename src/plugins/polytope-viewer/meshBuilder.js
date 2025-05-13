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

  // WIREFRAME MODE: one independent Line per edge
  if (renderMode === 'wireframe') {
    polytope.edges.forEach(([i, j], idx) => {
      // Get endpoints
      const vA = new THREE.Vector3(...polytope.vertices[i]);
      const vB = new THREE.Vector3(...polytope.vertices[j]);
      
      // Create geometry from two points
      const geometry = new THREE.BufferGeometry().setFromPoints([vA, vB]);
      
      // Each edge gets its own color from the palette
      const color = new THREE.Color(colorPalette[idx % colorPalette.length]);
      
      // Create a simple material - render system will handle specifics
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: faceOpacity < 1,
        opacity: faceOpacity
      });
      
      // Create the line and add to group
      const line = new THREE.Line(geometry, material);
      group.add(line);
    });
    
    return group;
  }
  
  // SOLID MESH MODE: one Mesh per face
  polytope.faces.forEach((faceIndices, faceIndex) => {
    // Extract face vertices
    const faceVertices = faceIndices.map(idx => polytope.vertices[idx]);
    
    // Create geometry for this face
    let geometry;
    
    if (faceVertices.length === 3) {
      // Triangle face - simple case
      geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(faceVertices.flat());
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    } else {
      // N-gon face - triangulate
      geometry = new THREE.BufferGeometry();
      
      // Convert to flat array of coordinates
      const coords = new Float32Array(faceVertices.flat());
      geometry.setAttribute('position', new THREE.BufferAttribute(coords, 3));
      
      // Create triangle indices (fan triangulation)
      const indices = [];
      for (let i = 1; i < faceVertices.length - 1; i++) {
        indices.push(0, i, i + 1);
      }
      
      geometry.setIndex(indices);
    }
    
    // Compute normals for proper lighting
    geometry.computeVertexNormals();
    
    // Get color for this face
    const color = new THREE.Color(colorPalette[faceIndex % colorPalette.length]);
    
    // Create a basic material with color - render system will handle specifics
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