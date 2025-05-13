// src/rendering/Canvas2DEnvironment.js
import Konva from 'konva';

export class Canvas2DEnvironment {
  constructor(canvas, core) {
    // Existing properties...
    this.stage = null;      // Konva stage
    this.layer = null;      // Main Konva layer
    this.originalCanvas = canvas;  // Keep reference to original canvas
  }
  
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Get container element (parent of canvas)
      const container = this.originalCanvas.parentElement;
      
      // Hide original canvas (Konva will create its own)
      this.originalCanvas.style.display = 'none';
      
      // Create Konva stage directly in the container
      this.stage = new Konva.Stage({
        container: container,
        width: container.clientWidth,
        height: container.clientHeight
      });
      
      // Create main layer
      this.layer = new Konva.Layer();
      this.stage.add(this.layer);
      
      // Set background color
      this.stage.container().style.backgroundColor = this.backgroundColor;
      
      // Keep ctx for backward compatibility
      // Use hidden canvas context for legacy API
      this.ctx = this.originalCanvas.getContext('2d');
      
      this.initialized = true;
      
      // Set continuous rendering requirement
      this.requiresContinuousRendering = true;
      
      return true;
    } catch (error) {
      console.error("Failed to initialize Konva environment:", error);
      return false;
    }
  }
  
  // Handle resize directly with Konva
  handleResize() {
    if (!this.stage) return;
    
    const container = this.stage.container();
    this.stage.width(container.clientWidth);
    this.stage.height(container.clientHeight);
  }
  
  // Legacy support for direct canvas - translate to camera position
  prepareRender(ctx) {
    ctx.save();
    // Implement camera transforms to match Konva's view
    return ctx;
  }
  
  completeRender(ctx) {
    ctx.restore();
  }
  
  // Clean up
  dispose() {
    if (this.stage) {
      this.stage.destroy();
      this.stage = null;
    }
    
    // Show original canvas again
    if (this.originalCanvas) {
      this.originalCanvas.style.display = 'block';
    }
    
    this.initialized = false;
    this.active = false;
  }
}