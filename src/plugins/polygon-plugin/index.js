// src/plugins/polygon-plugin/index.js
import { Plugin } from '../../core/Plugin.js';

export default class PolygonVisualization extends Plugin {
  // Required static properties
  static id = 'polygon-visualization';
  static name = 'Polygon Visualization';
  static description = 'Interactive regular polygon visualization with customizable properties';
  static renderingType = '2d';
  
  constructor(core) {
    super(core);
    // Initialize local state
    this.state = {
      animationRunning: false
    };
  }
  
  async start() {
    console.log("Starting Polygon Visualization plugin");
    
    // Add visual parameters (displayed in the visualization parameters panel)
    this.addSlider('sides', 'Number of Sides', 5, { min: 3, max: 20, step: 1 }, 'visual');
    this.addSlider('radius', 'Radius', 100, { min: 20, max: 300, step: 5 }, 'visual');
    this.addSlider('rotation', 'Rotation (degrees)', 0, { min: 0, max: 360, step: 1 }, 'visual');
    this.addColor('fillColor', 'Fill Color', '#3498db', 'visual');
    this.addColor('strokeColor', 'Stroke Color', '#2c3e50', 'visual');
    this.addSlider('strokeWidth', 'Stroke Width', 2, { min: 0, max: 10, step: 0.5 }, 'visual');
    
    // Add plugin parameters (displayed in the plugin parameters panel)
    this.addCheckbox('animate', 'Animate Rotation', true, 'structural');
    this.addCheckbox('showVertices', 'Show Vertices', true, 'structural');
    this.addSlider('animationSpeed', 'Animation Speed', 45, { min: 5, max: 180, step: 5 }, 'structural');
    this.addSlider('vertexSize', 'Vertex Size', 6, { min: 2, max: 15, step: 1 }, 'structural');
    
    // Add actions
    this.addAction('reset', 'Reset View', () => this.resetView());
    this.addAction('randomColors', 'Random Colors', () => this.randomizeColors());
    this.addAction('toggleAnimation', 'Toggle Animation', () => this.toggleAnimation());
    
    // Setup Konva objects
    this.setupKonvaObjects();
    
    // Start animation if enabled
    this.startAnimation();
  }
  
  setupKonvaObjects() {
    // Get Konva stage, layer, and Konva reference
    const { stage, layer, konva } = this.renderEnv;
    
    // Create group for the polygon and vertices
    this.polygonGroup = new konva.Group({
      x: stage.width() / 2,
      y: stage.height() / 2,
      draggable: true  // Allow dragging the entire polygon
    });
    
    // Create the regular polygon shape
    this.polygon = new konva.RegularPolygon({
      sides: this.getParameter('sides'),
      radius: this.getParameter('radius'),
      fill: this.getParameter('fillColor'),
      stroke: this.getParameter('strokeColor'),
      strokeWidth: this.getParameter('strokeWidth'),
      rotation: this.getParameter('rotation')
    });
    
    // Create separate group for vertices
    this.verticesGroup = new konva.Group();
    
    // Create vertices
    this.updateVertices();
    
    // Add shapes to groups and layer
    this.polygonGroup.add(this.polygon);
    this.polygonGroup.add(this.verticesGroup);
    layer.add(this.polygonGroup);
    
    // Refresh layer
    layer.batchDraw();
    
    // Set up double-click handler for returning to center
    this.polygonGroup.on('dblclick', () => {
      this.polygonGroup.position({
        x: stage.width() / 2,
        y: stage.height() / 2
      });
      layer.batchDraw();
    });
  }
  
  updateVertices() {
    // Don't try to update if not yet initialized
    if (!this.verticesGroup || !this.renderEnv) return;
    
    const konva = this.renderEnv.konva;
    const sides = this.getParameter('sides');
    const radius = this.getParameter('radius');
    const rotationDegrees = this.getParameter('rotation');
    const rotation = rotationDegrees * Math.PI / 180; // Convert to radians
    const vertexSize = this.getParameter('vertexSize');
    const showVertices = this.getParameter('showVertices');
    
    // Clear existing vertices
    this.verticesGroup.destroyChildren();
    
    // Only create vertices if enabled
    if (!showVertices) return;
    
    // Create circle for each vertex
    for (let i = 0; i < sides; i++) {
      // Calculate vertex position
      // For a regular polygon, vertices are equally spaced around a circle
      const angle = (i * 2 * Math.PI / sides) + rotation;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      // Create vertex circle
      const vertex = new konva.Circle({
        x: x,
        y: y,
        radius: vertexSize,
        fill: this.getParameter('strokeColor'),
        stroke: 'white',
        strokeWidth: 1
      });
      
      // Add vertex to group
      this.verticesGroup.add(vertex);
    }
  }
  
  startAnimation() {
    const animate = this.getParameter('animate');
    
    if (animate && !this.state.animationRunning) {
      this.state.animationRunning = true;
      this.animationHandler = this.requestAnimation(this.animate.bind(this));
    }
  }
  
  stopAnimation() {
    if (this.animationHandler) {
      this.cancelAnimation(this.animationHandler);
      this.animationHandler = null;
      this.state.animationRunning = false;
    }
  }
  
  toggleAnimation() {
    const currentState = this.getParameter('animate');
    this.setParameter('animate', !currentState);
  }
  
  animate(deltaTime) {
    // Skip animation if disabled
    if (!this.getParameter('animate')) {
      this.state.animationRunning = false;
      return false; // Stop animation
    }
    
    // Continue animation
    const speed = this.getParameter('animationSpeed');
    const currentRotation = this.getParameter('rotation');
    const newRotation = (currentRotation + speed * deltaTime) % 360;
    
    // Update rotation parameter
    this.setParameter('rotation', newRotation);
    
    return true; // Continue animation
  }
  
  onParameterChanged(parameterId, value, group) {
    // Skip if we don't have Konva objects yet
    if (!this.polygon) return;
    
    // Update based on the changed parameter
    switch (parameterId) {
      case 'sides':
        // Update polygon sides
        this.polygon.sides(value);
        // Update vertices to match new sides
        this.updateVertices();
        break;
        
      case 'radius':
        // Update polygon radius
        this.polygon.radius(value);
        // Update vertices positions
        this.updateVertices();
        break;
        
      case 'rotation':
        // Update polygon rotation
        this.polygon.rotation(value);
        // Update vertices positions
        this.updateVertices();
        break;
        
      case 'fillColor':
        // Update polygon fill
        this.polygon.fill(value);
        break;
        
      case 'strokeColor':
        // Update polygon stroke
        this.polygon.stroke(value);
        // Update vertices fill color
        if (this.verticesGroup) {
          this.verticesGroup.children.forEach(vertex => {
            vertex.fill(value);
          });
        }
        break;
        
      case 'strokeWidth':
        // Update polygon stroke width
        this.polygon.strokeWidth(value);
        break;
        
      case 'animate':
        // Toggle animation
        if (value) {
          this.startAnimation();
        } else {
          this.stopAnimation();
        }
        break;
        
      case 'showVertices':
        // Update vertices visibility
        this.updateVertices();
        break;
        
      case 'vertexSize':
        // Update vertices size
        this.updateVertices();
        break;
    }
    
    // Redraw layer to show changes
    if (this.renderEnv && this.renderEnv.layer) {
      this.renderEnv.layer.batchDraw();
    }
  }
  
  handleInteraction(type, data) {
    // Respond to user interaction events
    switch (type) {
      case 'wheel':
        // Adjust radius with mouse wheel if directly on polygon
        if (data.target === this.polygon || data.target.parent === this.verticesGroup) {
          const delta = data.deltaY;
          const radius = this.getParameter('radius');
          const newRadius = Math.max(20, Math.min(300, radius - delta * 0.1));
          this.setParameter('radius', newRadius);
        }
        break;
        
      case 'click':
        // If not clicking on polygon or vertices, change sides
        if (data.target !== this.polygon && 
            (!data.target.parent || data.target.parent !== this.verticesGroup)) {
          const sides = this.getParameter('sides');
          const newSides = sides === 20 ? 3 : sides + 1;  // Loop from 20 back to 3
          this.setParameter('sides', newSides);
        }
        break;
        
      case 'keydown':
        // Handle keyboard shortcuts
        if (data.evt && data.evt.key) {
          switch (data.evt.key.toLowerCase()) {
            case 'r':
              this.resetView();
              break;
            case 'a':
              this.toggleAnimation();
              break;
            case 'c':
              this.randomizeColors();
              break;
          }
        }
        break;
    }
  }
  
  resetView() {
    // Reset to default values
    this.setParameter('sides', 5);
    this.setParameter('radius', 100);
    this.setParameter('rotation', 0);
    this.setParameter('fillColor', '#3498db');
    this.setParameter('strokeColor', '#2c3e50');
    this.setParameter('strokeWidth', 2);
    this.setParameter('vertexSize', 6);
    
    // Return polygon to center if it was dragged
    if (this.polygonGroup && this.renderEnv && this.renderEnv.stage) {
      this.polygonGroup.position({
        x: this.renderEnv.stage.width() / 2,
        y: this.renderEnv.stage.height() / 2
      });
      this.renderEnv.layer.batchDraw();
    }
  }
  
  randomizeColors() {
    // Generate random hex colors
    const getRandomColor = () => {
      return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    };
    
    // Set random fill and stroke colors
    this.setParameter('fillColor', getRandomColor());
    this.setParameter('strokeColor', getRandomColor());
  }
  
  async unload() {
    // Stop animation first
    this.stopAnimation();
    
    // Let base class handle animation and event cleanup
    await super.unload();
    
    // Clean up Konva objects
    if (this.polygonGroup) {
      this.polygonGroup.destroy();
      this.polygonGroup = null;
    }
    
    // Clear references
    this.polygon = null;
    this.verticesGroup = null;
    this.state = null;
    
    console.log("Polygon Visualization plugin unloaded");
  }
}