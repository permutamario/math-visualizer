// src/plugins/asep-plugin/BaseASEPVisualization.js - Modified to fix initialization issue
import { Visualization } from '../../core/Visualization.js';

/**
 * Base class for all ASEP visualizations with shared functionality
 */
export class BaseASEPVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Set the direct isAnimating property for the rendering manager
    this.isAnimating = true;
    
    // Store simulation state
    this.state = {
      isAnimating: true,        // Flag to ensure continuous rendering
      isPaused: false,          // Flag to control simulation pausing
      boxes: [],                // Array of box positions
      particles: [],            // Array of particle objects
      jumpEvents: [],           // Array to track scheduled jump events
      timeScale: 1.0,           // Time scaling factor for simulation speed
      boxSize: 40,              // Fixed box size (pixels)
      particleRadius: 14        // Fixed particle radius (pixels)
    };
  }

  /**
   * Abstract initialize method (should be implemented by subclasses)
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // To be implemented by subclasses
    // By default, just clear any existing state
    this.clearSimulation();
    return true;
  }

  /**
   * Clear any existing simulation state
   */
  clearSimulation() {
    // Clear existing jump timeouts
    if (this.state && this.state.jumpEvents) {
      this.state.jumpEvents.forEach(event => {
        if (event.timeoutId) {
          clearTimeout(event.timeoutId);
        }
      });
    }
    
    // Reset state
    this.state.boxes = [];
    this.state.particles = [];
    this.state.jumpEvents = [];
  }
  
  /**
   * Create initial particles with random positions
   * @param {Object} parameters - Visualization parameters
   */
  createParticles(parameters) {
    if (!parameters || !parameters.numParticles || !parameters.numBoxes) {
      console.error("Cannot create particles: missing parameters");
      return;
    }

    const numParticles = Math.min(parameters.numParticles, parameters.numBoxes);
    const numBoxes = parameters.numBoxes;
    
    // Generate unique random positions
    const positions = [];
    while (positions.length < numParticles) {
      const pos = Math.floor(Math.random() * numBoxes);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    
    // Create particles
    for (let i = 0; i < numParticles; i++) {
      this.state.particles.push({
        id: i,
        position: positions[i],
        isJumping: false,
        jumpProgress: 0,
        startPosition: positions[i],
        targetPosition: positions[i],
        color: parameters.particleColor || '#3498db',
        originalColor: parameters.particleColor || '#3498db',
        radius: this.state.particleRadius,
        jumpSpeed: 2.0,
        jumpState: 'none', // 'none', 'entering', 'inside', 'exiting'
        insideProgress: 0
      });
    }
  }
  
  /**
   * Schedule initial jumps for particles
   */
  scheduleInitialJumps() {
    if (!this.state.isPaused && Array.isArray(this.state.particles)) {
      this.state.particles.forEach(particle => {
        this.scheduleNextJump(particle);
      });
    }
  }
  
  /**
   * Check if a position is already occupied
   * @param {number} position - Position to check
   * @param {Object} excludeParticle - Particle to exclude from check
   * @returns {boolean} True if position is occupied
   */
  isPositionOccupied(position, excludeParticle = null) {
    if (!Array.isArray(this.state.particles)) return false;
    
    return this.state.particles.some(p => 
      p !== excludeParticle && 
      ((p.position === position && (p.jumpState === 'none' || p.jumpState === 'inside')) || 
       (p.isJumping && p.targetPosition === position))
    );
  }
  
  /**
   * Schedule the next jump for a particle
   * Override in subclasses to implement specific jumping behavior
   * @param {Object} particle - Particle to schedule jump for
   */
  scheduleNextJump(particle) {
    // To be implemented by subclasses
    console.log("BaseASEPVisualization: scheduleNextJump must be implemented by subclasses");
  }
  
  /**
   * Toggle simulation pause state
   */
  toggleSimulation() {
    this.state.isPaused = !this.state.isPaused;
    
    if (!this.state.isPaused && Array.isArray(this.state.particles)) {
      // Resume by scheduling new jumps for non-jumping particles
      this.state.particles.forEach(particle => {
        if (!particle.isJumping) {
          this.scheduleNextJump(particle);
        }
      });
    } else {
      // Pause by clearing all scheduled jumps
      if (Array.isArray(this.state.jumpEvents)) {
        this.state.jumpEvents.forEach(event => {
          if (event.timeoutId) {
            clearTimeout(event.timeoutId);
          }
        });
        this.state.jumpEvents = [];
      }
    }
  }
  
  /**
   * Interpolate between two colors
   * @param {string} startColor - Starting color (hex or rgb)
   * @param {string} endColor - Ending color (hex or rgb)
   * @param {number} t - Interpolation factor (0-1)
   * @returns {string} Interpolated color
   */
  lerpColor(startColor, endColor, t) {
    // Parse colors to RGB
    const start = this.parseColor(startColor);
    const end = this.parseColor(endColor);
    
    // Interpolate RGB components
    const r = Math.floor(start.r + (end.r - start.r) * t);
    const g = Math.floor(start.g + (end.g - start.g) * t);
    const b = Math.floor(start.b + (end.b - start.b) * t);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Parse a color string to RGB components
   * @param {string} colorStr - Color string (hex or rgb)
   * @returns {Object} RGB components
   */
  parseColor(colorStr) {
    if (!colorStr) {
      return { r: 0, g: 0, b: 0 }; // Default to black
    }
    
    // Handle hex colors
    if (colorStr.startsWith('#')) {
      const r = parseInt(colorStr.slice(1, 3), 16);
      const g = parseInt(colorStr.slice(3, 5), 16);
      const b = parseInt(colorStr.slice(5, 7), 16);
      return { r, g, b };
    }
    
    // Handle rgb colors
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    
    // Default to black
    return { r: 0, g: 0, b: 0 };
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  animate(deltaTime) {
    if (!this.plugin || !this.plugin.parameters) {
      return true; // Keep rendering to avoid freezing
    }
    
    // Update speed from parameters
    this.state.timeScale = this.plugin.parameters.animationSpeed || 1.0;
    
    // Always request continuous rendering by setting direct property
    this.isAnimating = true;
    
    // Update particle jump animations
    const particlesToRemove = [];
    if (Array.isArray(this.state.particles)) {
      this.state.particles.forEach(particle => {
        if (particle.isJumping) {
          // Update jump progress
          particle.jumpProgress += deltaTime * particle.jumpSpeed * this.state.timeScale;
          
          // Check for entering a box
          if (particle.jumpState === 'entering' && particle.jumpProgress >= 0.5) {
            particle.jumpState = 'inside';
            particle.insideProgress = 0;
          }
          // Check for exiting a box
          else if (particle.jumpState === 'inside' && particle.insideProgress >= 1.0) {
            particle.jumpState = 'exiting';
          }
          
          // Update inside progress if particle is inside a box
          if (particle.jumpState === 'inside') {
            particle.insideProgress += deltaTime * particle.jumpSpeed * this.state.timeScale * 2;
          }
          
          // Check if jump is complete
          if (particle.jumpProgress >= 1) {
            this.completeJump(particle, particlesToRemove);
          }
        }
      });
    }
    
    // Remove particles that need to be removed
    if (particlesToRemove.length > 0) {
      this.state.particles = this.state.particles.filter(p => !particlesToRemove.includes(p));
    }
    
    // Custom animation behavior in subclasses
    this.customAnimate(deltaTime);
    
    // Return true to ensure continuous rendering
    return true;
  }
  
  /**
   * Custom animation behavior to be implemented by subclasses
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  customAnimate(deltaTime) {
    // To be implemented by subclasses - empty by default
  }
  
  /**
   * Complete a jump for a particle
   * @param {Object} particle - Particle that completed jump
   * @param {Array} particlesToRemove - Array to add particles to remove to
   */
  completeJump(particle, particlesToRemove) {
    // Normal jump completion (override in subclasses for special cases)
    particle.isJumping = false;
    particle.jumpProgress = 0;
    particle.position = particle.targetPosition;
    particle.color = particle.originalColor;
    particle.jumpState = 'none';
    particle.insideProgress = 0;
    
    // Schedule next jump if not paused
    if (!this.state.isPaused) {
      this.scheduleNextJump(particle);
    }
  }
  
  /**
   * Draw a particle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} particle - Particle to draw
   * @param {number} x - X position to draw at
   * @param {number} y - Y position to draw at
   * @param {number} scale - Scale factor (1.0 = normal size)
   */
  drawParticle(ctx, particle, x, y, scale = 1.0) {
    if (!ctx || !particle) return;
    
    // Draw particle
    ctx.beginPath();
    ctx.arc(x, y, particle.radius * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw particle ID
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(particle.id.toString(), x, y);
  }
  
  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - New parameter values
   */
  update(parameters) {
    if (!parameters) return;
    
    // Update pause state
    if (parameters.isPaused !== undefined && parameters.isPaused !== this.state.isPaused) {
      this.state.isPaused = parameters.isPaused;
      
      if (!this.state.isPaused && Array.isArray(this.state.particles)) {
        // Resume simulation
        this.state.particles.forEach(particle => {
          if (!particle.isJumping) {
            this.scheduleNextJump(particle);
          }
        });
      } else if (Array.isArray(this.state.jumpEvents)) {
        // Pause simulation
        this.state.jumpEvents.forEach(event => {
          if (event.timeoutId) {
            clearTimeout(event.timeoutId);
          }
        });
        this.state.jumpEvents = [];
      }
    }
    
    // Update timeScale
    if (parameters.animationSpeed !== undefined) {
      this.state.timeScale = parameters.animationSpeed;
    }
    
    // Allow subclasses to handle specific parameter updates
    this.handleParameterUpdate(parameters);
  }
  
  /**
   * Handle parameter updates specific to subclasses
   * @param {Object} parameters - New parameter values
   */
  handleParameterUpdate(parameters) {
    // To be implemented by subclasses - empty by default
  }
  
  /**
   * Clean up resources when visualization is no longer needed
   */
  dispose() {
    // Clear all timeouts
    if (Array.isArray(this.state.jumpEvents)) {
      this.state.jumpEvents.forEach(event => {
        if (event.timeoutId) {
          clearTimeout(event.timeoutId);
        }
      });
    }
    
    // Reset state
    this.state.jumpEvents = [];
    this.state.particles = [];
    this.state.boxes = [];
    this.state.isAnimating = false;
    this.isAnimating = false;
  }
  
  /**
   * Default render2D method to prevent errors
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  render2D(ctx, parameters) {
    // Default implementation - should be overridden by subclasses
    if (ctx) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(-100, -100, 200, 200);
      ctx.fillStyle = '#333';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Visualization not implemented', 0, 0);
      ctx.restore();
    }
  }
}