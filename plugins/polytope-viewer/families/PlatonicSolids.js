import PolytopeFamily from '../PolytopeFamily.js';

export default class PlatonicSolids extends PolytopeFamily {
  constructor(plugin, name = "Platonic Solids") {
    super(plugin, name);
    
    // Define solid types
    this.solidTypes = [
      { value: 'tetrahedron', label: 'Tetrahedron' },
      { value: 'cube', label: 'Cube' },
      { value: 'octahedron', label: 'Octahedron' },
      { value: 'dodecahedron', label: 'Dodecahedron' },
      { value: 'icosahedron', label: 'Icosahedron' }
    ];
    
    // Set default type
    this.currentType = 'tetrahedron';
  }
  
  /**
   * Add parameters specific to Platonic solids
   */
  addFamilyParameters() {
    // Add parameter to select solid type
    this.plugin.addDropdown(
      'solidType',
      'Solid Type',
      'tetrahedron',
      this.solidTypes,
      'structural'
    );
  }
  
  /**
   * Calculate vertices based on the selected solid type
   */
  calculateVertices() {
    // Get parameters
    this.currentType = this.plugin.getParameter('solidType') || 'tetrahedron';
    const size = this.plugin.getParameter('size') || 1.0;
    
    // Generate vertices based on solid type
    switch (this.currentType) {
      case 'tetrahedron':
        return this.generateTetrahedron(size);
      case 'cube':
        return this.generateCube(size);
      case 'octahedron':
        return this.generateOctahedron(size);
      case 'dodecahedron':
        return this.generateDodecahedron(size);
      case 'icosahedron':
        return this.generateIcosahedron(size);
      default:
        return this.generateTetrahedron(size);
    }
  }
  
  /**
   * Generate vertices for a tetrahedron
   * @param {number} size - Size factor
   */
  generateTetrahedron(size) {
    // Regular tetrahedron centered at origin
    const a = size * 1.0;
    return [
      [a, a, a],     // (1, 1, 1)
      [-a, -a, a],   // (-1, -1, 1)
      [-a, a, -a],   // (-1, 1, -1)
      [a, -a, -a]    // (1, -1, -1)
    ];
  }
  
  /**
   * Generate vertices for a cube
   * @param {number} size - Size factor
   */
  generateCube(size) {
    // Unit cube centered at origin
    const a = size * 0.5;
    return [
      [-a, -a, -a], // 0: (-1, -1, -1)
      [a, -a, -a],  // 1: (1, -1, -1)
      [a, a, -a],   // 2: (1, 1, -1)
      [-a, a, -a],  // 3: (-1, 1, -1)
      [-a, -a, a],  // 4: (-1, -1, 1)
      [a, -a, a],   // 5: (1, -1, 1)
      [a, a, a],    // 6: (1, 1, 1)
      [-a, a, a]    // 7: (-1, 1, 1)
    ];
  }
  
  /**
   * Generate vertices for an octahedron
   * @param {number} size - Size factor
   */
  generateOctahedron(size) {
    // Regular octahedron centered at origin
    return [
      [size, 0, 0],    // (1, 0, 0)
      [0, size, 0],    // (0, 1, 0)
      [0, 0, size],    // (0, 0, 1)
      [-size, 0, 0],   // (-1, 0, 0)
      [0, -size, 0],   // (0, -1, 0)
      [0, 0, -size]    // (0, 0, -1)
    ];
  }
  
  /**
   * Generate vertices for a dodecahedron
   * @param {number} size - Size factor
   */
  generateDodecahedron(size) {
    // Values needed for dodecahedron construction
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const a = size * 0.5;
    const b = size * 0.5 * phi;
    const vertices = [];
    
    // Generate vertices based on coordinate permutations
    // (±1, ±1, ±1)
    for (let i = 0; i < 8; i++) {
      const x = a * ((i & 1) ? 1 : -1);
      const y = a * ((i & 2) ? 1 : -1);
      const z = a * ((i & 4) ? 1 : -1);
      vertices.push([x, y, z]);
    }
    
    // (0, ±φ, ±1/φ)
    vertices.push([0, b, a/phi]);
    vertices.push([0, b, -a/phi]);
    vertices.push([0, -b, a/phi]);
    vertices.push([0, -b, -a/phi]);
    
    // (±1/φ, 0, ±φ)
    vertices.push([a/phi, 0, b]);
    vertices.push([-a/phi, 0, b]);
    vertices.push([a/phi, 0, -b]);
    vertices.push([-a/phi, 0, -b]);
    
    // (±φ, ±1/φ, 0)
    vertices.push([b, a/phi, 0]);
    vertices.push([b, -a/phi, 0]);
    vertices.push([-b, a/phi, 0]);
    vertices.push([-b, -a/phi, 0]);
    
    return vertices;
  }
  
  /**
   * Generate vertices for an icosahedron
   * @param {number} size - Size factor
   */
  generateIcosahedron(size) {
    // Golden ratio needed for icosahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    const a = size;
    const b = size * phi;
    const vertices = [];
    
    // Generate the 12 vertices of the icosahedron
    // (0, ±1, ±φ)
    vertices.push([0, a, b]);
    vertices.push([0, a, -b]);
    vertices.push([0, -a, b]);
    vertices.push([0, -a, -b]);
    
    // (±1, ±φ, 0)
    vertices.push([a, b, 0]);
    vertices.push([a, -b, 0]);
    vertices.push([-a, b, 0]);
    vertices.push([-a, -b, 0]);
    
    // (±φ, 0, ±1)
    vertices.push([b, 0, a]);
    vertices.push([-b, 0, a]);
    vertices.push([b, 0, -a]);
    vertices.push([-b, 0, -a]);
    
    return vertices;
  }
}
