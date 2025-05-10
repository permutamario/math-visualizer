// src/rendering/Canvas2DEnvironment.js

/**
 * 2D canvas rendering environment
 */
export class Canvas2DEnvironment {
  /**
   * Create a new Canvas2DEnvironment
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {AppCore} core - Reference to the application core
   */
  constructor(canvas, core) {
    this.canvas = canvas;
    this.core = core;
    this.ctx = null;
    this.initialized = false;
    this.active = false;
    
    // 2D environment doesn't need continuous rendering
    this.requiresContinuousRendering = false;
    
    // Camera/viewport state
    this.camera = {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0
    };
    
    // Interaction state
    this.interaction = {
      isDragging: false,
      lastX: 0,
      lastY: 0,
      keys: {}
    };
    
    // Bind event handlers
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }
  
  /**
   * Initialize the 2D environment
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Get 2D context
      this.ctx = this.canvas.getContext('2d');
      
      if (!this.ctx) {
        throw new Error("Could not get 2D context from canvas");
      }
      
      this.initialized = true;
      console.log("2D canvas environment initialized");
      return true;
    } catch (error) {
      console.error("Failed to initialize 2D canvas environment:", error);
      return false;
    }
  }
  
  /**
   * Activate the 2D environment
   * @returns {boolean} Whether activation was successful
   */
  activate() {
    if (this.active) return true;
    
    if (!this.initialized) {
      console.error("Cannot activate uninitialized 2D environment");
      return false;
    }
    
    // Attach event listeners
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('wheel', this.handleWheel);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Set initial cursor style
    this.canvas.style.cursor = 'grab';
    
    this.active = true;
    console.log("2D canvas environment activated");
    return true;
  }
  
  /**
   * Deactivate the 2D environment
   * @returns {boolean} Whether deactivation was successful
   */
deactivate() {
  if (!this.active) return true;
  
  // Remove event listeners
  this.canvas.removeEventListener('mousedown', this.handleMouseDown);
  window.removeEventListener('mousemove', this.handleMouseMove);
  window.removeEventListener('mouseup', this.handleMouseUp);
  this.canvas.removeEventListener('wheel', this.handleWheel);
  window.removeEventListener('keydown', this.handleKeyDown);
  window.removeEventListener('keyup', this.handleKeyUp);
  
  // Reset cursor style
  this.canvas.style.cursor = '';
  
  this.active = false;
  console.log("2D canvas environment deactivated");
  return true;
}
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Nothing special needed for 2D environment
    console.log("2D environment handling resize");
  }
  
  /**
   * Prepare rendering by setting up camera transformations
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @returns {CanvasRenderingContext2D} Transformed context
   */
  prepareRender(ctx) {
    ctx.save();
    
    // Apply camera transformations:
    // 1. Translate to center of canvas
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    ctx.translate(centerX, centerY);
    
    // 2. Apply scale
    ctx.scale(this.camera.scale, this.camera.scale);
    
    // 3. Apply rotation (in radians)
    ctx.rotate((this.camera.rotation * Math.PI) / 180);
    
    // 4. Apply translation
    ctx.translate(this.camera.x, this.camera.y);
    
    return ctx;
  }
  
  /**
   * Complete rendering by restoring context state
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   */
  completeRender(ctx) {
    ctx.restore();
  }
  
  /**
   * Render a visualization
   * @param {Visualization} visualization - Visualization to render
   * @param {Object} parameters - Current parameters
   */
  render(visualization, parameters) {
    if (!this.active || !this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set up camera transformations
    this.ctx.save();
    
    // Apply camera transformations:
    // 1. Translate to center of canvas
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.ctx.translate(centerX, centerY);
    
    // 2. Apply scale
    this.ctx.scale(this.camera.scale, this.camera.scale);
    
    // 3. Apply rotation (in radians)
    this.ctx.rotate((this.camera.rotation * Math.PI) / 180);
    
    // 4. Apply translation
    this.ctx.translate(this.camera.x, this.camera.y);
    
    // Call visualization's render method
    visualization.render2D(this.ctx, parameters);
    
    // Restore context
    this.ctx.restore();
  }
  
  // Event handlers
  
  /**
   * Handle mouse down events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseDown(event) {
    this.interaction.isDragging = true;
    this.interaction.lastX = event.clientX;
    this.interaction.lastY = event.clientY;
    this.canvas.style.cursor = 'grabbing';
    
    // Get mouse coordinates
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Pass to active visualization if any
    const activePlugin = this.core.getActivePlugin ? this.core.getActivePlugin() : null;
    if (activePlugin) {
      const visualization = activePlugin.getCurrentVisualization();
      if (visualization) {
        visualization.handleInteraction('mousedown', { x, y, event });
      }
    }
  }
  
  /**
   * Handle mouse move events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    // Handle camera panning
    if (this.interaction.isDragging) {
      const dx = event.clientX - this.interaction.lastX;
      const dy = event.clientY - this.interaction.lastY;
      
      // Adjust for rotation and scale
      const cos = Math.cos((-this.camera.rotation * Math.PI) / 180);
      const sin = Math.sin((-this.camera.rotation * Math.PI) / 180);
      
      const rotatedDx = cos * dx - sin * dy;
      const rotatedDy = sin * dx + cos * dy;
      
      this.camera.x += rotatedDx / this.camera.scale;
      this.camera.y += rotatedDy / this.camera.scale;
      
      this.interaction.lastX = event.clientX;
      this.interaction.lastY = event.clientY;
      
      // Request render
      if (this.core.renderingManager && this.core.renderingManager.requestRender) {
        this.core.renderingManager.requestRender();
      }
    }
    
    // Get mouse coordinates
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Pass to active visualization if any
    const activePlugin = this.core.getActivePlugin ? this.core.getActivePlugin() : null;
    if (activePlugin) {
      const visualization = activePlugin.getCurrentVisualization();
      if (visualization) {
        visualization.handleInteraction('mousemove', { x, y, event });
      }
    }
  }
  
  /**
   * Handle mouse up events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseUp(event) {
    this.interaction.isDragging = false;
    this.canvas.style.cursor = 'grab';
    
    // Get mouse coordinates
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Pass to active visualization if any
    const activePlugin = this.core.getActivePlugin ? this.core.getActivePlugin() : null;
    if (activePlugin) {
      const visualization = activePlugin.getCurrentVisualization();
      if (visualization) {
        visualization.handleInteraction('mouseup', { x, y, event });
        visualization.handleInteraction('click', { x, y, event });
      }
    }
  }
  
  /**
   * Handle mouse wheel events
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
    
    // Apply zoom with limits
    const newScale = Math.max(0.1, Math.min(10, this.camera.scale * factor));
    
    // Adjust camera position to zoom toward mouse position
    if (newScale !== this.camera.scale) {
      const scaleFactor = newScale / this.camera.scale;
      this.camera.x = worldX + (this.camera.x - worldX) * scaleFactor;
      this.camera.y = worldY + (this.camera.y - worldY) * scaleFactor;
      this.camera.scale = newScale;
      
      // Request render
      if (this.core.renderingManager && this.core.renderingManager.requestRender) {
        this.core.renderingManager.requestRender();
      }
    }
    
    // Get mouse coordinates
    const x = mouseX;
    const y = mouseY;
    
    // Pass to active visualization if any
    const activePlugin = this.core.getActivePlugin ? this.core.getActivePlugin() : null;
    if (activePlugin) {
      const visualization = activePlugin.getCurrentVisualization();
      if (visualization) {
        visualization.handleInteraction('wheel', { x, y, deltaY: event.deltaY, event });
      }
    }
  }
  
  /**
   * Handle key down events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    this.interaction.keys[event.key] = true;
    
    // Handle special keys
    if (event.key === 'Escape') {
      this.resetCamera();
    }
    
    // Pass to active visualization if any
    const activePlugin = this.core.getActivePlugin ? this.core.getActivePlugin() : null;
    if (activePlugin) {
      const visualization = activePlugin.getCurrentVisualization();
      if (visualization) {
        visualization.handleInteraction('keydown', { key: event.key, event });
      }
    }
  }
  
  /**
   * Handle key up events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyUp(event) {
    this.interaction.keys[event.key] = false;
    
    // Pass to active visualization if any
    const activePlugin = this.core.getActivePlugin ? this.core.getActivePlugin() : null;
    if (activePlugin) {
      const visualization = activePlugin.getCurrentVisualization();
      if (visualization) {
        visualization.handleInteraction('keyup', { key: event.key, event });
      }
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
    if (this.core.renderingManager && this.core.renderingManager.requestRender) {
      this.core.renderingManager.requestRender();
    }
  }
  
  /**
   * Get the 2D context
   * @returns {CanvasRenderingContext2D} Canvas 2D context
   */
  getContext() {
    return this.ctx;
  }
  
  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  screenToWorld(screenX, screenY) {
    // Adjust for canvas position
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    // Convert to camera space
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const relativeX = canvasX - centerX;
    const relativeY = canvasY - centerY;
    
    // Apply inverse camera transformations
    // 1. Inverse scale
    const scaledX = relativeX / this.camera.scale;
    const scaledY = relativeY / this.camera.scale;
    
    // 2. Inverse rotation
    const rotRad = (-this.camera.rotation * Math.PI) / 180;
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);
    
    const rotatedX = cos * scaledX - sin * scaledY;
    const rotatedY = sin * scaledX + cos * scaledY;
    
    // 3. Apply camera offset
    const worldX = rotatedX - this.camera.x;
    const worldY = rotatedY - this.camera.y;
    
    return { x: worldX, y: worldY };
  }
}
