// src/plugins/example2d-plugin/BasicVisualization.js - Improved version

import { Visualization } from '../../core/Visualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Basic shape visualization with customizable properties
 */
export class BasicVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Flag for animation - used by RenderingManager
    this.isAnimating = false;
    
    // Initialize internal state
    this.state = {
      shape: 'circle',
      size: 100,
      fillColor: '#3498db',
      rotation: 0,
      numSides: 5,
      hasStroke: true,
      strokeColor: '#2c3e50',
      scaledSize: 100 // Will be updated with global scale
    };
  }

  /**
   * Define visualization-specific parameters
   * @returns {Array} Array of parameter definitions
   * @static
   */
  static getParameters() {
    return createParameters()
      .addDropdown('shape', 'Shape Type', 'circle', [
        { value: 'circle', label: 'Circle' },
        { value: 'square', label: 'Square' },
        { value: 'triangle', label: 'Triangle' },
        { value: 'polygon', label: 'Regular Polygon' }
      ])
      .addSlider('size', 'Size', 100, { min: 50, max: 200, step: 10 })
      .addColor('fillColor', 'Fill Color', '#3498db')
      .addCheckbox('hasStroke', 'Show Outline', true)
      .addColor('strokeColor', 'Outline Color', '#2c3e50')
      .addSlider('numSides', 'Polygon Sides', 5, { min: 3, max: 12, step: 1 })
      .build();
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(parameters) {
    try {
      // Store state values from parameters
      this.updateState(parameters);

      // Set animation flag based on shape (only polygons animate by default)
      this.isAnimating = this.state.shape === 'polygon';
      
      return true;
    } catch (error) {
      console.error("Error initializing BasicVisualization:", error);
      return false;
    }
  }

  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - Changed parameters only
   */
  update(parameters) {
    // Update state with changed parameters
    this.updateState(parameters);
    
    // Update animation state based on shape
    if (parameters.shape !== undefined) {
      this.isAnimating = parameters.shape === 'polygon';
    }
  }

  /**
   * Update internal state from parameters
   * @param {Object} parameters - Parameter values
   * @private
   */
  updateState(parameters) {
    if (!parameters) return;
    
    // Only update defined parameters
    if (parameters.shape !== undefined) this.state.shape = parameters.shape;
    if (parameters.size !== undefined) this.state.size = parameters.size;
    if (parameters.fillColor !== undefined) this.state.fillColor = parameters.fillColor;
    if (parameters.hasStroke !== undefined) this.state.hasStroke = parameters.hasStroke;
    if (parameters.strokeColor !== undefined) this.state.strokeColor = parameters.strokeColor;
    if (parameters.numSides !== undefined) this.state.numSides = parameters.numSides;
    
    // Handle global scale from plugin parameters
    if (parameters.globalScale !== undefined) {
      // Apply global scale to size
      this.state.scaledSize = this.state.size * parameters.globalScale;
    } else {
      // Recalculate using current size and global scale from plugin if available
      const globalScale = this.plugin.pluginParameters.globalScale || 1.0;
      this.state.scaledSize = this.state.size * globalScale;
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
    
    // Apply scaled size
    const size = this.state.size * globalScale;
    
    // Save context state
    ctx.save();
    
    // Draw bounding box if enabled
    if (showBoundingBox) {
      ctx.strokeStyle = '#999999';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.strokeRect(-size, -size, size * 2, size * 2);
      ctx.setLineDash([]);
    }
    
    // Draw shape based on type
    switch (this.state.shape) {
      case 'circle':
        this.drawCircle(ctx, size);
        break;
      case 'square':
        this.drawSquare(ctx, size);
        break;
      case 'triangle':
        this.drawTriangle(ctx, size);
        break;
      case 'polygon':
        this.drawPolygon(ctx, size, this.state.numSides, this.state.rotation);
        break;
      default:
        // Fallback to circle
        this.drawCircle(ctx, size);
    }
    
    // Draw debug info if in debug mode
    if (parameters.debugMode) {
      this.drawDebugInfo(ctx, parameters);
    }
    
    ctx.restore();
  }

  /**
   * Draw a circle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} size - Circle radius
   */
  drawCircle(ctx, size) {
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fillStyle = this.state.fillColor;
    ctx.fill();
    
    if (this.state.hasStroke) {
      ctx.strokeStyle = this.state.strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * Draw a square
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} size - Half side length
   */
  drawSquare(ctx, size) {
    ctx.fillStyle = this.state.fillColor;
    ctx.fillRect(-size, -size, size * 2, size * 2);
    
    if (this.state.hasStroke) {
      ctx.strokeStyle = this.state.strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-size, -size, size * 2, size * 2);
    }
  }

  /**
   * Draw a triangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} size - Size scale
   */
  drawTriangle(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * Math.cos(Math.PI / 6), size * Math.sin(Math.PI / 6));
    ctx.lineTo(-size * Math.cos(Math.PI / 6), size * Math.sin(Math.PI / 6));
    ctx.closePath();
    
    ctx.fillStyle = this.state.fillColor;
    ctx.fill();
    
    if (this.state.hasStroke) {
      ctx.strokeStyle = this.state.strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  /**
   * Draw a regular polygon
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} size - Size scale
   * @param {number} sides - Number of sides
   * @param {number} rotation - Rotation in radians
   */
  drawPolygon(ctx, size, sides, rotation = 0) {
    ctx.beginPath();
    
    for (let i = 0; i < sides; i++) {
      const angle = rotation + (i / sides) * Math.PI * 2;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    
    ctx.fillStyle = this.state.fillColor;
    ctx.fill();
    
    if (this.state.hasStroke) {
      ctx.strokeStyle = this.state.strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
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
    ctx.fillText(`Shape: ${this.state.shape}`, 20, 30);
    ctx.fillText(`Size: ${this.state.size}`, 20, 45);
    ctx.fillText(`Scale: ${parameters.globalScale || 1.0}`, 20, 60);
    ctx.fillText(`Sides: ${this.state.numSides}`, 20, 75);
    
    ctx.restore();
  }

  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @returns {boolean} Whether a render is needed
   */
  animate(deltaTime) {
    // Only animate polygon rotation
    if (this.isAnimating && this.state.shape === 'polygon') {
      // Update rotation
      this.state.rotation += deltaTime * 0.5;
      return true;
    }
    
    return false;
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
      
      // Check if click is inside the shape
      const size = this.state.scaledSize || (this.state.size * (this.plugin.pluginParameters.globalScale || 1.0));
      
      if (distance < size) {
        // Toggle stroke
        this.state.hasStroke = !this.state.hasStroke;
        
        // Update parameter in plugin
        this.plugin.updateParameter('hasStroke', this.state.hasStroke, 'visualization');
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Reset animation state
    this.isAnimating = false;
  }
}