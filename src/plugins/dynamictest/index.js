// src/plugins/dynamic-parameters-plugin/index.js
import { Plugin } from '../../core/Plugin.js';

export default class DynamicParametersPlugin extends Plugin {
  // Required static properties
  static id = 'dynamic-parameters-plugin';
  static name = 'Dynamic Parameters Plugin';
  static description = 'A plugin that changes parameters based on selected object type';
  static renderingType = '2d'; // Using Konva for 2D
  
  constructor(core) {
    super(core);
    
    // Initialize state
    this.state = {
      currentType: null, // Will store the active visualization type
      objects: {}, // Will hold the Konva objects for each type
      parameters: {}, // Will track parameter definitions for each type
    };
  }
  
  async start() {
    console.log("Starting Dynamic Parameters Plugin");
    
    // Add the primary selection parameter that will always be present
    this.addDropdown('visualizationType', 'Visualization Type', 'polygons', 
      ['polygons', 'dots', 'waves'], 'structural');
    
    // Initialize parameters and objects for the default visualization type
    this.switchVisualizationType(this.getParameter('visualizationType'));
  }
  
  /**
   * Switch between visualization types
   * @param {string} type - The visualization type to switch to
   */
  switchVisualizationType(type) {
    console.log(`Switching to visualization type: ${type}`);
    
    if (this.state.currentType === type) {
      console.log("Already displaying this type, no change needed");
      return;
    }
    
    // Clean up existing objects
    this.cleanupCurrentObjects();
    
    // Store the current selection before clearing parameters
    const visualizationType = type;
    
    // Clear all parameters from the core
    if (this.core && typeof this.core.clearParameters === 'function') {
      // If a dedicated clearParameters method exists, use it
      this.core.clearParameters();
    } else {
      // Otherwise use the emptyParameters method
      this.emptyParameters('visual');
      this.emptyParameters('structural');
      this.emptyParameters('advanced');
    }
    
    // Save the new current type
    this.state.currentType = visualizationType;
    
    // Re-add the visualization type parameter (it was cleared in the previous step)
    this.addDropdown('visualizationType', 'Visualization Type', visualizationType, 
      ['polygons', 'dots', 'waves'], 'structural');
    
    // Add parameters for the new type
    this.setupParametersForType(visualizationType);
    
    // Create objects for the new type
    this.setupObjectsForType(visualizationType);
  }
  
  /**
   * Clean up the currently displayed objects
   */
  cleanupCurrentObjects() {
    if (!this.renderEnv || !this.renderEnv.layer) return;
    
    // If we have a current type and objects associated with it, clean them up
    if (this.state.currentType && this.state.objects[this.state.currentType]) {
      const currentObjects = this.state.objects[this.state.currentType];
      
      // Remove all Konva objects for the current type
      if (currentObjects.group) {
        console.log(`Destroying group for ${this.state.currentType}`);
        currentObjects.group.destroy();
      }
      
      // Clear references to objects
      this.state.objects[this.state.currentType] = {};
    } else {
      // If there's no current type, clean up all objects from all types
      Object.keys(this.state.objects).forEach(type => {
        const typeObjects = this.state.objects[type];
        if (typeObjects.group) {
          console.log(`Destroying group for ${type}`);
          typeObjects.group.destroy();
        }
      });
      
      // Reset objects state
      this.state.objects = {};
    }
    
    // Force layer redraw to ensure objects are removed
    if (this.renderEnv.layer) {
      this.renderEnv.layer.batchDraw();
    }
  }
  
  /**
   * Set up parameters specific to the visualization type
   * @param {string} type - The visualization type
   */
  setupParametersForType(type) {
    switch (type) {
      case 'polygons':
        this.setupPolygonParameters();
        break;
        
      case 'dots':
        this.setupDotParameters();
        break;
        
      case 'waves':
        this.setupWaveParameters();
        break;
        
      default:
        console.warn(`Unknown visualization type: ${type}`);
    }
  }
  
  /**
   * Setup polygon-specific parameters
   */
  setupPolygonParameters() {
    // Structural parameters - affect the number and fundamental arrangement
    this.addSlider('polygonCount', 'Number of Polygons', 5, { min: 1, max: 10, step: 1 }, 'structural');
    this.addSlider('polygonSides', 'Sides per Polygon', 6, { min: 3, max: 12, step: 1 }, 'structural');
    this.addSlider('polygonSize', 'Polygon Size', 80, { min: 20, max: 150, step: 5 }, 'structural');
    
    // Visual parameters - affect appearance only
    this.addSlider('polygonRotation', 'Rotation (degrees)', 0, { min: 0, max: 360, step: 15 });
    this.addColor('polygonFillColor', 'Fill Color', '#3498db');
    this.addColor('polygonStrokeColor', 'Stroke Color', '#2c3e50');
    this.addSlider('polygonStrokeWidth', 'Stroke Width', 2, { min: 0, max: 10, step: 1 });
    this.addCheckbox('polygonAnimate', 'Animate Rotation', true);
    
    // Track parameters for reference (not necessary for functionality but helpful for tracking)
    this.state.parameters.polygons = {
      count: 'polygonCount',
      sides: 'polygonSides',
      size: 'polygonSize',
      rotation: 'polygonRotation',
      fillColor: 'polygonFillColor',
      strokeColor: 'polygonStrokeColor',
      strokeWidth: 'polygonStrokeWidth',
      animate: 'polygonAnimate'
    };
  }
  
  /**
   * Setup dot-specific parameters
   */
  setupDotParameters() {
    // Structural parameters - affect the number and fundamental arrangement
    this.addSlider('dotCount', 'Number of Dots', 50, { min: 10, max: 200, step: 10 }, 'structural');
    this.addDropdown('dotPattern', 'Distribution Pattern', 'circle', 
      ['circle', 'grid', 'random', 'spiral'], 'structural');
    this.addSlider('dotSpread', 'Spread', 0.8, { min: 0.1, max: 1.0, step: 0.1 }, 'structural');
    
    // Visual parameters - affect appearance only
    this.addSlider('dotSize', 'Dot Size', 10, { min: 2, max: 30, step: 1 });
    this.addColor('dotFillColor', 'Dot Color', '#e74c3c');
    this.addCheckbox('dotAnimate', 'Animate Dots', true);
    this.addSlider('dotAnimationSpeed', 'Animation Speed', 1, 
      { min: 0.1, max: 3.0, step: 0.1 });
    
    // Track parameters for reference
    this.state.parameters.dots = {
      count: 'dotCount',
      pattern: 'dotPattern',
      spread: 'dotSpread',
      size: 'dotSize',
      fillColor: 'dotFillColor',
      animate: 'dotAnimate',
      animationSpeed: 'dotAnimationSpeed'
    };
  }
  
  /**
   * Setup wave-specific parameters
   */
  setupWaveParameters() {
    // Structural parameters - affect the fundamental shape
    this.addDropdown('waveType', 'Wave Type', 'sine', 
      ['sine', 'cosine', 'square', 'sawtooth'], 'structural');
    this.addSlider('waveAmplitude', 'Amplitude', 100, { min: 10, max: 200, step: 10 }, 'structural');
    this.addSlider('waveFrequency', 'Frequency', 0.02, { min: 0.005, max: 0.05, step: 0.005 }, 'structural');
    
    // Visual parameters - affect appearance
    this.addSlider('wavePhase', 'Phase Offset', 0, { min: 0, max: 6.28, step: 0.1 });
    this.addColor('waveLineColor', 'Line Color', '#9b59b6');
    this.addSlider('waveLineWidth', 'Line Width', 3, { min: 1, max: 10, step: 1 });
    this.addCheckbox('waveAnimate', 'Animate Wave', true);
    this.addSlider('waveAnimationSpeed', 'Animation Speed', 1, 
      { min: 0.1, max: 3.0, step: 0.1 });
    
    // Track parameters for reference
    this.state.parameters.waves = {
      type: 'waveType',
      amplitude: 'waveAmplitude',
      frequency: 'waveFrequency',
      phase: 'wavePhase',
      lineColor: 'waveLineColor',
      lineWidth: 'waveLineWidth',
      animate: 'waveAnimate',
      animationSpeed: 'waveAnimationSpeed'
    };
  }
  
  /**
   * Set up Konva objects specific to the visualization type
   * @param {string} type - The visualization type
   */
  setupObjectsForType(type) {
    if (!this.renderEnv || !this.renderEnv.layer) return;
    
    // Create a container for this visualization type if needed
    this.state.objects[type] = this.state.objects[type] || {};
    
    // Create a group to hold all objects for this visualization type
    const { layer, konva } = this.renderEnv;
    const group = new konva.Group({
      x: this.renderEnv.stage.width() / 2,
      y: this.renderEnv.stage.height() / 2
    });
    
    // Store group reference
    this.state.objects[type].group = group;
    
    // Create objects based on type
    switch (type) {
      case 'polygons':
        this.createPolygons(group);
        break;
        
      case 'dots':
        this.createDots(group);
        break;
        
      case 'waves':
        this.createWaves(group);
        break;
    }
    
    // Add group to layer
    layer.add(group);
    
    // Start animation if enabled
    this.startAnimationIfEnabled(type);
  }
  
  /**
   * Create polygon visualization
   * @param {Konva.Group} group - The group to add polygons to
   */
  createPolygons(group) {
    const { konva } = this.renderEnv;
    
    // Get parameters
    const count = this.getParameter('polygonCount');
    const sides = this.getParameter('polygonSides');
    const size = this.getParameter('polygonSize');
    const rotation = this.getParameter('polygonRotation');
    const fillColor = this.getParameter('polygonFillColor');
    const strokeColor = this.getParameter('polygonStrokeColor');
    const strokeWidth = this.getParameter('polygonStrokeWidth');
    
    // Create container for polygons
    const polygons = [];
    
    // Create polygons
    for (let i = 0; i < count; i++) {
      // Calculate position in a circle
      const angle = (i / count) * Math.PI * 2;
      const radius = 150; // Distance from center
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // Create polygon
      const polygon = new konva.RegularPolygon({
        x: x,
        y: y,
        sides: sides,
        radius: size / 2,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        rotation: rotation,
        opacity: 0.8
      });
      
      // Add to group and tracking array
      group.add(polygon);
      polygons.push(polygon);
    }
    
    // Store reference to polygons
    this.state.objects.polygons.items = polygons;
  }
  
  /**
   * Create dots visualization
   * @param {Konva.Group} group - The group to add dots to
   */
  createDots(group) {
    const { konva } = this.renderEnv;
    
    // Get parameters
    const count = this.getParameter('dotCount');
    const size = this.getParameter('dotSize');
    const spread = this.getParameter('dotSpread');
    const pattern = this.getParameter('dotPattern');
    const fillColor = this.getParameter('dotFillColor');
    
    // Create container for dots
    const dots = [];
    
    // Create dots based on pattern
    for (let i = 0; i < count; i++) {
      let x, y;
      
      switch (pattern) {
        case 'circle':
          // Distribute in a circle
          const angle = (i / count) * Math.PI * 2;
          const radius = 200 * spread;
          x = Math.cos(angle) * radius;
          y = Math.sin(angle) * radius;
          break;
          
        case 'grid':
          // Distribute in a grid
          const cols = Math.ceil(Math.sqrt(count));
          const spacing = 400 * spread / cols;
          x = (i % cols) * spacing - (spacing * (cols - 1)) / 2;
          y = Math.floor(i / cols) * spacing - (spacing * (Math.ceil(count / cols) - 1)) / 2;
          break;
          
        case 'random':
          // Distribute randomly
          x = (Math.random() * 2 - 1) * 200 * spread;
          y = (Math.random() * 2 - 1) * 200 * spread;
          break;
          
        case 'spiral':
          // Distribute in a spiral
          const spiralAngle = i * 0.5;
          const spiralRadius = i * 5 * spread;
          x = Math.cos(spiralAngle) * spiralRadius;
          y = Math.sin(spiralAngle) * spiralRadius;
          break;
          
        default:
          // Default to random
          x = (Math.random() * 2 - 1) * 200 * spread;
          y = (Math.random() * 2 - 1) * 200 * spread;
      }
      
      // Create dot
      const dot = new konva.Circle({
        x: x,
        y: y,
        radius: size / 2,
        fill: fillColor,
        opacity: 0.7
      });
      
      // Add to group and tracking array
      group.add(dot);
      dots.push(dot);
    }
    
    // Store reference to dots
    this.state.objects.dots.items = dots;
    
    // Add animation properties
    this.state.objects.dots.animProps = {
      time: 0,
      originalPositions: dots.map(dot => ({
        x: dot.x(),
        y: dot.y()
      }))
    };
  }
  
  /**
   * Create wave visualization
   * @param {Konva.Group} group - The group to add wave to
   */
  createWaves(group) {
    const { konva } = this.renderEnv;
    
    // Get parameters
    const lineColor = this.getParameter('waveLineColor');
    const lineWidth = this.getParameter('waveLineWidth');
    
    // Create wave line
    const waveLine = new konva.Line({
      points: [],
      stroke: lineColor,
      strokeWidth: lineWidth,
      lineCap: 'round',
      lineJoin: 'round'
    });
    
    // Add to group
    group.add(waveLine);
    
    // Store reference to wave
    this.state.objects.waves.line = waveLine;
    
    // Add animation properties
    this.state.objects.waves.animProps = {
      phase: 0
    };
    
    // Generate initial wave points
    this.updateWavePoints();
  }
  
  /**
   * Update wave points based on parameters
   */
  updateWavePoints() {
    if (!this.state.objects.waves || !this.state.objects.waves.line) return;
    
    const waveLine = this.state.objects.waves.line;
    const waveType = this.getParameter('waveType');
    const amplitude = this.getParameter('waveAmplitude');
    const frequency = this.getParameter('waveFrequency');
    const phase = this.getParameter('wavePhase');
    const stageWidth = this.renderEnv.stage.width();
    
    // Calculate wave points
    const points = [];
    const centerY = 0; // Group is already centered
    
    // Generate wave points
    for (let x = -stageWidth / 2; x < stageWidth / 2; x += 2) {
      let y;
      
      // Phase including animation offset
      const totalPhase = phase + (this.state.objects.waves.animProps?.phase || 0);
      
      // Calculate y based on wave type
      switch (waveType) {
        case 'sine':
          y = Math.sin(x * frequency + totalPhase) * amplitude;
          break;
          
        case 'cosine':
          y = Math.cos(x * frequency + totalPhase) * amplitude;
          break;
          
        case 'square':
          y = Math.sin(x * frequency + totalPhase) >= 0 ? amplitude : -amplitude;
          break;
          
        case 'sawtooth':
          y = ((((x * frequency + totalPhase) / (2 * Math.PI)) % 1) * 2 - 1) * amplitude;
          break;
          
        default:
          y = Math.sin(x * frequency + totalPhase) * amplitude;
      }
      
      points.push(x, centerY + y);
    }
    
    // Update line points
    waveLine.points(points);
  }
  
  /**
   * Start animation if enabled for the current visualization type
   * @param {string} type - The visualization type
   */
  startAnimationIfEnabled(type) {
    // Check if animation is enabled for this type
    const animateParamId = `${type}Animate`;
    const animate = this.getParameter(animateParamId);
    
    if (animate) {
      // Cancel any existing animation
      if (this.animationHandler) {
        this.cancelAnimation(this.animationHandler);
      }
      
      // Start new animation
      this.animationHandler = this.requestAnimation(this.animate.bind(this));
    }
  }
  
  /**
   * Animation frame handler
   * @param {number} deltaTime - Time since last frame in seconds
   * @returns {boolean} Whether to continue animation
   */
  animate(deltaTime) {
    // Only animate if we have a current type
    if (!this.state.currentType) return true;
    
    const type = this.state.currentType;
    const animateParamId = `${type}Animate`;
    const animate = this.getParameter(animateParamId);
    
    // If animation is disabled, do nothing but keep loop running
    if (!animate) return true;
    
    // Get animation speed (if available)
    let speed = 1;
    const speedParamId = `${type}AnimationSpeed`;
    if (this.parameterExists(speedParamId)) {
      speed = this.getParameter(speedParamId);
    }
    
    // Adjust delta time by speed
    const adjustedDelta = deltaTime * speed;
    
    // Animate based on visualization type
    switch (type) {
      case 'polygons':
        this.animatePolygons(adjustedDelta);
        break;
        
      case 'dots':
        this.animateDots(adjustedDelta);
        break;
        
      case 'waves':
        this.animateWaves(adjustedDelta);
        break;
    }
    
    return true; // Continue animation
  }
  
  /**
   * Check if a parameter exists
   * @param {string} paramId - Parameter ID to check
   * @returns {boolean} Whether the parameter exists
   */
  parameterExists(paramId) {
    return this.getParameter(paramId) !== undefined;
  }
  
  /**
   * Animate polygons
   * @param {number} deltaTime - Adjusted delta time
   */
  animatePolygons(deltaTime) {
    const polygons = this.state.objects.polygons?.items;
    if (!polygons) return;
    
    // Get rotation increment
    const rotationSpeed = 30; // degrees per second
    const rotationIncrement = rotationSpeed * deltaTime;
    
    // Rotate each polygon
    polygons.forEach((polygon, index) => {
      // Rotate in alternating directions based on index
      const direction = index % 2 === 0 ? 1 : -1;
      const currentRotation = polygon.rotation();
      polygon.rotation(currentRotation + rotationIncrement * direction);
    });
  }
  
  /**
   * Animate dots
   * @param {number} deltaTime - Adjusted delta time
   */
  animateDots(deltaTime) {
    const dots = this.state.objects.dots?.items;
    const animProps = this.state.objects.dots?.animProps;
    
    if (!dots || !animProps) return;
    
    // Update animation time
    animProps.time += deltaTime;
    
    // Animate each dot
    dots.forEach((dot, index) => {
      const originalPos = animProps.originalPositions[index];
      
      // Calculate animation offset
      const timeOffset = index * 0.1;
      const xOffset = Math.sin(animProps.time + timeOffset) * 10;
      const yOffset = Math.cos(animProps.time * 1.3 + timeOffset) * 10;
      
      // Update position
      dot.x(originalPos.x + xOffset);
      dot.y(originalPos.y + yOffset);
    });
  }
  
  /**
   * Animate waves
   * @param {number} deltaTime - Adjusted delta time
   */
  animateWaves(deltaTime) {
    const animProps = this.state.objects.waves?.animProps;
    if (!animProps) return;
    
    // Update phase
    animProps.phase += deltaTime;
    
    // Update wave points
    this.updateWavePoints();
  }
  
  /**
   * Handle parameter changes
   * @param {string} parameterId - ID of changed parameter
   * @param {any} value - New parameter value
   * @param {string} group - Parameter group
   */
  onParameterChanged(parameterId, value, group) {
    console.log(`Parameter changed: ${parameterId} = ${value} (${group})`);
    
    // Special handling for visualization type changes
    if (parameterId === 'visualizationType') {
      this.switchVisualizationType(value);
      return;
    }
    
    // Handle type-specific parameter changes
    if (this.state.currentType === 'polygons') {
      this.handlePolygonParameterChange(parameterId, value);
    } else if (this.state.currentType === 'dots') {
      this.handleDotParameterChange(parameterId, value);
    } else if (this.state.currentType === 'waves') {
      this.handleWaveParameterChange(parameterId, value);
    }
  }
  
  /**
   * Handle polygon-specific parameter changes
   * @param {string} parameterId - ID of changed parameter
   * @param {any} value - New parameter value
   */
  handlePolygonParameterChange(parameterId, value) {
    const polygons = this.state.objects.polygons?.items;
    if (!polygons) return;
    
    // Handle each parameter type
    switch (parameterId) {
      case 'polygonCount':
        // Need to recreate all polygons when count changes
        this.cleanupCurrentObjects();
        this.setupObjectsForType('polygons');
        break;
        
      case 'polygonSides':
        // Update sides for all polygons
        polygons.forEach(polygon => {
          polygon.sides(value);
        });
        break;
        
      case 'polygonSize':
        // Update size for all polygons
        polygons.forEach(polygon => {
          polygon.radius(value / 2);
        });
        break;
        
      case 'polygonRotation':
        // Set rotation for all polygons
        polygons.forEach(polygon => {
          polygon.rotation(value);
        });
        break;
        
      case 'polygonFillColor':
        // Update fill color for all polygons
        polygons.forEach(polygon => {
          polygon.fill(value);
        });
        break;
        
      case 'polygonStrokeColor':
        // Update stroke color for all polygons
        polygons.forEach(polygon => {
          polygon.stroke(value);
        });
        break;
        
      case 'polygonStrokeWidth':
        // Update stroke width for all polygons
        polygons.forEach(polygon => {
          polygon.strokeWidth(value);
        });
        break;
        
      case 'polygonAnimate':
        // Toggle animation
        this.startAnimationIfEnabled('polygons');
        break;
    }
  }
  
  /**
   * Handle dot-specific parameter changes
   * @param {string} parameterId - ID of changed parameter
   * @param {any} value - New parameter value
   */
  handleDotParameterChange(parameterId, value) {
    const dots = this.state.objects.dots?.items;
    if (!dots) return;
    
    // Handle each parameter type
    switch (parameterId) {
      case 'dotCount':
      case 'dotPattern':
      case 'dotSpread':
        // These require recreating the dots
        this.cleanupCurrentObjects();
        this.setupObjectsForType('dots');
        break;
        
      case 'dotSize':
        // Update size for all dots
        dots.forEach(dot => {
          dot.radius(value / 2);
        });
        break;
        
      case 'dotFillColor':
        // Update fill color for all dots
        dots.forEach(dot => {
          dot.fill(value);
        });
        break;
        
      case 'dotAnimate':
        // Toggle animation
        this.startAnimationIfEnabled('dots');
        break;
        
      // Animation speed is handled in the animate method
    }
  }
  
  /**
   * Handle wave-specific parameter changes
   * @param {string} parameterId - ID of changed parameter
   * @param {any} value - New parameter value
   */
  handleWaveParameterChange(parameterId, value) {
    const waveLine = this.state.objects.waves?.line;
    if (!waveLine) return;
    
    // Handle each parameter type
    switch (parameterId) {
      case 'waveType':
      case 'waveAmplitude':
      case 'waveFrequency':
      case 'wavePhase':
        // These affect the wave shape
        this.updateWavePoints();
        break;
        
      case 'waveLineColor':
        // Update line color
        waveLine.stroke(value);
        break;
        
      case 'waveLineWidth':
        // Update line width
        waveLine.strokeWidth(value);
        break;
        
      case 'waveAnimate':
        // Toggle animation
        this.startAnimationIfEnabled('waves');
        break;
        
      // Animation speed is handled in the animate method
    }
  }
  
  /**
   * Clean up resources when unloaded
   */
  async unload() {
    console.log("Unloading Dynamic Parameters Plugin");
    
    // Cancel animation
    if (this.animationHandler) {
      this.cancelAnimation(this.animationHandler);
      this.animationHandler = null;
    }
    
    // Let base class handle standard cleanup
    await super.unload();
    
    // Clean up all visualization objects
    Object.keys(this.state.objects).forEach(type => {
      const objects = this.state.objects[type];
      if (objects.group) {
        objects.group.destroy();
      }
    });
    
    // Reset state
    this.state = {
      currentType: null,
      objects: {},
      parameters: {}
    };
    
    console.log("Dynamic Parameters Plugin unloaded successfully");
  }
}