import { Plugin } from '../../core/Plugin.js';

export default class TrefoilKnotVisualization extends Plugin {
  static id = 'trefoil-knot-visualization';
  static name = 'Trefoil Knot Visualization';
  static description = 'A 3D visualization of a mathematical trefoil knot';
  static renderingType = '3d';
  
  constructor(core) {
    super(core);
    this.rotationSpeed = 0.5;
  }
  
  async start() {
    // Add render mode parameter
    this.addDropdown('renderMode', 'Render Mode', 'standard', 
                    ['standard', 'metallic', 'glass', 'toon', 'matte'], 'visual');
    
    // Set up Three.js objects
    this.setupThreeJsObjects();
    
    // Start animation
    this.animationHandler = this.requestAnimation(this.animate.bind(this));
  }
  
  setupThreeJsObjects() {
    // Get Three.js scene and THREE library
    const { scene, THREE } = this.renderEnv;
    
    // Create a group for all meshes
    this.meshGroup = new THREE.Group();
    
    // Create a trefoil knot geometry
    // Parameters: radius, tube radius, tubular segments, radial segments, p, q
    const geometry = new THREE.TorusKnotGeometry(1, 0.4, 128, 32, 3, 2);
    
    // Create material - this will be replaced by render mode manager
    const material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.5,
      metalness: 0.2
    });
    
    // Create mesh
    this.knot = new THREE.Mesh(geometry, material);
    this.meshGroup.add(this.knot);
    
    // Add to scene
    scene.add(this.meshGroup);
    
    // Apply initial render mode
    this.applyRenderMode(this.getParameter('renderMode'));
  }
  
  animate(deltaTime) {
    // Rotate knot
    if (this.knot) {
      this.knot.rotation.x += deltaTime * this.rotationSpeed;
      this.knot.rotation.y += deltaTime * this.rotationSpeed * 0.7;
    }
    
    return true; // Continue animation
  }
  
  applyRenderMode(mode) {
    if (!this.meshGroup || !this.core || !this.core.renderModeManager) return;
    
    // Use the render mode manager to apply the render mode
    this.core.renderModeManager.applyRenderMode(
      this.renderEnv.scene,
      this.meshGroup,
      mode,
      {
        opacity: 1.0,
        colorPalette: 'default' // Use default color palette from color scheme manager
      }
    );
  }
  
  onParameterChanged(parameterId, value, group) {
    if (parameterId === 'renderMode') {
      this.applyRenderMode(value);
    }
  }
  
  async unload() {
    // Cancel animations
    if (this.animationHandler) {
      this.cancelAnimation(this.animationHandler);
    }
    
    // Let base class handle event cleanup
    await super.unload();
    
    // Clean up Three.js objects
    if (this.meshGroup) {
      this.renderEnv.scene.remove(this.meshGroup);
      
      // Dispose of geometries and materials
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
      this.knot = null;
    }
  }
}