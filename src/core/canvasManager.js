// src/core/canvasManager.js
// Manages the canvas and rendering process

import { getState, getStateValue } from './stateManager.js';

/**
 * Manages canvas creation, rendering, and animation
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
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.container.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    
    // Add a debug ID
    this.canvas.id = 'main-canvas';
    this.canvas.style.border = '1px solid rgba(0,0,0,0.1)';
    
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
      this.render();
    });
  }
  
  /**
   * Render the current visualization
   */
  render() {
    if (!this.ctx || !this.canvas) {
      console.error('Cannot render - canvas or context is missing');
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
    
    //console.log("Canvas render called with settings:", settings);
    //console.log("Active plugin:", state.activePluginId);
    
    // Clear canvas with background color
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
    
    // Call the render action - this will call the active plugin's render function
    const rendered = app.hooks.doAction('render', this.ctx, this.canvas, settings);
    
    if (!rendered) {
      // If no plugin handled rendering, show a message
      this.ctx.fillStyle = '#999';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`No render handler for plugin: ${state.activePluginId}`, this.canvas.width / 2, this.canvas.height / 2);
    }
    
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
    }
  }
  
  /**
   * Start the animation/render loop
   */
  startRenderLoop() {
    if (this.animationId) return;
    
    //console.log('Starting render loop');
    
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
      
      // Render the current state
      this.render();
      
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
