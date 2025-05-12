// src/rendering/RenderingManager.js - Modified version

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
    
    // Initialize the environments object properly
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
    this.updateBackgroundColors = this.updateBackgroundColors.bind(this);
    this.renderNoPluginMessage = this.renderNoPluginMessage.bind(this);
  }

  /**
   * Handle Resize
   */
  handleResize() {
    // Resize the canvas first
    this.resizeCanvas();
    
    // Then let the current environment handle the resize if it exists
    if (this.currentEnvironment) {
      console.log(`Handling resize for ${this.environments['2d'] === this.currentEnvironment ? '2D' : '3D'} environment`);
      this.currentEnvironment.handleResize();
      
      // Request a render to update the view
      this.requestRender();
    } else {
      console.log("No active environment to resize");
    }
  }
  
  /**
   * Initialize the rendering manager
   * @param {string} canvasId - ID of the canvas element (default: 'visualization-canvas')
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(canvasId = 'visualization-canvas') {
    try {
      console.log("Initializing RenderingManager...");
      
      // Get or create canvas element
      this.canvas = document.getElementById(canvasId);
      
      if (!this.canvas) {
        // Create new canvas
        console.log(`Canvas with id ${canvasId} not found, creating new one`);
        this.canvas = document.createElement('canvas');
        this.canvas.id = canvasId;
        document.body.appendChild(this.canvas);
      }
      
      // Set canvas size
      this.resizeCanvas();
      
      // Ensure environments object is initialized
      if (!this.environments) {
        console.log("Initializing environments object");
        this.environments = {
          '2d': null,
          '3d': null
        };
      }
      
      // Create initial environment instances but don't initialize or activate them yet
      console.log("Creating environment instances");
      this.environments['2d'] = this._createEnvironment('2d');
      this.environments['3d'] = this._createEnvironment('3d');
      
      // Initialize and activate the 2D environment by default to show the welcome message
      await this.setEnvironment('2d');
      
      // Listen for window resize
      window.addEventListener('resize', this.handleResize);
      
      // Subscribe to color scheme changes if available
      if (this.core && this.core.events && this.core.colorSchemeManager) {
        this.core.events.on('colorSchemeChanged', this.updateBackgroundColors);
        
        // Also set initial colors from current scheme
        const currentScheme = this.core.colorSchemeManager.getActiveScheme();
        if (currentScheme) {
          this.updateBackgroundColors(currentScheme);
        }
      }
      
      console.log("RenderingManager initialized successfully");
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
    console.log(`Creating ${type} environment`);
    
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
      console.log(`Setting environment to ${type}...`);
      
      // Validate environments object exists
      if (!this.environments) {
        console.error("Environments object is undefined");
        this.environments = {
          '2d': null,
          '3d': null
        };
      }
      
      // Check if the environment instance exists
      if (!this.environments[type]) {
        console.log(`Creating new ${type} environment instance`);
        this.environments[type] = this._createEnvironment(type);
      }
      
      // Dispose of current environment completely if it exists
      if (this.currentEnvironment) {
        // Make sure to stop rendering before we dispose the environment
        const wasRendering = this.rendering;
        if (wasRendering) {
          this.stopRenderLoop();
        }
        
        // Fully dispose the current environment
        try {
          console.log("Disposing current environment");
          this.currentEnvironment.dispose();
        } catch (disposeError) {
          console.error("Error disposing current environment:", disposeError);
          // Continue anyway
        }
        
        this.currentEnvironment = null;
        
        // Small delay to ensure DOM updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Restart rendering if it was running
        if (wasRendering) {
          this.startRenderLoop();
        }
      }
      
      // Initialize the environment if needed
      if (!this.environments[type].initialized) {
        console.log(`Initializing ${type} environment`);
        await this.environments[type].initialize();
      }
      
      // Set and activate new environment
      console.log(`Activating ${type} environment`);
      this.currentEnvironment = this.environments[type];
      await this.currentEnvironment.activate();
      
      // Ensure the canvas is properly sized for the new environment
      console.log("Resizing for new environment");
      this.resizeCanvas();
      this.currentEnvironment.handleResize();
      
      // Apply current color scheme if available
      if (this.core && this.core.colorSchemeManager) {
        const currentScheme = this.core.colorSchemeManager.getActiveScheme();
        if (currentScheme && this.currentEnvironment && 
            typeof this.currentEnvironment.updateBackgroundColor === 'function') {
          this.currentEnvironment.updateBackgroundColor(currentScheme);
        }
      }
      
      // Request a render to ensure the new environment is rendered
      this.requestRender();
      
      console.log(`Environment set to ${type} successfully`);
      return true;
    } catch (error) {
      console.error(`Error setting environment to ${type}:`, error);
      return false;
    }
  }
  
  /**
   * Update background colors in all rendering environments
   * @param {Object} colorScheme - Color scheme to apply
   */
  updateBackgroundColors(colorScheme) {
    if (!colorScheme) return;
    
    console.log(`Updating rendering background colors to match theme: ${colorScheme.id}`);
    
    // Update both environments if they exist and have the method
    Object.values(this.environments).forEach(env => {
      if (env && typeof env.updateBackgroundColor === 'function') {
        env.updateBackgroundColor(colorScheme);
      }
    });
    
    // Request a render to show the changes if we're currently rendering
    if (this.rendering || this.currentEnvironment) {
      this.requestRender();
    }
  }
  
  /**
   * Resize the canvas to fill its container
   */
  resizeCanvas() {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement || document.body;
    const { width, height } = container.getBoundingClientRect();
    
    console.log(`Resizing main canvas to ${width}x${height}`);
    
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
  
  render() {
  if (!this.currentEnvironment) {
    console.log("Cannot render: no active environment");
    return;
  }
  
  const activePlugin = this.core.getActivePlugin();
  if (!activePlugin) {
    console.log("No active plugin, showing welcome message");
    this.renderNoPluginMessage();
    return;
  }
  
  const visualization = activePlugin.getCurrentVisualization();
  if (!visualization) {
    console.log("Cannot render: no active visualization");
    return;
  }
  
  // Merge all parameter collections before passing to render
  const combinedParameters = {
    ...activePlugin.pluginParameters,
    ...activePlugin.visualizationParameters,
    ...activePlugin.advancedParameters
  };
  
  // Render using the current environment
  this.currentEnvironment.render(visualization, combinedParameters);
}
  
  /**
   * Render a message when no plugin is loaded
   */
  renderNoPluginMessage() {
    if (!this.currentEnvironment || !this.canvas) return;
    
    // Only 2D environment supports this for now
    if (this.environments['2d'] === this.currentEnvironment) {
      const ctx = this.currentEnvironment.getContext();
      if (!ctx) return;
      
      // Clear canvas with the background color
      ctx.fillStyle = this.currentEnvironment.backgroundColor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Set up transformations to center the text
      ctx.save();
      
      // Draw instruction text
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      
      ctx.font = '30px sans-serif';
      ctx.fillStyle = 'var(--text-color)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Select a Plugin', centerX, centerY - 20);
      
      // Add a smaller instruction
      ctx.font = '16px sans-serif';
      ctx.fillText('Click the plugin button to choose a visualization', centerX, centerY + 20);
      
      // Draw an arrow pointing to the plugin selector button
      const pluginButton = document.querySelector('.plugin-selector-button') || 
                           document.getElementById('mobile-plugin-button');
      
      if (pluginButton) {
        const buttonRect = pluginButton.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate relative position
        const arrowEndX = buttonRect.left + buttonRect.width/2 - canvasRect.left;
        const arrowEndY = buttonRect.top + buttonRect.height/2 - canvasRect.top;
        
        // Draw arrow from center to button
        const arrowStartX = centerX;
        const arrowStartY = centerY + 60;
        
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        
        // Create a curved arrow using bezier
        const controlX = (arrowStartX + arrowEndX) / 2;
        const controlY = arrowStartY + 30;
        
        ctx.quadraticCurveTo(controlX, controlY, arrowEndX, arrowEndY);
        
        ctx.strokeStyle = 'var(--accent-color)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add arrowhead
        const angle = Math.atan2(arrowEndY - controlY, arrowEndX - controlX);
        const arrowSize = 10;
        
        ctx.beginPath();
        ctx.moveTo(arrowEndX, arrowEndY);
        ctx.lineTo(
          arrowEndX - arrowSize * Math.cos(angle - Math.PI/6),
          arrowEndY - arrowSize * Math.sin(angle - Math.PI/6)
        );
        ctx.lineTo(
          arrowEndX - arrowSize * Math.cos(angle + Math.PI/6),
          arrowEndY - arrowSize * Math.sin(angle + Math.PI/6)
        );
        ctx.closePath();
        ctx.fillStyle = 'var(--accent-color)';
        ctx.fill();
      }
      
      ctx.restore();
    }
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
    
    // Remove resize listener and color scheme listener
    window.removeEventListener('resize', this.handleResize);
    if (this.core && this.core.events) {
      this.core.events.off('colorSchemeChanged', this.updateBackgroundColors);
    }
    
    console.log("Rendering manager cleaned up");
  }
}