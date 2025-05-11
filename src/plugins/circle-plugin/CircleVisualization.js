// src/plugins/circle-plugin/CircleVisualization.js
import { Visualization } from '../../core/Visualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

export class CircleVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Initialize state
    this.state = {
      lastRadius: 0,
      lastColor: '',
      hasStroke: false,
      strokeColor: ''
    };
    
    // Set animation flag to false as this visualization is static
    this.isAnimating = false;
  }

  /**
   * Define the parameters specific to this visualization
   * @returns {Array} Parameter definitions
   * @static
   */
  static getParameters() {
    return createParameters()
      .addSlider('radius', 'Radius', 100, { min: 10, max: 200, step: 5 })
      .addColor('fillColor', 'Fill Color', '#3498db')
      .addCheckbox('stroke', 'Show Outline', true)
      .addColor('strokeColor', 'Outline Color', '#000000')
      .build();
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Visualization parameters
   */
  async initialize(parameters) {
    // Store initial state
    this.state.lastRadius = parameters.radius || 100;
    this.state.lastColor = parameters.fillColor || '#3498db';
    this.state.hasStroke = parameters.stroke !== undefined ? parameters.stroke : true;
    this.state.strokeColor = parameters.strokeColor || '#000000';
    
    return true;
  }

  /**
   * Update the visualization
   * @param {Object} parameters - Changed parameters only
   */
  update(parameters) {
    // Update state for each changed parameter
    if (parameters.radius !== undefined) {
      this.state.lastRadius = parameters.radius;
    }
    
    if (parameters.fillColor !== undefined) {
      this.state.lastColor = parameters.fillColor;
    }
    
    if (parameters.stroke !== undefined) {
      this.state.hasStroke = parameters.stroke;
    }
    
    if (parameters.strokeColor !== undefined) {
      this.state.strokeColor = parameters.strokeColor;
    }
    
    // Update showLabels parameter if it exists
    if (parameters.showLabels !== undefined) {
      // No specific state to update here, as showLabels is used directly from parameters in render2D
    }
  }

  /**
   * Render the visualization in 2D
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} parameters - Current parameters
   */
  render2D(ctx, parameters) {
    // Use current parameters if provided, otherwise use state values
    const radius = parameters.radius !== undefined ? parameters.radius : this.state.lastRadius;
    const fillColor = parameters.fillColor || this.state.lastColor;
    const hasStroke = parameters.stroke !== undefined ? parameters.stroke : this.state.hasStroke;
    const strokeColor = parameters.strokeColor || this.state.strokeColor;
    const showLabels = parameters.showLabels || false;
    
    // Draw a circle
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (hasStroke) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Show radius label if enabled
    if (showLabels) {
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`r = ${radius}`, 0, radius + 20);
      ctx.restore();
    }
  }

  /**
   * Handle user interaction
   * @param {string} type - Interaction type
   * @param {Object} event - Event data
   */
  handleInteraction(type, event) {
    if (type === 'click') {
      // Calculate distance from center
      const distance = Math.sqrt(event.x * event.x + event.y * event.y);
      
      // Get current radius from plugin
      const currentRadius = this.plugin.visualizationParameters.radius || 100;
      
      // Check if click is within or near the circle
      if (Math.abs(distance - currentRadius) < 15) {
        // Toggle stroke
        const newStrokeState = !this.plugin.visualizationParameters.stroke;
        
        // Update plugin parameter
        this.plugin.onParameterChanged('stroke', newStrokeState, 'visualization');
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Nothing to clean up for this simple visualization
  }
}