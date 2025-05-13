/**
 * Creates a THREE.js mesh from a collection of polygonal faces
 * with automatic resource tracking via Plugin3D
 * 
 * @param {Plugin3D} plugin - The plugin instance
 * @param {Array<Array<number>>} vertices - Array of vertex coordinates [x,y,z]
 * @param {Array<Array<number>>} faces - Array of faces, where each face is an array of vertex indices
 * @param {Array<number>} [edges] - Optional array of edges, where each edge is a pair of vertex indices
 * @returns {THREE.Group} A THREE.js group containing the mesh
 */
export function meshFromFaces(plugin, vertices, faces, edges) {
  const { THREE } = plugin.renderEnv;
  
  // Create a group to hold all the meshes
  const group = plugin.createGroup();
  
  // Get the color palette from plugin parameters
  const paletteName = plugin.getParameter('colorPalette') || 'default';
  const colorPalette = plugin.core.colorSchemeManager.getPalette(paletteName);
  
  // Get the opacity
  const opacity = plugin.getParameter('opacity') || 0.85;
  const transparent = opacity < 1.0;
  
  // Process each face
  faces.forEach((face, faceIndex) => {
    if (face.length < 3) return; // Skip degenerate faces
    
    // Get color for this face from the palette
    const color = new THREE.Color(colorPalette[faceIndex % colorPalette.length]);
    
    // Create a geometry for this face and register it with Plugin3D
    const geometry = plugin.addGeometry(new THREE.BufferGeometry());
    
    // Create position array for vertices
    const positions = [];
    for (const vertexIndex of face) {
      if (vertexIndex === undefined || vertexIndex < 0 || vertexIndex >= vertices.length) {
        console.error(`Invalid vertex index ${vertexIndex} in face ${faceIndex}`);
        return; // Skip this face
      }
      const vertex = vertices[vertexIndex];
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
    
    // Create material and register it with Plugin3D
    const material = plugin.addMaterial(new THREE.MeshStandardMaterial({
      color: color,
      transparent: transparent,
      opacity: opacity,
      side: THREE.DoubleSide
    }));
    
    // Create mesh and add to group with Plugin3D tracking
    const mesh = plugin.addMesh(new THREE.Mesh(geometry, material));
    group.add(mesh);
  });
  
  // Add edges if provided
  if (edges && plugin.getParameter('showEdges')) {
    const edgeColor = new THREE.Color(0x000000);
    const edgeMaterial = plugin.addMaterial(new THREE.LineBasicMaterial({ 
      color: edgeColor,
      transparent: transparent,
      opacity: Math.min(1, opacity + 0.1)
    }));
    
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
      
      const geometry = plugin.addGeometry(new THREE.BufferGeometry().setFromPoints(points));
      const line = plugin.addMesh(new THREE.Line(geometry, edgeMaterial));
      group.add(line);
    });
  }
  
  return group;
}
