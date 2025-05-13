// src/plugins/framework-test-plugin/index.js
import { Plugin } from '../../core/Plugin.js';

export default class FrameworkTestPlugin extends Plugin {
  // Required static properties
  static id = 'framework-test-plugin';
  static name = 'Framework Test Plugin';
  static description = 'A comprehensive test with auto-rendering framework features';
  static renderingType = '2d'; // Using 2D with Konva (could be '3d' for Three.js)
  
  constructor(core) {
    super(core);
    // Initialize local state
    this.state = {
      animationRunning: false,
      mousePosition: { x: 0, y: 0 },
      shapes: [],
      lastEventTime: Date.now(),
      eventLog: []
    };
  }
  
  async start() {
    console.log("Starting Framework Test Plugin");
    
    // ========== PARAMETER MANAGEMENT TESTS ==========
    // Visual parameters (appear in visualization parameters panel)
    this.addSlider('mainSize', 'Main Shape Size', 100, { min: 20, max: 300, step: 5 }, 'visual');
    this.addColor('mainColor', 'Main Color', '#3498db', 'visual');
    this.addDropdown('shapeType', 'Shape Type', 'circle', ['circle', 'square', 'triangle', 'star'], 'visual');
    
    // Structural parameters (appear in plugin parameters panel)
    this.addCheckbox('animate', 'Enable Animation', true, 'structural');
    this.addSlider('animationSpeed', 'Animation Speed', 1, { min: 0.1, max: 5, step: 0.1 }, 'structural');
    this.addNumber('shapeCount', 'Number of Shapes', 5, { min: 1, max: 20, step: 1 }, 'structural');
    
    // Advanced parameters
    this.addText('customText', 'Custom Text', 'Framework Test', 'advanced');
    this.addColor('textColor', 'Text Color', '#333333', 'advanced');
    this.addSlider('textSize', 'Text Size', 18, { min: 8, max: 48, step: 1 }, 'advanced');
    
    // ========== ACTION MANAGEMENT TESTS ==========
    this.addAction('reset', 'Reset View', () => this.resetView());
    this.addAction('randomColors', 'Randomize Colors', () => this.randomizeColors());
    this.addAction('toggleAnimation', 'Toggle Animation', () => this.toggleAnimation());
    this.addAction('clearEvents', 'Clear Event Log', () => this.clearEventLog());
    
    // ========== KONVA SETUP ==========
    this.setupKonvaObjects();
    
    // ========== ANIMATION TESTS ==========
    // Start animation if enabled
    this.startAnimation();
  }
  
  setupKonvaObjects() {
    // Get Konva stage, layer, and library reference
    const { stage, layer, konva } = this.renderEnv;
    
    // Create main group for visualization elements
    this.mainGroup = new konva.Group({
      x: stage.width() / 2,
      y: stage.height() / 2,
      draggable: true // Test draggable functionality
    });
    
    // Create shape container group
    this.shapesGroup = new konva.Group();
    this.mainGroup.add(this.shapesGroup);
    
    // Create event display area at the bottom
    this.eventDisplay = new konva.Text({
      text: 'Interaction events will appear here',
      fontSize: 14,
      fill: 'black',
      width: stage.width() - 40,
      x: -stage.width() / 2 + 20,
      y: stage.height() / 2 - 100,
      align: 'left'
    });
    this.mainGroup.add(this.eventDisplay);
    
    // Create text display for the custom text parameter
    this.textNode = new konva.Text({
      text: this.getParameter('customText'),
      fontSize: this.getParameter('textSize'),
      fill: this.getParameter('textColor'),
      x: 0,
      y: 150,
      align: 'center'
    });
    this.mainGroup.add(this.textNode);
    
    // Center text
    this.textNode.offsetX(this.textNode.width() / 2);
    
    // Create tooltip for mouse position
    this.tooltip = new konva.Label({
      x: 0,
      y: 0,
      opacity: 0,
      visible: false
    });
    
    const tooltipTag = new konva.Tag({
      fill: 'black',
      pointerDirection: 'down',
      pointerWidth: 10,
      pointerHeight: 10,
      lineJoin: 'round',
      cornerRadius: 5
    });
    
    const tooltipText = new konva.Text({
      text: '',
      fontFamily: 'Arial',
      fontSize: 12,
      padding: 5,
      fill: 'white'
    });
    
    this.tooltip.add(tooltipTag);
    this.tooltip.add(tooltipText);
    layer.add(this.tooltip);
    
    // Create shapes based on parameters
    this.createShapes();
    
    // Add the main group to the layer
    layer.add(this.mainGroup);
    
    // Set up event tracking for testing interaction events
    this.setupEventTracking(stage);
    
    // No need for explicit layer.batchDraw() - framework will handle it
  }
  
  createShapes() {
    // Don't try to update if not yet initialized
    if (!this.shapesGroup || !this.renderEnv) return;
    
    const konva = this.renderEnv.konva;
    const shapeCount = this.getParameter('shapeCount');
    const mainSize = this.getParameter('mainSize');
    const mainColor = this.getParameter('mainColor');
    const shapeType = this.getParameter('shapeType');
    
    // Clear existing shapes
    this.shapesGroup.destroyChildren();
    this.state.shapes = [];
    
    // Create main shape in the center
    const mainShape = this.createShape(konva, shapeType, 0, 0, mainSize, mainColor);
    this.shapesGroup.add(mainShape);
    this.state.shapes.push(mainShape);
    
    // Create satellite shapes
    for (let i = 0; i < shapeCount - 1; i++) {
      const angle = (i * 2 * Math.PI / (shapeCount - 1));
      const x = Math.cos(angle) * mainSize * 1.5;
      const y = Math.sin(angle) * mainSize * 1.5;
      const size = mainSize * 0.4;
      const color = this.getRandomColor();
      
      const shape = this.createShape(konva, shapeType, x, y, size, color);
      this.shapesGroup.add(shape);
      this.state.shapes.push(shape);
    }
    
    // No need for explicit layer.batchDraw() - the framework will handle it
  }
  
  createShape(konva, type, x, y, size, color) {
    let shape;
    
    switch (type) {
      case 'circle':
        shape = new konva.Circle({
          x: x,
          y: y,
          radius: size / 2,
          fill: color,
          stroke: 'black',
          strokeWidth: 2
        });
        break;
        
      case 'square':
        shape = new konva.Rect({
          x: x - size / 2,
          y: y - size / 2,
          width: size,
          height: size,
          fill: color,
          stroke: 'black',
          strokeWidth: 2
        });
        break;
        
      case 'triangle':
        shape = new konva.RegularPolygon({
          x: x,
          y: y,
          sides: 3,
          radius: size / 2,
          fill: color,
          stroke: 'black',
          strokeWidth: 2
        });
        break;
        
      case 'star':
        shape = new konva.Star({
          x: x,
          y: y,
          numPoints: 5,
          innerRadius: size / 4,
          outerRadius: size / 2,
          fill: color,
          stroke: 'black',
          strokeWidth: 2
        });
        break;
        
      default:
        // Default to circle
        shape = new konva.Circle({
          x: x,
          y: y,
          radius: size / 2,
          fill: color,
          stroke: 'black',
          strokeWidth: 2
        });
    }
    
    // Add hover effect to test event handling
    shape.on('mouseover', function() {
      document.body.style.cursor = 'pointer';
      this.strokeWidth(4);
      this.getLayer().batchDraw(); // Need this because event is from Konva directly
    });
    
    shape.on('mouseout', function() {
      document.body.style.cursor = 'default';
      this.strokeWidth(2);
      this.getLayer().batchDraw(); // Need this because event is from Konva directly
    });
    
    // Add click handler
    shape.on('click', () => {
      this.logEvent(`Clicked on ${type} shape`);
      // No explicit draw needed - will happen via the framework
    });
    
    return shape;
  }
  
  setupEventTracking(stage) {
    // Track various events to test event handling
    const events = [
      'mousedown', 'mouseup', 'mousemove', 
      'click', 'dblclick', 'wheel',
      'dragstart', 'dragmove', 'dragend'
    ];
    
    events.forEach(eventType => {
      stage.on(eventType, (evt) => {
        // Update tooltip position and content for mousemove
        if (eventType === 'mousemove') {
          const pos = stage.getPointerPosition();
          if (pos) {
            // Update tooltip
            this.tooltip.position({
              x: pos.x,
              y: pos.y - 20
            });
            
            // Update tooltip text
            const tooltipText = this.tooltip.findOne('Text');
            const relativeX = pos.x - this.mainGroup.x();
            const relativeY = pos.y - this.mainGroup.y();
            tooltipText.text(`x: ${Math.round(relativeX)}, y: ${Math.round(relativeY)}`);
            
            // Show tooltip
            this.tooltip.show();
            this.tooltip.opacity(1);
            
            this.state.mousePosition = { x: relativeX, y: relativeY };
            
            // Need to keep this batch draw since mousemove is very frequent
            // and happens directly from Konva
            this.tooltip.getLayer().batchDraw();
          }
        }
        
        // For all other events, log them with limited rate
        if (eventType !== 'mousemove' || Date.now() - this.state.lastEventTime > 500) {
          this.logEvent(`${eventType} at x:${Math.round(evt.evt.offsetX)}, y:${Math.round(evt.evt.offsetY)}`);
          this.state.lastEventTime = Date.now();
        }
      });
    });
  }
  
  logEvent(message) {
    // Add event to log with timestamp
    const time = new Date().toLocaleTimeString();
    this.state.eventLog.unshift(`${time}: ${message}`);
    
    // Limit log size
    if (this.state.eventLog.length > 5) {
      this.state.eventLog.pop();
    }
    
    // Update display
    this.updateEventDisplay();
  }
  
  clearEventLog() {
    this.state.eventLog = [];
    this.updateEventDisplay();
  }
  
  updateEventDisplay() {
    if (this.eventDisplay) {
      this.eventDisplay.text(this.state.eventLog.join('\n'));
      // No explicit draw needed - will happen via framework
    }
  }
  
  getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  }
  
  // ========== ANIMATION MANAGEMENT TESTS ==========
  
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
    // The parameter change will automatically trigger onParameterChanged,
    // which will start/stop the animation as needed
  }
  
  animate(deltaTime) {
    // Skip animation if disabled
    if (!this.getParameter('animate')) {
      this.state.animationRunning = false;
      return false; // Stop animation
    }
    
    // Animation speed factor
    const speed = this.getParameter('animationSpeed');
    
    // Animate shapes
    if (this.state.shapes && this.state.shapes.length > 0) {
      // Main shape pulsates
      const mainShape = this.state.shapes[0];
      const pulseFactor = Math.sin(Date.now() * 0.001 * speed) * 0.2 + 0.8;
      
      // Apply different scaling based on shape type
      if (mainShape instanceof this.renderEnv.konva.Circle) {
        mainShape.radius(this.getParameter('mainSize') / 2 * pulseFactor);
      } else if (mainShape instanceof this.renderEnv.konva.Rect) {
        const size = this.getParameter('mainSize') * pulseFactor;
        mainShape.width(size);
        mainShape.height(size);
        mainShape.x(-size / 2);
        mainShape.y(-size / 2);
      } else {
        // For other shapes use scale
        mainShape.scale({ x: pulseFactor, y: pulseFactor });
      }
      
      // Satellite shapes rotate
      for (let i = 1; i < this.state.shapes.length; i++) {
        const shape = this.state.shapes[i];
        // Rotate around center
        const angle = Math.atan2(shape.y(), shape.x());
        const distance = Math.sqrt(shape.x() * shape.x() + shape.y() * shape.y());
        const newAngle = angle + deltaTime * speed;
        
        shape.x(Math.cos(newAngle) * distance);
        shape.y(Math.sin(newAngle) * distance);
        
        // Also rotate the shape itself
        shape.rotation(shape.rotation() + deltaTime * 90 * speed);
      }
    }
    
    // Animate tooltip for mouse position
    if (this.tooltip && this.tooltip.visible()) {
      // Fade out the tooltip gradually
      const newOpacity = Math.max(0, this.tooltip.opacity() - deltaTime * 0.5);
      this.tooltip.opacity(newOpacity);
      
      if (newOpacity === 0) {
        this.tooltip.hide();
      }
    }
    
    // Animate text
    if (this.textNode) {
      const textBounce = Math.abs(Math.sin(Date.now() * 0.0005 * speed));
      this.textNode.y(150 + textBounce * 20);
    }
    
    // We need to keep this batch draw call for animation frames
    // since we're making continuous updates that need to be rendered
    // immediately and the AnimationManager handles this special case
    if (this.renderEnv && this.renderEnv.layer) {
      this.renderEnv.layer.batchDraw();
    }
    
    return true; // Continue animation
  }
  
  // ========== PARAMETER CHANGE HANDLING TESTS ==========
  
  onParameterChanged(parameterId, value, group) {
    // Log parameter changes
    this.logEvent(`Parameter changed: ${parameterId} = ${value} (${group})`);
    
    // Handle specific parameter changes
    switch (parameterId) {
      case 'shapeType':
      case 'mainSize':
      case 'mainColor':
      case 'shapeCount':
        // Recreate all shapes
        this.createShapes();
        break;
        
      case 'animate':
        // Toggle animation
        if (value) {
          this.startAnimation();
        } else {
          this.stopAnimation();
        }
        break;
        
      case 'customText':
        // Update text
        if (this.textNode) {
          this.textNode.text(value);
          this.textNode.offsetX(this.textNode.width() / 2);
        }
        break;
        
      case 'textColor':
        // Update text color
        if (this.textNode) {
          this.textNode.fill(value);
        }
        break;
        
      case 'textSize':
        // Update text size
        if (this.textNode) {
          this.textNode.fontSize(value);
          this.textNode.offsetX(this.textNode.width() / 2);
        }
        break;
    }
    
    // No explicit batchDraw needed - framework handles it after onParameterChanged
  }
  
  // ========== INTERACTION HANDLING TESTS ==========
  
  handleInteraction(type, data) {
    // Log interaction events
    this.logEvent(`Framework interaction: ${type}`);
    
    // Handle various interaction types
    switch (type) {
      case 'wheel':
        // Adjust main size with mouse wheel if directly on main shape
        if (data.target === this.state.shapes[0]) {
          const delta = data.deltaY;
          const size = this.getParameter('mainSize');
          const newSize = Math.max(20, Math.min(300, size - delta * 0.2));
          this.setParameter('mainSize', newSize);
        }
        break;
        
      case 'click':
        // Change shape type on background click
        if (!data.target || data.target === this.renderEnv.stage) {
          const currentType = this.getParameter('shapeType');
          const types = ['circle', 'square', 'triangle', 'star'];
          const nextIndex = (types.indexOf(currentType) + 1) % types.length;
          this.setParameter('shapeType', types[nextIndex]);
        }
        break;
        
      case 'dblclick':
        // Reset view on double click
        this.resetView();
        break;
    }
    
    // No explicit batchDraw needed - framework handles it after handleInteraction
  }
  
  // ========== ACTION IMPLEMENTATION TESTS ==========
  
  resetView() {
    // Reset parameters to defaults
    this.setParameter('mainSize', 100);
    this.setParameter('mainColor', '#3498db');
    this.setParameter('shapeType', 'circle');
    this.setParameter('shapeCount', 5);
    this.setParameter('customText', 'Framework Test');
    this.setParameter('textColor', '#333333');
    this.setParameter('textSize', 18);
    
    // Return to center if dragged
    if (this.mainGroup && this.renderEnv && this.renderEnv.stage) {
      this.mainGroup.position({
        x: this.renderEnv.stage.width() / 2,
        y: this.renderEnv.stage.height() / 2
      });
    }
    
    this.logEvent('View reset to defaults');
    // No explicit draw needed - framework will handle it via action execution
  }
  
  randomizeColors() {
    // Set random colors for all parameters that take colors
    this.setParameter('mainColor', this.getRandomColor());
    this.setParameter('textColor', this.getRandomColor());
    
    // Also randomize satellite shape colors
    if (this.state.shapes && this.state.shapes.length > 1) {
      for (let i = 1; i < this.state.shapes.length; i++) {
        this.state.shapes[i].fill(this.getRandomColor());
      }
    }
    
    this.logEvent('Colors randomized');
    // No explicit draw needed - framework will handle it via action execution
  }
  
  // ========== CLEANUP TESTS ==========
  
  async unload() {
    // Stop animation first
    this.stopAnimation();
    
    // Let base class handle animation and event cleanup
    await super.unload();
    
    // Clean up Konva objects
    if (this.mainGroup) {
      this.mainGroup.destroy();
      this.mainGroup = null;
    }
    
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
    
    // Clear references
    this.shapesGroup = null;
    this.textNode = null;
    this.eventDisplay = null;
    this.state.shapes = [];
    
    console.log("Framework Test Plugin unloaded");
  }
}