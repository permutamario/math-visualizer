import { Plugin } from '../../core/Plugin.js';

export default class KnotVisualization extends Plugin {
  static id = 'mathematical-knot-visualization';
  static name = 'Mathematical Knot Visualization';
  static description = 'A 3D visualization of mathematical knots using various notations';
  static renderingType = '3d';
  
  constructor(core) {
    super(core);
    this.rotationSpeed = 0.3;
    this.currentKnot = null;
    this.knotGeometry = null;
    this.knotOptions = {
      tubeRadius: 0.2,
      tubeSegments: 128,
      radialSegments: 16
    };
  }
  
  async start() {
    // Add parameter for knot type
    this.addDropdown('knotType', 'Knot Type', 'trefoil', [
      { value: 'trefoil', label: 'Trefoil Knot (2,3)' },
      { value: 'cinquefoil', label: 'Cinquefoil Knot (2,5)' },
      { value: 'figure8', label: 'Figure-8 Knot' },
      { value: 'torus34', label: 'Torus Knot (3,4)' },
      { value: 'torus35', label: 'Torus Knot (3,5)' },
      { value: 'torus45', label: 'Torus Knot (4,5)' },
      { value: 'pretzel', label: 'Pretzel Knot (3,3,3)' }
    ], 'structural');
    
    // Add parameters for torus knots
    this.addNumber('p', 'Torus P', 2, { min: 2, max: 15, step: 1 }, 'structural');
    this.addNumber('q', 'Torus Q', 3, { min: 2, max: 15, step: 1 }, 'structural');
    
    // Add parameters for knot details
    this.addSlider('tubeRadius', 'Tube Radius', 0.2, { min: 0.05, max: 0.5, step: 0.01 }, 'structural');
    
    // Add render mode parameter
    this.addDropdown('renderMode', 'Render Mode', 'standard', [
      'standard', 'metallic', 'glass', 'toon', 'matte'
    ], 'visual');
    
    // Add action for custom knot
    this.addAction('customTorus', 'Generate Custom Torus Knot', () => {
      const p = this.getParameter('p');
      const q = this.getParameter('q');
      this.generateTorusKnot(p, q);
    });
    
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
    
    // Generate initial knot
    this.generateKnot(this.getParameter('knotType'));
    
    // Add to scene
    scene.add(this.meshGroup);
    
    // Apply initial render mode
    this.applyRenderMode(this.getParameter('renderMode'));
  }
  
  generateKnot(knotType) {
    const { THREE } = this.renderEnv;
    
    // Clear any existing knot
    if (this.currentKnot) {
      this.meshGroup.remove(this.currentKnot);
      if (this.knotGeometry) {
        this.knotGeometry.dispose();
        this.knotGeometry = null;
      }
    }
    
    // Get tube radius from parameters
    const tubeRadius = this.getParameter('tubeRadius');
    
    // Generate geometry based on knot type
    switch (knotType) {
      case 'trefoil':
        this.generateTorusKnot(2, 3);
        break;
      case 'cinquefoil':
        this.generateTorusKnot(2, 5);
        break;
      case 'torus34':
        this.generateTorusKnot(3, 4);
        break;
      case 'torus35':
        this.generateTorusKnot(3, 5);
        break;
      case 'torus45':
        this.generateTorusKnot(4, 5);
        break;
      case 'figure8':
        this.generateFigure8Knot();
        break;
      case 'pretzel':
        this.generatePretzelKnot();
        break;
      default:
        this.generateTorusKnot(2, 3); // Default to trefoil
    }
    
    // Apply current render mode
    this.applyRenderMode(this.getParameter('renderMode'));
  }
  
  generateTorusKnot(p, q) {
    const { THREE } = this.renderEnv;
    
    // Get parameters
    const tubeRadius = this.getParameter('tubeRadius');
    const { tubeSegments, radialSegments } = this.knotOptions;
    
    // Create a torus knot geometry
    this.knotGeometry = new THREE.TorusKnotGeometry(
      1, // radius
      tubeRadius, // tube radius
      tubeSegments,
      radialSegments,
      p, // p
      q  // q
    );
    
    // Create material - this will be replaced by render mode manager
    const material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.5,
      metalness: 0.2
    });
    
    // Create mesh
    this.currentKnot = new THREE.Mesh(this.knotGeometry, material);
    this.meshGroup.add(this.currentKnot);
  }
  
  generateFigure8Knot() {
    const { THREE } = this.renderEnv;
    
    // Get parameters
    const tubeRadius = this.getParameter('tubeRadius');
    const { tubeSegments, radialSegments } = this.knotOptions;
    
    // Create a custom parametric curve for the figure-8 knot
    class Figure8Curve extends THREE.Curve {
      constructor(scale = 1) {
        super();
        this.scale = scale;
      }
      
      getPoint(t) {
        const s = 2 * Math.PI * t;
        
        // Figure-8 knot parametric equations
        const x = (2 + Math.cos(2 * s)) * Math.cos(3 * s);
        const y = (2 + Math.cos(2 * s)) * Math.sin(3 * s);
        const z = Math.sin(4 * s);
        
        return new THREE.Vector3(x, y, z).multiplyScalar(this.scale * 0.4);
      }
    }
    
    // Create the curve and tube geometry
    const path = new Figure8Curve();
    this.knotGeometry = new THREE.TubeGeometry(
      path,
      tubeSegments,
      tubeRadius,
      radialSegments,
      true // closed
    );
    
    // Create material - this will be replaced by render mode manager
    const material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.5,
      metalness: 0.2
    });
    
    // Create mesh
    this.currentKnot = new THREE.Mesh(this.knotGeometry, material);
    this.meshGroup.add(this.currentKnot);
  }
  
  generatePretzelKnot() {
    const { THREE } = this.renderEnv;
    
    // Get parameters
    const tubeRadius = this.getParameter('tubeRadius');
    const { tubeSegments, radialSegments } = this.knotOptions;
    
    // Create a custom parametric curve for a pretzel knot (3,3,3)
    class PretzelCurve extends THREE.Curve {
      constructor(scale = 1) {
        super();
        this.scale = scale;
      }
      
      getPoint(t) {
        const s = 2 * Math.PI * t;
        
        // Simplified pretzel curve - this is an approximation
        const theta = s;
        const phi = Math.sin(3 * theta);
        
        const r = 1.5 + Math.cos(3 * theta);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const z = 0.5 * Math.sin(3 * theta);
        
        return new THREE.Vector3(x, y, z).multiplyScalar(this.scale * 0.4);
      }
    }
    
    // Create the curve and tube geometry
    const path = new PretzelCurve();
    this.knotGeometry = new THREE.TubeGeometry(
      path,
      tubeSegments,
      tubeRadius,
      radialSegments,
      true // closed
    );
    
    // Create material - this will be replaced by render mode manager
    const material = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.5,
      metalness: 0.2
    });
    
    // Create mesh
    this.currentKnot = new THREE.Mesh(this.knotGeometry, material);
    this.meshGroup.add(this.currentKnot);
  }
  
  animate(deltaTime) {
    // Rotate knot
    if (this.currentKnot) {
      this.currentKnot.rotation.x += deltaTime * this.rotationSpeed * 0.5;
      this.currentKnot.rotation.y += deltaTime * this.rotationSpeed;
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
    else if (parameterId === 'knotType') {
      this.generateKnot(value);
    }
    else if (parameterId === 'tubeRadius' && this.currentKnot) {
      // Regenerate current knot with new tube radius
      this.generateKnot(this.getParameter('knotType'));
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
      this.currentKnot = null;
      this.knotGeometry = null;
    }
  }
}