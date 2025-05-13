// src/plugins/circle-plugin/CircleVisualization.js
import { Visualization } from '../../core/Visualization.js';

/**
 * A simple circle visualization
 * Implementing the Math Visualization Framework philosophy
 */
export class CircleVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Internal state for animation and rendering
    this.state = {
      radius: 100,             // Base radius value
      scaledRadius: 100,       // Radius after applying global scale
      fillColor: '#3498db',    // Fill color
      hasStroke: true,         // Whether to show outline
      strokeColor: '#000000',  // Outline color
      phase: 0                 // Animation phase (not used in this implementation)
    };
    
    // Flag to control animation - false since this is a static visualization
    this.isAnimating = true;
  }

  /**
   * Define the parameters specific to this visualization
   * @returns {Array} Parameter definitions
   * @static
   */
  static getParameters() {
    return [
      {
        id: 'radius',
        type: 'slider',
        label: 'Radius',
        default: 100,
        min: 10,
        max: 200,
        step: 5
      },
      {
        id: 'fillColor',
        type: 'color',
        label: 'Fill Color',
        default: '#3498db'
      },
      {
        id: 'hasStroke',
        type: 'checkbox',
        label: 'Show Outline',
        default: true
      },
      {
        id: 'strokeColor',
        type: 'color',
        label: 'Outline Color',
        default: '#000000'
      }
    ];
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Combined parameters from all groups
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(parameters) {
    try {
      // Call parent initialization first
      await super.initialize(parameters);
      
      // Initialize state with provided parameters
      this.updateState(parameters);
      
      return true;
    } catch (error) {
      console.error("Error initializing CircleVisualization:", error);
      return false;
    }
  }

  /**
   * Update the visualization with changed parameters
   * @param {Object} parameters - Changed parameters only (partial object)
   */
  update(parameters) {
    if (!parameters) return;
    
    // Update state with changed parameters
    this.updateState(parameters);
    
    // No need to request render - this is handled by the framework
  }

  /**
   * Update internal state from parameters
   * @param {Object} parameters - Parameter values
   * @private
   */
  updateState(parameters) {
    // Only update defined parameters
    if (parameters.radius !== undefined) this.state.radius = parameters.radius;
    if (parameters.fillColor !== undefined) this.state.fillColor = parameters.fillColor;
    if (parameters.hasStroke !== undefined) this.state.hasStroke = parameters.hasStroke;
    if (parameters.strokeColor !== undefined) this.state.strokeColor = parameters.strokeColor;
    
    // Handle global scale from plugin parameters
    if (parameters.globalScale !== undefined) {
      this.state.scaledRadius = this.state.radius * parameters.globalScale;
    } else if (this.state.scaledRadius === undefined) {
      // Initialize scaled radius if not set
      const globalScale = this.getParameterValue('globalScale', 1.0);
      this.state.scaledRadius = this.state.radius * globalScale;
    }
  }

  /**
   * Render the visualization in 2D
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} parameters - Current parameters from all groups
   */
  render2D(ctx, parameters) {
    if (!ctx) return;
    
    // Get plugin-level parameters
    const showBoundingBox = parameters.showBoundingBox || false;
    const globalScale = parameters.globalScale || 1.0;
    const showLabels = parameters.showLabels || false;
    const debugMode = parameters.debugMode || false;
    
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
    if (debugMode) {
      this.drawDebugInfo(ctx, parameters);
    }
    
    ctx.restore();
  }

  /**
   * Draw debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Current parameters
   * @private
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
   * Handle user interaction events from the rendering environment
   * @param {string} type - Interaction type (e.g., "click", "mousemove")
   * @param {Object} event - Event data
   * @returns {boolean} Whether the interaction was handled
   */
  handleInteraction(type, event) {
    if (type === 'click') {
      // Calculate distance from center
      const distance = Math.sqrt(event.x * event.x + event.y * event.y);
      
      // Get current scaled radius
      const globalScale = this.getParameterValue('globalScale', 1.0);
      const scaledRadius = this.state.radius * globalScale;
      
      // Check if click is within or near the circle border (within 10px)
      if (Math.abs(distance - scaledRadius) < 10) {
        // Toggle stroke
        const newStrokeState = !this.state.hasStroke;
        
        // Use the plugin's updateParameter method to ensure UI is updated
        this.requestParameterUpdate('hasStroke', newStrokeState);
        
        return true;
      }
      
      // Check if click is inside the circle
      if (distance < scaledRadius) {
        // Generate a random color
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        // Update parameter through plugin
        this.requestParameterUpdate('fillColor', randomColor);
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Animation method - not used in this static visualization
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @returns {boolean} Whether animation should continue
   */
  animate(deltaTime) {
    // This visualization is static, so no animation is needed
    return this.isAnimating;
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Clean up resources - nothing to do for this simple visualization
    this.isAnimating = false;
  }
}