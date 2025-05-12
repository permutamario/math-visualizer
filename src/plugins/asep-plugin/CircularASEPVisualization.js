// src/plugins/asep-plugin/CircularASEPVisualization.js
import { BaseASEPVisualization } from './BaseASEPVisualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Circular ASEP model - particles move in a circular arrangement
 */
export class CircularASEPVisualization extends BaseASEPVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Add radius property for circular layout
    this.state.radius = 200;
  }
  
  /**
   * Get parameters specific to this visualization
   * @returns {Array} Array of parameter definitions
   * @static
   */
  static getParameters() {
    // Parameters specific to circular ASEP visualization
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
    
    // Create boxes in circular arrangement
    this.createCircularBoxes(parameters);
    
    // Create initial particles with random positions
    this.createParticles(parameters);
    
    // Schedule initial jumps for each particle
    this.scheduleInitialJumps();
    
    return true;
  }
  
  /**
   * Create boxes for the ASEP lattice in a circular arrangement
   * @param {Object} parameters - Visualization parameters
   */
  createCircularBoxes(parameters) {
    const numBoxes = parameters.numBoxes;
    const boxSize = this.state.boxSize;
    
    // Calculate circle radius based on number of boxes
    // Make sure it's large enough to fit all boxes
    const radius = Math.max(200, numBoxes * boxSize / (2 * Math.PI) * 1.5);
    this.state.radius = radius;
    
    // Create boxes in circular arrangement
    for (let i = 0; i < numBoxes; i++) {
      // Calculate angle for this box
      const angle = (i / numBoxes) * Math.PI * 2;
      
      // Calculate position on circle
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      this.state.boxes.push({
        index: i,
        x: x,
        y: y,
        angle: angle,
        size: boxSize
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
        
        // For circular model, wrap around
        const numBoxes = this.state.boxes.length;
        let targetPos;
        
        if (jumpRight) {
          // Move clockwise - to the next position
          targetPos = (particle.position + 1) % numBoxes;
        } else {
          // Move counterclockwise - to the previous position
          // Use modulo arithmetic to ensure positive result
          targetPos = (particle.position - 1 + numBoxes) % numBoxes;
        }
        
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
    // Draw circular track
    this.drawCircularTrack(ctx, parameters);
    
    // Draw boxes
    this.drawCircularBoxes(ctx, parameters);
    
    // Draw particles
    this.drawParticles(ctx, parameters);
  }
  
  /**
   * Draw the circular track
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawCircularTrack(ctx, parameters) {
    const boxColor = this.getColorFromPalette(parameters, this.state.colorIndices.box);
    const radius = this.state.radius;
    
    ctx.save();
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    
    // Draw circular path
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }
  
  /**
   * Draw the boxes in circular arrangement
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawCircularBoxes(ctx, parameters) {
    const boxColor = this.getColorFromPalette(parameters, this.state.colorIndices.box);
    const boxSize = this.state.boxSize;
    const showLabels = this.getParameterValue('showLabels', false);
    
    ctx.save();
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2;
    
    // Draw each box
    this.state.boxes.forEach((box, index) => {
      ctx.save();
      
      // Translate to box position
      ctx.translate(box.x, box.y);
      
      // Rotate box to align with circle tangent
      ctx.rotate(box.angle + Math.PI/2);
      
      // Draw the box
      const x1 = -boxSize / 2;
      const y1 = -boxSize / 2;
      
      ctx.beginPath();
      ctx.rect(x1, y1, boxSize, boxSize);
      ctx.stroke();
      
      // Add site index outside box (only if showLabels is true)
      if (showLabels) {
        ctx.fillStyle = boxColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Position the index text outside the box
        const textRadius = 20;
        ctx.fillText(box.index.toString(), 0, boxSize/2 + textRadius);
      }
      
      ctx.restore();
    });
    
    ctx.restore();
  }
  
  /**
   * Draw the particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawParticles(ctx, parameters) {
    const jumpColor = this.getColorFromPalette(parameters, this.state.colorIndices.jump);
    
    // Draw each particle
    this.state.particles.forEach(particle => {
      ctx.save();
      
      if (particle.isJumping) {
        const t = particle.jumpProgress;
        const startBox = this.state.boxes[particle.startPosition];
        const endBox = this.state.boxes[particle.targetPosition];
        
        // Determine if it's a wraparound jump
        const numBoxes = this.state.boxes.length;
        const isWraparound = Math.abs(particle.targetPosition - particle.startPosition) > 1 &&
                            Math.abs(particle.targetPosition - particle.startPosition) !== numBoxes - 1;
        
        let x, y, scale;
        
        if (particle.jumpState === 'entering') {
          // Entering the box - shrink in place
          x = startBox.x;
          y = startBox.y;
          const progress = t * 2; // Scale to [0,1] for the first half
          scale = 1.0 - 0.3 * Math.sin(Math.PI * progress);
          ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
        } else if (particle.jumpState === 'inside') {
          // Moving along arc between boxes
          const progress = particle.insideProgress;
          
          // Calculate angle between boxes
          let startAngle = startBox.angle;
          let endAngle = endBox.angle;
          
          // Handle wraparound case - take the short path around the circle
          if (Math.abs(endAngle - startAngle) > Math.PI) {
            if (endAngle > startAngle) {
              startAngle += Math.PI * 2;
            } else {
              endAngle += Math.PI * 2;
            }
          }
          
          // Calculate intermediate angle
          const angle = startAngle + (endAngle - startAngle) * progress;
          
          // Calculate position on the circle
          x = Math.cos(angle) * this.state.radius;
          y = Math.sin(angle) * this.state.radius;
          
          scale = 0.7; // Smaller while inside
          ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.7);
        } else {
          // Exiting the box - grow in place
          x = endBox.x;
          y = endBox.y;
          const progress = (t - 0.5) * 2; // Scale to [0,1] for the second half
          scale = 0.7 + 0.3 * progress;
          ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
        }
        
        // Draw jumping particle
        this.drawParticle(ctx, particle, x, y, scale);
      } else {
        // Static particle
        const box = this.state.boxes[particle.position];
        
        // Draw at position
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
      
      // Check each box - need to consider rotation for circular layout
      for (let i = 0; i < this.state.boxes.length; i++) {
        const box = this.state.boxes[i];
        const dx = event.x - box.x;
        const dy = event.y - box.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If clicked near a box center
        if (distance <= boxSize / 1.5) {
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
            const particleColor = this.getColorFromPalette(parameters, this.state.colorIndices.particle);
            
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