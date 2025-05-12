// src/plugins/asep-plugin/BaseASEPVisualization.js
import { Visualization } from '../../core/Visualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

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
      updateInterval: 500,      // ms between updates (discrete time steps)
      lastUpdateTime: 0,        // Track time since last update
      boxSize: 40,              // Fixed box size (pixels)
      particleRadius: 14,       // Fixed particle radius (pixels)
      colorIndices: {           // Default color indices from the palette
        particle: 0,            // First color for particles
        box: 1,                 // Second color for boxes
        jump: 2,                // Third color for jumping particles
        portal: 4               // Fifth color for portals
      }
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
    
    // Set update interval based on animation speed
    this.state.updateInterval = 500 / (parameters.animationSpeed || 1.0);
    
    return true;
  }

  /**
   * Clear any existing simulation state
   */
  clearSimulation() {
    // Reset state
    this.state.boxes = [];
    this.state.particles = [];
    this.state.lastUpdateTime = 0;
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

    // Get particle color from the palette
    const particleColor = this.getColorFromPalette(parameters, this.state.colorIndices.particle);
    
    // Create particles
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
        insideProgress: 0
      });
    }
  }
  
  /**
   * NEW: Global update method for probability-based updates
   * @param {number} deltaTime - Time since last frame in seconds
   */
  updateSimulation(deltaTime) {
    if (this.state.isPaused) return;
    
    // Accumulate time since last update
    this.state.lastUpdateTime += deltaTime * 1000; // convert to ms
    
    // Only update at fixed intervals (for discrete-time model)
    if (this.state.lastUpdateTime < this.state.updateInterval) return;
    
    // Reset timer
    this.state.lastUpdateTime = 0;
    
    // Process particles in random order to avoid bias
    const shuffledParticles = [...this.state.particles];
    for (let i = shuffledParticles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledParticles[i], shuffledParticles[j]] = [shuffledParticles[j], shuffledParticles[i]];
    }
    
    // Process each particle
    for (const particle of shuffledParticles) {
      if (particle.isJumping) continue; // Skip particles already in motion
      
      this.attemptParticleJump(particle);
    }
    
    // Handle boundary dynamics
    this.handleBoundaryDynamics();
  }
  
  /**
   * NEW: Method to attempt particle jumps based on probabilities
   * @param {Object} particle - Particle to attempt jump with
   */
  attemptParticleJump(particle) {
    // Override in subclasses to implement specific jump logic
  }
  
  /**
   * NEW: Method to handle boundary dynamics
   */
  handleBoundaryDynamics() {
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
    
    // Update the simulation with probability-based model
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
    
    // Update animation speed
    if (parameters.animationSpeed !== undefined) {
      this.state.updateInterval = 500 / parameters.animationSpeed;
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
    ctx.fillRect(10, 10, 220, 130);
    
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
    ctx.fillText(`Update Interval: ${this.state.updateInterval.toFixed(0)} ms`, 20, y);
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