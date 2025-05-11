// src/plugins/sample-plugin/SampleVisualization.js

import { Visualization } from '../../core/Visualization.js';

export class SampleVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Set animation flag
    this.isAnimating = true;
    
    // Initialize internal state
    this.state = {
      circles: [],
      counter: 0,
      isLoading: true,
      dataComputed: false
    };
  }

  /**
   * Define visualization-specific parameters
   * @returns {Object} Parameter schema with structural and visual parameters
   * @static
   */
  static getParameters() {
    return {
      structural: [
        {
          id: 'numCircles',
          type: 'slider',
          label: 'Number of Circles',
          min: 1,
          max: 20,
          step: 1,
          default: 5
        },
        {
          id: 'radius',
          type: 'slider',
          label: 'Circle Radius',
          min: 10,
          max: 50,
          step: 5,
          default: 30
        }
      ],
      visual: [
        {
          id: 'fillColor',
          type: 'color',
          label: 'Fill Color',
          default: '#3498db'
        },
        {
          id: 'strokeWidth',
          type: 'slider',
          label: 'Stroke Width',
          min: 0,
          max: 10,
          step: 1,
          default: 2
        }
      ]
    };
  }

  /**
   * Check if the visualization is ready to provide parameters
   * Simulates a visualization that needs to compute or load data
   * @returns {Promise<boolean>} Whether the visualization is ready
   */
  async isReadyForParameters() {
    // If data is already computed, return true immediately
    if (this.state.dataComputed) {
      return true;
    }
    
    // Simulate data computation/loading
    if (this.state.isLoading) {
      // In a real implementation, this might involve fetching data or heavy computation
      await new Promise(resolve => setTimeout(resolve, 500));
      this.state.dataComputed = true;
      this.state.isLoading = false;
    }
    
    return true;
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Visualization parameters
   */
  async initialize(parameters) {
    // Reset state
    this.state.circles = [];
    this.state.counter = 0;
    
    // Use parameters to create initial state
    const numCircles = parameters.numCircles || 5;
    const radius = parameters.radius || 30;
    
    // Create initial circles
    for (let i = 0; i < numCircles; i++) {
      const angle = (i / numCircles) * Math.PI * 2;
      const distance = 150;
      
      this.state.circles.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        radius: radius,
        color: parameters.fillColor || '#3498db',
        phase: i / numCircles * Math.PI * 2
      });
    }
    
    // Set animation state based on parameters
    this.isAnimating = !parameters.pauseAnimation;
    
    // Simulate data computation before completing initialization
    if (!this.state.dataComputed) {
      await this.isReadyForParameters();
    }
    
    return true;
  }

  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - New parameter values
   */
  update(parameters) {
    // Handle animation state changes
    if (parameters.pauseAnimation !== undefined) {
      this.isAnimating = !parameters.pauseAnimation;
    }
    
    // Update circle count if needed
    if (parameters.numCircles !== undefined) {
      const currentCount = this.state.circles.length;
      const targetCount = parameters.numCircles;
      
      if (targetCount > currentCount) {
        // Add new circles
        for (let i = currentCount; i < targetCount; i++) {
          const angle = (i / targetCount) * Math.PI * 2;
          const distance = 150;
          
          this.state.circles.push({
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            radius: parameters.radius || this.state.circles[0]?.radius || 30,
            color: parameters.fillColor || this.state.circles[0]?.color || '#3498db',
            phase: i / targetCount * Math.PI * 2
          });
        }
      } else if (targetCount < currentCount) {
        // Remove excess circles
        this.state.circles = this.state.circles.slice(0, targetCount);
      }
      
      // Redistribute angles evenly
      this.state.circles.forEach((circle, i) => {
        const angle = (i / targetCount) * Math.PI * 2;
        const distance = 150;
        
        circle.x = Math.cos(angle) * distance;
        circle.y = Math.sin(angle) * distance;
        circle.phase = i / targetCount * Math.PI * 2;
      });
    }
    
    // Update radius if needed
    if (parameters.radius !== undefined) {
      this.state.circles.forEach(circle => {
        circle.radius = parameters.radius;
      });
    }
    
    // Update colors if needed
    if (parameters.fillColor !== undefined) {
      this.state.circles.forEach(circle => {
        circle.color = parameters.fillColor;
      });
    }
  }

  /**
   * Render the visualization in 2D
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} parameters - Current parameters
   */
  render2D(ctx, parameters) {
    // Clear canvas with a semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    
    // Get canvas size for clearing
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    // Clear relative to the center point (0,0 after transform)
    ctx.fillRect(-canvasWidth/2, -canvasHeight/2, canvasWidth, canvasHeight);
    
    // Draw each circle
    this.state.circles.forEach(circle => {
      ctx.save();
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
      ctx.fillStyle = circle.color;
      ctx.fill();
      
      // Add stroke if specified
      if (parameters.strokeWidth > 0) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = parameters.strokeWidth;
        ctx.stroke();
      }
      
      ctx.restore();
    });
    
    // Draw debug info if enabled
    if (parameters.showDebug) {
      this.renderDebugInfo(ctx, parameters);
    }
  }

  /**
   * Render debug information overlay
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} parameters - Current parameters
   */
  renderDebugInfo(ctx, parameters) {
    ctx.save();
    
    // Reset transform to work in screen space
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw debug panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 100);
    
    // Draw text
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    ctx.fillText(`Circles: ${this.state.circles.length}`, 20, 30);
    ctx.fillText(`Radius: ${parameters.radius || 0}px`, 20, 50);
    ctx.fillText(`Animation: ${this.isAnimating ? 'Running' : 'Paused'}`, 20, 70);
    ctx.fillText(`Frame: ${this.state.counter}`, 20, 90);
    
    ctx.restore();
  }

  /**
   * Update animation
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @returns {boolean} Whether a render is needed
   */
  animate(deltaTime) {
    // Skip animation if paused
    if (!this.isAnimating) {
      return false;
    }
    
    // Update animation counter
    this.state.counter++;
    
    // Animate circles
    this.state.circles.forEach((circle, i) => {
      const time = performance.now() / 1000;
      
      // Apply a pulsating effect
      const pulseFactor = Math.sin(time * 2 + circle.phase) * 0.2 + 0.8;
      circle.radius = (this.plugin.parameters.radius || 30) * pulseFactor;
      
      // Apply a slight position movement
      const orbitRadius = 20;
      circle.x += Math.cos(time + circle.phase) * orbitRadius * deltaTime;
      circle.y += Math.sin(time * 1.3 + circle.phase) * orbitRadius * deltaTime;
    });
    
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
      // Check if clicking on a circle
      for (const circle of this.state.circles) {
        const dx = event.x - circle.x;
        const dy = event.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= circle.radius) {
          // Randomly change the circle color
          const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
          circle.color = randomColor;
          
          // Update the plugin parameter if this is the first circle
          if (circle === this.state.circles[0]) {
            this.plugin.parameters.fillColor = randomColor;
            this.plugin.giveParameters(false);
          }
          
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Reset state
    this.state.circles = [];
    this.state.counter = 0;
    this.isAnimating = false;
  }
}