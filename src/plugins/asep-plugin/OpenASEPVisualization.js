// src/plugins/asep-plugin/OpenASEPVisualization.js
import { BaseASEPVisualization } from './BaseASEPVisualization.js';

/**
 * Open boundary ASEP model - particles can enter/exit at the boundaries
 */
export class OpenASEPVisualization extends BaseASEPVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Add portal state properties
    this.state.leftPortal = null;
    this.state.rightPortal = null;
    this.state.particleCount = 0;
  }
  
  /**
   * Initialize the visualization with parameters
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Clear any existing state
    this.clearSimulation();
    
    // Create boxes
    this.createBoxes(parameters);
    
    // Create portals
    this.createPortals(parameters);
    
    // Create initial particles with random positions
    this.createParticles(parameters);
    
    // Store particle count
    this.state.particleCount = this.state.particles.length;
    
    // Schedule initial jumps for each particle
    this.scheduleInitialJumps();
    
    // Set animation flag
    this.state.isAnimating = true;
    this.isAnimating = true;  // Direct property for RenderingManager
    this.state.isPaused = parameters.isPaused || false;
    
    // Set timeScale from parameters
    this.state.timeScale = parameters.animationSpeed || 1.0;
    
    return true;
  }
  
  /**
   * Create boxes for the ASEP lattice
   * @param {Object} parameters - Visualization parameters
   */
  createBoxes(parameters) {
    const numBoxes = parameters.numBoxes;
    const boxSize = this.state.boxSize;
    
    // Calculate total width to center the boxes
    const totalWidth = numBoxes * boxSize;
    const startX = -totalWidth / 2;
    
    // Create boxes
    for (let i = 0; i < numBoxes; i++) {
      this.state.boxes.push({
        index: i,
        x: startX + (i * boxSize) + boxSize / 2, // center x position
        y: 0,  // center y position
        size: boxSize
      });
    }
  }
  
  /**
   * Create entrance/exit portals
   * @param {Object} parameters - Visualization parameters
   */
  createPortals(parameters) {
    const boxSize = this.state.boxSize;
    const firstBox = this.state.boxes[0];
    const lastBox = this.state.boxes[this.state.boxes.length - 1];
    
    // Get portal color from palette
    const portalColor = this.getColorFromPalette(parameters, this.state.colorIndices.portal);

    // Create left portal (entry)
    this.state.leftPortal = {
      x: firstBox.x - boxSize,
      y: firstBox.y,
      size: boxSize * 0.8,
      color: portalColor,
      entryRate: parameters.entryRate || 0.5
    };
    
    // Create right portal (exit)
    this.state.rightPortal = {
      x: lastBox.x + boxSize,
      y: lastBox.y,
      size: boxSize * 0.8,
      color: portalColor,
      exitRate: parameters.exitRate || 0.5
    };
  }
  
  /**
   * Schedule the next jump for a particle
   * @param {Object} particle - Particle to schedule jump for
   */
  scheduleNextJump(particle) {
    if (this.state.isPaused) return;
    
    const rightRate = this.plugin.parameters.rightJumpRate;
    const leftRate = this.plugin.parameters.leftJumpRate;
    const exitRate = this.plugin.parameters.exitRate || 0.5;
    
    // Determine total rate and waiting time
    let totalRate = rightRate + leftRate;
    
    // Add exit rate if particle is at the rightmost box
    if (particle.position === this.state.boxes.length - 1) {
      totalRate += exitRate;
    }
    
    const waitTime = -Math.log(Math.random()) / totalRate;
    const scaledWaitTime = waitTime / this.state.timeScale;
    
    // Create jump event
    const jumpEvent = {
      particleId: particle.id,
      timeoutId: setTimeout(() => {
        // Choose movement type based on rates
        const rand = Math.random() * totalRate;
        
        if (particle.position === this.state.boxes.length - 1 && rand > rightRate + leftRate) {
          // Exit right through portal
          particle.isJumping = true;
          particle.jumpProgress = 0;
          particle.startPosition = particle.position;
          particle.targetPosition = this.state.boxes.length; // Special value for portal
          particle.originalColor = particle.color;
          particle.jumpState = 'exiting'; // Exiting the system
          
          // Decrease particle count
          this.state.particleCount--;
          
          // Remove event from tracking array
          this.state.jumpEvents = this.state.jumpEvents.filter(
            e => e.timeoutId !== jumpEvent.timeoutId
          );
        } else {
          // Normal jump left or right
          const jumpRight = rand < rightRate;
          
          const targetPos = jumpRight ? 
            particle.position + 1 : 
            particle.position - 1;
          
          // Ensure target position is valid (within bounds for open model)
          if (targetPos >= 0 && targetPos < this.state.boxes.length) {
            // Check if target position is empty
            if (!this.isPositionOccupied(targetPos, particle)) {
              // Start jump animation
              particle.isJumping = true;
              particle.jumpProgress = 0;
              particle.startPosition = particle.position;
              particle.targetPosition = targetPos;
              particle.originalColor = particle.color;
              particle.jumpState = 'entering'; // Start the jump animation sequence
              
              // Remove event from tracking array
              this.state.jumpEvents = this.state.jumpEvents.filter(
                e => e.timeoutId !== jumpEvent.timeoutId
              );
            } else {
              // Target is occupied, try again
              this.scheduleNextJump(particle);
            }
          } else {
            // Position out of bounds, try again
            this.scheduleNextJump(particle);
          }
        }
      }, scaledWaitTime * 1000) // Convert to milliseconds
    };
    
    // Add to jump events array for tracking
    this.state.jumpEvents.push(jumpEvent);
  }
  
  /**
   * Try to generate a new particle from the left portal
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  tryGenerateParticle(deltaTime) {
    if (this.state.isPaused) return;
    
    const entryRate = this.plugin.parameters.entryRate || 0.5;
    
    // Calculate probability for this frame
    const probability = entryRate * 0.01 * deltaTime;
    
    // Check if first position is empty
    if (Math.random() < probability && !this.isPositionOccupied(0)) {
      this.generateNewParticleFromLeft();
    }
  }
  
  /**
   * Generate a new particle from the left portal
   */
  generateNewParticleFromLeft() {
    // Get particle color from palette
    const particleColor = this.getColorFromPalette(this.plugin.parameters, this.state.colorIndices.particle);

    // Find the highest ID to create a new unique ID
    const maxId = Math.max(...this.state.particles.map(p => p.id), -1);
    
    // Create the new particle
    const newParticle = {
      id: maxId + 1,
      position: 0,
      isJumping: true,
      jumpProgress: 0,
      startPosition: -1,
      targetPosition: 0,
      color: particleColor,
      originalColor: particleColor,
      radius: this.state.particleRadius,
      jumpSpeed: 2.0,
      jumpState: 'entering',
      insideProgress: 0
    };
    
    // Add to particles array
    this.state.particles.push(newParticle);
    
    // Increase particle count
    this.state.particleCount++;
  }
  
  /**
   * Custom animate function for open model
   * Handles particle generation from the left portal
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  customAnimate(deltaTime) {
    // Try to generate a new particle from left portal
    this.tryGenerateParticle(deltaTime);
    
    // Update count display/slider if needed
    if (this.plugin && this.plugin.parameters && 
        this.plugin.parameters.numParticles !== this.state.particleCount) {
      // Dynamic update of particle count for UI
      this.plugin.parameters.numParticles = this.state.particleCount;
      
      // Update UI if core exists
      if (this.plugin.core && this.plugin.core.uiManager) {
        this.plugin.core.uiManager.updateControls({
          numParticles: this.state.particleCount
        });
      }
    }
  }
  
  /**
   * Complete a jump for a particle
   * @param {Object} particle - Particle that completed jump
   * @param {Array} particlesToRemove - Array to add particles to remove to
   */
  completeJump(particle, particlesToRemove) {
    // Check if particle is exiting the system
    if (particle.targetPosition === this.state.boxes.length) {
      // Mark for removal
      particlesToRemove.push(particle);
    } else {
      // Normal jump completion
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
  }
  
  /**
   * Handle parameter updates specific to open model
   * @param {Object} parameters - New parameter values
   */
  handleParameterUpdate(parameters) {
    // Update portal rates if provided
    if (parameters.entryRate !== undefined && this.state.leftPortal) {
      this.state.leftPortal.entryRate = parameters.entryRate;
    }
    
    if (parameters.exitRate !== undefined && this.state.rightPortal) {
      this.state.rightPortal.exitRate = parameters.exitRate;
    }
    
    // Update portal colors if color palette changed
    if (parameters.colorPalette !== undefined) {
      const portalColor = this.getColorFromPalette(parameters, this.state.colorIndices.portal);
      if (this.state.leftPortal) this.state.leftPortal.color = portalColor;
      if (this.state.rightPortal) this.state.rightPortal.color = portalColor;
    }
  }
  
  /**
   * Render the visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  render2D(ctx, parameters) {
    // Draw portals first
    this.drawPortals(ctx, parameters);
    
    // Draw boxes using base method with portal connections
    this.drawOpenBoxes(ctx, parameters);
    
    // Draw particles
    this.drawParticles(ctx, parameters);
  }
  
  /**
   * Draw the entrance/exit portals
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawPortals(ctx, parameters) {
    if (this.state.leftPortal && this.state.rightPortal) {
      // Draw left portal
      ctx.beginPath();
      ctx.arc(this.state.leftPortal.x, this.state.leftPortal.y, this.state.leftPortal.size/2, 0, Math.PI * 2);
      ctx.fillStyle = this.state.leftPortal.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw swirl in left portal
      this.drawPortalSwirl(ctx, this.state.leftPortal, Date.now() / 1000);
      
      // Draw right portal
      ctx.beginPath();
      ctx.arc(this.state.rightPortal.x, this.state.rightPortal.y, this.state.rightPortal.size/2, 0, Math.PI * 2);
      ctx.fillStyle = this.state.rightPortal.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw swirl in right portal
      this.drawPortalSwirl(ctx, this.state.rightPortal, Date.now() / 1000 + Math.PI);
    }
  }

  /**
   * Draw a swirl pattern in the portal
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} portal - Portal object
   * @param {number} time - Current time for animation
   */
  drawPortalSwirl(ctx, portal, time) {
    ctx.save();
    
    // Clip to portal circle
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.size/2 - 2, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw spiral
    const spiralArms = 3;
    const rotationSpeed = 1;
    
    ctx.beginPath();
    for (let i = 0; i < spiralArms; i++) {
      const angle = (i / spiralArms) * Math.PI * 2;
      const rotation = time * rotationSpeed;
      
      for (let r = 0; r < portal.size/2; r += 1) {
        const theta = angle + rotation + (r / portal.size) * Math.PI * 4;
        const x = portal.x + r * Math.cos(theta);
        const y = portal.y + r * Math.sin(theta);
        
        if (r === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.restore();
  }
  
  /**
   * Draw the boxes/lattice with connections to portals
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawOpenBoxes(ctx, parameters) {
    const boxColor = this.getColorFromPalette(parameters, this.state.colorIndices.box);
    const boxSize = this.state.boxSize;
    const showLabels = parameters.showLabels === true;
    
    ctx.save();
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2;
    
    // Draw each box
    this.state.boxes.forEach((box, index) => {
      // Draw a box
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
    
    // Draw connection to portals
    const firstBox = this.state.boxes[0];
    const lastBox = this.state.boxes[this.state.boxes.length - 1];
    
    // Left connection (dashed)
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.moveTo(this.state.leftPortal.x + this.state.leftPortal.size/2, this.state.leftPortal.y);
    ctx.lineTo(firstBox.x - boxSize/2, firstBox.y);
    ctx.stroke();
    
    // Right connection (dashed)
    ctx.beginPath();
    ctx.moveTo(lastBox.x + boxSize/2, lastBox.y);
    ctx.lineTo(this.state.rightPortal.x - this.state.rightPortal.size/2, this.state.rightPortal.y);
    ctx.stroke();
    
    // Reset dash
    ctx.setLineDash([]);
    
    ctx.restore();
  }
  
  /**
   * Draw the particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawParticles(ctx, parameters) {
    const boxSize = this.state.boxSize;
    // Get jump color from palette
    const jumpColor = this.getColorFromPalette(parameters, this.state.colorIndices.jump);
    
    // Draw each particle
    this.state.particles.forEach(particle => {
      ctx.save();
      
      if (particle.isJumping) {
        const t = particle.jumpProgress;
        
        // Handle particles entering or exiting through portals
        if (particle.startPosition === -1) {
          // Entering from left portal
          const portalX = this.state.leftPortal.x;
          const portalY = this.state.leftPortal.y;
          const targetBox = this.state.boxes[particle.targetPosition];
          
          if (particle.jumpState === 'entering') {
            // Moving from portal to box edge
            const progress = t * 2; // Scale to [0,1] for the first half
            const x = portalX + (targetBox.x - boxSize/2 - portalX) * progress;
            const y = portalY;
            const scale = 1.0;
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
            this.drawParticle(ctx, particle, x, y, scale);
          } else if (particle.jumpState === 'inside') {
            // Inside the box
            const x = targetBox.x;
            const y = targetBox.y;
            const scale = 1.0 - 0.3 * Math.sin(Math.PI * particle.insideProgress); // Shrink a bit when inside
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.7);
            this.drawParticle(ctx, particle, x, y, scale);
          } else {
            // Exiting the box
            const x = targetBox.x;
            const y = targetBox.y;
            const scale = 1.0;
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
            this.drawParticle(ctx, particle, x, y, scale);
          }
        } else if (particle.targetPosition === this.state.boxes.length) {
          // Exiting to right portal
          const startBox = this.state.boxes[particle.startPosition];
          const portalX = this.state.rightPortal.x;
          const portalY = this.state.rightPortal.y;
          
          if (particle.jumpState === 'entering') {
            // Entering the box
            const x = startBox.x;
            const y = startBox.y;
            const scale = 1.0 - 0.3 * Math.sin(Math.PI * 0.5); // Shrink at start
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
            this.drawParticle(ctx, particle, x, y, scale);
          } else if (particle.jumpState === 'inside') {
            // Inside the box
            const x = startBox.x;
            const y = startBox.y;
            const scale = 1.0 - 0.3 * Math.sin(Math.PI * particle.insideProgress); // Shrink inside
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.7);
            this.drawParticle(ctx, particle, x, y, scale);
          } else {
            // Moving from box edge to portal
            const progress = (t - 0.5) * 2; // Scale to [0,1] for the second half
            const x = (startBox.x + boxSize/2) + (portalX - (startBox.x + boxSize/2)) * progress;
            const y = portalY;
            const scale = 1.0;
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
            this.drawParticle(ctx, particle, x, y, scale);
          }
        } else {
          // Normal jump between boxes
          const startBox = this.state.boxes[particle.startPosition];
          const endBox = this.state.boxes[particle.targetPosition];
          
          if (particle.jumpState === 'entering') {
            // Entering the box
            const progress = t * 2; // Scale to [0,1] for the first half
            const x = startBox.x;
            const y = startBox.y;
            const scale = 1.0 - 0.3 * Math.sin(Math.PI * progress); // Shrink when entering
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
            this.drawParticle(ctx, particle, x, y, scale);
          } else if (particle.jumpState === 'inside') {
            // Moving from startBox to endBox while inside
            const progress = particle.insideProgress;
            const x = startBox.x + (endBox.x - startBox.x) * progress;
            const y = startBox.y;
            const scale = 0.7; // Consistently smaller while inside
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.7);
            this.drawParticle(ctx, particle, x, y, scale);
          } else {
            // Exiting the box
            const progress = (t - 0.5) * 2; // Scale to [0,1] for the second half
            const x = endBox.x;
            const y = endBox.y;
            const scale = 0.7 + 0.3 * progress; // Grow when exiting
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
            this.drawParticle(ctx, particle, x, y, scale);
          }
        }
      } else {
        // Static particle
        const box = this.state.boxes[particle.position];
        ctx.fillStyle = particle.color;
        this.drawParticle(ctx, particle, box.x, box.y);
      }
      
      ctx.restore();
    });
  }
  
  /**
   * Handle user interaction
   * @param {string} type - Interaction type (e.g., "click", "mousemove")
   * @param {Object} event - Event data
   * @returns {boolean} Whether the interaction was handled
   */
  handleInteraction(type, event) {
    // Check if clicking on a box to add/remove particles
    if (type === 'click') {
      const boxSize = this.state.boxSize;
      
      // Check each box
      for (let i = 0; i < this.state.boxes.length; i++) {
        const box = this.state.boxes[i];
        const dx = event.x - box.x;
        const dy = event.y - box.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If clicked inside box
        if (distance <= boxSize / 2) {
          // Check if box already has a particle
          const particleIndex = this.state.particles.findIndex(p => 
            p.position === i && !p.isJumping
          );
          
          if (particleIndex >= 0) {
            // Remove particle
            this.state.particles.splice(particleIndex, 1);
            this.state.particleCount--;
          } else if (!this.isPositionOccupied(i)) {
            // Add particle if box is empty
            // Get particle color from palette
            const particleColor = this.getColorFromPalette(this.plugin.parameters, this.state.colorIndices.particle);
            const maxId = Math.max(...this.state.particles.map(p => p.id), -1);
            
            this.state.particles.push({
              id: maxId + 1,
              position: i,
              isJumping: false,
              jumpProgress: 0,
              startPosition: i,
              targetPosition: i,
              color: particleColor,
              originalColor: particleColor,
              radius: this.state.particleRadius,
              jumpSpeed: 2.0,
              jumpState: 'none',
              insideProgress: 0
            });
            
            this.state.particleCount++;
            
            // Schedule a jump if not paused
            if (!this.state.isPaused) {
              this.scheduleNextJump(this.state.particles[this.state.particles.length - 1]);
            }
          }
          
          return true;
        }
      }
      
      // Check if clicking on left portal to manually add a particle
      const leftPortal = this.state.leftPortal;
      if (leftPortal) {
        const dx = event.x - leftPortal.x;
        const dy = event.y - leftPortal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= leftPortal.size / 2) {
          // Clicked on left portal - try to generate a particle
          if (!this.isPositionOccupied(0)) {
            this.generateNewParticleFromLeft();
            return true;
          }
        }
      }
    }
    
    return false;
  }
}