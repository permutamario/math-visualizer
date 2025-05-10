// src/rendering/RenderingManager.js

import { Canvas2DEnvironment } from './Canvas2DEnvironment.js';
import { ThreeJSEnvironment } from './ThreeJSEnvironment.js';

/**
 * Manages rendering environments and animation loop
 */
export class RenderingManager {
  /**
   * Create a new RenderingManager
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    this.core = core;
    this.canvas = null;
    this.environments = {
      '2d': null,
      '3d': null
    };
    this.currentEnvironment = null;
    this.animationId = null;
    this.lastFrameTime = 0;
    this.rendering = false;
    this.renderRequested = false;
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.render = this.render.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Handle Resize
   */
  handleResize() {
    // Resize the canvas first
    this.resizeCanvas();
    
    // Then let the current environment handle the resize if it exists
    if (this.currentEnvironment) {
      this.currentEnvironment.handleResize();
      
      // Request a render
      this.requestRender();
    }
  }
  
  /**
   * Initialize the rendering manager
   * @param {string} canvasId - ID of the canvas element (default: 'visualization-canvas')
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(canvasId = 'visualization-canvas') {
    try {
      // Get or create canvas element
      this.canvas = document.getElementById(canvasId);
      
      if (!this.canvas) {
        // Create new canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = canvasId;
        document.body.appendChild(this.canvas);
      }
      
      // Set canvas size
      this.resizeCanvas();
      
      // Create initial environment instances but don't initialize or activate them yet
      this.environments['2d'] = this._createEnvironment('2d');
      this.environments['3d'] = this._createEnvironment('3d');
      
      // Listen for window resize
      window.addEventListener('resize', this.handleResize);
      
      console.log("Rendering manager initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize rendering manager:", error);
      return false;
    }
  }
  
  /**
   * Create a new environment instance
   * @param {string} type - Environment type ('2d' or '3d')
   * @returns {Object} New environment instance
   * @private
   */
  _createEnvironment(type) {
    if (type === '2d') {
      return new Canvas2DEnvironment(this.canvas, this.core);
    } else if (type === '3d') {
      return new ThreeJSEnvironment(this.canvas, this.core);
    }
    throw new Error(`Unknown environment type: ${type}`);
  }
  
  /**
   * Set the current rendering environment
   * @param {string} type - Environment type ('2d' or '3d')
   * @returns {boolean} Whether environment change was successful
   */
  async setEnvironment(type) {
    // Validate environment type
    if (type !== '2d' && type !== '3d') {
      console.error(`Invalid environment type: ${type}`);
      return false;
    }
    
    try {
      // Dispose of current environment completely if it exists
      if (this.currentEnvironment) {
        // Make sure to stop rendering before we dispose the environment
        const wasRendering = this.rendering;
        if (wasRendering) {
          this.stopRenderLoop();
        }
        
        this.currentEnvironment.dispose();
        this.currentEnvironment = null;
        
        // Restart rendering if it was running
        if (wasRendering) {
          this.startRenderLoop();
        }
      }
      
      // Recreate the environment to ensure it's clean
      this.environments[type] = this._createEnvironment(type);
      
      // Initialize the environment
      await this.environments[type].initialize();
      
      // Set and activate new environment
      this.currentEnvironment = this.environments[type];
      this.currentEnvironment.activate();
      
      // Trigger a resize to ensure the new environment is properly sized
      this.handleResize();
      
      console.log(`Set rendering environment to ${type}`);
      
      // Request a render to ensure the new environment is rendered
      this.requestRender();
      
      return true;
    } catch (error) {
      console.error(`Error setting environment to ${type}:`, error);
      return false;
    }
  }
  
  /**
   * Resize the canvas to fill its container
   */
  resizeCanvas() {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement || document.body;
    const { width, height } = container.getBoundingClientRect();
    
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  /**
   * Start the animation/render loop
   */
  startRenderLoop() {
    if (this.animationId) return;
    
    this.rendering = true;
    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this.animate);
    console.log("Render loop started");
  }
  
  /**
   * Stop the animation/render loop
   */
  stopRenderLoop() {
    if (!this.animationId) return;
    
    cancelAnimationFrame(this.animationId);
    this.animationId = null;
    this.rendering = false;
    console.log("Render loop stopped");
  }
  
  /**
   * Animation loop callback
   * @param {number} timestamp - Current timestamp
   */
  animate(timestamp) {
    // Calculate delta time in seconds
    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    
    // Get active plugin
    const activePlugin = this.core.getActivePlugin();
    
    // Update animation
    if (activePlugin) {
      const visualization = activePlugin.getCurrentVisualization();
      if (visualization) {
        visualization.animate(deltaTime);
      }
    }
    
    // Render if requested or animating
    if (this.renderRequested || this.shouldRenderEveryFrame()) {
      this.render();
      this.renderRequested = false;
    }
    
    // Continue animation loop
    if (this.rendering) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  }
  
  /**
   * Determine if rendering should occur every frame
   * @returns {boolean} Whether to render every frame
   */
  shouldRenderEveryFrame() {
    // Check if environment needs continuous rendering (like 3D)
    if (this.currentEnvironment && this.currentEnvironment.requiresContinuousRendering) {
      return true;
    }
    
    // Check if active plugin requires continuous rendering
    const activePlugin = this.core.getActivePlugin();
    if (activePlugin && activePlugin.getCurrentVisualization()) {
      const visualization = activePlugin.getCurrentVisualization();
      // Check for animation flag or property
      return visualization.isAnimating || false;
    }
    
    return false;
  }
  
  /**
   * Request a render on the next animation frame
   */
  requestRender() {
    this.renderRequested = true;
    
    // If the render loop isn't running, do a one-time render
    if (!this.rendering) {
      requestAnimationFrame(() => {
        this.render();
        this.renderRequested = false;
      });
    }
  }
  
  /**
   * Render the current visualization
   */
  render() {
    if (!this.currentEnvironment) return;
    
    const activePlugin = this.core.getActivePlugin();
    if (!activePlugin) return;
    
    const visualization = activePlugin.getCurrentVisualization();
    if (!visualization) return;
    
    // Render using the current environment
    this.currentEnvironment.render(visualization, activePlugin.parameters);
  }
  
  /**
   * Export the current visualization as a PNG
   */
  exportAsPNG() {
    if (!this.canvas) return;
    
    const activePlugin = this.core.getActivePlugin();
    const filename = activePlugin ? 
                    `${activePlugin.constructor.id}-${Date.now()}.png` : 
                    `visualization-${Date.now()}.png`;
    
    // Force a render to ensure latest state
    this.render();
    
    // Create a download link
    const link = document.createElement('a');
    link.download = filename;
    
    try {
      // Try to get the image data - may fail if using 3D
      let imageData;
      
      // For 3D environment, use the renderer's output
      if (this.currentEnvironment && 
          this.currentEnvironment.getRenderer && 
          typeof this.currentEnvironment.getRenderer === 'function') {
        
        const renderer = this.currentEnvironment.getRenderer();
        if (renderer) {
          // Force a render to ensure the image is up to date
          renderer.render(
            this.currentEnvironment.getScene(), 
            this.currentEnvironment.getCamera()
          );
          
          // Get the image data as a data URL
          imageData = renderer.domElement.toDataURL('image/png');
        }
      }
      
      // If we couldn't get the image data from the environment, use the main canvas
      if (!imageData) {
        imageData = this.canvas.toDataURL('image/png');
      }
      
      link.href = imageData;
      link.click();
      
      console.log(`Exported visualization as ${filename}`);
    } catch (error) {
      console.error("Error exporting as PNG:", error);
      // Notify user of error
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showError(`Failed to export as PNG: ${error.message}`);
      }
    }
  }
  
  /**
   * Get the canvas element
   * @returns {HTMLCanvasElement} Canvas element
   */
  getCanvas() {
    return this.canvas;
  }
  
  /**
   * Get the current environment
   * @returns {RenderingEnvironment} Current rendering environment
   */
  getCurrentEnvironment() {
    return this.currentEnvironment;
  }
  
  /**
   * Clean up resources when the manager is no longer needed
   */
  cleanup() {
    // Stop rendering
    this.stopRenderLoop();
    
    // Dispose of current environment
    if (this.currentEnvironment) {
      this.currentEnvironment.dispose();
      this.currentEnvironment = null;
    }
    
    // Clean up environment instances
    Object.keys(this.environments).forEach(key => {
      if (this.environments[key]) {
        this.environments[key].dispose();
        this.environments[key] = null;
      }
    });
    
    // Remove resize listener
    window.removeEventListener('resize', this.handleResize);
    
    console.log("Rendering manager cleaned up");
  }
}
