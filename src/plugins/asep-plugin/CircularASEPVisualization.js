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
    
    // Create boxes in circular arrangement
    this.createCircularBoxes(parameters);
    
    // Create initial particles with random positions
    this.createParticles(parameters);
    
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
   * Implement probability-based jump attempt with circular boundary
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
    const numBoxes = this.state.boxes.length;
    
    if (rand < rightProb) {
      // Attempt to jump right (clockwise)
      const targetPos = (particle.position + 1) % numBoxes;
      
      // Check if position is not occupied
      if (!this.isPositionOccupied(targetPos, particle)) {
        this.startJumpAnimation(particle, targetPos);
      }
    } else if (rand < totalProb) {
      // Attempt to jump left (counterclockwise)
      const targetPos = (particle.position - 1 + numBoxes) % numBoxes;
      
      // Check if position is not occupied
      if (!this.isPositionOccupied(targetPos, particle)) {
        this.startJumpAnimation(particle, targetPos);
      }
    }
    // Otherwise, particle stays put
  }
  
  /**
   * Handle boundary dynamics - empty for circular (no boundaries)
   */
  handleBoundaryDynamics() {
    // No boundary dynamics for circular system
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
    
    ctx.fillText(`Right Prob: ${this.getParameterValue('rightJumpProb', 0.7).toFixed(2)}`, 20, y);
    y += 20;
    ctx.fillText(`Left Prob: ${this.getParameterValue('leftJumpProb', 0.3).toFixed(2)}`, 20, y);
    y += 20;
    ctx.fillText(`Radius: ${this.state.radius.toFixed(0)}px`, 20, y);
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