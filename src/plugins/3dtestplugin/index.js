// src/plugins/api-test-3d/index.js
import { Plugin } from '../../core/Plugin.js';

export default class APITest3D extends Plugin {
  // Required static properties
  static id = 'api-test-3d';
  static name = '3D API Test';
  static description = 'A comprehensive test of the 3D visualization framework API';
  static renderingType = '3d'; // Using Three.js for 3D

  constructor(core) {
    super(core);
    
    // Local state
    this.state = {
      time: 0,
      rotating: true,
      lastMousePosition: { x: 0, y: 0 },
      objects: [],
      lights: [],
      isAnimating: true,
      activeMesh: null
    };
  }

  async start() {
    console.log("Starting 3D API Test Plugin");

    // ===== VISUAL PARAMETERS =====
    this.addSlider('scale', 'Object Scale', 1.0, { min: 0.1, max: 3.0, step: 0.1 });
    this.addColor('primaryColor', 'Primary Color', '#4285f4');
    this.addColor('secondaryColor', 'Secondary Color', '#ea4335');
    this.addDropdown('renderMode', 'Render Mode', 'standard', 
      ['standard', 'metallic', 'glass', 'toon', 'matte', 'technical']);
    this.addSlider('opacity', 'Object Opacity', 1.0, { min: 0.1, max: 1.0, step: 0.1 });
    this.addCheckbox('showWireframe', 'Show Wireframe', false);
    
    // ===== STRUCTURAL PARAMETERS =====
    this.addDropdown('shape', 'Primary Shape', 'torus', 
      ['cube', 'sphere', 'torus', 'cone', 'cylinder', 'dodecahedron'], 'structural');
    this.addSlider('complexity', 'Geometry Detail', 32, { min: 4, max: 64, step: 4 }, 'structural');
    this.addNumber('count', 'Object Count', 5, { min: 1, max: 20, step: 1 }, 'structural');
    this.addCheckbox('showHelpers', 'Show Helpers', true, 'structural');
    
    // ===== ADVANCED PARAMETERS =====
    this.addText('customLabel', 'Custom Text Label', 'API Test', 'advanced');
    this.addSlider('animationSpeed', 'Animation Speed', 1.0, { min: 0.1, max: 5.0, step: 0.1 }, 'advanced');
    this.addSlider('lightIntensity', 'Light Intensity', 1.0, { min: 0.1, max: 3.0, step: 0.1 }, 'advanced');
    this.addCheckbox('enablePostprocessing', 'Enable Post FX', false, 'advanced');
    
    // ===== ACTIONS =====
    this.addAction('reset', 'Reset Scene', () => this.resetScene());
    this.addAction('randomColors', 'Randomize Colors', () => this.randomizeColors());
    this.addAction('toggleRotation', 'Toggle Rotation', () => this.toggleRotation());
    this.addAction('addObject', 'Add Object', () => this.addRandomObject());
    this.addAction('removeObject', 'Remove Object', () => this.removeLastObject());
    this.addAction('changeCamera', 'Change Camera View', () => this.changeCameraView());
    
    // ===== SETUP THREE.JS SCENE =====
    this.setupThreeJsScene();
    
    // ===== START ANIMATION =====
    this.animationHandler = this.requestAnimation(this.animate.bind(this));
  }
  
  // Create all Three.js objects
  setupThreeJsScene() {
    const { scene, camera, THREE } = this.renderEnv;
    
    // Create main group for all meshes
    this.meshGroup = new THREE.Group();
    scene.add(this.meshGroup);
    
    // Create text label using TextGeometry if available
    this.setupTextLabel();
    
    // Create main objects
    this.createObjects();
    
    // Setup lights
    this.setupLights();
    
    // Setup helpers
    this.setupHelpers();
    
    // Set camera position
    camera.position.set(5, 5, 8);
    camera.lookAt(0, 0, 0);
  }
  
  // Create the main geometric objects
  createObjects() {
    const { THREE } = this.renderEnv;
    
    // Clear existing objects
    while (this.meshGroup.children.length > 0) {
      const obj = this.meshGroup.children[0];
      this.meshGroup.remove(obj);
      
      // Dispose of geometries and materials
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
    
    this.state.objects = [];
    
    // Get parameters
    const count = this.getParameter('count');
    const scale = this.getParameter('scale');
    const showWireframe = this.getParameter('showWireframe');
    const secondaryColor = this.getParameter('secondaryColor');
    const shape = this.getParameter('shape');
    const complexity = this.getParameter('complexity');
    
    // Create geometry based on shape parameter
    let geometry;
    switch (shape) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1, complexity/8, complexity/8, complexity/8);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, complexity, complexity);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.5, 0.2, complexity, complexity);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, complexity);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, complexity);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(0.5, 0);
        break;
      default:
        geometry = new THREE.SphereGeometry(0.5, complexity, complexity);
    }
    
    // We'll create basic meshes with default material
    // The RenderModeManager will handle proper material assignment
    const placeholderMaterial = new THREE.MeshBasicMaterial();
    
    // Create wireframe material separately - not managed by RenderModeManager
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    
    // Create objects
    for (let i = 0; i < count; i++) {
      // Position in a circle
      const angle = (i / count) * Math.PI * 2;
      const radius = 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      // Create main mesh with placeholder material
      // RenderModeManager will replace this with appropriate material
      const mesh = new THREE.Mesh(geometry, placeholderMaterial.clone());
      mesh.position.set(x, 0, z);
      mesh.scale.set(scale, scale, scale);
      this.meshGroup.add(mesh);
      this.state.objects.push(mesh);
      
      // Add wireframe if enabled - keep outside meshGroup so RenderModeManager doesn't affect it
      if (showWireframe) {
        const wireframe = new THREE.Mesh(geometry, wireframeMaterial.clone());
        wireframe.position.copy(mesh.position);
        wireframe.rotation.copy(mesh.rotation);
        wireframe.scale.copy(mesh.scale);
        mesh.userData.wireframe = wireframe;
        this.renderEnv.scene.add(wireframe);  // Add directly to scene instead of meshGroup
      }
    }
    
    // Apply render mode which will set up proper materials based on our parameters
    this.applyRenderMode();
  }
  
  // Setup text label using TextGeometry if available
  setupTextLabel() {
    const { THREE } = this.renderEnv;
    const customLabel = this.getParameter('customLabel');
    
    // Try to access TextGeometry (may not be available in all THREE.js bundles)
    try {
      // We'll use a basic mesh as a placeholder for where text would be
      const textPlaceholder = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 0.5),
        new THREE.MeshBasicMaterial({
          color: this.getParameter('secondaryColor'),
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        })
      );
      
      textPlaceholder.position.set(0, 2, 0);
      textPlaceholder.rotation.x = -Math.PI / 2;
      textPlaceholder.userData.isTextPlaceholder = true;
      
      this.meshGroup.add(textPlaceholder);
      this.textMesh = textPlaceholder;
    } catch (e) {
      console.warn("TextGeometry not available, using placeholder instead");
    }
  }
  
  // Setup scene lights
  setupLights() {
    // We no longer set up lights manually
    // The RenderModeManager will handle lighting based on the selected mode
    console.log("Lighting is handled by the RenderModeManager based on render mode");
    
    // Clear existing lights array to avoid unnecessary removal attempts
    this.state.lights = [];
  }
  
  // Setup scene helpers (grid, axes)
  setupHelpers() {
    const { scene, THREE } = this.renderEnv;
    
    // Grid helper
    this.gridHelper = new THREE.GridHelper(10, 10);
    scene.add(this.gridHelper);
    
    // Axes helper
    this.axesHelper = new THREE.AxesHelper(5);
    scene.add(this.axesHelper);
    
    // Update visibility based on parameter
    const showHelpers = this.getParameter('showHelpers');
    this.gridHelper.visible = showHelpers;
    this.axesHelper.visible = showHelpers;
  }
  
  // Apply the selected render mode
  applyRenderMode() {
    // Get render mode parameters
    const renderMode = this.getParameter('renderMode');
    const opacity = this.getParameter('opacity');
    const primaryColor = this.getParameter('primaryColor');
    
    // Use render mode manager if available
    if (this.core && this.core.renderModeManager && this.meshGroup) {
      // Let the render mode manager handle materials and lighting
      this.core.renderModeManager.applyRenderMode(
        this.renderEnv.scene,
        this.meshGroup,
        renderMode,
        {
          opacity: opacity,
          baseColor: new this.renderEnv.THREE.Color(primaryColor)
        }
      );
    }
  }
  
  // Animation frame update
  animate(deltaTime) {
    // Update time
    this.state.time += deltaTime * this.getParameter('animationSpeed');
    
    // Rotate objects if enabled
    if (this.state.rotating) {
      this.state.objects.forEach((obj, index) => {
        // Rotate at different speeds based on index
        const speed = 1 + index * 0.2;
        obj.rotation.x = this.state.time * 0.5 * speed;
        obj.rotation.y = this.state.time * 0.3 * speed;
        
        // Also rotate wireframe if present
        if (obj.userData.wireframe) {
          obj.userData.wireframe.rotation.copy(obj.rotation);
        }
        
        // Add some vertical oscillation
        obj.position.y = Math.sin(this.state.time + index) * 0.5;
        if (obj.userData.wireframe) {
          obj.userData.wireframe.position.y = obj.position.y;
        }
      });
    }
    
    // Animate text placeholder if it exists
    if (this.textMesh) {
      // Make it float and rotate gently
      this.textMesh.position.y = 2 + Math.sin(this.state.time * 0.5) * 0.2;
      this.textMesh.rotation.z = Math.sin(this.state.time * 0.3) * 0.1;
    }
    
    return this.state.isAnimating; // Continue animation if true
  }
  
  // Parameter change handler
  onParameterChanged(parameterId, value, group) {
    switch (parameterId) {
      case 'scale':
        // Update scale for all objects
        this.state.objects.forEach(obj => {
          obj.scale.set(value, value, value);
          if (obj.userData.wireframe) {
            obj.userData.wireframe.scale.set(value, value, value);
          }
        });
        break;
        
      case 'primaryColor':
        // Let render mode manager handle primary color updates
        this.applyRenderMode();
        break;
        
      case 'secondaryColor':
        // Update color for wireframes and text
        this.state.objects.forEach(obj => {
          if (obj.userData.wireframe) {
            obj.userData.wireframe.material.color.set(value);
            obj.userData.wireframe.material.needsUpdate = true;
          }
        });
        
        if (this.textMesh) {
          this.textMesh.material.color.set(value);
          this.textMesh.material.needsUpdate = true;
        }
        break;
        
      case 'showWireframe':
        // Show/hide wireframes - need to recreate to properly handle
        this.createObjects();
        break;
        
      case 'renderMode':
      case 'opacity':
        // Apply render mode
        this.applyRenderMode();
        break;
        
      case 'shape':
      case 'complexity':
      case 'count':
        // Recreate objects when structure changes
        this.createObjects();
        break;
        
      case 'showHelpers':
        // Show/hide helpers
        if (this.gridHelper) this.gridHelper.visible = value;
        if (this.axesHelper) this.axesHelper.visible = value;
        break;
        
      case 'customLabel':
        // Update text label
        if (this.textMesh) {
          // In a real implementation, we would update TextGeometry
          // Here we just update the userData to show we received the change
          this.textMesh.userData.text = value;
        }
        break;
        
      case 'lightIntensity':
        // Let render mode manager handle lighting - we don't need to
        // override the framework's lighting management
        break;
        
      case 'enablePostprocessing':
        // We would set up post-processing here if supported
        // For this sample, just log that it would be enabled/disabled
        console.log(`Post-processing ${value ? 'enabled' : 'disabled'}`);
        break;
    }
  }
  
  // User interaction handler
  handleInteraction(type, data) {
    switch (type) {
      case 'click':
        // Try to detect clicked object
        if (data.target && data.target.isMesh) {
          // Highlight clicked object
          this.highlightObject(data.target);
          
          // Log click
          console.log(`Clicked on object at position: ${data.target.position.x.toFixed(2)}, ${data.target.position.y.toFixed(2)}, ${data.target.position.z.toFixed(2)}`);
        } else {
          // Clicked empty space - toggle rotation
          this.toggleRotation();
        }
        break;
        
      case 'dblclick':
        // Reset camera view on double click
        if (this.renderEnv && this.renderEnv.resetCamera) {
          this.renderEnv.resetCamera();
        }
        break;
        
      case 'wheel':
        // Already handled by camera controls, but we could add custom behavior
        break;
        
      case 'mousemove':
        // Track mouse position
        this.state.lastMousePosition = {
          x: data.x,
          y: data.y
        };
        break;
    }
  }
  
  // Highlight an object
  highlightObject(object) {
    // Reset previous highlight
    if (this.state.activeMesh && this.state.activeMesh !== object) {
      if (this.state.activeMesh.userData.originalEmissive) {
        this.state.activeMesh.material.emissive.set(this.state.activeMesh.userData.originalEmissive);
      } else {
        this.state.activeMesh.material.emissive.set(0x000000);
      }
    }
    
    // Set new highlight
    this.state.activeMesh = object;
    
    // Store original emissive color
    if (!object.userData.originalEmissive) {
      object.userData.originalEmissive = object.material.emissive.getHex();
    }
    
    // Set highlight color
    object.material.emissive.set(0x333333);
  }
  
  // ACTIONS
  
  // Reset scene to initial state
  resetScene() {
    // Reset parameters to defaults
    this.setParameter('scale', 1.0);
    this.setParameter('primaryColor', '#4285f4');
    this.setParameter('secondaryColor', '#ea4335');
    this.setParameter('renderMode', 'standard');
    this.setParameter('opacity', 1.0);
    this.setParameter('showWireframe', false);
    this.setParameter('shape', 'torus');
    this.setParameter('complexity', 32);
    this.setParameter('count', 5);
    this.setParameter('showHelpers', true);
    this.setParameter('customLabel', 'API Test');
    this.setParameter('animationSpeed', 1.0);
    this.setParameter('lightIntensity', 1.0);
    this.setParameter('enablePostprocessing', false);
    
    // Reset camera position
    if (this.renderEnv && this.renderEnv.resetCamera) {
      this.renderEnv.resetCamera();
    }
    
    // Reset state
    this.state.time = 0;
    this.state.rotating = true;
    this.state.activeMesh = null;
    
    // Recreate objects
    this.createObjects();
    
    // Show notification
    if (this.core && this.core.uiManager) {
      this.core.uiManager.showNotification('Scene reset to default state');
    }
  }
  
  // Randomize colors
  randomizeColors() {
    // Generate random colors
    const primaryColor = this.getRandomColor();
    const secondaryColor = this.getRandomColor();
    
    // Update parameters
    this.setParameter('primaryColor', primaryColor);
    this.setParameter('secondaryColor', secondaryColor);
    
    // Show notification
    if (this.core && this.core.uiManager) {
      this.core.uiManager.showNotification('Colors randomized');
    }
  }
  
  // Toggle rotation animation
  toggleRotation() {
    this.state.rotating = !this.state.rotating;
    
    // Show notification
    if (this.core && this.core.uiManager) {
      const message = this.state.rotating ? 'Animation enabled' : 'Animation paused';
      this.core.uiManager.showNotification(message);
    }
  }
  
  // Add a random object
  addRandomObject() {
    // Get current count and increment
    const count = this.getParameter('count');
    if (count < 20) { // Respect max limit
      this.setParameter('count', count + 1);
      
      // Show notification
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showNotification('Object added');
      }
    } else {
      // Show notification that we're at the limit
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showNotification('Maximum object count reached (20)');
      }
    }
  }
  
  // Remove the last object
  removeLastObject() {
    // Get current count and decrement
    const count = this.getParameter('count');
    if (count > 1) { // Keep at least one object
      this.setParameter('count', count - 1);
      
      // Show notification
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showNotification('Object removed');
      }
    } else {
      // Show notification that we're at the minimum
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showNotification('Minimum object count reached (1)');
      }
    }
  }
  
  // Change camera view
  changeCameraView() {
    const { camera } = this.renderEnv;
    
    // Define different camera positions
    const views = [
      { position: [5, 5, 8], target: [0, 0, 0] },
      { position: [8, 2, 0], target: [0, 0, 0] },
      { position: [0, 8, 0], target: [0, 0, 0] },
      { position: [-5, 3, -5], target: [0, 0, 0] },
      { position: [0, 2, -8], target: [0, 0, 0] }
    ];
    
    // Select a random view different from current
    let newView;
    do {
      newView = views[Math.floor(Math.random() * views.length)];
    } while (
      newView.position[0] === camera.position.x &&
      newView.position[1] === camera.position.y &&
      newView.position[2] === camera.position.z
    );
    
    // Set new camera position
    camera.position.set(...newView.position);
    camera.lookAt(...newView.target);
    
    // Show notification
    if (this.core && this.core.uiManager) {
      this.core.uiManager.showNotification('Camera view changed');
    }
  }
  
  // Helper function to generate random colors
  getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }
  
  // Clean up resources when plugin is unloaded
  async unload() {
    console.log("Unloading 3D API Test Plugin");
    
    // Cancel animation loop
    if (this.animationHandler) {
      this.cancelAnimation(this.animationHandler);
      this.animationHandler = null;
    }
    
    // Let base class handle animation and event cleanup
    await super.unload();
    
    // Remove wireframes first (they're added directly to scene)
    this.state.objects.forEach(obj => {
      if (obj.userData.wireframe && obj.userData.wireframe.parent) {
        obj.userData.wireframe.parent.remove(obj.userData.wireframe);
        if (obj.userData.wireframe.geometry) {
          obj.userData.wireframe.geometry.dispose();
        }
        if (obj.userData.wireframe.material) {
          obj.userData.wireframe.material.dispose();
        }
      }
    });
    
    // Clean up Three.js objects
    if (this.meshGroup) {
      if (this.renderEnv && this.renderEnv.scene) {
        this.renderEnv.scene.remove(this.meshGroup);
      }
      
      // Dispose of geometries and materials
      this.meshGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      
      this.meshGroup = null;
    }
    
    // Remove helpers
    if (this.gridHelper && this.gridHelper.parent) {
      this.gridHelper.parent.remove(this.gridHelper);
      this.gridHelper = null;
    }
    
    if (this.axesHelper && this.axesHelper.parent) {
      this.axesHelper.parent.remove(this.axesHelper);
      this.axesHelper = null;
    }
    
    // Remove lights - actually, we don't need to do this since they are controlled
    // by the RenderModeManager and will be cleaned up when the environment changes
    
    // Clear state
    this.state.objects = [];
    this.state.lights = [];
    this.state.activeMesh = null;
    this.textMesh = null;
    
    console.log("3D API Test Plugin unloaded successfully");
  }
}