// src/plugins/circle-plugin/CircleVisualization.js
import { Visualization } from '../../core/Visualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * A simple circle visualization
 */
export class CircleVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Initialize state
    this.state = {
      radius: 100,
      fillColor: '#3498db',
      hasStroke: true,
      strokeColor: '#000000'
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
      .addCheckbox('hasStroke', 'Show Outline', true)
      .addColor('strokeColor', 'Outline Color', '#000000')
      .build();
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Visualization parameters
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(parameters) {
    try {
      // Update state with initial parameters
      this.updateState(parameters);
      return true;
    } catch (error) {
      console.error("Error initializing CircleVisualization:", error);
      return false;
    }
  }

  /**
   * Update the visualization
   * @param {Object} parameters - Changed parameters only
   */
  update(parameters) {
    // Update state with changed parameters
    this.updateState(parameters);
  }

  /**
   * Update internal state from parameters
   * @param {Object} parameters - Parameter values
   * @private
   */
  updateState(parameters) {
    if (!parameters) return;
    
    // Only update defined parameters
    if (parameters.radius !== undefined) this.state.radius = parameters.radius;
    if (parameters.fillColor !== undefined) this.state.fillColor = parameters.fillColor;
    if (parameters.hasStroke !== undefined) this.state.hasStroke = parameters.hasStroke;
    if (parameters.strokeColor !== undefined) this.state.strokeColor = parameters.strokeColor;
    
    // Handle global scale from plugin parameters
    if (parameters.globalScale !== undefined) {
      // Apply global scale to radius
      this.state.scaledRadius = this.state.radius * parameters.globalScale;
    } else if (this.state.scaledRadius === undefined) {
      // Initialize scaled radius if not set
      this.state.scaledRadius = this.state.radius * (parameters.globalScale || 1.0);
    }
  }

  /**
   * Render the visualization in 2D
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} parameters - Current parameters
   */
  render2D(ctx, parameters) {
    if (!ctx) return;
    
    // Apply global state
    const showBoundingBox = parameters.showBoundingBox || false;
    const globalScale = parameters.globalScale || 1.0;
    const showLabels = parameters.showLabels || false;
    
    // Calculate scaled radius
    const radius = this.state.radius * globalScale;
    this.state.scaledRadius = radius;
    
    // Save context state
    ctx.save();
    
    // Draw bounding box if enabled
    if (showBoundingBox) {
      ctx.strokeStyle = '#999999';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.strokeRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
      ctx.setLineDash([]);
    }
    
    // Draw a circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = this.state.fillColor;
    ctx.fill();
    
    if (this.state.hasStroke) {
      ctx.strokeStyle = this.state.strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Show radius label if enabled
    if (showLabels) {
      ctx.fillStyle = '#000000';
      // Use text color from theme if available
      const computedStyle = getComputedStyle(document.documentElement);
      const textColor = computedStyle.getPropertyValue('--text-color')?.trim() || '#000000';
      ctx.fillStyle = textColor;
      
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw radius line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius, 0);
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw radius label
      ctx.fillText(`r = ${this.state.radius}`, radius / 2, 15);
      
      // Show actual radius with scale
      if (globalScale !== 1.0) {
        ctx.fillText(`(scaled: ${radius.toFixed(1)})`, radius / 2, 35);
      }
    }
    
    // Draw debug info if in debug mode
    if (parameters.debugMode) {
      this.drawDebugInfo(ctx, parameters);
    }
    
    ctx.restore();
  }

  /**
   * Draw debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Current parameters
   */
  drawDebugInfo(ctx, parameters) {
    ctx.save();
    
    // Reset transform to work in screen space for text
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw a semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 80);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Radius: ${this.state.radius}`, 20, 30);
    ctx.fillText(`Scaled: ${this.state.scaledRadius.toFixed(1)}`, 20, 45);
    ctx.fillText(`Global Scale: ${parameters.globalScale || 1.0}`, 20, 60);
    ctx.fillText(`Stroke: ${this.state.hasStroke ? 'On' : 'Off'}`, 20, 75);
    
    ctx.restore();
  }

  /**
   * Handle user interaction
   * @param {string} type - Interaction type
   * @param {Object} event - Event data
   * @returns {boolean} Whether the interaction was handled
   */
  handleInteraction(type, event) {
    if (type === 'click') {
      // Calculate distance from center
      const distance = Math.sqrt(event.x * event.x + event.y * event.y);
      
      // Get current scaled radius
      const globalScale = this.plugin.pluginParameters.globalScale || 1.0;
      const scaledRadius = this.state.radius * globalScale;
      
      // Check if click is within or near the circle border (within 10px)
      if (Math.abs(distance - scaledRadius) < 10) {
        // Toggle stroke
        const newStrokeState = !this.state.hasStroke;
        
        // Update parameter in plugin
        this.plugin.updateParameter('hasStroke', newStrokeState, 'visualization');
        
        return true;
      }
      
      // Check if click is inside the circle
      if (distance < scaledRadius) {
        // Generate a random color
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        // Update parameter in plugin
        this.plugin.updateParameter('fillColor', randomColor, 'visualization');
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Nothing specific to clean up for this simple visualization
    this.isAnimating = false;
  }
}