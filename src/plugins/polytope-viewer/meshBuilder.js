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

  // WIREFRAME MODE: one distinct Line per edge
  if (renderMode === 'wireframe') {
    polytope.edges.forEach((edge, idx) => {
      // Get endpoints
      const vA = new THREE.Vector3(...polytope.vertices[edge[0]]);
      const vB = new THREE.Vector3(...polytope.vertices[edge[1]]);
      
      // Create geometry from two points
      const geometry = new THREE.BufferGeometry().setFromPoints([vA, vB]);
      
      // Each edge gets its own color from the palette
      const color = new THREE.Color(colorPalette[idx % colorPalette.length]);
      
      // Create a line material
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: faceOpacity < 1,
        opacity: faceOpacity,
        linewidth: 1
      });
      
      // Create the line and add to group
      const line = new THREE.Line(geometry, material);
      group.add(line);
    });
    
    return group;
  }
  
  // SOLID MESH MODE: one mesh per face with triangulation
  polytope.faces.forEach((faceIndices, faceIndex) => {
    // Get color for this face
    const color = new THREE.Color(colorPalette[faceIndex % colorPalette.length]);
    
    // Create a triangulated geometry from the face vertices
    const coords = new Float32Array(
      faceIndices.flatMap(i => polytope.vertices[i])
    );
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(coords, 3));
    
    // Fan triangulation of the face
    const indices = [];
    for (let j = 1; j + 1 < faceIndices.length; j++) {
      indices.push(0, j, j + 1);
    }
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    
    // Create material based on render mode
    const material = new THREE.MeshStandardMaterial({
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