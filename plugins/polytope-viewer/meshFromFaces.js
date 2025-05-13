/**
 * Creates a THREE.js mesh from a collection of polygonal faces
 * 
 * @param {Object} plugin - The plugin instance
 * @param {Array<Array<number>>} vertices - Array of vertex coordinates [x,y,z]
 * @param {Array<Array<number>>} faces - Array of faces, where each face is an array of vertex indices
 * @param {Array<number>} [edges] - Optional array of edges, where each edge is a pair of vertex indices
 * @returns {THREE.Group} A THREE.js group containing the mesh
 */
export function meshFromFaces(plugin, vertices, faces, edges) {
  // Get the rendering environment and palette
  const { renderEnv } = plugin;
  const { THREE } = renderEnv;
  
  // Create a group to hold all the meshes
  const group = new THREE.Group();
  
  // Get the color palette from plugin parameters
  const paletteName = plugin.getParameter('colorPalette') || 'default';
  let colorPalette = [];
  
  if (plugin.core && plugin.core.colorSchemeManager) {
    colorPalette = plugin.core.colorSchemeManager.getPalette(paletteName);
  } else {
    // Fallback color palette
    colorPalette = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
  }
  
  // Get the opacity
  const opacity = plugin.getParameter('opacity') || 0.85;
  const transparent = opacity < 1.0;
  
  // Process each face
  faces.forEach((face, faceIndex) => {
    if (face.length < 3) return; // Skip degenerate faces
    
    // Get color for this face from the palette
    const color = new THREE.Color(colorPalette[faceIndex % colorPalette.length]);
    
    // Create a geometry for this face
    const geometry = new THREE.BufferGeometry();
    
    // Create position array for vertices
    const positions = [];
    for (const vertexIndex of face) {
      if (vertexIndex === undefined || vertexIndex < 0 || vertexIndex >= vertices.length) {
        console.error(`Invalid vertex index ${vertexIndex} in face ${faceIndex}`);
        return; // Skip this face
      }
      const vertex = vertices[vertexIndex];
      if (!vertex) {
        console.error(`Vertex at index ${vertexIndex} is undefined`);
        return; // Skip this face
      }
      positions.push(vertex[0], vertex[1], vertex[2]);
    }
    
    // Set the position attribute
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    // Triangulate the face with a fan triangulation
    const indices = [];
    for (let i = 1; i < face.length - 1; i++) {
      indices.push(0, i, i + 1);
    }
    
    // Set the index attribute
    geometry.setIndex(indices);
    
    // Compute normals
    geometry.computeVertexNormals();
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: color,
      transparent: transparent,
      opacity: opacity,
      side: THREE.DoubleSide
    });
    
    // Create mesh and add to group
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  });
  
  // Add edges if provided
  if (edges && plugin.getParameter('showEdges')) {
    const edgeColor = new THREE.Color(0x000000);
    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: edgeColor,
      transparent: transparent,
      opacity: Math.min(1, opacity + 0.1)
    });
    
    edges.forEach(edge => {
      if (edge[0] === undefined || edge[1] === undefined || 
          edge[0] < 0 || edge[0] >= vertices.length || 
          edge[1] < 0 || edge[1] >= vertices.length) {
        console.error(`Invalid edge indices: ${edge}`);
        return; // Skip this edge
      }
      
      const start = vertices[edge[0]];
      const end = vertices[edge[1]];
      
      if (!start || !end) {
        console.error(`Vertex missing for edge ${edge}`);
        return; // Skip this edge
      }
      
      const points = [
        new THREE.Vector3(start[0], start[1], start[2]),
        new THREE.Vector3(end[0], end[1], end[2])
      ];
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, edgeMaterial);
      group.add(line);
    });
  }
  
  return group;
}
