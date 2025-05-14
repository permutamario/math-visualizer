// src/plugins/example2d-plugin/WaveVisualization.js
import { Visualization } from '../../core/Visualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Animated wave visualization with adjustable parameters
 */
export class WaveVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Flag for animation
    this.isAnimating = true;
    
    // Initialize internal state
    this.state = {
      waveType: 'sine',
      amplitude: 80,
      frequency: 0.02,
      speed: 1.0,
      waveColor: '#3498db',
      fillWave: true,
      phase: 0,
      points: [],
      resolution: 2 // Points per pixel
    };
  }

  /**
   * Define visualization-specific parameters
   * @returns {Array} Array of parameter definitions
   * @static
   */
  static getParameters() {
    return createParameters()
      .addDropdown('waveType', 'Wave Type', 'sine', [
        { value: 'sine', label: 'Sine Wave' },
        { value: 'square', label: 'Square Wave' },
        { value: 'sawtooth', label: 'Sawtooth Wave' },
        { value: 'triangle', label: 'Triangle Wave' },
        { value: 'combined', label: 'Combined Waves' }
      ])
      .addSlider('amplitude', 'Amplitude', 80, { min: 10, max: 150, step: 10 })
      .addSlider('frequency', 'Frequency', 0.02, { min: 0.005, max: 0.05, step: 0.005 })
      .addSlider('speed', 'Speed', 1.0, { min: 0.1, max: 3.0, step: 0.1 })
      .addColor('waveColor', 'Wave Color', '#3498db')
      .addCheckbox('fillWave', 'Fill Wave', true)
      .build();
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    try {
      // Store state values from parameters
      this.updateState(parameters);
      
      // Generate initial wave points
      this.generateWavePoints();
      
      return true;
    } catch (error) {
      console.error("Error initializing WaveVisualization:", error);
      return false;
    }
  }

  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - Changed parameters only
   */
  update(parameters) {
    // Check if the resolution needs to be updated for render quality
    if (parameters.renderQuality !== undefined) {
      switch (parameters.renderQuality) {
        case 'low':
          this.state.resolution = 1; // 1 point per pixel
          break;
        case 'medium':
          this.state.resolution = 2; // 2 points per pixel
          break;
        case 'high':
          this.state.resolution = 4; // 4 points per pixel
          break;
      }
      
      // Regenerate points for new resolution
      this.generateWavePoints();
    }
    
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
    if (parameters.waveType !== undefined) this.state.waveType = parameters.waveType;
    if (parameters.amplitude !== undefined) this.state.amplitude = parameters.amplitude;
    if (parameters.frequency !== undefined) this.state.frequency = parameters.frequency;
    if (parameters.speed !== undefined) this.state.speed = parameters.speed;
    if (parameters.waveColor !== undefined) this.state.waveColor = parameters.waveColor;
    if (parameters.fillWave !== undefined) this.state.fillWave = parameters.fillWave;
    
    // Handle global scale from plugin parameters
    if (parameters.globalScale !== undefined) {
      // Apply global scale to amplitude
      this.state.scaledAmplitude = this.state.amplitude * parameters.globalScale;
    } else if (this.state.scaledAmplitude === undefined) {
      // Initialize scaled amplitude if not set
      this.state.scaledAmplitude = this.state.amplitude * (parameters.globalScale || 1.0);
    }
  }

  /**
   * Generate wave points based on canvas size
   * @private
   */
  generateWavePoints() {
    // We'll estimate the canvas size - it will be adjusted in render
    const estimatedWidth = 800;
    
    // Calculate number of points based on resolution
    const numPoints = estimatedWidth * this.state.resolution;
    
    // Generate points array
    this.state.points = new Array(numPoints);
    
    // We don't calculate Y values here - they'll be calculated during animation
  }

  /**
   * Calculate wave Y value based on type
   * @param {number} x - X position
   * @param {number} phase - Wave phase
   * @returns {number} Y value
   * @private
   */
  calculateWaveY(x, phase) {
    const amplitude = this.state.scaledAmplitude || this.state.amplitude;
    const frequency = this.state.frequency;
    
    switch (this.state.waveType) {
      case 'sine':
        return Math.sin(x * frequency + phase) * amplitude;
        
      case 'square':
        return Math.sign(Math.sin(x * frequency + phase)) * amplitude;
        
      case 'sawtooth':
        const sawPosition = (x * frequency + phase) % (2 * Math.PI);
        return (sawPosition / Math.PI - 1) * amplitude;
        
      case 'triangle':
        const triPosition = (x * frequency + phase) % (2 * Math.PI);
        return (Math.abs(triPosition / Math.PI - 1) * 2 - 1) * amplitude;
        
      case 'combined':
        // Combination of sine and triangle
        const sine = Math.sin(x * frequency + phase) * amplitude * 0.6;
        const triangle = (Math.abs(((x * frequency * 0.5) + phase) % (2 * Math.PI) / Math.PI - 1) * 2 - 1) * amplitude * 0.4;
        return sine + triangle;
        
      default:
        return Math.sin(x * frequency + phase) * amplitude;
    }
  }

  /**
   * Render the visualization in 2D
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} parameters - Current parameters
   */
  render2D(ctx, parameters) {
    if (!ctx) return;
    
    // Get canvas dimensions
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    // Apply global state
    const showBoundingBox = parameters.showBoundingBox || false;
    const globalScale = parameters.globalScale || 1.0;
    const debug = parameters.debugMode || false;
    
    // Calculate scaled amplitude
    const amplitude = this.state.amplitude * globalScale;
    this.state.scaledAmplitude = amplitude;
    
    // Update points array size if canvas width changed
    const requiredPoints = Math.ceil(canvasWidth * this.state.resolution);
    if (this.state.points.length !== requiredPoints) {
      this.state.points = new Array(requiredPoints);
    }
    
    ctx.save();
    
    // Draw bounding box if enabled
    if (showBoundingBox) {
      ctx.strokeStyle = '#999999';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.strokeRect(-canvasWidth/2, -amplitude - 20, canvasWidth, amplitude * 2 + 40);
      ctx.setLineDash([]);
    }
    
    // Calculate horizontal scale
    const horizontalScale = canvasWidth / this.state.points.length;
    
    // Calculate y values for all points
    for (let i = 0; i < this.state.points.length; i++) {
      const x = (i * horizontalScale) - canvasWidth / 2;
      const y = this.calculateWaveY(x, this.state.phase);
      this.state.points[i] = { x, y };
    }
    
    // Draw wave
    ctx.beginPath();
    
    // Start at the left edge
    const startPoint = this.state.points[0];
    ctx.moveTo(startPoint.x, startPoint.y);
    
    // Draw through all points
    for (let i = 1; i < this.state.points.length; i++) {
      const point = this.state.points[i];
      ctx.lineTo(point.x, point.y);
    }
    
    // Style based on parameters
    ctx.strokeStyle = this.state.waveColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Fill if enabled
    if (this.state.fillWave) {
      // Complete the path to the bottom
      const lastPoint = this.state.points[this.state.points.length - 1];
      ctx.lineTo(lastPoint.x, canvasHeight/2); // Bottom right
      ctx.lineTo(startPoint.x, canvasHeight/2); // Bottom left
      ctx.closePath();
      
      // Fill with semi-transparent color
      const fillColor = this.hexToRgba(this.state.waveColor, 0.3);
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    
    // Draw zero-line
    ctx.beginPath();
    ctx.moveTo(-canvasWidth/2, 0);
    ctx.lineTo(canvasWidth/2, 0);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw debug info if enabled
    if (debug) {
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
    ctx.fillRect(10, 10, 230, 115);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Wave Type: ${this.state.waveType}`, 20, 30);
    ctx.fillText(`Amplitude: ${this.state.amplitude.toFixed(1)}`, 20, 45);
    ctx.fillText(`Frequency: ${this.state.frequency.toFixed(4)}`, 20, 60);
    ctx.fillText(`Speed: ${this.state.speed.toFixed(1)}`, 20, 75);
    ctx.fillText(`Phase: ${this.state.phase.toFixed(2)}`, 20, 90);
    ctx.fillText(`Resolution: ${this.state.resolution} (${parameters.renderQuality || 'medium'})`, 20, 105);
    
    ctx.restore();
  }

  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @returns {boolean} Whether a render is needed
   */
  animate(deltaTime) {
    if (!this.isAnimating) return false;
    
    // Update phase
    this.state.phase += deltaTime * this.state.speed * 5;
    
    return true;
  }

  /**
   * Handle user interaction
   * @param {string} type - Interaction type
   * @param {Object} event - Event data
   * @returns {boolean} Whether the interaction was handled
   */
  handleInteraction(type, event) {
    if (type === 'click') {
      // Toggle fill mode on click
      this.state.fillWave = !this.state.fillWave;
      
      // Update parameter in plugin
      this.plugin.updateParameter('fillWave', this.state.fillWave, 'visualization');
      
      return true;
    } else if (type === 'mousemove' && event.event && event.event.buttons === 1) {
      // Adjust frequency when dragging
      const dx = event.event.movementX;
      if (dx) {
        // Scale movement to frequency adjustment
        const newFrequency = Math.max(0.005, Math.min(0.05, 
          this.state.frequency + dx * 0.0001
        ));
        
        if (newFrequency !== this.state.frequency) {
          this.state.frequency = newFrequency;
          
          // Update parameter in plugin
          this.plugin.updateParameter('frequency', this.state.frequency, 'visualization');
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Convert hex color to rgba
   * @param {string} hex - Hex color (#RRGGBB)
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} RGBA color string
   * @private
   */
  hexToRgba(hex, alpha = 1) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Return rgba string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Reset animation state
    this.isAnimating = false;
    
    // Clear points array
    this.state.points = [];
  }
}