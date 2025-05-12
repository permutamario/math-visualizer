// src/plugins/asep-plugin/BaseASEPVisualization.js
import { Visualization } from '../../core/Visualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Base class for all ASEP visualizations with shared functionality
 * Implements a continuous-time Markov chain model
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
      realTimeFactor: 1.0,      // How many simulation seconds per real second
      boxSize: 40,              // Fixed box size (pixels)
      particleRadius: 14,       // Fixed particle radius (pixels)
      colorIndices: {           // Default color indices from the palette
        particle: 0,            // First color for particles
        box: 1,                 // Second color for boxes
        jump: 2,                // Third color for jumping particles
        portal: 4               // Fifth color for portals
      },
      currentTime: 0,           // Current simulation time
      nextEventTime: Infinity,  // Time of next event
      eventsOccurred: 0         // Counter for statistics
    };
  }

  /**
   * Get parameters specific to all ASEP visualizations
   * @returns {Array} Array of parameter definitions 
   * @static
   */
  static getParameters() {
    // Base parameters shared by all ASEP visualizations
    // Individual ASEP visualization subclasses will add their own specific parameters
    return createParameters().build();
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Clear any existing state
    this.clearSimulation();
    
    // Set isPaused from parameters
    this.state.isPaused = parameters.isPaused || false;
    
    // Set real-time factor based on animation speed
    this.state.realTimeFactor = 2.0 * (parameters.animationSpeed || 1.0);
    
    // Reset simulation time and event counter
    this.state.currentTime = 0;
    this.state.eventsOccurred = 0;
    
    return true;
  }

  /**
   * Clear any existing simulation state
   */
  clearSimulation() {
    // Reset state
    this.state.boxes = [];
    this.state.particles = [];
    this.state.currentTime = 0;
    this.state.nextEventTime = Infinity;
    this.state.eventsOccurred = 0;
  }
  
  /**
   * Create initial particles with random positions and initialize their jump clocks
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

    // Get particle color from the palette
    const particleColor = this.getColorFromPalette(parameters, this.state.colorIndices.particle);
    
    // Get jump rates from parameters
    const rightRate = parameters.rightJumpRate !== undefined ? parameters.rightJumpRate : 0.8;
    const leftRate = parameters.leftJumpRate !== undefined ? parameters.leftJumpRate : 0.2;
    
    // Create particles with jump clocks
    for (let i = 0; i < numParticles; i++) {
      this.state.particles.push({
        id: i,
        position: positions[i],
        isJumping: false,
        jumpProgress: 0,
        startPosition: positions[i],
        targetPosition: positions[i],
        color: particleColor,
        originalColor: particleColor,
        radius: this.state.particleRadius,
        jumpSpeed: 2.0,
        jumpState: 'none', // 'none', 'entering', 'inside', 'exiting'
        insideProgress: 0,
        // Continuous-time Markov chain specific properties
        rightJumpRate: rightRate,
        leftJumpRate: leftRate,
        rightJumpTime: this.generateExponentialTime(rightRate),
        leftJumpTime: this.generateExponentialTime(leftRate)
      });
    }
    
    // Calculate the time of the next event
    this.calculateNextEventTime();
  }
  
  /**
   * Generate a random time from an exponential distribution
   * @param {number} rate - Rate parameter (λ) for the exponential distribution
   * @returns {number} Random time value
   */
  generateExponentialTime(rate) {
    if (rate <= 0) return Infinity;
    // Generate exponential random variable using inverse transform sampling
    // T = -ln(U)/λ where U is uniform(0,1) and λ is the rate
    return -Math.log(Math.random()) / rate;
  }
  
  /**
   * Calculate the time of the next event across all particles
   */
  calculateNextEventTime() {
    this.state.nextEventTime = Infinity;
    let nextEventParticle = null;
    let nextEventDirection = null;
    
    // Find the minimum jump time across all particles
    for (const particle of this.state.particles) {
      if (particle.isJumping) continue; // Skip particles already in motion
      
      // Check right jump time
      if (particle.rightJumpTime < this.state.nextEventTime) {
        this.state.nextEventTime = particle.rightJumpTime;
        nextEventParticle = particle;
        nextEventDirection = 'right';
      }
      
      // Check left jump time
      if (particle.leftJumpTime < this.state.nextEventTime) {
        this.state.nextEventTime = particle.leftJumpTime;
        nextEventParticle = particle;
        nextEventDirection = 'left';
      }
    }
    
    // Store which particle and direction will trigger the next event
    this.state.nextEventParticle = nextEventParticle;
    this.state.nextEventDirection = nextEventDirection;
  }
  
  /**
   * Update the simulation based on continuous-time Markov chain
   * @param {number} deltaTime - Real time elapsed since last frame in seconds
   */
  updateSimulation(deltaTime) {
    if (this.state.isPaused) return;
    
    // Scale real time to simulation time based on speed factor
    const simulationDeltaTime = deltaTime * this.state.realTimeFactor;
    
    // Advance simulation time
    this.state.currentTime += simulationDeltaTime;
    
    // Process events that should have occurred by current time
    while (!this.state.isPaused && this.state.nextEventTime <= this.state.currentTime) {
      // Execute the next event
      this.executeNextEvent();
      
      // Recalculate next event time
      this.calculateNextEventTime();
    }
    
    // Handle boundary dynamics (entry/exit for open system)
    this.handleBoundaryDynamics(simulationDeltaTime);
  }
  
  /**
   * Execute the next scheduled event in the simulation
   */
  executeNextEvent() {
    const particle = this.state.nextEventParticle;
    const direction = this.state.nextEventDirection;
    
    if (!particle || !direction) return;
    
    // Update events counter
    this.state.eventsOccurred++;
    
    // Reset the clock for the triggered direction
    if (direction === 'right') {
      particle.rightJumpTime = this.state.currentTime + this.generateExponentialTime(particle.rightJumpRate);
    } else {
      particle.leftJumpTime = this.state.currentTime + this.generateExponentialTime(particle.leftJumpRate);
    }
    
    // Attempt the jump in the specified direction
    this.attemptJump(particle, direction);
  }
  
  /**
   * Attempt a jump in the specified direction
   * @param {Object} particle - Particle attempting to jump
   * @param {string} direction - Direction of jump ('right' or 'left')
   */
  attemptJump(particle, direction) {
    if (particle.isJumping) return; // Already jumping
    
    let targetPosition;
    
    if (direction === 'right') {
      targetPosition = particle.position + 1;
      
      // Check if target position is valid for this model
      if (!this.isValidRightJump(particle, targetPosition)) return;
      
      // Check if target position is occupied
      if (this.isPositionOccupied(targetPosition, particle)) return;
      
      // Start jump animation
      this.startJumpAnimation(particle, targetPosition);
    } 
    else if (direction === 'left') {
      targetPosition = particle.position - 1;
      
      // Check if target position is valid for this model
      if (!this.isValidLeftJump(particle, targetPosition)) return;
      
      // Check if target position is occupied
      if (this.isPositionOccupied(targetPosition, particle)) return;
      
      // Start jump animation
      this.startJumpAnimation(particle, targetPosition);
    }
  }
  
  /**
   * Check if a right jump to target position is valid
   * @param {Object} particle - Particle attempting to jump
   * @param {number} targetPosition - Position to jump to
   * @returns {boolean} Whether the jump is valid
   */
  isValidRightJump(particle, targetPosition) {
    // Must be implemented by subclasses
    return false;
  }
  
  /**
   * Check if a left jump to target position is valid
   * @param {Object} particle - Particle attempting to jump
   * @param {number} targetPosition - Position to jump to
   * @returns {boolean} Whether the jump is valid
   */
  isValidLeftJump(particle, targetPosition) {
    // Must be implemented by subclasses
    return false;
  }
  
  /**
   * Method to handle boundary dynamics
   * @param {number} deltaTime - Simulation time elapsed
   */
  handleBoundaryDynamics(deltaTime) {
    // Override in subclasses to implement boundary-specific logic
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
      ((p.position === position && !p.isJumping) || 
       (p.isJumping && p.targetPosition === position))
    );
  }
  
  /**
   * Start jump animation for a particle
   * @param {Object} particle - Particle to animate
   * @param {number} targetPosition - Target position to jump to
   */
  startJumpAnimation(particle, targetPosition) {
    particle.isJumping = true;
    particle.jumpProgress = 0;
    particle.startPosition = particle.position;
    particle.targetPosition = targetPosition;
    particle.originalColor = particle.color;
    particle.jumpState = 'entering'; // Start the jump animation sequence
  }
  
  /**
   * Toggle simulation pause state
   */
  toggleSimulation() {
    this.state.isPaused = !this.state.isPaused;
    
    // Update the isPaused parameter in the plugin
    this.plugin.updateParameter('isPaused', this.state.isPaused, 'plugin');
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  animate(deltaTime) {
    // Always set isAnimating true to ensure continuous rendering
    this.isAnimating = true;
    
    // Get animation speed from parameters
    const animationSpeed = this.getParameterValue('animationSpeed', 1.0);
    
    // Update jump animations
    const particlesToRemove = [];
    if (Array.isArray(this.state.particles)) {
      this.state.particles.forEach(particle => {
        if (particle.isJumping) {
          // Update jump progress
          particle.jumpProgress += deltaTime * particle.jumpSpeed * animationSpeed;
          
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
            particle.insideProgress += deltaTime * particle.jumpSpeed * animationSpeed * 2;
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
    
    // Update the simulation with continuous-time model
    this.updateSimulation(deltaTime);
    
    // Allow subclasses to perform additional animation
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
  }
  
  /**
   * Get color from the specified palette
   * @param {Object} parameters - Visualization parameters 
   * @param {number} colorIndex - Index in the palette
   * @returns {string} Color string
   */
  getColorFromPalette(parameters, colorIndex = 0) {
    // Default palette and colors
    const defaultPalette = ['#3498db', '#2c3e50', '#ff5722', '#27ae60', '#9C27B0', '#f1c40f', '#e74c3c'];
    
    // Try to get palette from the core
    if (parameters.colorPalette && this.plugin && this.plugin.core && this.plugin.core.colorSchemeManager) {
      const palette = this.plugin.core.colorSchemeManager.getPalette(parameters.colorPalette);
      if (palette && palette.length > 0) {
        return palette[colorIndex % palette.length];
      }
    }
    
    // If we don't have a core palette, check for direct color parameters (backwards compatibility)
    if (parameters) {
      if (colorIndex === this.state.colorIndices.particle && parameters.particleColor) {
        return parameters.particleColor;
      }
      if (colorIndex === this.state.colorIndices.box && parameters.boxColor) {
        return parameters.boxColor;
      }
      if (colorIndex === this.state.colorIndices.jump && parameters.jumpColor) {
        return parameters.jumpColor;
      }
      if (colorIndex === this.state.colorIndices.portal && parameters.portalColor) {
        return parameters.portalColor;
      }
    }
    
    // Fallback to default palette
    return defaultPalette[colorIndex % defaultPalette.length];
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
   * Update the visualization with new parameters
   * @param {Object} parameters - New parameter values
   */
  update(parameters) {
    if (!parameters) return;

    // Update particle colors if color palette changed
    if (parameters.colorPalette !== undefined) {
      this.updateParticleColors(parameters);
    }
    
    // Update pause state
    if (parameters.isPaused !== undefined && parameters.isPaused !== this.state.isPaused) {
      this.state.isPaused = parameters.isPaused;
    }
    
    // Update animation speed which affects simulation speed
    if (parameters.animationSpeed !== undefined) {
      this.state.realTimeFactor = 2.0 * parameters.animationSpeed;
    }
    
    // Update jump rates if provided
    if (parameters.rightJumpRate !== undefined || parameters.leftJumpRate !== undefined) {
      this.updateJumpRates(parameters);
    }
    
    // Allow subclasses to handle specific parameter updates
    this.handleParameterUpdate(parameters);
  }

  /**
   * Update particle colors when color palette changes
   * @param {Object} parameters - Visualization parameters with new color settings
   */
  updateParticleColors(parameters) {
    if (!Array.isArray(this.state.particles) || this.state.particles.length === 0) return;
    
    // Get the new color from palette
    const particleColor = this.getColorFromPalette(parameters, this.state.colorIndices.particle);
    
    // Update all particle colors
    this.state.particles.forEach(particle => {
      particle.color = particleColor;
      particle.originalColor = particleColor;
    });
  }
  
  /**
   * Update jump rates for all particles
   * @param {Object} parameters - New parameters with jump rates
   */
  updateJumpRates(parameters) {
    if (!Array.isArray(this.state.particles) || this.state.particles.length === 0) return;
    
    // Get new rates
    const rightRate = parameters.rightJumpRate !== undefined ? parameters.rightJumpRate : undefined;
    const leftRate = parameters.leftJumpRate !== undefined ? parameters.leftJumpRate : undefined;
    
    // Update particles
    this.state.particles.forEach(particle => {
      // Only update if the rate has changed
      if (rightRate !== undefined && particle.rightJumpRate !== rightRate) {
        particle.rightJumpRate = rightRate;
        // Rescale the remaining time proportionally if the particle isn't currently jumping
        if (!particle.isJumping) {
          const timeToEvent = particle.rightJumpTime - this.state.currentTime;
          if (timeToEvent > 0) {
            const oldRate = particle.rightJumpRate;
            // Rescaling formula: new_time = old_time * (old_rate / new_rate)
            const newTimeToEvent = rightRate > 0 ? timeToEvent * (oldRate / rightRate) : Infinity;
            particle.rightJumpTime = this.state.currentTime + newTimeToEvent;
          } else {
            // If the event was already due, generate a new time
            particle.rightJumpTime = this.state.currentTime + this.generateExponentialTime(rightRate);
          }
        }
      }
      
      if (leftRate !== undefined && particle.leftJumpRate !== leftRate) {
        particle.leftJumpRate = leftRate;
        // Rescale the remaining time proportionally if the particle isn't currently jumping
        if (!particle.isJumping) {
          const timeToEvent = particle.leftJumpTime - this.state.currentTime;
          if (timeToEvent > 0) {
            const oldRate = particle.leftJumpRate;
            // Rescaling formula: new_time = old_time * (old_rate / new_rate)
            const newTimeToEvent = leftRate > 0 ? timeToEvent * (oldRate / leftRate) : Infinity;
            particle.leftJumpTime = this.state.currentTime + newTimeToEvent;
          } else {
            // If the event was already due, generate a new time
            particle.leftJumpTime = this.state.currentTime + this.generateExponentialTime(leftRate);
          }
        }
      }
    });
    
    // Recalculate next event time
    this.calculateNextEventTime();
  }
  
  /**
   * Handle parameter updates specific to subclasses
   * @param {Object} parameters - New parameter values
   */
  handleParameterUpdate(parameters) {
    // Default implementation does nothing
    // To be overridden by subclasses
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
    
    // Draw particle ID only if showLabels is true
    if (this.getParameterValue('showLabels', false)) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(particle.id.toString(), x, y);
    }
  }
  
  /**
   * Draw boxes without labels
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawBoxes(ctx, parameters) {
    if (!ctx || !Array.isArray(this.state.boxes)) return;
    
    // Get box color from palette
    const boxColor = this.getColorFromPalette(parameters, this.state.colorIndices.box);
    const boxSize = this.state.boxSize;
    const showLabels = this.getParameterValue('showLabels', false);
    
    ctx.save();
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2;
    
    // Draw each box
    this.state.boxes.forEach((box, index) => {
      // Calculate box position
      const x1 = box.x - boxSize / 2;
      const y1 = box.y - boxSize / 2;
      
      // Draw the box
      ctx.beginPath();
      ctx.rect(x1, y1, boxSize, boxSize);
      ctx.stroke();
      
      // Add site index below box only if showLabels is true
      if (showLabels) {
        ctx.fillStyle = boxColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(box.index.toString(), box.x, box.y + boxSize/2 + 20);
      }
    });
    
    ctx.restore();
  }
  
  /**
   * Draw a bounding box around the system
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawBoundingBox(ctx, parameters) {
    if (!ctx || !Array.isArray(this.state.boxes) || this.state.boxes.length === 0) return;
    
    ctx.save();
    
    // Find the extents of the boxes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const boxHalfSize = this.state.boxSize / 2;
    
    this.state.boxes.forEach(box => {
      minX = Math.min(minX, box.x - boxHalfSize);
      minY = Math.min(minY, box.y - boxHalfSize);
      maxX = Math.max(maxX, box.x + boxHalfSize);
      maxY = Math.max(maxY, box.y + boxHalfSize);
    });
    
    // Add margin
    const margin = 20;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;
    
    // Draw the bounding box
    ctx.strokeStyle = '#999999';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    ctx.setLineDash([]);
    
    ctx.restore();
  }
  
  /**
   * Draw debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawDebugInfo(ctx, parameters) {
    ctx.save();
    
    // Reset transform to work in screen space
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw a semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 220, 150);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    let y = 20;
    ctx.fillText(`Particles: ${this.state.particles.length}`, 20, y);
    y += 20;
    ctx.fillText(`Paused: ${this.state.isPaused}`, 20, y);
    y += 20;
    ctx.fillText(`Simulation Time: ${this.state.currentTime.toFixed(2)}s`, 20, y);
    y += 20;
    ctx.fillText(`Time Factor: ${this.state.realTimeFactor.toFixed(1)}x`, 20, y);
    y += 20;
    ctx.fillText(`Events: ${this.state.eventsOccurred}`, 20, y);
    y += 20;
    
    // Add specific debug info for each model
    this.drawSpecificDebugInfo(ctx, y);
    
    ctx.restore();
  }
  
  /**
   * Draw model-specific debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startY - Y position to start drawing
   */
  drawSpecificDebugInfo(ctx, startY) {
    // Override in subclasses to add specific debug info
  }
  
  /**
   * Clean up resources when visualization is no longer needed
   */
  dispose() {
    // Reset state
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