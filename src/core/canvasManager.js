// src/core/canvasManager.js
// Updated to work with rendering environments

import { getState, getStateValue, changeState } from './stateManager.js';
import { createEnvironment, isEnvironmentTypeSupported } from './renderingEnvironments/environmentFactory.js';

/**
 * Manages canvas creation, rendering, and animation with environment support
 */
export class CanvasManager {
  /**
   * Create a new CanvasManager
   * @param {string} containerId - ID of the container element
   */
  constructor(containerId = 'viewer-canvas') {
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }
    
    this.setupCanvas();
    this.bindEvents();
    this.animationId = null;
    this.lastFrameTime = 0;
    this.fps = 0;
    
    // Current rendering environment
    this.currentEnvironment = null;
    this.environmentType = null;
    
    console.log('Canvas manager initialized');
  }
  
  /**
   * Set up the canvas element
   */
  setupCanvas() {
    // Remove any existing canvas
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    // Create a new canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.id = 'main-canvas';
    this.canvas.style.border = '1px solid rgba(0,0,0,0.1)';
    this.container.appendChild(this.canvas);

    // We'll get the appropriate context later based on the environment type
    // For now, use 2D as default
    this.ctx = this.canvas.getContext('2d');
    
    console.log('Canvas created with dimensions:', this.canvas.width, 'x', this.canvas.height);
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      
      // Notify the environment about the resize
      if (this.currentEnvironment) {
        this.currentEnvironment.handleResize();
      }
      
      this.render();
    });
  }
  
  /**
   * Set up the appropriate rendering environment
   * @param {string} type - Environment type
   * @param {Object} options - Environment options
   * @returns {boolean} - Whether environment setup was successful
   */
  setupEnvironment(type, options = {}) {
    // Don't change if already using this type
    if (this.currentEnvironment && this.environmentType === type) {
      console.log(`Already using environment type: ${type}`);
      return true;
    }

    console.log(`Setting up environment type: ${type}`);

    // Clean up current environment if it exists
    if (this.currentEnvironment) {
      console.log(`Disposing current environment: ${this.environmentType}`);
      this.currentEnvironment.dispose();
      this.currentEnvironment = null;
    }

    // Check if the requested environment type is supported
    if (!isEnvironmentTypeSupported(type)) {
      console.error(`Unsupported environment type: ${type}`);
      console.log('Falling back to 2D camera environment');
      type = '2d-camera';
    }

    // Create new environment
    this.currentEnvironment = createEnvironment(type, this.canvas, options);
    
    if (!this.currentEnvironment) {
      console.error(`Failed to create environment of type: ${type}`);
      return false;
    }
    
    this.environmentType = type;

    // Activate the environment
    console.log(`Creating Environment ${type}`);
    const activationSuccess = this.currentEnvironment.activate();
    
    if (!activationSuccess && type === '3d-camera') {
      console.warn('3D environment activation failed - falling back to 2D environment');
      
      // Clean up failed environment
      this.currentEnvironment.dispose();
      this.currentEnvironment = null;
      
      // Fall back to 2D
      this.environmentType = '2d-camera';
      this.currentEnvironment = createEnvironment('2d-camera', this.canvas, options);
      this.currentEnvironment.activate();
      
      // Notify that we're using 2D instead
      changeState('currentEnvironment', '2d-camera');
      return false;
    }

    // Update state
    changeState('currentEnvironment', this.environmentType);
    return true;
  }
  
  /**
   * Render the current visualization
   */
  render() {
    if (!this.canvas) {
      console.error('Cannot render - canvas is missing');
      return;
    }

    const state = getState();
    const { settings } = state;

    // Get the app instance
    const app = window.AppInstance;
    if (!app || !app.hooks) {
      console.error('Cannot render - app or hooks system not available');
      return;
    }

    // For 3D environment, we rely on its own render loop
    if (this.environmentType === '3d-camera' && this.currentEnvironment && this.currentEnvironment.active) {
      // 3D environment handles its own rendering through animate()
      return;
    }

    // For 2D environments, handle rendering here
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        console.error('Cannot get 2D context for rendering');
        return;
      }
    }

    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fill with background color
    this.ctx.fillStyle = settings?.backgroundColor || '#f5f5f5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // If no active plugin, show a message
    if (!state.activePluginId) {
      this.ctx.fillStyle = '#999';
      this.ctx.font = '18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('No visualization selected', this.canvas.width / 2, this.canvas.height / 2);
      return;
    }

    // Prepare for rendering using environment if available
    let ctx = this.ctx;
    if (this.currentEnvironment) {
      ctx = this.currentEnvironment.prepareRender(this.ctx);
    }

    // Call before render hook
    app.hooks.doAction('beforeRender', ctx, this.canvas, settings);

    // Call the render action - this will call the active plugin's render function
    const rendered = app.hooks.doAction('render', ctx, this.canvas, settings);

    if (!rendered) {
      // If no plugin handled rendering, show a message
      ctx.fillStyle = '#999';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`No render handler for plugin: ${state.activePluginId}`, this.canvas.width / 2, this.canvas.height / 2);
    }

    // Complete rendering using environment if available
    if (this.currentEnvironment) {
      this.currentEnvironment.completeRender(this.ctx);
    }

    // Call after render hook
    app.hooks.doAction('afterRender', this.ctx, this.canvas, settings);

    // Show FPS if enabled
    if (settings?.showFPS) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`FPS: ${this.fps.toFixed(1)}`, 10, 20);
    }

    // Debug mode - draw a border around the canvas
    if (state.debugMode) {
      this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(0, 0, this.canvas.width - 1, this.canvas.height - 1);

      // Show active plugin name
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`Active Plugin: ${state.activePluginId}`, 10, this.canvas.height - 10);

      // Show current environment
      this.ctx.fillText(`Environment: ${this.environmentType || 'none'}`, 10, this.canvas.height - 30);
    }
  }
  
  /**
   * Start the animation/render loop
   */
  startRenderLoop() {
    if (this.animationId) return;
    
    const renderFrame = (timestamp) => {
      // Calculate FPS
      if (this.lastFrameTime) {
        const deltaTime = timestamp - this.lastFrameTime;
        this.fps = 1000 / deltaTime;
      }
      this.lastFrameTime = timestamp;
      
      const state = getState();
      
      // Only animate if animation is enabled
      if (state.settings?.animation) {
        // Apply animation changes for the active plugin
        if (state.activePluginId === 'square' && state.settings?.squareRotation !== undefined) {
          const newRotation = (state.settings.squareRotation + 1) % 360;
          window.changeState('settings.squareRotation', newRotation);
        }
      }
      
      // Render the current state (if not using 3D environment)
      if (this.environmentType !== '3d-camera') {
        this.render();
      }
      
      // Request next frame
      this.animationId = requestAnimationFrame(renderFrame);
    };
    
    this.animationId = requestAnimationFrame(renderFrame);
  }
  
  /**
   * Stop the animation/render loop
   */
  stopRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log('Render loop stopped');
    }
  }
  
  /**
   * Export the current visualization as a PNG
   */
  exportAsPNG() {
    const activePluginId = getStateValue('activePluginId') || 'visualization';
    
    const link = document.createElement('a');
    link.download = `${activePluginId}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    
    console.log(`Exported PNG: ${activePluginId}.png`);
  }
}
