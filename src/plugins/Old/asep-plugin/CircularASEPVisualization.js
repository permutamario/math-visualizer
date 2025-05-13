// src/plugins/asep-plugin/CircularASEPVisualization.js
import { BaseASEPVisualization } from './BaseASEPVisualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Circular ASEP model - particles move in a circular arrangement
 * with periodic boundary conditions
 */
export class CircularASEPVisualization extends BaseASEPVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Add specific state for circular layout
    this.state.radius = 200;
  }
  
  /**
   * Define visualization-specific parameters
   * @returns {Array} Array of parameter definitions
   * @static
   */
  static getParameters() {
    return createParameters()
      .addSlider('numSites', 'Number of Sites', 10, { min: 3, max: 20, step: 1 })
      .addSlider('numParticles', 'Number of Particles', 5, { min: 1, max: 15, step: 1 })
      .addSlider('rightJumpRate', 'Right Jump Rate', 0.7, { min: 0.1, max: 2.0, step: 0.1 })
      .addSlider('leftJumpRate', 'Left Jump Rate', 0.3, { min: 0.0, max: 2.0, step: 0.1 })
      .build();
  }
  
  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    try {
      // Reset state
      this.state.sites = [];
      this.state.particles = [];
      this.state.jumpingParticles = [];
      this.state.currentTime = 0;
      this.state.timeScale = 1.0;
      
      // Create sites in a circular arrangement
      this.createCircularSites(parameters);
      
      // Create particles
      this.createParticles(parameters);
      
      return true;
    } catch (error) {
      console.error("Error initializing CircularASEPVisualization:", error);
      return false;
    }
  }
  
  /**
   * Create sites in a circular arrangement
   * @param {Object} parameters - Visualization parameters
   */
  createCircularSites(parameters) {
    const numSites = parameters.numSites || 10;
    const boxSize = this.state.boxSize;
    
    // Calculate appropriate radius based on number of sites
    // Ensure the boxes don't overlap
    this.state.radius = Math.max(150, numSites * boxSize / (2 * Math.PI) * 1.2);
    
    // Create sites
    for (let i = 0; i < numSites; i++) {
      // Calculate angle for this site
      const angle = (i / numSites) * Math.PI * 2;
      
      // Calculate position on circle
      const x = Math.cos(angle) * this.state.radius;
      const y = Math.sin(angle) * this.state.radius;
      
      this.state.sites.push({
        index: i,
        angle: angle,
        x: x,
        y: y,
        size: boxSize
      });
    }
  }
  
  /**
   * Create particles at random positions
   * @param {Object} parameters - Visualization parameters
   */
  createParticles(parameters) {
    const numSites = this.state.sites.length;
    const numParticles = Math.min(parameters.numParticles || 5, numSites);
    const rightJumpRate = parameters.rightJumpRate || 0.7;
    const leftJumpRate = parameters.leftJumpRate || 0.3;
    
    // Generate unique random positions
    const positions = [];
    while (positions.length < numParticles) {
      const pos = Math.floor(Math.random() * numSites);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    
    // Get particle color
    const particleColor = this.getColor('particle');
    
    // Create particles
    for (let i = 0; i < numParticles; i++) {
      const particle = {
        id: i,
        siteIndex: positions[i],
        isJumping: false,
        jumpProgress: 0,
        startSite: positions[i],
        targetSite: positions[i],
        color: particleColor,
        originalColor: particleColor,
        radius: this.state.particleRadius,
        
        // CTMC properties
        rightJumpRate: rightJumpRate,
        leftJumpRate: leftJumpRate,
        nextRightJumpTime: 0,
        nextLeftJumpTime: 0
      };
      
      // Schedule initial jump events
      this.scheduleJumpEvents(particle);
      
      // Add to particles array
      this.state.particles.push(particle);
    }
  }
  
  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - Changed parameters
   */
  update(parameters) {
    // Handle parameter changes that require regenerating the system
    if (parameters.numSites !== undefined && 
        parameters.numSites !== this.state.sites.length) {
      // Full reset with new parameters
      this.initialize({
        ...this.plugin.pluginParameters,
        ...this.plugin.visualizationParameters,
        ...this.plugin.advancedParameters
      });
      return;
    }
    
    // Handle particle count changes
    if (parameters.numParticles !== undefined) {
      this.updateParticleCount(parameters.numParticles);
    }
    
    // Update jump rates if changed
    if (parameters.rightJumpRate !== undefined || parameters.leftJumpRate !== undefined) {
      this.updateJumpRates(parameters);
    }
  }
  
  /**
   * Update particle count to match target
   * @param {number} targetCount - Target number of particles
   */
  updateParticleCount(targetCount) {
    const currentCount = this.state.particles.length;
    
    if (targetCount > currentCount) {
      // Add particles
      this.addParticles(targetCount - currentCount);
    } else if (targetCount < currentCount) {
      // Remove particles
      this.removeParticles(currentCount - targetCount);
    }
  }
  
  /**
   * Add specified number of particles to random empty sites
   * @param {number} count - Number of particles to add
   */
  addParticles(count) {
    const numSites = this.state.sites.length;
    const particleColor = this.getColor('particle');
    const rightJumpRate = this.plugin.visualizationParameters.rightJumpRate || 0.7;
    const leftJumpRate = this.plugin.visualizationParameters.leftJumpRate || 0.3;
    
    // Find empty sites
    const occupiedSites = this.state.particles.map(p => p.siteIndex);
    const emptySites = [];
    
    for (let i = 0; i < numSites; i++) {
      if (!occupiedSites.includes(i) && !this.isSiteOccupied(i)) {
        emptySites.push(i);
      }
    }
    
    // Add particles to random empty sites
    for (let i = 0; i < count && emptySites.length > 0; i++) {
      // Select random empty site
      const randomIndex = Math.floor(Math.random() * emptySites.length);
      const siteIndex = emptySites[randomIndex];
      
      // Remove site from available list
      emptySites.splice(randomIndex, 1);
      
      // Create particle
      const newId = Math.max(...this.state.particles.map(p => p.id), -1) + 1;
      const particle = {
        id: newId,
        siteIndex: siteIndex,
        isJumping: false,
        jumpProgress: 0,
        startSite: siteIndex,
        targetSite: siteIndex,
        color: particleColor,
        originalColor: particleColor,
        radius: this.state.particleRadius,
        
        // CTMC properties
        rightJumpRate: rightJumpRate,
        leftJumpRate: leftJumpRate,
        nextRightJumpTime: 0,
        nextLeftJumpTime: 0
      };
      
      // Schedule jump events
      this.scheduleJumpEvents(particle);
      
      // Add to particles array
      this.state.particles.push(particle);
    }
  }
  
  /**
   * Remove specified number of particles
   * @param {number} count - Number of particles to remove
   */
  removeParticles(count) {
    // Sort particles by ID and remove the highest IDs
    const sortedParticles = [...this.state.particles].sort((a, b) => a.id - b.id);
    const particlesToRemove = sortedParticles.slice(0, count);
    
    // Remove particles from main array and jumping array
    this.state.particles = this.state.particles.filter(p => !particlesToRemove.includes(p));
    this.state.jumpingParticles = this.state.jumpingParticles.filter(p => !particlesToRemove.includes(p));
  }
  
  /**
   * Update jump rates for particles
   * @param {Object} parameters - New parameters
   */
  updateJumpRates(parameters) {
    const rightRate = parameters.rightJumpRate;
    const leftRate = parameters.leftJumpRate;
    
    // Update each particle's rates
    for (const particle of this.state.particles) {
      // Update right jump rate if specified
      if (rightRate !== undefined && particle.rightJumpRate !== rightRate) {
        // Calculate how far into the clock we are
        const remainingTime = particle.nextRightJumpTime - this.state.currentTime;
        
        if (remainingTime > 0) {
          // Scale remaining time proportionally to new rate
          const oldRate = particle.rightJumpRate;
          const newRemainingTime = rightRate > 0 ? 
                                   remainingTime * (oldRate / rightRate) : 
                                   Infinity;
          
          particle.nextRightJumpTime = this.state.currentTime + newRemainingTime;
        } else {
          // Clock already expired, generate new time
          particle.nextRightJumpTime = this.state.currentTime + this.generateExponentialTime(rightRate);
        }
        
        // Update the rate
        particle.rightJumpRate = rightRate;
      }
      
      // Update left jump rate if specified
      if (leftRate !== undefined && particle.leftJumpRate !== leftRate) {
        // Calculate how far into the clock we are
        const remainingTime = particle.nextLeftJumpTime - this.state.currentTime;
        
        if (remainingTime > 0) {
          // Scale remaining time proportionally to new rate
          const oldRate = particle.leftJumpRate;
          const newRemainingTime = leftRate > 0 ? 
                                  remainingTime * (oldRate / leftRate) : 
                                  Infinity;
          
          particle.nextLeftJumpTime = this.state.currentTime + newRemainingTime;
        } else {
          // Clock already expired, generate new time
          particle.nextLeftJumpTime = this.state.currentTime + this.generateExponentialTime(leftRate);
        }
        
        // Update the rate
        particle.leftJumpRate = leftRate;
      }
    }
  }
  
  /**
   * Get the modular site index (for wraparound)
   * @param {number} index - Raw site index
   * @returns {number} Normalized site index with wraparound
   */
  getNormalizedSiteIndex(index) {
    const numSites = this.state.sites.length;
    return ((index % numSites) + numSites) % numSites;
  }
  
  /**
   * Update ASEP dynamics by processing jump events
   */
  updateParticleDynamics() {
    // Skip particles that are currently jumping
    const stationaryParticles = this.state.particles.filter(p => !p.isJumping);
    
    // Check each particle for jump events
    for (const particle of stationaryParticles) {
      const currentTime = this.state.currentTime;
      
      // Check right jump
      if (particle.nextRightJumpTime <= currentTime) {
        // Calculate target site (with wraparound)
        const targetSite = this.getNormalizedSiteIndex(particle.siteIndex + 1);
        
        // Check if target site is free
        if (!this.isSiteOccupied(targetSite)) {
          // Execute the jump
          this.startJumpAnimation(particle, targetSite);
        } else {
          // Reset the clock even though jump failed
          particle.nextRightJumpTime = currentTime + this.generateExponentialTime(particle.rightJumpRate);
        }
      }
      
      // Check left jump
      else if (particle.nextLeftJumpTime <= currentTime) {
        // Calculate target site (with wraparound)
        const targetSite = this.getNormalizedSiteIndex(particle.siteIndex - 1);
        
        // Check if target site is free
        if (!this.isSiteOccupied(targetSite)) {
          // Execute the jump
          this.startJumpAnimation(particle, targetSite);
        } else {
          // Reset the clock even though jump failed
          particle.nextLeftJumpTime = currentTime + this.generateExponentialTime(particle.leftJumpRate);
        }
      }
    }
  }
  
  /**
   * Calculate interpolated position for a jumping particle
   * @param {Object} particle - Jumping particle
   * @returns {Object} Interpolated x,y position
   */
  calculateJumpPosition(particle) {
    const t = particle.jumpProgress;
    const numSites = this.state.sites.length;
    
    // Get start and end sites
    const startSite = this.state.sites[particle.startSite];
    const endSite = this.state.sites[particle.targetSite];
    
    // FIX: Correctly determine if it's a wraparound jump
    // Look at the difference between site indices, not the absolute difference
    const indexDifference = Math.abs(particle.targetSite - particle.startSite);
    const isWraparound = indexDifference > 1;
    
    // For non-wraparound jumps or small index differences, do simple interpolation
    if (!isWraparound) {
      // Use angular interpolation to follow the circle
      let startAngle = startSite.angle;
      let endAngle = endSite.angle;
      
      // Handle wrapping around the circle (take shorter path)
      if (Math.abs(endAngle - startAngle) > Math.PI) {
        if (endAngle > startAngle) {
          startAngle += 2 * Math.PI;
        } else {
          endAngle += 2 * Math.PI;
        }
      }
      
      // Interpolate angle
      const angle = startAngle + (endAngle - startAngle) * t;
      
      // Calculate position
      return {
        x: Math.cos(angle) * this.state.radius,
        y: Math.sin(angle) * this.state.radius
      };
    } 
    // For wraparound jumps, we need to determine the correct direction
    else {
      // FIX: Properly determine jump direction for wraparound jumps
      // For jumps that wrap around the circle, determine direction based on
      // right or left jump type, rather than the indices
      
      // If target site is site 0 and start site is the last site (n-1),
      // this is a rightward wraparound jump (clockwise)
      const isRightJump = (particle.targetSite === 0 && particle.startSite === numSites - 1);
      
      // If target site is the last site (n-1) and start site is site 0,
      // this is a leftward wraparound jump (counterclockwise)
      const isLeftJump = (particle.targetSite === numSites - 1 && particle.startSite === 0);
      
      // Get angles for interpolation
      let startAngle = startSite.angle;
      let endAngle = endSite.angle;
      
      // For right jumps (clockwise wraparound), add 2π to start angle
      if (isRightJump) {
        startAngle += 2 * Math.PI;
      }
      // For left jumps (counterclockwise wraparound), add 2π to end angle
      else if (isLeftJump) {
        endAngle += 2 * Math.PI;
      }
      // For other jumps (non-wraparound), handle normally
      else {
        // This should not happen, but just in case
        if (endAngle < startAngle) {
          if (particle.targetSite > particle.startSite) {
            // Moving clockwise (right)
            endAngle += 2 * Math.PI;
          } else {
            // Moving counterclockwise (left)
            startAngle += 2 * Math.PI;
          }
        }
      }
      
      // Interpolate angle
      const angle = startAngle + (endAngle - startAngle) * t;
      
      // Calculate position
      return {
        x: Math.cos(angle) * this.state.radius,
        y: Math.sin(angle) * this.state.radius
      };
    }
  }
  
  /**
   * Render the visualization in 2D
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render2D(ctx) {
    if (!ctx) return;
    
    const showBoundingBox = this.plugin.pluginParameters.showBoundingBox || false;
    const showDebug = this.plugin.advancedParameters.debugMode || false;
    
    ctx.save();
    
    // Draw circular track
    this.drawCircularTrack(ctx);
    
    // Draw boxes for sites
    this.drawSites(ctx);
    
    // Draw particles
    this.drawParticles(ctx);
    
    // Draw bounding box if enabled
    if (showBoundingBox) {
      this.drawBoundingBox(ctx);
    }
    
    // Draw debug info if enabled
    if (showDebug) {
      this.drawDebugInfo(ctx);
    }
    
    ctx.restore();
  }
  
  /**
   * Draw circular track
   * @param {CanvasRenderingContext2D} ctx - Canvas context 
   */
  drawCircularTrack(ctx) {
    const boxColor = this.getColor('box');
    
    ctx.save();
    ctx.strokeStyle = boxColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    
    // Draw circular path
    ctx.beginPath();
    ctx.arc(0, 0, this.state.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }
  
  /**
   * Draw bounding box
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawBoundingBox(ctx) {
    const boxSize = this.state.boxSize;
    const radius = this.state.radius;
    
    ctx.save();
    ctx.strokeStyle = '#999999';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    
    // Draw square bounding box
    const size = radius + boxSize + 10;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    
    ctx.setLineDash([]);
    ctx.restore();
  }
  
  /**
   * Draw sites (boxes)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawSites(ctx) {
    const boxColor = this.getColor('box');
    const boxSize = this.state.boxSize;
    const showLabels = this.plugin.pluginParameters.showLabels || false;
    
    ctx.save();
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2;
    
    // Draw each site
    for (const site of this.state.sites) {
      ctx.save();
      
      // Move to site position
      ctx.translate(site.x, site.y);
      
      // Rotate to align with circle tangent
      ctx.rotate(site.angle + Math.PI/2);
      
      // Draw box
      const halfSize = boxSize / 2;
      ctx.strokeRect(-halfSize, -halfSize, boxSize, boxSize);
      
      // Draw site index if labels enabled
      if (showLabels) {
        ctx.fillStyle = boxColor;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(site.index.toString(), 0, boxSize);
      }
      
      ctx.restore();
    }
    
    ctx.restore();
  }
  
  /**
   * Draw particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawParticles(ctx) {
    const particleColor = this.getColor('particle');
    const jumpingColor = this.getColor('jumpingParticle');
    const showLabels = this.plugin.pluginParameters.showLabels || false;
    
    ctx.save();
    
    // Draw stationary particles
    for (const particle of this.state.particles) {
      if (particle.isJumping) continue; // Skip jumping particles
      
      const site = this.state.sites[particle.siteIndex];
      
      // Draw particle at site position
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(site.x, site.y, this.state.particleRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw particle ID if labels enabled
      if (showLabels) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.id.toString(), site.x, site.y);
      }
    }
    
    // Draw jumping particles
    for (const particle of this.state.jumpingParticles) {
      // Calculate interpolated position
      const pos = this.calculateJumpPosition(particle);
      
      // Interpolate color between particle and jumping color
      ctx.fillStyle = this.lerpColor(particleColor, jumpingColor, 0.5);
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, this.state.particleRadius * 1.1, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw particle ID if labels enabled
      if (showLabels) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.id.toString(), pos.x, pos.y);
      }
    }
    
    ctx.restore();
  }
  
  /**
   * Draw model-specific debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startY - Y position to start drawing
   */
  drawSpecificDebugInfo(ctx, startY) {
    let y = startY || 110;
    
    // Get parameters
    const rightRate = this.plugin.visualizationParameters.rightJumpRate || 0.7;
    const leftRate = this.plugin.visualizationParameters.leftJumpRate || 0.3;
    
    // Draw parameters
    ctx.fillText(`Right Jump Rate: ${rightRate.toFixed(1)}`, 20, y);
    y += 20;
    ctx.fillText(`Left Jump Rate: ${leftRate.toFixed(1)}`, 20, y);
    y += 20;
    ctx.fillText(`Circle Radius: ${this.state.radius.toFixed(0)}px`, 20, y);
  }
  
  /**
   * Handle user interaction
   * @param {string} type - Interaction type (e.g., "click")
   * @param {Object} event - Event data with x, y coordinates
   * @returns {boolean} Whether the interaction was handled
   */
  handleInteraction(type, event) {
    if (type === 'click') {
      // Check if a site was clicked
      for (let i = 0; i < this.state.sites.length; i++) {
        const site = this.state.sites[i];
        const dx = event.x - site.x;
        const dy = event.y - site.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If click was within this site
        if (distance <= this.state.boxSize / 1.5) {
          // Check if site has a particle
          const hasParticle = this.isSiteOccupied(i);
          
          if (hasParticle) {
            // Find and remove particle
            const particleIndex = this.state.particles.findIndex(p => 
              p.siteIndex === i && !p.isJumping
            );
            
            if (particleIndex >= 0) {
              this.state.particles.splice(particleIndex, 1);
              
              // Update count parameter
              const newCount = this.state.particles.length;
              this.plugin.updateParameter('numParticles', newCount, 'visualization');
            }
          } else {
            // Add particle if site is empty
            const particleColor = this.getColor('particle');
            const rightJumpRate = this.plugin.visualizationParameters.rightJumpRate || 0.7;
            const leftJumpRate = this.plugin.visualizationParameters.leftJumpRate || 0.3;
            
            // Create new particle
            const newId = Math.max(...this.state.particles.map(p => p.id), -1) + 1;
            const particle = {
              id: newId,
              siteIndex: i,
              isJumping: false,
              jumpProgress: 0,
              startSite: i,
              targetSite: i,
              color: particleColor,
              originalColor: particleColor,
              radius: this.state.particleRadius,
              
              // CTMC properties
              rightJumpRate: rightJumpRate,
              leftJumpRate: leftJumpRate,
              nextRightJumpTime: 0,
              nextLeftJumpTime: 0
            };
            
            // Schedule jump events
            this.scheduleJumpEvents(particle);
            
            // Add to particles array
            this.state.particles.push(particle);
            
            // Update count parameter
            const newCount = this.state.particles.length;
            this.plugin.updateParameter('numParticles', newCount, 'visualization');
          }
          
          return true;
        }
      }
    }
    
    return false;
  }
}