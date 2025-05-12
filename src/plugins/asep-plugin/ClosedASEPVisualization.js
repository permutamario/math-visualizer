// src/plugins/asep-plugin/ClosedASEPVisualization.js
import { BaseASEPVisualization } from './BaseASEPVisualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Closed linear ASEP model - particles move on a linear lattice with no entrances or exits
 */
export class ClosedASEPVisualization extends BaseASEPVisualization {
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
    
    // Create initial particles with random positions - this is a critical step
    // Make sure numParticles and numBoxes are properly extracted
    const numParticles = parseInt(parameters.numParticles || 5);
    const numBoxes = parseInt(parameters.numBoxes || 10);
    
    // Ensure parameters are consistent
    console.log(`Initializing ClosedASEP with ${numParticles} particles and ${numBoxes} boxes`);
    
    // Create particles with modified parameters object to ensure correct creation
    this.createParticles({
      numParticles: numParticles,
      numBoxes: numBoxes,
      colorPalette: parameters.colorPalette
    });
    
    // Schedule initial jumps for each particle
    this.scheduleInitialJumps();
    
    return true;
  }
  
  /**
   * Create boxes for the ASEP lattice
   * @param {Object} parameters - Visualization parameters
   */
  createBoxes(parameters) {
    // Ensure numBoxes is a number and has a default
    const numBoxes = parseInt(parameters.numBoxes || 10);
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
   * Override createParticles to ensure particles are properly created
   * @param {Object} parameters - Visualization parameters
   */
  createParticles(parameters) {
    // Make sure parameters are valid
    if (!parameters) {
      console.error("Cannot create particles: missing parameters");
      return;
    }

    // Ensure numParticles and numBoxes are numbers
    const numParticles = parseInt(parameters.numParticles || 0);
    const numBoxes = parseInt(parameters.numBoxes || 0);
    
    console.log(`Creating ${numParticles} particles in ${numBoxes} boxes`);
    
    if (numParticles <= 0 || numBoxes <= 0) {
      console.warn("No particles to create or no boxes available");
      return;
    }

    // Make sure we don't exceed the number of boxes
    const effectiveNumParticles = Math.min(numParticles, numBoxes);
    
    // Generate unique random positions
    const positions = [];
    while (positions.length < effectiveNumParticles) {
      const pos = Math.floor(Math.random() * numBoxes);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }

    // Get particle color from the palette or use default
    const particleColor = this.getColorFromPalette(parameters, this.state.colorIndices.particle);
    
    // Create particles
    for (let i = 0; i < effectiveNumParticles; i++) {
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
    
    console.log(`Created ${this.state.particles.length} particles`);
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
    
    // Determine total rate and waiting time
    const totalRate = rightRate + leftRate;
    const waitTime = -Math.log(Math.random()) / totalRate;
    const scaledWaitTime = waitTime / this.state.timeScale;
    
    // Create jump event
    const jumpEvent = {
      particleId: particle.id,
      timeoutId: setTimeout(() => {
        // Choose direction based on rates
        const jumpRight = Math.random() < (rightRate / totalRate);
        
        const targetPos = jumpRight ? 
          particle.position + 1 : 
          particle.position - 1;
        
        // Check if target position is valid (within bounds for closed model)
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
      }, scaledWaitTime * 1000) // Convert to milliseconds
    };
    
    // Add to jump events array for tracking
    this.state.jumpEvents.push(jumpEvent);
  }
  
  /**
   * Render the visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  render2D(ctx, parameters) {
    // Draw boxes using base method
    this.drawBoxes(ctx, parameters);
    
    // Draw particles
    this.drawParticles(ctx, parameters);
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
    
    // Log particles count for debugging
    if (this.state.particles.length === 0) {
      console.warn("No particles to draw in ClosedASEPVisualization");
    }
    
    // Draw each particle
    this.state.particles.forEach(particle => {
      ctx.save();
      
      if (particle.isJumping) {
        const t = particle.jumpProgress;
        const startBox = this.state.boxes[particle.startPosition];
        const endBox = this.state.boxes[particle.targetPosition];
        let x, y, scale;
        
        if (particle.jumpState === 'entering') {
          // Entering the box
          const progress = t * 2; // Scale to [0,1] for the first half
          x = startBox.x;
          y = startBox.y;
          scale = 1.0 - 0.3 * Math.sin(Math.PI * progress); // Shrink when entering
          
          ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
        } else if (particle.jumpState === 'inside') {
          // Moving from startBox to endBox while inside
          const progress = particle.insideProgress;
          x = startBox.x + (endBox.x - startBox.x) * progress;
          y = startBox.y;
          scale = 0.7; // Consistently smaller while inside
          
          ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.7);
        } else {
          // Exiting the box
          const progress = (t - 0.5) * 2; // Scale to [0,1] for the second half
          x = endBox.x;
          y = endBox.y;
          scale = 0.7 + 0.3 * progress; // Grow when exiting
          
          ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
        }
        
        // Draw jumping particle
        this.drawParticle(ctx, particle, x, y, scale);
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
            
            // Update particle count in parameters
            const newCount = this.getParameterValue('numParticles', 0) - 1;
            this.plugin.updateParameter('numParticles', Math.max(0, newCount), 'visualization');
          } else if (!this.isPositionOccupied(i)) {
            // Add particle if box is empty
            const maxId = Math.max(...this.state.particles.map(p => p.id), -1);
            
            // Get particle color from palette - use current parameters to get color
            const currentParams = {
              colorPalette: this.getParameterValue('colorPalette')
            };
            const particleColor = this.getColorFromPalette(currentParams, this.state.colorIndices.particle);
            
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
            
            // Update particle count in parameters
            const newCount = this.getParameterValue('numParticles', 0) + 1;
            this.plugin.updateParameter('numParticles', newCount, 'visualization');
            
            // Schedule a jump if not paused
            if (!this.state.isPaused) {
              this.scheduleNextJump(this.state.particles[this.state.particles.length - 1]);
            }
          }
          
          return true;
        }
      }
    }
    
    return false;
  }
}