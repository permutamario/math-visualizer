// src/plugins/asep-plugin/CircularASEPVisualization.js
import { BaseASEPVisualization } from './BaseASEPVisualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Circular ASEP model - particles move in a circular arrangement
 * Uses continuous-time Markov chain dynamics with exponential clocks
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
      .addSlider('rightJumpRate', 'Right Jump Rate', 0.7, { min: 0.1, max: 3.0, step: 0.1 })
      .addSlider('leftJumpRate', 'Left Jump Rate', 0.3, { min: 0.0, max: 1.0, step: 0.1 })
      .addSlider('updateSpeed', 'Update Speed', 1.0, { min: 0.2, max: 3.0, step: 0.1 })
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
    
    // Store the number of particles for parameter synchronization
    this.state.particleCount = this.state.particles.length;
    
    // Set update interval based on speed
    this.state.updateInterval = 500 / (parameters.updateSpeed || 1.0);
    
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
    const rightRate = parameters.rightJumpRate !== undefined ? parameters.rightJumpRate : 0.7;
    const leftRate = parameters.leftJumpRate !== undefined ? parameters.leftJumpRate : 0.3;
    
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
        rightJumpTime: this.state.currentTime + this.generateExponentialTime(rightRate),
        leftJumpTime: this.state.currentTime + this.generateExponentialTime(leftRate)
      });
    }
  }
  
  /**
   * Check if a right jump to target position is valid
   * @param {Object} particle - Particle attempting to jump
   * @param {number} targetPosition - Position to jump to
   * @returns {boolean} Whether the jump is valid
   */
  isValidRightJump(particle, targetPosition) {
    // For circular system, all positions are valid with wraparound
    const numBoxes = this.state.boxes.length;
    return true; // All jumps are valid in circular system
  }
  
  /**
   * Check if a left jump to target position is valid
   * @param {Object} particle - Particle attempting to jump
   * @param {number} targetPosition - Position to jump to
   * @returns {boolean} Whether the jump is valid
   */
  isValidLeftJump(particle, targetPosition) {
    // For circular system, all positions are valid with wraparound
    const numBoxes = this.state.boxes.length;
    return true; // All jumps are valid in circular system
  }
  
  /**
   * Implement continuous-time Markov chain jumps using exponential clocks
   * @param {Object} particle - Particle to attempt jump with
   */
  attemptParticleJump(particle) {
    // Skip if particle is already jumping
    if (particle.isJumping) return;
    
    // Get current time
    const currentTime = this.state.currentTime;
    const numBoxes = this.state.boxes.length;
    
    // Initialize jump times if they don't exist
    if (particle.rightJumpTime === undefined) {
      particle.rightJumpRate = this.getParameterValue('rightJumpRate', 0.7);
      particle.rightJumpTime = currentTime + this.generateExponentialTime(particle.rightJumpRate);
    }
    
    if (particle.leftJumpTime === undefined) {
      particle.leftJumpRate = this.getParameterValue('leftJumpRate', 0.3);
      particle.leftJumpTime = currentTime + this.generateExponentialTime(particle.leftJumpRate);
    }
    
    // Check if it's time for a right jump (clockwise)
    if (particle.rightJumpTime <= currentTime) {
      // Attempt to jump right (with circular wraparound)
      const targetPos = (particle.position + 1) % numBoxes;
      
      // Check if position is not occupied
      if (!this.isPositionOccupied(targetPos, particle)) {
        this.startJumpAnimation(particle, targetPos);
      } else {
        // Reschedule the jump attempt if failed due to occupancy
        particle.rightJumpTime = currentTime + this.generateExponentialTime(particle.rightJumpRate);
      }
      return;
    }
    
    // Check if it's time for a left jump (counterclockwise)
    if (particle.leftJumpTime <= currentTime) {
      // Attempt to jump left (with circular wraparound)
      const targetPos = (particle.position - 1 + numBoxes) % numBoxes;
      
      // Check if position is not occupied
      if (!this.isPositionOccupied(targetPos, particle)) {
        this.startJumpAnimation(particle, targetPos);
      } else {
        // Reschedule the jump attempt if failed due to occupancy
        particle.leftJumpTime = currentTime + this.generateExponentialTime(particle.leftJumpRate);
      }
      return;
    }
  }
  
  /**
   * Handle boundary dynamics - empty for circular (no boundaries)
   */
  handleBoundaryDynamics() {
    // No boundary dynamics for circular system
  }
  
  /**
   * Complete a jump for a particle with special handling for circular boundaries
   * @param {Object} particle - Particle that completed jump
   * @param {Array} particlesToRemove - Array to add particles to remove to
   */
  completeJump(particle, particlesToRemove) {
    // Complete the jump
    particle.isJumping = false;
    particle.jumpProgress = 0;
    particle.position = particle.targetPosition;
    particle.color = particle.originalColor;
    particle.jumpState = 'none';
    particle.insideProgress = 0;
    
    // Schedule new jump times based on rates
    const rightRate = this.getParameterValue('rightJumpRate', 0.7);
    const leftRate = this.getParameterValue('leftJumpRate', 0.3);
    
    particle.rightJumpTime = this.state.currentTime + this.generateExponentialTime(rightRate);
    particle.leftJumpTime = this.state.currentTime + this.generateExponentialTime(leftRate);
  }
  
  /**
   * Handle parameter updates
   * @param {Object} parameters - New parameter values
   */
  handleParameterUpdate(parameters) {
    // Update the jump rates
    if (parameters.rightJumpRate !== undefined || parameters.leftJumpRate !== undefined) {
      // Update handled by the base class
    }
    
    // Update the update interval based on speed
    if (parameters.updateSpeed !== undefined) {
      this.state.updateInterval = 500 / parameters.updateSpeed;
    }
    
    // If numBoxes or numParticles changed drastically, reset simulation
    if ((parameters.numBoxes !== undefined && Math.abs(parameters.numBoxes - this.state.boxes.length) > 1) ||
        (parameters.numParticles !== undefined && Math.abs(parameters.numParticles - this.state.particles.length) > 2)) {
      // Re-initialize with current parameters
      this.initialize({
        ...this.plugin.pluginParameters,
        ...this.plugin.visualizationParameters,
        ...this.plugin.advancedParameters
      });
    }
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
    
    // Draw debug info if enabled
    if (parameters.debugMode) {
      this.drawDebugInfo(ctx, parameters);
    }
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
   * Draw model-specific debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startY - Y position to start drawing
   */
  drawSpecificDebugInfo(ctx, startY) {
    let y = startY;
    
    ctx.fillText(`Right Rate: ${this.getParameterValue('rightJumpRate', 0.7).toFixed(2)}`, 20, y);
    y += 20;
    ctx.fillText(`Left Rate: ${this.getParameterValue('leftJumpRate', 0.3).toFixed(2)}`, 20, y);
    y += 20;
    ctx.fillText(`Radius: ${this.state.radius.toFixed(0)}px`, 20, y);
    y += 20;
    
    // Find next event
    let nextEvent = "None";
    let nextTime = Infinity;
    
    for (const particle of this.state.particles) {
      if (!particle.isJumping) {
        if (particle.rightJumpTime < nextTime) {
          nextEvent = `Right (${particle.id})`;
          nextTime = particle.rightJumpTime;
        }
        if (particle.leftJumpTime < nextTime) {
          nextEvent = `Left (${particle.id})`;
          nextTime = particle.leftJumpTime;
        }
      }
    }
    
    const timeToNext = Math.max(0, nextTime - this.state.currentTime).toFixed(2);
    ctx.fillText(`Next event: ${nextEvent} in ${timeToNext}s`, 20, y);
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
            const newCount = this.state.particles.length;
            this.plugin.updateParameter('numParticles', newCount, 'visualization');
          } else if (!this.isPositionOccupied(i)) {
            // Add particle if box is empty
            const maxId = Math.max(...this.state.particles.map(p => p.id), -1);
            const currentParams = {
              colorPalette: this.getParameterValue('colorPalette')
            };
            const particleColor = this.getColorFromPalette(currentParams, this.state.colorIndices.particle);
            
            // Get jump rates
            const rightRate = this.getParameterValue('rightJumpRate', 0.7);
            const leftRate = this.getParameterValue('leftJumpRate', 0.3);
            
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
              insideProgress: 0,
              // Continuous-time Markov chain specific properties
              rightJumpRate: rightRate,
              leftJumpRate: leftRate,
              rightJumpTime: this.state.currentTime + this.generateExponentialTime(rightRate),
              leftJumpTime: this.state.currentTime + this.generateExponentialTime(leftRate)
            });
            
            // Update particle count in parameters
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