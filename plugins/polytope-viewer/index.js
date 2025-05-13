import { Plugin } from '../../src/core/Plugin.js';
import PolytopeFamily from './PolytopeFamily.js';

export default class PolytopeVisualization extends Plugin {
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
    this.meshGroup = null;
	
  }
  
  async start() {
    
    // Add visual parameters
    this.addCheckbox('showEdges', 'Show Edges', true);
    this.addDropdown('renderMode', 'Render Mode', 'standard', 
                ['standard', 'metallic', 'glass', 'toon'], 'visual');
    
    // Discover available polytope families
    await this.discoverFamilies();
    
    // Set initial parameters (including structural params for family selection)
    this.setParameters();

    this.createPolytope();
    this.sendMesh();
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
        this.currentFamily.name,
        familyOptions,
        'structural'
      );
	console.log('ADDGSD',this.currentFamily.name);
      
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
  
  sendMesh() {
    if (!this.currentFamily) return;

    // Get THREE.js objects from rendering environment
    const { scene, THREE } = this.renderEnv;
    
    // Remove existing mesh group if any
    if (this.meshGroup) {
      scene.remove(this.meshGroup);
      
      // Clean up geometries and materials
      this.meshGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
    
    // Create new mesh group
    this.meshGroup = this.currentFamily.createMesh();
    
    // Add to scene
    scene.add(this.meshGroup);
    
    // Apply render mode if available
    if (this.core && this.core.renderModeManager) {
      const renderMode = this.getParameter('renderMode') || 'standard';
      const opacity = this.getParameter('opacity') || 0.85;
      const colorPalette = this.core.colorSchemeManager.getPalette(
        this.getParameter('colorPalette') || 'default'
      );
      
      this.core.renderModeManager.applyRenderMode(
        scene,
        this.meshGroup,
        renderMode,
        {
          opacity: opacity,
          colorPalette: colorPalette
        }
      );
    }
	this.refresh();
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
        this.sendMesh();
      }
    } 
    else if (group === 'structural') {
      // Family-specific parameter changed, recreate the polytope
      this.createPolytope();
      this.sendMesh();
    }
    else if (parameterId === 'showEdges') {
      // Recreate the mesh when edge visibility changes
      this.sendMesh();
    }
    // Visual parameter changes (opacity, renderMode, colorPalette) are handled 
    // automatically by the core's render mode manager
  }
  
  async unload() {
    // Remove the mesh from the scene
    if (this.meshGroup && this.renderEnv && this.renderEnv.scene) {
      this.renderEnv.scene.remove(this.meshGroup);
    }
    
    // Clean up meshes
    if (this.meshGroup) {
      this.meshGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      this.meshGroup = null;
    }
    
    // Clear families
    this.families = [];
    this.currentFamily = null;
    
    // Let parent class handle remaining cleanup
    await super.unload();
  }
}
