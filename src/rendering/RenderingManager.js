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
      
      // Create environments
      this.environments['2d'] = new Canvas2DEnvironment(this.canvas, this.core);
      this.environments['3d'] = new ThreeJSEnvironment(this.canvas, this.core);
      
      // Initialize both environments but don't activate them yet
      await this.environments['2d'].initialize();
      await this.environments['3d'].initialize();
      
      // Listen for window resize
      window.addEventListener('resize', () => {
        this.resizeCanvas();
        this.render();
      });
      
      console.log("Rendering manager initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize rendering manager:", error);
      return false;
    }
  }
  
  /**
   * Set the current rendering environment
   * @param {string} type - Environment type ('2d' or '3d')
   * @returns {boolean} Whether environment change was successful
   */
  setEnvironment(type) {
    // Validate environment type
    if (!this.environments[type]) {
      console.error(`Invalid environment type: ${type}`);
      return false;
    }
    
    // Deactivate current environment if different
    if (this.currentEnvironment && this.currentEnvironment !== this.environments[type]) {
      this.currentEnvironment.deactivate();
    }
    
    // Set and activate new environment
    this.currentEnvironment = this.environments[type];
    this.currentEnvironment.activate();
    
    console.log(`Set rendering environment to ${type}`);
    return true;
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
    
    // Notify current environment
    if (this.currentEnvironment) {
      this.currentEnvironment.handleResize();
    }
  }
  
  /**
   * Start the animation/render loop
   */
  startRenderLoop() {
    if (this.animationId) return;
    
    this.rendering = true;
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
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    
    console.log(`Exported visualization as ${filename}`);
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
}
