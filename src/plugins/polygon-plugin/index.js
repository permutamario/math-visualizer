import { Plugin } from '../../core/Plugin.js';

export default class PolygonVisualization extends Plugin {
  // Required static properties
  static id = 'polygon-visualization';
  static name = 'Polygon Visualization';
  static description = 'Interactive regular polygon visualization';
  static renderingType = '2d';
  
  constructor(core) {
    super(core);
    this.animationHandler = null;
  }
  
  async start() {
    // Add visual parameters using helper methods
    this.addSlider('sides', 'Number of Sides', 5, { min: 3, max: 20, step: 1 });
    this.addSlider('radius', 'Radius', 100, { min: 20, max: 200, step: 10 });
    this.addSlider('rotation', 'Rotation', 0, { min: 0, max: 360, step: 1 });
    this.addColor('fillColor', 'Fill Color', '#3498db');
    this.addColor('strokeColor', 'Stroke Color', '#2c3e50');
    this.addSlider('strokeWidth', 'Stroke Width', 2, { min: 0, max: 10, step: 0.5 });
    
    // Add structural parameters
    this.addCheckbox('animate', 'Animate Rotation', true, 'structural');
    this.addCheckbox('showVertices', 'Show Vertices', true, 'structural');
    
    // Add actions
    this.addAction('reset', 'Reset View', () => this.resetView());
    this.addAction('randomColors', 'Random Colors', () => this.randomizeColors());
    
    // DIRECT RENDERING in start() to demonstrate freedom in rendering
    // This is before animation setup to emphasize we can render whenever we want
    const ctx = this.renderEnv.context;
    const canvas = ctx.canvas;
    
    // Draw a simple initial render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw a message
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('Direct rendering in start() method', canvas.width/2, 30);
    
    // Draw initial polygon without camera transformations
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const sides = this.getParameter('sides');
    const radius = this.getParameter('radius');
    
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Draw polygon
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = i * 2 * Math.PI / sides;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    // Apply styles
    ctx.fillStyle = this.getParameter('fillColor');
    ctx.strokeStyle = this.getParameter('strokeColor');
    ctx.lineWidth = this.getParameter('strokeWidth');
    
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    // Start proper rendering and animation after a brief delay
    setTimeout(() => {
      // Start animation if enabled
      if (this.getParameter('animate')) {
        this.animationHandler = this.requestAnimation(this.animate.bind(this));
      }
      
      // Render properly with camera transformations
      this.renderPolygon();
    }, 1000);
  }
  
  // Animation method
  animate(deltaTime) {
    if (this.getParameter('animate')) {
      // Update rotation parameter
      const currentRotation = this.getParameter('rotation');
      const newRotation = (currentRotation + 45 * deltaTime) % 360;
      this.setParameter('rotation', newRotation);
    }
    
    return true; // Continue animation
  }
  
  // Handle parameter changes
  onParameterChanged(parameterId, value, group) {
    // Special handling for the animate parameter
    if (parameterId === 'animate') {
      if (value && !this.animationHandler) {
        this.animationHandler = this.requestAnimation(this.animate.bind(this));
      } else if (!value && this.animationHandler) {
        this.cancelAnimation(this.animationHandler);
        this.animationHandler = null;
      }
    }
    
    // Render with updated parameters
    this.renderPolygon();
  }
  
  // Main rendering method
  renderPolygon() {
    // Get rendering context and parameters
    const ctx = this.renderEnv.context;
    const canvas = ctx.canvas;
    const params = this.getAllParameters();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply camera transformations provided by environment
    const transformedCtx = this.renderEnv.prepareRender(ctx);
    
    // Draw polygon at origin (camera handles position)
    transformedCtx.beginPath();
    for (let i = 0; i < params.sides; i++) {
      const angle = (i * 2 * Math.PI / params.sides) + (params.rotation * Math.PI / 180);
      const x = params.radius * Math.cos(angle);
      const y = params.radius * Math.sin(angle);
      
      if (i === 0) transformedCtx.moveTo(x, y);
      else transformedCtx.lineTo(x, y);
    }
    transformedCtx.closePath();
    
    // Fill and stroke
    transformedCtx.fillStyle = params.fillColor;
    transformedCtx.fill();
    transformedCtx.strokeStyle = params.strokeColor;
    transformedCtx.lineWidth = params.strokeWidth;
    transformedCtx.stroke();
    
    // Draw vertices if enabled
    if (params.showVertices) {
      for (let i = 0; i < params.sides; i++) {
        const angle = (i * 2 * Math.PI / params.sides) + (params.rotation * Math.PI / 180);
        const x = params.radius * Math.cos(angle);
        const y = params.radius * Math.sin(angle);
        
        transformedCtx.beginPath();
        transformedCtx.arc(x, y, 5, 0, 2 * Math.PI);
        transformedCtx.fillStyle = params.strokeColor;
        transformedCtx.fill();
      }
    }
    
    // Restore context state
    this.renderEnv.completeRender(transformedCtx);
  }
  
  // Reset to default values
  resetView() {
    this.setParameter('sides', 5);
    this.setParameter('radius', 100);
    this.setParameter('rotation', 0);
    this.setParameter('fillColor', '#3498db');
    this.setParameter('strokeColor', '#2c3e50');
    this.setParameter('strokeWidth', 2);
  }
  
  // Generate random colors
  randomizeColors() {
    const getRandomColor = () => {
      return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    };
    
    this.setParameter('fillColor', getRandomColor());
    this.setParameter('strokeColor', getRandomColor());
  }
  
  // Handle user interaction
  handleInteraction(type, data) {
    if (type === 'wheel') {
      // Mouse wheel to adjust radius
      const delta = -data.deltaY * 0.1;
      const radius = this.getParameter('radius');
      this.setParameter('radius', Math.max(20, Math.min(200, radius + delta)));
    } else if (type === 'click' || type === 'tap') {
      // Click/tap to increment sides
      const sides = this.getParameter('sides');
      this.setParameter('sides', ((sides) % 20) + 1);
    } else if (type === 'keydown' && data.key === 'r') {
      // 'r' key to reset
      this.resetView();
    }
  }
  
  // Clean up when unloaded
  async unload() {
    // Let base class handle animation cleanup and other resources
    await super.unload();
    
    // Plugin-specific cleanup
    this.animationHandler = null;
  }
}