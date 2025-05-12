// src/plugins/polygon-viewer/index.js
import { Plugin } from '../../core/Plugin.js';

export default class PolygonViewer extends Plugin {
  // Required static properties
  static id = 'polygon-viewer';
  static name = 'Polygon Viewer';
  static description = 'Interactive regular polygon visualization';
  static renderingType = '2d'; // Using 2D rendering
  
  constructor(core) {
    super(core);
    // Initialize local state
    this.isAnimating = false;
  }
  
  async start() {
    // Get rendering environment (guaranteed to be 2D based on renderingType)
    this.renderEnv = this.core.getRenderingEnvironment();
    
    // Register visual parameters (UI controls)
    this.core.createVisualParameters()
      .addSlider('sides', 'Number of Sides', 5, { min: 3, max: 20, step: 1 })
      .addSlider('radius', 'Radius', 100, { min: 10, max: 200, step: 5 })
      .addSlider('rotation', 'Rotation', 0, { min: 0, max: 360, step: 5 })
      .addColor('fillColor', 'Fill Color', '#4285f4')
      .addColor('strokeColor', 'Stroke Color', '#333333')
      .addSlider('strokeWidth', 'Stroke Width', 2, { min: 0, max: 10, step: 0.5 })
      .register();
    
    // Register actions (buttons)
    this.core.addAction('reset', 'Reset View', () => {
      this.resetView();
    });
    
    this.core.addAction('toggleAnimation', 'Toggle Animation', () => {
      this.toggleAnimation();
    });
    
    // Request initial render
    this.core.requestRenderRefresh();
  }
  
  resetView() {
    // Reset camera to default position
    if (this.renderEnv && typeof this.renderEnv.resetCamera === 'function') {
      this.renderEnv.resetCamera();
    }
    
    // Reset rotation parameter
    this.core.changeParameter('rotation', 0);
    
    // Request render refresh
    this.core.requestRenderRefresh();
  }
  
  toggleAnimation() {
    if (this.isAnimating) {
      // Stop animation
      if (this.animationHandler) {
        this.core.animationManager.cancelAnimation(this.animationHandler);
        this.animationHandler = null;
      }
      this.isAnimating = false;
    } else {
      // Start animation
      this.animationHandler = this.core.animationManager.requestAnimation(
        this.animate.bind(this)
      );
      this.isAnimating = true;
    }
  }
  
  animate(deltaTime) {
    // Update rotation based on time
    const currentRotation = this.core.getAllParameters().rotation;
    const newRotation = (currentRotation + deltaTime * 30) % 360;
    
    // Update rotation parameter (will trigger UI update)
    this.core.changeParameter('rotation', newRotation);
    
    return this.isAnimating; // Continue animation if still animating
  }
  
  onParameterChanged(parameterId, value, group) {
    // Request a render refresh to show parameter changes
    this.core.requestRenderRefresh();
  }
  
  render2D(ctx, parameters) {
    // Extract parameters
    const { sides, radius, rotation, fillColor, strokeColor, strokeWidth } = parameters;
    
    const centerX = 0;
    const centerY = 0;
    const angleStep = (Math.PI * 2) / sides;
    const rotationInRadians = (rotation * Math.PI) / 180;
    
    // Begin a new path
    ctx.beginPath();
    
    // Draw the polygon
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep + rotationInRadians;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    // Close the path
    ctx.closePath();
    
    // Fill the polygon
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // Stroke the polygon
    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }
  
  async unload() {
    // Cancel animation if running
    if (this.animationHandler) {
      this.core.animationManager.cancelAnimation(this.animationHandler);
      this.animationHandler = null;
    }
    
    // Reset state
    this.isAnimating = false;
  }
}