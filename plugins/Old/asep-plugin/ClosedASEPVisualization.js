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
      .addSlider('rightJumpProb', 'Right Jump Probability', 0.7, { min: 0.0, max: 1.0, step: 0.05 })
      .addSlider('leftJumpProb', 'Left Jump Probability', 0.3, { min: 0.0, max: 1.0, step: 0.05 })
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
    
    // Create boxes
    this.createBoxes(parameters);
    
    // Create initial particles with random positions
    this.createParticles(parameters);
    
    // Set update interval based on speed
    this.state.updateInterval = 500 / (parameters.updateSpeed || 1.0);
    
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
   * Implement probability-based jump attempt
   * @param {Object} particle - Particle to attempt jump with
   */
  attemptParticleJump(particle) {
    // Get jump probabilities
    const rightProb = this.getParameterValue('rightJumpProb', 0.7);
    const leftProb = this.getParameterValue('leftJumpProb', 0.3);
    
    // Make sure probabilities are valid
    const totalProb = Math.min(rightProb + leftProb, 1.0);
    
    // Generate random number for jump decision
    const rand = Math.random();
    
    if (rand < rightProb) {
      // Attempt to jump right
      const targetPos = particle.position + 1;
      
      // Check if valid position
      if (targetPos < this.state.boxes.length && !this.isPositionOccupied(targetPos, particle)) {
        this.startJumpAnimation(particle, targetPos);
      }
    } else if (rand < totalProb) {
      // Attempt to jump left
      const targetPos = particle.position - 1;
      
      // Check if valid position
      if (targetPos >= 0 && !this.isPositionOccupied(targetPos, particle)) {
        this.startJumpAnimation(particle, targetPos);
      }
    }
    // Otherwise, particle stays put
  }
  
  /**
   * Empty implementation - closed system has no boundary dynamics
   */
  handleBoundaryDynamics() {
    // No boundary dynamics for closed system
  }
  
  /**
   * Handle parameter updates
   * @param {Object} parameters - New parameter values
   */
  handleParameterUpdate(parameters) {
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
    // Draw bounding box if enabled
    if (parameters.showBoundingBox) {
      this.drawBoundingBox(ctx, parameters);
    }
    
    // Draw boxes using base method
    this.drawBoxes(ctx, parameters);
    
    // Draw particles
    this.drawParticles(ctx, parameters);
    
    // Draw debug info if enabled
    if (parameters.debugMode) {
      this.drawDebugInfo(ctx, parameters);
    }
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
   * Draw model-specific debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startY - Y position to start drawing
   */
  drawSpecificDebugInfo(ctx, startY) {
    let y = startY;
    
    ctx.fillText(`Right Prob: ${this.getParameterValue('rightJumpProb', 0.7).toFixed(2)}`, 20, y);
    y += 20;
    ctx.fillText(`Left Prob: ${this.getParameterValue('leftJumpProb', 0.3).toFixed(2)}`, 20, y);
    y += 20;
    ctx.fillText(`Total Prob: ${(this.getParameterValue('rightJumpProb', 0.7) + 
                                this.getParameterValue('leftJumpProb', 0.3)).toFixed(2)}`, 20, y);
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
          }
          
          return true;
        }
      }
    }
    
    return false;
  }
}