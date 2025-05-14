// plugins/polytope-viewer/index.js
import { Plugin3D } from '../../src/core/Plugin3D.js';
import PolytopeFamily from './PolytopeFamily.js';

export default class PolytopeVisualization extends Plugin3D {
  // Required static properties
  static id = 'polytope-visualization';
  static name = 'Polytope Visualization';
  static description = 'Visualize various 3D polytope families';
  static renderingType = '3d';
  
  constructor(core) {
    super(core);
    
    // State for polytope families
    this.families = [];
    this.currentFamily = null;
  }
  
  async start() {
    // Add visual parameters
    this.addCheckbox('showEdges', 'Show Edges', true);
    this.addColorPalette(); // Use the plugin's color palette helper
    this.addDropdown('renderMode', 'Render Mode', 'standard', 
                    ['standard', 'metallic', 'glass', 'toon'], 'visual');
    this.addSlider('opacity', 'Opacity', 0.85, { min: 0.1, max: 1.0, step: 0.05 }, 'visual');
    
    // Discover available polytope families
    await this.discoverFamilies();
    
    // Set initial parameters (including structural params for family selection)
    this.setParameters();

    // Create the polytope and update visualization
    this.createPolytope();
    this.updateVisualization();
  }
  
  async discoverFamilies() {
    try {
      // Fetch the manifest file that lists all polytope families
      const response = await fetch('/math-visualizer/plugins/polytope-viewer/families/manifest.json');
      if (!response.ok) {
        throw new Error(`Failed to load polytope families manifest: ${response.statusText}`);
      }
      
      const manifest = await response.json();
      this.families = [];
      
      // Import each family module and create instances
      for (const entry of manifest) {
        try {
          // Dynamically import the family module
          const module = await import(`./families/${entry.file}`);
          const FamilyClass = module.default;
          
          // Create and store the family instance
          const family = new FamilyClass(this, entry.name);
          this.families.push({
            id: entry.id,
            name: entry.name,
            instance: family
          });
          
          console.log(`Loaded polytope family: ${entry.name}`);
        } catch (error) {
          console.error(`Error loading polytope family ${entry.name}:`, error);
        }
      }
      
      // Set the default family if any were loaded
      if (this.families.length > 0) {
        this.currentFamily = this.families[0].instance;
      }
      
    } catch (error) {
      console.error("Failed to discover polytope families:", error);
      
      // Show error in UI
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showError(`Failed to load polytope families: ${error.message}`);
      }
    }
  }
  
  setParameters() {
    // Clear any existing structural parameters
    this.emptyParameters('structural');
    
    // Add the family type parameter if we have families
    if (this.families.length > 0) {
      const familyOptions = this.families.map(family => ({
        value: family.id,
        label: family.name
      }));
      
      // Add the family selection dropdown
      this.addDropdown(
        'familyType',
        'Polytope Family',
        this.families.find(f => f.instance === this.currentFamily)?.id || this.families[0].id,
        familyOptions,
        'structural'
      );
      
      // Add parameters specific to the current family
      if (this.currentFamily) {
        this.currentFamily.addFamilyParameters();
      }
    }
  }
  
  createPolytope() {
    if (!this.currentFamily) return false;
    
    // Call the family's createPolytope method to generate the geometry
    return this.currentFamily.createPolytope();
  }
  
  updateVisualization() {
    if (!this.currentFamily) return;

    // Create new mesh from the current family
    const newMeshGroup = this.currentFamily.createMesh();
    
    // Register the mesh group with Plugin3D's resource tracking
    // This will also add it to the scene
    this.setMainMesh(newMeshGroup);
    
    // Apply render mode using Plugin3D's helper method
    this.applyRenderMode(
      this.getParameter('renderMode') || 'standard',
      {
        opacity: this.getParameter('opacity') || 0.85,
        colorPalette: this.getParameter('colorPalette') || 'default'
      }
    );
  }
  
  onParameterChanged(parameterId, value, group) {
    if (parameterId === 'familyType') {
      // Find the selected family
      const selectedFamily = this.families.find(f => f.id === value);
      if (selectedFamily) {
        // Switch to the new family
        this.currentFamily = selectedFamily.instance;
        
        // Reset parameters for the new family
        this.setParameters();
        
        // Create and display the new polytope
        this.createPolytope();
        this.updateVisualization();
      }
    } 
    else if (group === 'structural') {
      // Family-specific parameter changed, recreate the polytope
      this.createPolytope();
      this.updateVisualization();
    }
    else if (parameterId === 'showEdges') {
      // Update visualization when edge visibility changes
      this.updateVisualization();
    }
    else if (parameterId === 'opacity' || parameterId === 'colorPalette') {
      // Update render properties for these visual parameters
      this.updateRenderProperties({
        opacity: this.getParameter('opacity'),
        colorPalette: this.getParameter('colorPalette')
      });
    }
    else if (parameterId === 'renderMode') {
      // Apply new render mode
      this.applyRenderMode(value, {
        opacity: this.getParameter('opacity'),
        colorPalette: this.getParameter('colorPalette')
      });
    }
  }
  
  // The unload method can be greatly simplified as Plugin3D handles cleanup
  async unload() {
    // Clear families
    this.families = [];
    this.currentFamily = null;
    
    // Let Plugin3D handle mesh cleanup and other resources
    await super.unload();
  }
}
