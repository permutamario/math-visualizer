// src/rendering/ThreeJSEnvironment.js

import CameraControls from '../../vendors/camera-controls.module.js';

/**
 * 3D rendering environment using THREE.js
 */
export class ThreeJSEnvironment {
  /**
   * Create a new ThreeJSEnvironment
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
    this.threeCanvas = null;
    
    // Animation and render state
    this.requiresContinuousRendering = true;
    this._animationLoopRunning = false;
    this.backgroundColor = '#f5f5f5';
    
    // Render mode tracking
    this.lastRenderMode = null;
    this.lastOpacity = null;
    this.lastColorPalette = null;
    
    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this._onCanvasEvent = this._onCanvasEvent.bind(this);
  }
  
  /**
   * Initialize the 3D environment
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Install CameraControls with THREE
      CameraControls.install({ THREE });
      
      // Create a separate canvas for THREE.js
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
      this.threeCanvas.style.zIndex = '0';
      this.threeCanvas.style.pointerEvents = 'auto';
      
      if (this.canvas.parentElement) {
        this.canvas.parentElement.appendChild(this.threeCanvas);
      } else {
        document.body.appendChild(this.threeCanvas);
      }
      
      // Get parent dimensions
      const parentElement = this.threeCanvas.parentElement;
      const width = parentElement.clientWidth;
      const height = parentElement.clientHeight;
      
      // Get initial background color
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
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      this.camera.position.set(0, 1, 5);
      this.camera.lookAt(0, 0, 0);
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.threeCanvas,
        antialias: true,
        alpha: true
      });
      this.renderer.setSize(width, height, false);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      
      // Create clock for animation
      this.clock = new THREE.Clock();
      
      // Add lighting
      this._setupLighting();
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Hide the THREE.js canvas initially
      this.threeCanvas.style.display = 'none';
      
      this.initialized = true;
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Activate the 3D environment
   */
  activate() {
    if (this.active) return true;
    
    if (!this.initialized) return false;
    
    // Show the THREE.js canvas
    if (this.threeCanvas) {
      this.threeCanvas.style.display = 'block';
      
      // Ensure canvas has proper dimensions
      const parentElement = this.threeCanvas.parentElement;
      if (parentElement) {
        const width = parentElement.clientWidth;
        const height = parentElement.clientHeight;
        
        // Update camera
        if (this.camera) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
        }
        
        // Update renderer
        if (this.renderer) {
          this.renderer.setSize(width, height, false);
        }
      }
    }
    
    // Hide the main canvas
    if (this.canvas) {
      this.canvas.style.display = 'none';
    }
    
    // Initialize camera controls
    this.initializeCameraControls();
    
    // Start animation loop
    this._startAnimationLoop();
    
    this.active = true;
    
    // Force a render
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    
    return true;
  }
  
  /**
   * Set up event listeners for the 3D canvas
   */
  _setupEventListeners() {
    if (!this.threeCanvas) return;
    
    const events = [
      'mousedown', 'mousemove', 'mouseup',
      'touchstart', 'touchmove', 'touchend',
      'wheel'
    ];
    
    events.forEach(eventType => {
      this.threeCanvas.addEventListener(eventType, this._onCanvasEvent, { 
        passive: false
      });
    });
  }
  
  /**
   * Handle events on the 3D canvas
   */
  _onCanvasEvent(event) {
    // Prevent default only for wheel events to avoid page scrolling
    if (event.type === 'wheel') {
      event.preventDefault();
    }
  }
  
  /**
   * Start the animation loop
   */
  _startAnimationLoop() {
    if (this._animationLoopRunning) return;
    
    this._animationLoopRunning = true;
    this.clock.start();
    
    const animate = () => {
      if (!this._animationLoopRunning) return;
      
      requestAnimationFrame(animate);
      
      // Update camera controls
      if (this.controls) {
        const delta = this.clock.getDelta();
        this.controls.update(delta);
      }
      
      // Render the scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    
    animate();
  }
  
  /**
   * Stop the animation loop
   */
  _stopAnimationLoop() {
    this._animationLoopRunning = false;
  }
  
  /**
   * Deactivate the 3D environment
   */
  deactivate() {
    if (!this.active) return true;
    
    // Stop animation loop
    this._stopAnimationLoop();
    
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
    return true;
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.initialized || !this.renderer || !this.camera || !this.threeCanvas) {
      return;
    }
    
    const parentElement = this.threeCanvas.parentElement;
    const width = parentElement.clientWidth;
    const height = parentElement.clientHeight;
    
    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer size
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  /**
   * Update background color based on color scheme
   */
  updateBackgroundColor(colorScheme) {
    if (!colorScheme || !colorScheme.background) return;
    
    this.backgroundColor = colorScheme.background;
    
    if (this.scene) {
      this.scene.background = new THREE.Color(this.backgroundColor);
    }
  }

  /**
   * Render a scene
   */
  render(parameters) {
    if (!this.active || !this.renderer || !this.scene || !this.camera) return;
    
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
          
          // Store current values
          this.lastRenderMode = parameters.renderMode;
          this.lastOpacity = parameters.opacity;
          this.lastColorPalette = parameters.colorPalette;
          this.renderedOnce = true;
        }
      }
    }
    
    // Explicit render call
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Initialize camera controls
   */
  initializeCameraControls() {
    if (!this.camera || !this.renderer) return false;
    
    // Create controls
    this.controls = new CameraControls(this.camera, this.renderer.domElement);
    
    // Configure controls
    this.controls.enableDamping = true;
    
    // Configure mouse and touch controls
    if (this.controls.mouseButtons) {
      this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
      this.controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
      this.controls.mouseButtons.right = CameraControls.ACTION.OFFSET;
    }
    
    if (this.controls.touches) {
      this.controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
      this.controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
      this.controls.touches.three = CameraControls.ACTION.TOUCH_OFFSET;
    }
    
    this.controls.minPolarAngle = -Infinity;
    this.controls.maxPolarAngle = Infinity;
    
    // Set initial camera position
    const center = [0, 0, 0];
    const distance = 5;
    
    this.controls.setPosition(
      center[0],
      center[1],
      center[2] + distance,
      false
    );
    
    this.controls.setLookAt(
      center[0],
      center[1],
      center[2] + distance,
      center[0],
      center[1],
      center[2],
      true
    );
    
    // Add optional rotation
    if (typeof this.controls.rotate === 'function') {
      this.controls.rotate(Math.PI / 7, -Math.PI / 6, true);
    }
    
    return true;
  }
  
  /**
   * Set up scene lighting
   */
  _setupLighting() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 3);
    this.scene.add(directionalLight);
  }
  
  /**
   * Clear the scene of all objects
   */
  clearScene() {
    if (!this.scene) return;
    
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      
      // Dispose of geometries and materials
      if (obj.geometry) obj.geometry.dispose();
      
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => material.dispose());
        } else {
          obj.material.dispose();
        }
      }
      
      this.scene.remove(obj);
    }
  }
  
  /**
   * Dispose of all resources
   */
  dispose() {
    // Stop animation loop
    this._stopAnimationLoop();
    
    // Properly deactivate
    this.deactivate();
    
    // Remove event listeners
    if (this.threeCanvas) {
      const events = [
        'mousedown', 'mousemove', 'mouseup',
        'touchstart', 'touchmove', 'touchend',
        'wheel'
      ];
      
      events.forEach(eventType => {
        this.threeCanvas.removeEventListener(eventType, this._onCanvasEvent);
      });
    }
    
    // Clear scene
    if (this.scene) {
      this.clearScene();
    }
    
    // Dispose of renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement = null;
      this.renderer = null;
    }
    
    // Dispose of controls
    if (this.controls && typeof this.controls.dispose === 'function') {
      this.controls.dispose();
      this.controls = null;
    }
    
    // Remove canvas
    if (this.threeCanvas && this.threeCanvas.parentElement) {
      this.threeCanvas.parentElement.removeChild(this.threeCanvas);
      this.threeCanvas = null;
    }
    
    // Reset properties
    this.scene = null;
    this.camera = null;
    this.clock = null;
    
    this.initialized = false;
    this.active = false;
    
    // Show the original canvas again
    if (this.canvas) {
      this.canvas.style.display = 'block';
    }
  }
  
  // Getter methods for environment access
  getScene() { return this.scene; }
  getCamera() { return this.camera; }
  getRenderer() { return this.renderer; }
  getControls() { return this.controls; }
}
