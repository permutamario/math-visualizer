import PolytopeFamily from '../PolytopeFamily.js';

export default class ArchimedeanSolids extends PolytopeFamily {
  constructor(plugin, name = "Archimedean Solids") {
    super(plugin, name);
    
    // Define solid types - names for display
    this.solidTypes = [
      { value: 'truncatedTetrahedron', label: 'Truncated Tetrahedron' },
      { value: 'cuboctahedron', label: 'Cuboctahedron' },
      { value: 'truncatedCube', label: 'Truncated Cube' },
      { value: 'truncatedOctahedron', label: 'Truncated Octahedron' },
      { value: 'rhombicuboctahedron', label: 'Rhombicuboctahedron' },
      { value: 'truncatedCuboctahedron', label: 'Truncated Cuboctahedron' },
      { value: 'snubCube', label: 'Snub Cube' },
      { value: 'icosidodecahedron', label: 'Icosidodecahedron' },
      { value: 'truncatedDodecahedron', label: 'Truncated Dodecahedron' },
      { value: 'truncatedIcosahedron', label: 'Truncated Icosahedron' },
      { value: 'rhombicosidodecahedron', label: 'Rhombicosidodecahedron' },
      { value: 'truncatedIcosidodecahedron', label: 'Truncated Icosidodecahedron' },
      { value: 'snubDodecahedron', label: 'Snub Dodecahedron' }
    ];
    
    // Set default type
    this.currentType = 'truncatedTetrahedron';
    
    // Will store the loaded polyhedra data
    this.polytopeData = null;
    
    // Load the data when constructed
    this._loadData();
  }
  
  /**
   * Add parameters specific to Archimedean solids
   */
  addFamilyParameters() {
    // Add parameter to select solid type
    this.plugin.addDropdown(
      'solidType',
      'Solid Type',
      this.currentType,
      this.solidTypes,
      'structural'
    );
    
  }
  
  /**
   * Load the pre-computed polyhedra data
   * @private
   */
  async _loadData() {
    try {
      const response = await fetch('/math-visualizer/plugins/polytope-viewer/families/data/archimedean_solids.json');
      if (!response.ok) {
        throw new Error(`Failed to load Archimedean solids data: ${response.statusText}`);
      }
      
      this.polytopeData = await response.json();
      console.log(`Loaded data for ${Object.keys(this.polytopeData).length} Archimedean solids`);
    } catch (error) {
      console.error("Failed to load Archimedean solids data:", error);
      // Fallback to empty data
      this.polytopeData = {};
    }
  }
  
  /**
   * Calculate vertices based on the selected solid type
   */
  calculateVertices() {
    // Get parameters
    this.currentType = this.plugin.getParameter('solidType') || this.currentType;
    const size = this.plugin.getParameter('size') || 1.0;
    
    // If data isn't loaded yet or type isn't found, return empty array
    if (!this.polytopeData || !this.polytopeData[this.currentType]) {
      return [];
    }
    
    // Get vertices from pre-computed data
    const vertices = this.polytopeData[this.currentType].vertices;
    
    // Apply size scaling
    return vertices.map(v => [v[0] * size, v[1] * size, v[2] * size]);
  }
  
}
