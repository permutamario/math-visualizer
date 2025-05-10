// src/core/renderingEnvironments/3dCameraEnvironment.js
import { BaseEnvironment } from './baseEnvironment.js';

/**
 * 3D environment with THREE.js using CameraControls
 */
export class Camera3DEnvironment extends BaseEnvironment {
    /**
     * Create a new Camera3D environment
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} options - Environment options
     */
    constructor(canvas, options = {}) {
        super(canvas, options);
        
        // Initialize properties with null values
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        this.cube = null;
        this.grid = null;
        this.clock = null;
        
        // Initial camera position
        this.cameraPosition = options.cameraPosition || [0, 1, 5];
        this.lookAt = options.lookAt || [0, 0, 0];
    }
    
    /**
     * Check if WebGL is available
     * @returns {boolean} - True if WebGL is supported
     */
    isWebGLAvailable() {
        try {
            // Create a temporary canvas to test WebGL support
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || 
                      canvas.getContext('experimental-webgl');
            return gl instanceof WebGLRenderingContext;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Initialize the 3D environment
     * @returns {boolean} - Whether initialization was successful
     */
    initialize() {
        if (this.initialized) return true;
        
        console.log('Initializing 3D environment with CameraControls...');
        
        // Check if WebGL is supported
        if (!this.isWebGLAvailable()) {
            console.error('WebGL is not supported in this browser');
            return false;
        }
        
        // Verify THREE.js is available
        if (typeof THREE === 'undefined') {
            console.error('THREE is not defined. Make sure it is loaded before this code runs.');
            return false;
        }
        
        // Verify CameraControls is available
        if (typeof CameraControls === 'undefined') {
            console.error('CameraControls is not defined. Make sure it is loaded before this code runs.');
            return false;
        }
        
        try {
            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xf0f0f0);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75, // field of view
                this.canvas.width / this.canvas.height, // aspect ratio
                0.1, // near clipping plane
                1000 // far clipping plane
            );
            
            // Set camera position from options or defaults
            this.camera.position.set(
                this.cameraPosition[0], 
                this.cameraPosition[1], 
                this.cameraPosition[2]
            );
            
            // CRITICAL FIX: Create a new canvas for WebGL rendering instead of reusing the existing one
            // This ensures we don't try to create a WebGL context on a canvas that already has another context
            const newCanvas = document.createElement('canvas');
            newCanvas.width = this.canvas.width;
            newCanvas.height = this.canvas.height;
            newCanvas.style.position = 'absolute';
            newCanvas.style.top = '0';
            newCanvas.style.left = '0';
            newCanvas.style.width = '100%';
            newCanvas.style.height = '100%';
            
            // Add the new canvas to the container right after the original canvas
            if (this.canvas.parentNode) {
                this.canvas.parentNode.appendChild(newCanvas);
            } else {
                document.body.appendChild(newCanvas);
            }
            
            // Create renderer using the new canvas
            this.renderer = new THREE.WebGLRenderer({
                canvas: newCanvas,
                antialias: true,
                alpha: true
            });
            
            if (!this.renderer) {
                console.error('Failed to create THREE.WebGLRenderer');
                return false;
            }
            
            this.renderer.setSize(newCanvas.width, newCanvas.height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            
            // Create clock for animation timing
            this.clock = new THREE.Clock();
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
            this.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 2, 3);
            this.scene.add(directionalLight);
            
          
            // Set up camera controls - now with proper initialization
            try {
                console.log('Creating CameraControls instance...');
                // Create a CameraControls instance
                this.controls = new CameraControls(this.camera, this.renderer.domElement);
                
                // Set control properties
                this.controls.dampingFactor = 0.05;
                this.controls.draggingDampingFactor = 0.25;
                
                // Set target
                this.controls.setLookAt(
                    this.camera.position.x,
                    this.camera.position.y,
                    this.camera.position.z,
                    this.lookAt[0], 
                    this.lookAt[1], 
                    this.lookAt[2],
                    true // Animate to position
                );
                
                console.log('CameraControls instance created successfully');
            } catch (error) {
                console.error('Error creating CameraControls:', error);
                // Fallback to dummy controls
                this.createFallbackControls();
            }
            
            this.initialized = true;
            console.log('3D environment initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Error initializing 3D environment:', error);
            // Clean up any created resources
            if (this.renderer) this.renderer.dispose();
            this.renderer = null;
            this.scene = null;
            this.camera = null;
            this.controls = null;
            return false;
        }
    }
    
    /**
     * Create fallback controls when CameraControls can't be created
     */
    createFallbackControls() {
        console.warn('Using fallback controls (orbit simulation)');
        
        this.controls = {
            update: (delta) => {
                // Simple orbital movement
                if (this.camera) {
                    const time = Date.now() * 0.001;
                    this.camera.position.x = Math.sin(time * 0.25) * 5;
                    this.camera.position.z = Math.cos(time * 0.25) * 5;
                    this.camera.lookAt(0, 0, 0);
                }
                return true; // Always request a render
            },
            dispose: () => {}
        };
    }
    
    /**
     * Activate the environment
     * @returns {boolean} - Whether activation was successful
     */
    activate() {
        if (this.active) return true;
        
        if (!this.initialized) {
            const success = this.initialize();
            if (!success) {
                console.error('Failed to initialize 3D environment, cannot activate');
                return false;
            }
        }
        
        // Call the base class activate method
        super.activate();
        
        // Start the animation loop
        if (this.renderer && this.scene && this.camera) {
            this.animationId = requestAnimationFrame(this.animate.bind(this));
            console.log('3D environment activated successfully');
            return true;
        } else {
            console.error('Cannot activate 3D environment - components not initialized');
            this.active = false;
            return false;
        }
    }
    
    /**
     * Animation loop for THREE.js rendering
     */
    animate() {
        if (!this.active) return;
        
        // Rotate the cube if it exists (just for visual feedback)
        if (this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
        }
        
        // Update controls
        if (this.controls && typeof this.controls.update === 'function') {
            // For camera-controls, we need to pass delta time
            const delta = this.clock ? this.clock.getDelta() : 0.016;
            const updated = this.controls.update(delta);
            
            // Only render if controls were updated or animation is happening
            if (updated || this.cube) {
                this.renderer.render(this.scene, this.camera);
            }
        } else {
            // Render anyway if no controls
            this.renderer.render(this.scene, this.camera);
        }
        
        // Continue animation loop
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
    
    /**
     * Deactivate the environment
     */
    deactivate() {
    if (!this.active) return;
    
    // Stop animation loop
    if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
    }
    
    // Hide the renderer's canvas
    if (this.renderer && this.renderer.domElement) {
        this.renderer.domElement.style.display = 'none';
    }
    
    super.deactivate();
    console.log('3D environment deactivated');
}
    
    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.active || !this.camera || !this.renderer) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        // Update controls if needed
        if (this.controls && typeof this.controls.updateCameraUp === 'function') {
            this.controls.updateCameraUp();
        }
        
        console.log('3D environment resized');
    }
    
    /**
 * Clean up resources
 */
dispose() {
    this.deactivate();
    
    // Remove the renderer's canvas from the DOM
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    
    // Clean up THREE.js resources
    if (this.renderer) {
        this.renderer.dispose();
        this.renderer = null;
    }
    
    // Clean up geometries and materials
    if (this.cube) {
        this.scene.remove(this.cube);
        this.cube.geometry.dispose();
        this.cube.material.dispose();
        this.cube = null;
    }
    
    if (this.grid) {
        this.scene.remove(this.grid);
        this.grid = null;
    }
    
    // Dispose of any other resources in the scene
    if (this.scene) {
        // Recursively dispose all geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    for (const material of object.material) {
                        disposeMaterial(material);
                    }
                } else {
                    disposeMaterial(object.material);
                }
            }
        });
    }
    
    // Dispose of controls if possible
    if (this.controls && typeof this.controls.dispose === 'function') {
        this.controls.dispose();
    }
    
    this.controls = null;
    this.scene = null;
    this.camera = null;
    this.initialized = false;
    
    super.dispose();
    console.log('3D environment resources disposed');
}

/**
 * Helper function to dispose of a material and its textures
 * @param {THREE.Material} material - Material to dispose
 */
 disposeMaterial(material) {
    if (!material) return;
    
    // Dispose textures
    for (const key in material) {
        const value = material[key];
        if (value && typeof value === 'object' && typeof value.dispose === 'function') {
            if (value.isTexture) {
                value.dispose();
            }
        }
    }
    
    material.dispose();
}
    
    /**
     * Prepare for rendering (no-op for 3D)
     */
    prepareRender(ctx) {
        // 3D rendering happens in animate()
        return ctx;
    }
    
    /**
     * Complete rendering (no-op for 3D)
     */
    completeRender(ctx) {
        // 3D rendering happens in animate()
        return ctx;
    }
    
    /**
     * Get the scene
     * @returns {Object} THREE.Scene
     */
    getScene() {
        return this.scene;
    }
    
    /**
     * Get the camera
     * @returns {Object} THREE.Camera
     */
    getCamera() {
        return this.camera;
    }
    
    /**
     * Get the renderer
     * @returns {Object} THREE.WebGLRenderer
     */
    getRenderer() {
        return this.renderer;
    }
    
    /**
     * Add an object to the scene
     * @param {Object} object - THREE.js object
     */
    addToScene(object) {
        if (this.scene && object) {
            this.scene.add(object);
        }
    }
    
    /**
     * Remove an object from the scene
     * @param {Object} object - THREE.js object
     */
    removeFromScene(object) {
        if (this.scene && object) {
            this.scene.remove(object);
        }
    }
}
