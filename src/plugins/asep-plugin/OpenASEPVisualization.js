// src/plugins/asep-plugin/OpenASEPVisualization.js
import { BaseASEPVisualization } from './BaseASEPVisualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Open boundary ASEP model - particles can enter/exit at the boundaries
 */
export class OpenASEPVisualization extends BaseASEPVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Track particle count
    this.state.particleCount = 0;
    
    // Flag to track time since last entry attempt
    this.state.timeSinceEntryAttempt = 0;
  }
  
  /**
   * Get parameters specific to this visualization
   * @returns {Array} Array of parameter definitions
   * @static
   */
  static getParameters() {
    return createParameters()
      .addSlider('numBoxes', 'Number of Sites', 10, { min: 3, max: 20, step: 1 })
      .addSlider('numParticles', 'Number of Particles', 5, { min: 0, max: 20, step: 1 })
      .addSlider('rightJumpRate', 'Right Jump Rate', 0.8, { min: 0.0, max: 2.0, step: 0.1 })
      .addSlider('leftJumpRate', 'Left Jump Rate', 0.2, { min: 0.0, max: 2.0, step: 0.1 })
      .addSlider('entryRate', 'Entry Rate', 0.5, { min: 0.0, max: 2.0, step: 0.1 })
      .addSlider('exitRate', 'Exit Rate', 0.5, { min: 0.0, max: 2.0, step: 0.1 })
      .addSlider('animationSpeed', 'Animation Speed', 1.0, { min: 0.1, max: 3.0, step: 0.1 })
      .addCheckbox('isPaused', 'Pause Simulation', false)
      .addCheckbox('showLabels', 'Show Labels', false)
      .build();
  }
  
  /**
   * Initialize the visualization with parameters
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Call base initialize to clear any existing state and setup animation
    await super.initialize(parameters);
    
    // Create boxes
    this.createBoxes(parameters);
    
    // Create initial particles with random positions
    this.createParticles(parameters);
    
    // Store particle count
    this.state.particleCount = this.state.particles.length;
    
    // Schedule initial jumps for each particle
    this.scheduleInitialJumps();
    
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
      // Mark first and last boxes as special for open system
      const isEdge = (i === 0 || i === numBoxes - 1);
      
      this.state.boxes.push({
        index: i,
        x: startX + (i * boxSize) + boxSize / 2, // center x position
        y: 0,  // center y position
        size: boxSize,
        isLeftEdge: i === 0,
        isRightEdge: i === numBoxes - 1
      });
    }
  }
  
  /**
   * Schedule the next jump for a particle
   * @param {Object} particle - Particle to schedule jump for
   */
  scheduleNextJump(particle) {
    if (this.state.isPaused) return;
    
    // Get jump rates from parameters
    const rightRate = this.getParameterValue('rightJumpRate', 0.8);
    const leftRate = this.getParameterValue('leftJumpRate', 0.2);
    const exitRate = this.getParameterValue('exitRate', 0.5);
    
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
          // Exit right through rightmost box
          particle.isJumping = true;
          particle.jumpProgress = 0;
          particle.startPosition = particle.position;
          particle.targetPosition = -1; // Special value for right exit
          particle.originalColor = particle.color;
          particle.jumpState = 'exiting'; // Exiting the system
          
          // Decrease particle count
          this.state.particleCount--;
          
          // Update particle count in parameters
          this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
          
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
   * Try to generate a new particle from the left boundary
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  tryGenerateParticle(deltaTime) {
    if (this.state.isPaused) return;
    
    // Accumulate time since last attempt
    this.state.timeSinceEntryAttempt += deltaTime;
    
    // Get entry rate from parameters
    const entryRate = this.getParameterValue('entryRate', 0.5);
    
    // Calculate probability for this frame
    // Using time accumulation to handle very small deltaTime values properly
    const probability = entryRate * this.state.timeSinceEntryAttempt * 0.1;
    
    // Check if first position is empty
    if (Math.random() < probability && !this.isPositionOccupied(0)) {
      this.generateNewParticleFromLeft();
      // Reset time since last attempt after success
      this.state.timeSinceEntryAttempt = 0;
    }
    
    // Cap the time accumulation to prevent huge probability spikes
    if (this.state.timeSinceEntryAttempt > 5.0) {
      this.state.timeSinceEntryAttempt = 5.0;
    }
  }
  
  /**
   * Generate a new particle from the left boundary
   */
  generateNewParticleFromLeft() {
    // Get particle color from palette
    const particleColor = this.getColorFromPalette(
      { colorPalette: this.getParameterValue('colorPalette') }, 
      this.state.colorIndices.particle
    );

    // Find the highest ID to create a new unique ID
    const maxId = Math.max(...this.state.particles.map(p => p.id), -1);
    
    // Create the new particle
    const newParticle = {
      id: maxId + 1,
      position: 0,
      isJumping: false,
      jumpProgress: 0,
      startPosition: 0,
      targetPosition: 0,
      color: particleColor,
      originalColor: particleColor,
      radius: this.state.particleRadius,
      jumpSpeed: 2.0,
      jumpState: 'none',
      insideProgress: 0
    };
    
    // Add to particles array
    this.state.particles.push(newParticle);
    
    // Increase particle count
    this.state.particleCount++;
    
    // Update particle count in parameters
    this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
    
    // Schedule a jump for the new particle
    if (!this.state.isPaused) {
      this.scheduleNextJump(newParticle);
    }
  }
  
  /**
   * Custom animate function for open model
   * Handles particle generation from the left boundary
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  customAnimate(deltaTime) {
    // Try to generate a new particle from left boundary
    this.tryGenerateParticle(deltaTime);
  }
  
  /**
   * Complete a jump for a particle
   * @param {Object} particle - Particle that completed jump
   * @param {Array} particlesToRemove - Array to add particles to remove to
   */
  completeJump(particle, particlesToRemove) {
    // Check if particle is exiting the system to the right
    if (particle.targetPosition === -1) {
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
   * Render the visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  render2D(ctx, parameters) {
    // Draw the lattice and connections to boundaries
    this.drawOpenBoxes(ctx, parameters);
    
    // Draw particles
    this.drawParticles(ctx, parameters);
  }
  
  /**
   * Draw the boxes/lattice with half-open boxes at the boundaries
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawOpenBoxes(ctx, parameters) {
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
      
      if (box.isLeftEdge) {
        // Draw left edge box (only right, top, bottom sides)
        ctx.beginPath();
        // Top edge
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + boxSize, y1);
        // Right edge
        ctx.lineTo(x1 + boxSize, y1 + boxSize);
        // Bottom edge
        ctx.lineTo(x1, y1 + boxSize);
        ctx.stroke();
        
        // Add an arrow indicating entry
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(x1 - 20, y1 + boxSize/2);
        ctx.lineTo(x1 - 5, y1 + boxSize/2);
        ctx.moveTo(x1 - 10, y1 + boxSize/2 - arrowSize/2);
        ctx.lineTo(x1 - 5, y1 + boxSize/2);
        ctx.lineTo(x1 - 10, y1 + boxSize/2 + arrowSize/2);
        ctx.stroke();
        
      } else if (box.isRightEdge) {
        // Draw right edge box (only left, top, bottom sides)
        ctx.beginPath();
        // Top edge
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + boxSize, y1);
        // Left edge
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1, y1 + boxSize);
        // Bottom edge
        ctx.lineTo(x1 + boxSize, y1 + boxSize);
        ctx.stroke();
        
        // Add an arrow indicating exit
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(x1 + boxSize + 5, y1 + boxSize/2);
        ctx.lineTo(x1 + boxSize + 20, y1 + boxSize/2);
        ctx.moveTo(x1 + boxSize + 15, y1 + boxSize/2 - arrowSize/2);
        ctx.lineTo(x1 + boxSize + 20, y1 + boxSize/2);
        ctx.lineTo(x1 + boxSize + 15, y1 + boxSize/2 + arrowSize/2);
        ctx.stroke();
        
      } else {
        // Draw normal box
        ctx.beginPath();
        ctx.rect(x1, y1, boxSize, boxSize);
        ctx.stroke();
      }
      
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
        
        // Handle exiting through the right boundary
        if (particle.targetPosition === -1) {
          // Exiting to right boundary
          const startBox = this.state.boxes[particle.startPosition];
          
          if (particle.jumpState === 'entering' || particle.jumpState === 'inside') {
            // Initial phase of exit - still in the box
            const x = startBox.x;
            const y = startBox.y;
            const scale = 1.0 - 0.3 * particle.insideProgress; // Shrinking
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
            this.drawParticle(ctx, particle, x, y, scale);
          } else {
            // Moving from box to right boundary
            const progress = (t - 0.5) * 2; // Scale to [0,1] for the second half
            const rightEdge = startBox.x + boxSize/2;
            const xOffset = boxSize/2 + 30; // How far to move beyond the edge
            const x = rightEdge + progress * xOffset;
            const y = startBox.y;
            const scale = 1.0 - 0.5 * progress; // Gradually disappear
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.7);
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
            
            // Update particle count in parameters
            this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
          } else if (!this.isPositionOccupied(i)) {
            // Add particle if box is empty
            // Get particle color from palette
            const particleColor = this.getColorFromPalette(parameters, this.state.colorIndices.particle);
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
            
            // Update particle count in parameters
            this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
            
            // Schedule a jump if not paused
            if (!this.state.isPaused) {
              this.scheduleNextJump(this.state.particles[this.state.particles.length - 1]);
            }
          }
          
          return true;
        }
      }
      
      // Check if clicking outside the leftmost box to trigger an entry attempt
      const leftBox = this.state.boxes[0];
      if (leftBox) {
        const leftEdge = leftBox.x - boxSize/2;
        // Check if click is in the entry area (left of the first box)
        if (event.x < leftEdge && 
            Math.abs(event.y - leftBox.y) < boxSize/2 && 
            event.x > leftEdge - 30) {
          
          // Try to generate a particle if first site is empty
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