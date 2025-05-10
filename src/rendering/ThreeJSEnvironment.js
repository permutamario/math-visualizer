// src/rendering/ThreeJSEnvironment.js

/**
 * 3D rendering environment using THREE.js
 */
export class ThreeJSEnvironment {
  /**
   * Create a new ThreeJSEnvironment
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {AppCore} core - Reference to the application core
   */
  constructor(canvas, core) {
    this.canvas = canvas;
    this.core = core;
    this.initialized = false;
    this.active = false;
    
    // THREE.js objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = null;
    
    // 3D environment needs continuous rendering
    this.requiresContinuousRendering = true;
    
    // Render target for offscreen rendering
    this.renderTarget = null;
    
    // Bind methods
    this.handleResize = this.handleResize.bind(this);
  }
  
  /**
   * Initialize the 3D environment
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Ensure THREE.js is available
      if (typeof THREE === 'undefined') {
        throw new Error("THREE.js is not available. Make sure it is loaded before initializing 3D environment.");
      }
      
      // Check WebGL support
      if (!this._isWebGLAvailable()) {
        throw new Error("WebGL is not supported in this browser.");
      }
      
      // Create a separate canvas for THREE.js
      this.threeCanvas = document.createElement('canvas');
      this.threeCanvas.style.position = 'absolute';
      this.threeCanvas.style.top = '0';
      this.threeCanvas.style.left = '0';
      this.threeCanvas.style.width = '100%';
      this.threeCanvas.style.height = '100%';
      
      // Add the THREE.js canvas as a sibling to the main canvas
      this.canvas.parentElement.appendChild(this.threeCanvas);
      
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf5f5f5);
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75, // field of view
        this.threeCanvas.clientWidth / this.threeCanvas.clientHeight, // aspect ratio
        0.1, // near clipping plane
        1000 // far clipping plane
      );
      this.camera.position.set(0, 1, 5);
      this.camera.lookAt(0, 0, 0);
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.threeCanvas,
        antialias: true,
        alpha: true
      });
      this.renderer.setSize(this.threeCanvas.clientWidth, this.threeCanvas.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      
      // Create clock for animation
      this.clock = new THREE.Clock();
      
      // Create camera controls
      this._setupCameraControls();
      
      // Add lighting
      this._setupLighting();
      
      // Hide the THREE.js canvas initially
      this.threeCanvas.style.display = 'none';
      
      this.initialized = true;
      console.log("3D environment initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize 3D environment:", error);
      return false;
    }
  }
  
  /**
   * Activate the 3D environment
   * @returns {boolean} Whether activation was successful
   */
  activate() {
    if (this.active) return true;
    
    if (!this.initialized) {
      console.error("Cannot activate uninitialized 3D environment");
      return false;
    }
    
    // Show the THREE.js canvas
    this.threeCanvas.style.display = 'block';
    
    // Hide the main canvas
    this.canvas.style.display = 'none';
    
    // Set up camera controls
    this._setupCameraControls();
    
    this.active = true;
    console.log("3D environment activated");
    return true;
  }
  
  /**
   * Deactivate the 3D environment
   * @returns {boolean} Whether deactivation was successful
   */
  deactivate() {
    if (!this.active) return true;
    
    // Hide the THREE.js canvas
    this.threeCanvas.style.display = 'none';
    
    // Show the main canvas
    this.canvas.style.display = 'block';
    
    // Cleanup controls if needed
    if (this.controls && typeof this.controls.dispose === 'function') {
      this.controls.dispose();
      this.controls = null;
    }
    
    this.active = false;
    console.log("3D environment deactivated");
    return true;
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.initialized) return;
    
    // Update canvas dimensions
    const width = this.threeCanvas.clientWidth;
    const height = this.threeCanvas.clientHeight;
    
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height);
    
    console.log("3D environment resized");
  }
  
  /**
   * Render a visualization
   * @param {Visualization} visualization - Visualization to render
   * @param {Object} parameters - Current parameters
   */
  render(visualization, parameters) {
    if (!this.active || !this.renderer || !this.scene || !this.camera) return;
    
    // Call visualization's 3D render method
    visualization.render3D(THREE, this.scene, parameters);
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Check if WebGL is available
   * @returns {boolean} Whether WebGL is supported
   * @private
   */
  _isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || 
                 canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Set up camera controls
   * @private
   */
  _setupCameraControls() {
    // Check if CameraControls is available
    if (typeof CameraControls === 'undefined') {
      console.warn("CameraControls not available. Using fallback controls.");
      this._setupFallbackControls();
      return;
    }
    
    try {
      // Initialize CameraControls
      this.controls = new CameraControls(this.camera, this.renderer.domElement);
      
      // Configure controls
      this.controls.dampingFactor = 0.05;
      this.controls.draggingDampingFactor = 0.25;
      
      // Set initial position
      this.controls.setLookAt(
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z,
        0, 0, 0,
        true // Animate to position
      );
      
      console.log("Camera controls initialized");
    } catch (error) {
      console.error("Error setting up camera controls:", error);
      this._setupFallbackControls();
    }
  }
  
  /**
   * Set up fallback controls when CameraControls is not available
   * @private
   */
  _setupFallbackControls() {
    console.warn("Using fallback camera controls");
    
    // Simple fallback control object
    this.controls = {
      update: (delta) => {
        // Simple orbital movement
        if (this.camera) {
          const time = Date.now() * 0.001;
          this.camera.position.x = Math.sin(time * 0.1) * 5;
          this.camera.position.z = Math.cos(time * 0.1) * 5;
          this.camera.lookAt(0, 0, 0);
        }
        return true; // Always request a render
      },
      dispose: () => {}
    };
  }
  
  /**
   * Set up scene lighting
   * @private
   */
  _setupLighting() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3);
    this.scene.add(directionalLight);
    
    console.log("Scene lighting initialized");
  }
  
  /**
   * Clear the scene of all objects
   */
  clearScene() {
    if (!this.scene) return;
    
    // Remove all objects
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      
      // Dispose of geometries and materials
      if (obj.geometry) obj.geometry.dispose();
      
      if (obj.material) {
        // Handle arrays of materials
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => material.dispose());
        } else {
          obj.material.dispose();
        }
      }
      
      this.scene.remove(obj);
    }
    
    console.log("3D scene cleared");
  }
  
  /**
   * Get the THREE.js scene
   * @returns {THREE.Scene} Scene object
   */
  getScene() {
    return this.scene;
  }
  
  /**
   * Get the THREE.js camera
   * @returns {THREE.Camera} Camera object
   */
  getCamera() {
    return this.camera;
  }
  
  /**
   * Get the THREE.js renderer
   * @returns {THREE.WebGLRenderer} Renderer object
   */
  getRenderer() {
    return this.renderer;
  }
  
  /**
   * Get the THREE.js controls
   * @returns {Object} Controls object
   */
  getControls() {
    return this.controls;
  }
}
