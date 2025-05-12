// src/rendering/RenderingManager.js

import { Canvas2DEnvironment } from './Canvas2DEnvironment.js';
import { ThreeJSEnvironment } from './ThreeJSEnvironment.js';

/**
 * Manages rendering environments and animation loop
 * Provides direct environment access for plugins
 */
export class RenderingManager {
  /**
   * Create a new RenderingManager
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    this.core = core;
    this.canvas = null;
    
    // Initialize environments
    this.environments = {
      '2d': null,
      '3d': null
    };
    
    this.currentEnvironment = null;
    this.animationId = null;
    this.lastFrameTime = 0;
    this.rendering = false;
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.updateBackgroundColors = this.updateBackgroundColors.bind(this);
    this.renderNoPluginMessage = this.renderNoPluginMessage.bind(this);
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
        console.log(`Canvas with id ${canvasId} not found, creating new one`);
        this.canvas = document.createElement('canvas');
        this.canvas.id = canvasId;
        document.body.appendChild(this.canvas);
      }
      
      // Set canvas size
      this.resizeCanvas();
      
      // Create environment instances but don't initialize or activate them yet
      this.environments['2d'] = new Canvas2DEnvironment(this.canvas, this.core);
      this.environments['3d'] = new ThreeJSEnvironment(this.canvas, this.core);
      
      // Initialize and activate the 2D environment by default for welcome message
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
      
      // If no active plugin, render welcome message
      if (!this.core.getActivePlugin()) {
        this.renderNoPluginMessage();
      }
      
      console.log("RenderingManager initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize rendering manager:", error);
      return false;
    }
  }
  
  /**
   * Set the current rendering environment
   * @param {string} type - Environment type ('2d' or '3d')
   * @returns {Promise<boolean>} Whether environment change was successful
   */
  async setEnvironment(type) {
    // Validate environment type
    if (type !== '2d' && type !== '3d') {
      console.error(`Invalid environment type: ${type}`);
      return false;
    }
    
    try {
      console.log(`Setting environment to ${type}...`);
      
      // Dispose of current environment if it exists
      if (this.currentEnvironment) {
        // Pause rendering during transition
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
      
      // If no active plugin, render welcome message
      if (!this.core.getActivePlugin()) {
        this.renderNoPluginMessage();
      }
      
      console.log(`Environment set to ${type} successfully`);
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
    
    // Only resize if dimensions have changed
    if (this.canvas.width !== width || this.canvas.height !== height) {
      console.log(`Resizing main canvas to ${width}x${height}`);
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Resize the canvas first
    this.resizeCanvas();
    
    // Then let the current environment handle the resize if it exists
    if (this.currentEnvironment) {
      console.log(`Handling resize for ${this.currentEnvironment === this.environments['2d'] ? '2D' : '3D'} environment`);
      this.currentEnvironment.handleResize();
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
    const deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    
    // Get current plugin
    const plugin = this.core.getActivePlugin();
    
    // Only call plugin's animate method if it exists
    if (plugin && typeof plugin.animate === 'function') {
      // Plugin decides what to do within its animate method
      // including direct rendering on the environment
      plugin.animate(deltaTime);
    } else if (!plugin) {
      // If no active plugin, render welcome message
      this.renderNoPluginMessage();
    }
    
    // Continue animation loop
    if (this.rendering) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  }
  
  /**
   * Render a simple message when no plugin is loaded
   */
  renderNoPluginMessage() {
    if (!this.currentEnvironment || !this.canvas) return;
    
    // Only 2D environment supports this for now
    if (this.environments['2d'] === this.currentEnvironment) {
      const ctx = this.currentEnvironment.getContext();
      if (!ctx) return;
      
      // Clear canvas with the background color
      ctx.fillStyle = this.currentEnvironment.backgroundColor || '#f5f5f5';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Get canvas dimensions for centering
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      
      // Use theme colors from CSS variables or color scheme manager if available
      let textColor = '#333333';
      
      // Try to get color from color scheme manager first
      if (this.core && this.core.colorSchemeManager) {
        const scheme = this.core.colorSchemeManager.getActiveScheme();
        if (scheme && scheme.text) {
          textColor = scheme.text;
        }
      } 
      // Fallback to CSS variables if color scheme manager not available
      else {
        const computedTextColor = getComputedStyle(document.body).getPropertyValue('--text-color');
        if (computedTextColor) {
          textColor = computedTextColor;
        }
      }
      
      // Set text properties
      ctx.font = '30px sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw main heading
      ctx.fillText('Select a Plugin', centerX, centerY - 20);
      
      // Draw instruction with smaller font
      ctx.font = '16px sans-serif';
      ctx.fillText('Click the plugin button to choose a visualization', centerX, centerY + 20);
    }
  }
  
  /**
   * Provide direct access to rendering environment for plugins
   * (Key method for plugin architecture)
   * @returns {Object} Environment access object
   */
  getEnvironmentForPlugin() {
    if (!this.currentEnvironment) return null;
    
    if (this.currentEnvironment === this.environments['2d']) {
      // 2D environment access
      return {
        type: '2d',
        context: this.currentEnvironment.getContext(),
        canvas: this.canvas,
        resetCamera: () => this.currentEnvironment.resetCamera(),
        prepareRender: (ctx) => this.currentEnvironment.prepareRender(ctx),
        completeRender: (ctx) => this.currentEnvironment.completeRender(ctx)
      };
    } else {
      // 3D environment access
      return {
        type: '3d',
        scene: this.currentEnvironment.getScene(),
        camera: this.currentEnvironment.getCamera(),
        renderer: this.currentEnvironment.getRenderer(),
        controls: this.currentEnvironment.getControls(),
        THREE: window.THREE, // Provide THREE.js library reference
        resetCamera: () => {
          const controls = this.currentEnvironment.getControls();
          if (controls && typeof controls.reset === 'function') {
            controls.reset();
          }
        }
      };
    }
  }
  
  /**
   * Export the current visualization as a PNG
   * @returns {boolean} Whether export was successful
   */
  exportAsPNG() {
    if (!this.canvas) return false;
    
    const activePlugin = this.core.getActivePlugin();
    const filename = activePlugin ? 
                    `${activePlugin.id || 'visualization'}-${Date.now()}.png` : 
                    `visualization-${Date.now()}.png`;
    
    try {
      // Create a download link
      const link = document.createElement('a');
      link.download = filename;
      
      // Try to get the image data - may need special handling for 3D
      let imageData;
      
      // For 3D environment, use the renderer's output
      if (this.currentEnvironment && 
          this.currentEnvironment.getRenderer && 
          typeof this.currentEnvironment.getRenderer === 'function') {
        
        const renderer = this.currentEnvironment.getRenderer();
        if (renderer) {
          // The 3D renderer may need its own render call to ensure the image is up to date
          if (renderer.render && this.currentEnvironment.getScene && this.currentEnvironment.getCamera) {
            renderer.render(
              this.currentEnvironment.getScene(), 
              this.currentEnvironment.getCamera()
            );
          }
          
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
      return true;
    } catch (error) {
      console.error("Error exporting as PNG:", error);
      
      // Notify user of error
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showError(`Failed to export as PNG: ${error.message}`);
      }
      
      return false;
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
   * @returns {Object} Current rendering environment
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
      try {
        this.currentEnvironment.dispose();
      } catch (error) {
        console.error("Error disposing current environment during cleanup:", error);
      }
      this.currentEnvironment = null;
    }
    
    // Clean up environment instances
    Object.keys(this.environments).forEach(key => {
      if (this.environments[key]) {
        try {
          this.environments[key].dispose();
        } catch (error) {
          console.error(`Error disposing ${key} environment during cleanup:`, error);
        }
        this.environments[key] = null;
      }
    });
    
    // Remove resize listener and color scheme listener
    window.removeEventListener('resize', this.handleResize);
    if (this.core && this.core.events) {
      this.core.events.off('colorSchemeChanged', this.updateBackgroundColors);
    }
    
    // Reset properties
    this.canvas = null;
    this.environments = { '2d': null, '3d': null };
    this.animationId = null;
    this.lastFrameTime = 0;
    this.rendering = false;
    
    console.log("Rendering manager cleaned up");
  }
}