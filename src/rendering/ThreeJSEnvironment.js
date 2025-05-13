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
    console.log("Creating ThreeJSEnvironment instance");
    
    this.canvas = canvas;
    this.core = core;
    this.initialized = false;
    this.active = false;
    
    // THREE.js objects - initialize as null
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = null;
    this.threeCanvas = null;
    
    // 3D environment needs continuous rendering
    this.requiresContinuousRendering = true;
    
    // Render target for offscreen rendering
    this.renderTarget = null;

    // Background color - default to light theme
    this.backgroundColor = '#f5f5f5';
    
    // Tracking for render mode state
    this.lastRenderMode = null;
    this.lastOpacity = null;
    this.lastColorPalette = null;
    this.renderedOnce = false;
    
    // Event tracking 
    this.interactionEvents = {
      count: 0,
      lastType: null,
      timestamp: Date.now()
    };
    
    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this._onCanvasEvent = this._onCanvasEvent.bind(this);
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
        throw new Error("THREE.js is not available. Make sure it's loaded before initializing 3D environment.");
      }
      
      // Check WebGL support
      if (!this._isWebGLAvailable()) {
        throw new Error("WebGL is not supported in this browser.");
      }
      
      // Create a separate canvas for THREE.js
      // First check if it already exists and remove it if so
      const existingCanvas = document.getElementById('three-js-canvas');
      if (existingCanvas) {
        existingCanvas.parentElement.removeChild(existingCanvas);
      }
      
      this.threeCanvas = document.createElement('canvas');
      this.threeCanvas.id = 'three-js-canvas';
      this.threeCanvas.style.position = 'absolute';
      this.threeCanvas.style.top = '0';
      this.threeCanvas.style.left = '0';
      this.threeCanvas.style.width = '100%';
      this.threeCanvas.style.height = '100%';
      this.threeCanvas.style.zIndex = '0'; // Ensure it's at base level
      this.threeCanvas.style.pointerEvents = 'auto'; // Critical - ensure events reach this canvas
      
      // Add the THREE.js canvas as a sibling to the main canvas
      if (this.canvas.parentElement) {
        this.canvas.parentElement.appendChild(this.threeCanvas);
      } else {
        document.body.appendChild(this.threeCanvas);
      }
      
      // Get parent dimensions for initial sizing
      const parentElement = this.threeCanvas.parentElement;
      const width = parentElement.clientWidth;
      const height = parentElement.clientHeight;
      
      console.log(`Initializing 3D environment with size ${width}x${height}`);
      
      // Get initial background color from color scheme if available
      if (this.core && this.core.colorSchemeManager) {
        const scheme = this.core.colorSchemeManager.getActiveScheme();
        if (scheme && scheme.background) {
          this.backgroundColor = scheme.background;
        }
      }
      
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(this.backgroundColor);
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75, // field of view
        width / height, // aspect ratio
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
      this.renderer.setSize(width, height, false); // false = don't update style
      this.renderer.setPixelRatio(window.devicePixelRatio);
      
      // Create clock for animation
      this.clock = new THREE.Clock();
      
      // Add lighting
      this._setupLighting();
      
      // Set up event listeners BEFORE hiding canvas
      this._setupEventListeners();
      
      // Hide the THREE.js canvas initially
      this.threeCanvas.style.display = 'none';
      
      this.initialized = true;
      console.log("3D environment initialized successfully");
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
    
    console.log("Activating 3D environment");
    
    // Show the THREE.js canvas
    if (this.threeCanvas) {
      this.threeCanvas.style.display = 'block';
      
      // Ensure canvas has proper dimensions
      const parentElement = this.threeCanvas.parentElement;
      if (parentElement) {
        const width = parentElement.clientWidth;
        const height = parentElement.clientHeight;
        
        console.log(`Setting 3D canvas size to ${width}x${height}`);
        
        // Update camera
        if (this.camera) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
        }
        
        // Update renderer
        if (this.renderer) {
          this.renderer.setSize(width, height, false); // false = don't update style
        }
      }
    }
    
    // Hide the main canvas
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
    
    // Initialize camera controls
    const controlsInitialized = this.initializeCameraControls();
    if (!controlsInitialized) {
      console.error("CRITICAL: Camera controls initialization failed!");
    }
    
    this.active = true;
    console.log("3D environment activated");
    
    // Force a render to show the 3D scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    
    return true;
  }
  
  /**
   * Set up event listeners for the 3D canvas
   * @private
   */
  _setupEventListeners() {
    if (!this.threeCanvas) return;
    
    const events = [
      'mousedown', 'mousemove', 'mouseup', 'mouseover', 'mouseout',
      'click', 'dblclick', 'contextmenu',
      'touchstart', 'touchmove', 'touchend',
      'wheel'
    ];
    
    // Add listeners for each event type
    events.forEach(eventType => {
      this.threeCanvas.addEventListener(eventType, this._onCanvasEvent, { 
        passive: false // Allow preventDefault for wheel events
      });
    });
    
    console.log("Event listeners set up for 3D canvas");
  }
  
  /**
   * Handle events on the 3D canvas
   * @param {Event} event - DOM event
   * @private
   */
  _onCanvasEvent(event) {
    // Track event for debugging
    this.interactionEvents.count++;
    this.interactionEvents.lastType = event.type;
    this.interactionEvents.timestamp = Date.now();
    
    // Prevent default only for wheel events to avoid page scrolling
    if (event.type === 'wheel') {
      event.preventDefault();
    }
    
    // Log every 10th event to avoid console spam
    if (this.interactionEvents.count % 10 === 0) {
      console.log(`3D canvas event: ${event.type}, total events: ${this.interactionEvents.count}`);
    }
    
    // Do not stop propagation - we want the events to reach camera controls naturally
  }
  
  /**
   * Deactivate the 3D environment
   * @returns {boolean} Whether deactivation was successful
   */
  deactivate() {
    if (!this.active) return true;
    
    console.log("Deactivating 3D environment");
    
    // Hide the THREE.js canvas
    if (this.threeCanvas) {
      this.threeCanvas.style.display = 'none';
    }
    
    // Show the main canvas
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }
    
    // Cleanup controls if needed
    if (this.controls && typeof this.controls.dispose === 'function') {
      this.controls.dispose();
      this.controls = null;
    }
    
    this.active = false;
    console.log("3D environment deactivated");
    return true;
  }
  
  handleResize() {
    if (!this.initialized || !this.renderer || !this.camera || !this.threeCanvas) {
      return;
    }
    
    // Get the actual dimensions of the parent element
    const parentElement = this.threeCanvas.parentElement;
    const width = parentElement.clientWidth;
    const height = parentElement.clientHeight;
    
    console.log(`3D environment resizing to ${width}x${height}`);
    
    // Update threeCanvas size to match parent dimensions
    this.threeCanvas.style.width = '100%';
    this.threeCanvas.style.height = '100%';
    
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size and pixel ratio
    this.renderer.setSize(width, height, false); // false = don't update style
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // Force a render
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Update background color based on color scheme
   * @param {Object} colorScheme - Color scheme to apply
   */
  updateBackgroundColor(colorScheme) {
    if (!colorScheme || !colorScheme.background) return;
    
    // Update the stored background color
    this.backgroundColor = colorScheme.background;
    
    // Update THREE.js scene background if it exists
    if (this.scene) {
      this.scene.background = new THREE.Color(this.backgroundColor);
      console.log(`3D scene background updated to ${this.backgroundColor}`);
      
      // Force a render to show the change if active
      if (this.active && this.renderer && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  /**
   * Render a scene using the active plugin
   * @param {Object} parameters - Current parameters
   */
  render(parameters) {
    if (!this.active || !this.renderer || !this.scene || !this.camera) return;
    
    // Update controls if using animation
    if (this.clock && this.controls) {
      const delta = this.clock.getDelta();
      if (typeof this.controls.update === 'function') {
        this.controls.update(delta);
      }
    }
    
    // Get the active plugin
    const activePlugin = this.core.getActivePlugin ? this.core.getActivePlugin() : null;
    
    // Check if we should apply render mode
    if (parameters.renderMode && this.core && this.core.renderModeManager && activePlugin) {
      // Check if the plugin has a meshGroup
      const meshGroup = activePlugin.meshGroup || (activePlugin.state ? activePlugin.state.meshGroup : null);
      
      if (meshGroup) {
        // Check if render mode or related parameters have changed
        const renderModeChanged = this.lastRenderMode !== parameters.renderMode;
        const opacityChanged = this.lastOpacity !== parameters.opacity;
        const paletteChanged = this.lastColorPalette !== parameters.colorPalette;
        
        if (renderModeChanged || opacityChanged || paletteChanged || !this.renderedOnce) {
          // Apply or update the render mode
          this.core.renderModeManager.applyRenderMode(
            this.scene,
            meshGroup,
            parameters.renderMode,
            {
              opacity: parameters.opacity,
              colorPalette: this.core.colorSchemeManager.getPalette(
                parameters.colorPalette || 'default'
              )
            }
          );
          
          // Store current values to detect changes
          this.lastRenderMode = parameters.renderMode;
          this.lastOpacity = parameters.opacity;
          this.lastColorPalette = parameters.colorPalette;
          this.renderedOnce = true;
        }
      }
    }
    
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
   * Explicitly initialize camera controls
   * This can be called after all libraries are definitely loaded
   * @returns {boolean} Whether initialization was successful
   */
  initializeCameraControls() {
    try {
      // Check if CameraControls is available
      const hasCameraControlsWindow = typeof window.CameraControls !== 'undefined';
      const hasCameraControlsGlobal = typeof CameraControls !== 'undefined';
      
      console.log("Camera Controls availability check:", {
        window: hasCameraControlsWindow ? "Available" : "Missing",
        global: hasCameraControlsGlobal ? "Available" : "Missing"
      });
      
      if (!hasCameraControlsWindow && !hasCameraControlsGlobal) {
        throw new Error("CameraControls library is not available. Make sure it's properly loaded.");
      }
      
      // Get the constructor from wherever it's available
      const CameraControlsClass = hasCameraControlsWindow ? window.CameraControls : CameraControls;
      
      // Ensure THREE is installed for CameraControls
      if (typeof CameraControlsClass.install === 'function' && typeof THREE !== 'undefined') {
        // Install THREE to ensure it's properly set up
        CameraControlsClass.install({ THREE });
        console.log("CameraControls.install() called with THREE");
      }
      
      // Create controls instance
      if (!this.camera || !this.renderer) {
        throw new Error("Camera or renderer not initialized");
      }
      
      this.controls = new CameraControlsClass(this.camera, this.renderer.domElement);
      
      // Set initial properties
      this.controls.dampingFactor = 0.1; // Increased for more responsive feel
      this.controls.draggingDampingFactor = 0.25;
      
      // For Camera Controls v2+, set the proper properties
      if (this.controls.smoothTime !== undefined) {
        this.controls.smoothTime = 0.25;
        this.controls.draggingSmoothTime = 0.125;
      }
      
      // Set initial position
      this.controls.setLookAt(0, 1, 5, 0, 0, 0);
      
      // Double check control instance properties
      const controlCheck = {
        domElement: this.controls.domElement === this.renderer.domElement,
        enabled: this.controls.enabled === true,
        distance: this.controls.getDistance(),
        target: this.controls.getTarget(new THREE.Vector3()),
        position: this.camera.position
      };
      
      console.log("Camera controls initialized successfully:", controlCheck);
      
      // Add simple debug indicator for visual feedback when control is activated
      const addDebugIndicator = () => {
        if (!this.threeCanvas) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'camera-control-debug';
        indicator.style.position = 'fixed';
        indicator.style.top = '10px';
        indicator.style.right = '120px';
        indicator.style.background = 'rgba(255, 0, 0, 0.5)';
        indicator.style.color = 'white';
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '4px';
        indicator.style.fontSize = '12px';
        indicator.style.zIndex = '10000';
        indicator.style.pointerEvents = 'none';
        indicator.style.transition = 'opacity 0.3s ease';
        indicator.style.opacity = '0';
        indicator.textContent = 'Camera Active';
        
        document.body.appendChild(indicator);
        
        // Add mouse/touch event listeners to show indicator when interacting
        const showIndicator = () => {
          indicator.style.opacity = '1';
          setTimeout(() => {
            indicator.style.opacity = '0';
          }, 500);
        };
        
        this.threeCanvas.addEventListener('mousedown', showIndicator);
        this.threeCanvas.addEventListener('touchstart', showIndicator);
        this.threeCanvas.addEventListener('wheel', showIndicator);
      };
      
      addDebugIndicator();
      
      return true;
    } catch (error) {
      console.error("Failed to initialize camera controls:", error);
      throw error; // Re-throw to make failures explicit
    }
  }

  /**
   * Handle animation updates for controls
   * @param {number} deltaTime - Time in seconds since last frame
   */
  updateControls(deltaTime) {
    if (this.controls && typeof this.controls.update === 'function') {
      this.controls.update(deltaTime);
    }
  }

  /**
   * Dispose of all resources
   */
  dispose() {
    console.log("Disposing 3D environment");
    
    // Properly deactivate first
    this.deactivate();
    
    // Remove event listeners from canvas
    if (this.threeCanvas) {
      const events = [
        'mousedown', 'mousemove', 'mouseup', 'mouseover', 'mouseout',
        'click', 'dblclick', 'contextmenu',
        'touchstart', 'touchmove', 'touchend',
        'wheel'
      ];
      
      events.forEach(eventType => {
        this.threeCanvas.removeEventListener(eventType, this._onCanvasEvent);
      });
    }
    
    // Dispose of THREE.js resources
    if (this.scene) {
      this.clearScene();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement = null;
      this.renderer = null;
    }
    
    if (this.controls && typeof this.controls.dispose === 'function') {
      this.controls.dispose();
      this.controls = null;
    }
    
    // Remove the THREE.js canvas
    if (this.threeCanvas && this.threeCanvas.parentElement) {
      this.threeCanvas.parentElement.removeChild(this.threeCanvas);
      this.threeCanvas = null;
    }
    
    // Remove debug indicator if exists
    const debugIndicator = document.getElementById('camera-control-debug');
    if (debugIndicator && debugIndicator.parentNode) {
      debugIndicator.parentNode.removeChild(debugIndicator);
    }
    
    // Reset other properties
    this.scene = null;
    this.camera = null;
    this.clock = null;
    this.renderTarget = null;
    
    // Reset initialization flag
    this.initialized = false;
    this.active = false;
    
    console.log("3D environment disposed");
    
    // Show the original canvas again in case it was hidden
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }
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
