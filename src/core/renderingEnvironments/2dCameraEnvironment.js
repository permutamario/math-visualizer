// src/core/renderingEnvironments/2dCameraEnvironment.js
// 2D environment with camera controls (pan/zoom/rotate)

import { BaseEnvironment } from './baseEnvironment.js';
import { getState, getStateValue, changeState } from '../stateManager.js';

/**
 * 2D environment with camera transformations
 */
export class Camera2DEnvironment extends BaseEnvironment {
  /**
   * Create a new Camera2D environment
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Object} options - Environment options
   */
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    // Camera state
    this.camera = {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      // Allow overriding defaults from options
      ...options.camera
    };
    
    // Input state
    this.input = {
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      keys: {}
    };
    
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleWheel = this.handleWheel.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  }
  
  /**
   * Initialize the environment
   */
  initialize() {
    if (this.initialized) return;
    
    // Store camera state in app state if needed
    if (!getStateValue('camera')) {
      changeState('camera', { ...this.camera });
    }
    
    super.initialize();
    console.log('Camera2D environment initialized');
  }
  
  /**
   * Activate this environment
   */
  activate() {
    if (this.active) return;
    
    super.activate();
    
    // Attach event listeners
    this.canvas.addEventListener('mousedown', this.boundHandleMouseDown);
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
    this.canvas.addEventListener('wheel', this.boundHandleWheel);
    document.addEventListener('keydown', this.boundHandleKeyDown);
    document.addEventListener('keyup', this.boundHandleKeyUp);
    
    // Sync camera state from app state
    const storedCamera = getStateValue('camera');
    if (storedCamera) {
      this.camera = { ...storedCamera };
    }
    
    console.log('Camera2D environment activated');
  }
  
  /**
   * Deactivate this environment
   */
  deactivate() {
    if (!this.active) return;
    
    // Store camera state
    changeState('camera', { ...this.camera });
    
    // Remove event listeners
    this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    this.canvas.removeEventListener('wheel', this.boundHandleWheel);
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    document.removeEventListener('keyup', this.boundHandleKeyUp);
    
    super.deactivate();
    console.log('Camera2D environment deactivated');
  }
  
  /**
   * Prepare context for rendering with camera transformations
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  prepareRender(ctx) {
    ctx.save();
    
    // Apply camera transformations in correct order:
    // 1. Translate to center of canvas
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    ctx.translate(centerX, centerY);
    
    // 2. Apply camera scale
    ctx.scale(this.camera.scale, this.camera.scale);
    
    // 3. Apply camera rotation (in radians)
    ctx.rotate((this.camera.rotation * Math.PI) / 180);
    
    // 4. Apply camera translation
    ctx.translate(this.camera.x, this.camera.y);
    
    return ctx;
  }
  
  /**
   * Complete rendering by restoring context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  completeRender(ctx) {
    ctx.restore();
  }
  
  /**
   * Handle mouse down events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseDown(event) {
    this.input.isDragging = true;
    this.input.lastMouseX = event.clientX;
    this.input.lastMouseY = event.clientY;
    this.canvas.style.cursor = 'grabbing';
  }
  
  /**
   * Handle mouse move events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    if (!this.input.isDragging) return;
    
    const dx = event.clientX - this.input.lastMouseX;
    const dy = event.clientY - this.input.lastMouseY;
    
    // Adjust based on current rotation and scale
    const cos = Math.cos((-this.camera.rotation * Math.PI) / 180);
    const sin = Math.sin((-this.camera.rotation * Math.PI) / 180);
    
    // Rotate the movement direction
    const rotatedDx = cos * dx - sin * dy;
    const rotatedDy = sin * dx + cos * dy;
    
    // Update camera position (divide by scale to make it scale-invariant)
    this.camera.x += rotatedDx / this.camera.scale;
    this.camera.y += rotatedDy / this.camera.scale;
    
    // Update mouse position
    this.input.lastMouseX = event.clientX;
    this.input.lastMouseY = event.clientY;
    
    // Request render
    if (window.AppInstance && window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.render();
    }
  }
  
  /**
   * Handle mouse up events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseUp(event) {
    this.input.isDragging = false;
    this.canvas.style.cursor = 'grab';
  }
  
  /**
   * Handle mouse wheel events for zooming
   * @param {WheelEvent} event - Wheel event
   */
  handleWheel(event) {
    event.preventDefault();
    
    // Calculate zoom factor
    const delta = -event.deltaY / 500;
    const factor = 1 + delta;
    
    // Get mouse position relative to canvas
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Get mouse position in canvas space
    const canvasX = mouseX - this.canvas.width / 2;
    const canvasY = mouseY - this.canvas.height / 2;
    
    // Get mouse position in world space
    const worldX = canvasX / this.camera.scale - this.camera.x;
    const worldY = canvasY / this.camera.scale - this.camera.y;
    
    // Update scale with limits
    const newScale = Math.max(0.1, Math.min(10, this.camera.scale * factor));
    
    // Adjust camera position to zoom toward mouse position
    if (newScale !== this.camera.scale) {
      const scaleFactor = newScale / this.camera.scale;
      this.camera.x = worldX + (this.camera.x - worldX) * scaleFactor;
      this.camera.y = worldY + (this.camera.y - worldY) * scaleFactor;
      this.camera.scale = newScale;
      
      // Request render
      if (window.AppInstance && window.AppInstance.canvasManager) {
        window.AppInstance.canvasManager.render();
      }
    }
  }
  
  /**
   * Handle key down events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    this.input.keys[event.key] = true;
    
    // Handle rotation with R key + mouse drag
    if (event.key === 'r' && this.input.isDragging) {
      this.canvas.style.cursor = 'crosshair';
    }
    
    // Handle special keys like Escape to reset view
    if (event.key === 'Escape') {
      this.resetCamera();
    }
  }
  
  /**
   * Handle key up events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyUp(event) {
    this.input.keys[event.key] = false;
    
    // Restore cursor if R key released
    if (event.key === 'r' && this.input.isDragging) {
      this.canvas.style.cursor = 'grabbing';
    }
  }
  
  /**
   * Reset camera to default position
   */
  resetCamera() {
    this.camera = {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0
    };
    
    // Request render
    if (window.AppInstance && window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.render();
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this.deactivate();
    super.dispose();
  }
}
