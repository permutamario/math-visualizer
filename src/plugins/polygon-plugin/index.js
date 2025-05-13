import { Plugin } from '../../core/Plugin.js';

export default class PolygonVisualization extends Plugin {
  // Required static properties
  static id = 'polygon-visualization';
  static name = 'Polygon Visualization';
  static description = 'Interactive regular polygon visualization';
  static renderingType = '2d';
  
  constructor(core) {
    super(core);
    this.phase = 0;
  }
  
  async start() {
    // Add visual parameters
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
    
    // Setup Konva objects
    this.setupKonvaObjects();
    
    // Start animation if enabled
    if (this.getParameter('animate')) {
      this.animationHandler = this.requestAnimation(this.animate.bind(this));
    }
  }
  
  setupKonvaObjects() {
    // Get Konva stage and layer
    const { stage, layer, konva } = this.renderEnv;
    
    // Create a group for all polygon elements
    this.polygonGroup = new konva.Group({
      x: stage.width() / 2,
      y: stage.height() / 2
    });
    
    // Create the polygon shape
    this.polygon = new konva.RegularPolygon({
      sides: this.getParameter('sides'),
      radius: this.getParameter('radius'),
      fill: this.getParameter('fillColor'),
      stroke: this.getParameter('strokeColor'),
      strokeWidth: this.getParameter('strokeWidth'),
      rotation: this.getParameter('rotation')
    });
    
    // Add to group
    this.polygonGroup.add(this.polygon);
    
    // Create vertices if enabled
    this.verticesGroup = new konva.Group();
    this.polygonGroup.add(this.verticesGroup);
    
    if (this.getParameter('showVertices')) {
      this.updateVertices();
    }
    
    // Add group to layer
    layer.add(this.polygonGroup);
    layer.batchDraw();
    
    // Center the polygon (Konva's RegularPolygon is centered by default)
  }
  
  updateVertices() {
    const { konva } = this.renderEnv;
    const sides = this.getParameter('sides');
    const radius = this.getParameter('radius');
    const rotation = this.getParameter('rotation') * Math.PI / 180;
    
    // Clear existing vertices
    this.verticesGroup.destroyChildren();
    
    // Only create vertices if enabled
    if (!this.getParameter('showVertices')) {
      return;
    }
    
    // Create circles for each vertex
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) + rotation;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      const vertex = new konva.Circle({
        x: x,
        y: y,
        radius: 5,
        fill: this.getParameter('strokeColor')
      });
      
      this.verticesGroup.add(vertex);
    }
  }
  
  animate(deltaTime) {
    if (!this.getParameter('animate')) return true;
    
    // Update rotation parameter
    const currentRotation = this.getParameter('rotation');
    const newRotation = (currentRotation + 45 * deltaTime) % 360;
    this.setParameter('rotation', newRotation);
    
    return true; // Continue animation
  }
  
  onParameterChanged(parameterId, value, group) {
    if (!this.polygon) return;
    
    // Update polygon properties based on parameter changes
    switch (parameterId) {
      case 'sides':
        this.polygon.sides(value);
        this.updateVertices();
        break;
      case 'radius':
        this.polygon.radius(value);
        this.updateVertices();
        break;
      case 'rotation':
        this.polygon.rotation(value);
        this.updateVertices();
        break;
      case 'fillColor':
        this.polygon.fill(value);
        break;
      case 'strokeColor':
        this.polygon.stroke(value);
        // Also update vertices color
        this.verticesGroup.children.forEach(vertex => {
          vertex.fill(value);
        });
        break;
      case 'strokeWidth':
        this.polygon.strokeWidth(value);
        break;
      case 'animate':
        if (value && !this.animationHandler) {
          this.animationHandler = this.requestAnimation(this.animate.bind(this));
        } else if (!value && this.animationHandler) {
          this.cancelAnimation(this.animationHandler);
          this.animationHandler = null;
        }
        break;
      case 'showVertices':
        this.updateVertices();
        break;
    }
    
    // Redraw the layer
    this.renderEnv.layer.batchDraw();
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
    } else if (type === 'keydown' && data.evt && data.evt.key === 'r') {
      // 'r' key to reset
      this.resetView();
    } else if (type === 'dragstart' && data.target === this.polygon) {
      // Allow dragging the polygon
      // Konva handles this automatically
    }
  }
  
  // Clean up when unloaded
  async unload() {
    // Let base class handle animation cleanup and other resources
    await super.unload();
    
    // Clean up Konva objects
    if (this.polygonGroup) {
      this.polygonGroup.destroy();
      this.polygonGroup = null;
    }
    
    this.polygon = null;
    this.verticesGroup = null;
  }
}