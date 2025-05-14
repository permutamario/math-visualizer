// src/plugins/asep-plugin/BaseASEPVisualization.js
import { Visualization } from '../../core/Visualization.js';

/**
 * Base class for ASEP visualizations with shared functionality
 */
export class BaseASEPVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Flag for animation
    this.isAnimating = true;
    
    // Initialize base state shared across ASEP visualizations
    this.state = {
      // Canvas/rendering settings
      boxSize: 40,
      particleRadius: 15,
      
      // Color indices from color palette
      colorIndices: {
        box: 1,
        particle: 0,
        jumpingParticle: 2
      },
      
      // Core simulation data
      sites: [],       // Array representing lattice sites
      particles: [],   // Array of particle objects
      
      // Animation state
      jumpingParticles: [], // Particles currently in jump animation
      
      // Simulation time
      currentTime: 0,
      timeScale: 1.0
    };
  }

  /**
   * Generate exponential random time based on rate parameter
   * @param {number} rate - Rate parameter for the exponential distribution
   * @returns {number} Random time value from exponential distribution
   */
  generateExponentialTime(rate) {
    if (rate <= 0) return Infinity;
    
    // Exponential distribution formula: -ln(U)/rate where U is uniform(0,1)
    const u = Math.random();
    return -Math.log(u) / rate;
  }

  /**
   * Check if a site is occupied by a stationary particle
   * @param {number} siteIndex - Index of the site to check
   * @param {Object} excludeParticle - Optional particle to exclude from check
   * @returns {boolean} Whether the site is occupied
   */
  isSiteOccupied(siteIndex, excludeParticle = null) {
    // Check if any particle is at this site and not currently jumping
    return this.state.particles.some(p => 
      p !== excludeParticle && 
      p.siteIndex === siteIndex && 
      !p.isJumping
    );
  }

  /**
   * Start animation for a particle jumping to a new site
   * @param {Object} particle - Particle to animate
   * @param {number} targetSite - Index of the target site
   */
  startJumpAnimation(particle, targetSite) {
    if (!particle) return;
    
    // Set jumping state
    particle.isJumping = true;
    particle.jumpProgress = 0;
    particle.startSite = particle.siteIndex;
    particle.targetSite = targetSite;
    particle.originalColor = particle.color;
    
    // Add to jumping particles list for animation
    this.state.jumpingParticles.push(particle);
  }

  /**
   * Complete a jump for a particle
   * @param {Object} particle - Particle that completed jump
   */
  completeJump(particle) {
    if (!particle) return;
    
    // Update particle state
    particle.isJumping = false;
    particle.jumpProgress = 0;
    particle.siteIndex = particle.targetSite;
    particle.color = particle.originalColor;
    
    // Remove from jumping list
    this.state.jumpingParticles = this.state.jumpingParticles.filter(p => p !== particle);
    
    // Reschedule jump events
    this.scheduleJumpEvents(particle);
  }

  /**
   * Schedule jump events for a particle by setting left and right jump times
   * @param {Object} particle - Particle to schedule events for
   */
  scheduleJumpEvents(particle) {
    if (!particle) return;
    
    // Get current jump rates
    const rightRate = particle.rightJumpRate;
    const leftRate = particle.leftJumpRate;
    
    // Generate new jump times
    particle.nextRightJumpTime = this.state.currentTime + this.generateExponentialTime(rightRate);
    particle.nextLeftJumpTime = this.state.currentTime + this.generateExponentialTime(leftRate);
  }

  /**
   * Animate the simulation
   * @param {number} deltaTime - Real time elapsed since last frame in seconds
   * @returns {boolean} Whether a render is needed
   */
  animate(deltaTime) {
    // Always render when animating
    this.isAnimating = true;
    
    // Get animation speed from parameters
    const animationSpeed = this.plugin.pluginParameters.animationSpeed || 1.0;
    const isPaused = this.plugin.pluginParameters.pauseSimulation || false;
    
    // Update jump animations
    this.updateJumpAnimations(deltaTime, animationSpeed);
    
    // Only update simulation time when not paused
    if (!isPaused) {
      // Advance simulation time (scaled by animation speed)
      this.state.currentTime += deltaTime * this.state.timeScale * animationSpeed;
      
      // Update particle dynamics - process any due jump events
      this.updateParticleDynamics();
    }
    
    return true;
  }

  /**
   * Update animations for particles that are currently jumping
   * @param {number} deltaTime - Time elapsed since last frame
   * @param {number} speedFactor - Animation speed multiplier
   */
  updateJumpAnimations(deltaTime, speedFactor) {
    // Process all jumping particles
    const completedJumps = [];
    
    for (const particle of this.state.jumpingParticles) {
      // Progress the jump animation
      particle.jumpProgress += deltaTime * speedFactor * 2.0;
      
      // Check if jump animation is complete
      if (particle.jumpProgress >= 1.0) {
        completedJumps.push(particle);
      }
    }
    
    // Complete finished jumps
    for (const particle of completedJumps) {
      this.completeJump(particle);
    }
  }

  /**
   * Update ASEP dynamics by processing jump events
   * Must be implemented by subclasses
   */
  updateParticleDynamics() {
    // To be implemented by subclasses
  }

  /**
   * Get color from palette
   * @param {string} type - Type of element ('box', 'particle', or 'jumpingParticle')
   * @returns {string} Color string
   */
  getColor(type) {
    // Default colors in case palette is not available
    const defaultColors = {
      box: '#2c3e50',
      particle: '#3498db',
      jumpingParticle: '#e74c3c'
    };
    
    // Try to get from palette
    if (this.plugin && this.plugin.core && this.plugin.core.colorSchemeManager) {
      const palette = this.plugin.core.colorSchemeManager.getCurrentPalette();
      if (palette) {
        const index = this.state.colorIndices[type] || 0;
        if (palette[index]) {
          return palette[index];
        }
      }
    }
    
    // Fallback to default color
    return defaultColors[type] || '#333333';
  }

  /**
   * Interpolate between two colors
   * @param {string} color1 - Starting color
   * @param {string} color2 - Ending color
   * @param {number} amount - Interpolation amount (0-1)
   * @returns {string} Interpolated color
   */
  lerpColor(color1, color2, amount) {
    // Parse colors to RGB
    const parseColor = (color) => {
      if (color.startsWith('#')) {
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);
        return { r, g, b };
      }
      
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3])
        };
      }
      
      return { r: 0, g: 0, b: 0 };
    };
    
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * amount);
    const g = Math.round(c1.g + (c2.g - c1.g) * amount);
    const b = Math.round(c1.b + (c2.b - c1.b) * amount);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Draw debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawDebugInfo(ctx) {
    ctx.save();
    
    // Reset transform to screen space for text
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 250, 150);
    
    // Draw debug text
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    let y = 30;
    ctx.fillText(`Time: ${this.state.currentTime.toFixed(2)}s`, 20, y);
    y += 20;
    ctx.fillText(`Particles: ${this.state.particles.length}`, 20, y);
    y += 20;
    ctx.fillText(`Sites: ${this.state.sites.length}`, 20, y);
    y += 20;
    ctx.fillText(`Animating: ${this.state.jumpingParticles.length}`, 20, y);
    y += 20;
    
    // Add visualization-specific debug info
    this.drawSpecificDebugInfo(ctx, y);
    
    ctx.restore();
  }

  /**
   * Draw model-specific debug information (to be overridden)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startY - Y position to start drawing
   */
  drawSpecificDebugInfo(ctx, startY) {
    // Default empty implementation
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Clear all state
    this.state.sites = [];
    this.state.particles = [];
    this.state.jumpingParticles = [];
    this.isAnimating = false;
  }
}