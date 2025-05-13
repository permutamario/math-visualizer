// src/plugins/asep-plugin/OpenASEPVisualization.js
import { BaseASEPVisualization } from './BaseASEPVisualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Open boundary ASEP model - particles can enter/exit at the boundaries
 * Implements a continuous-time Markov chain model
 */
export class OpenASEPVisualization extends BaseASEPVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Add specific state for open system
    this.state.enteringParticles = []; // Particles currently entering the system
    this.state.exitingParticles = [];  // Particles currently exiting the system
    this.state.particleCount = 0;      // Track total particle count for UI updates
    this.state.nextEntryTime = Infinity; // Time of next entry event
    this.state.nextExitTime = Infinity;  // Time of next exit event at right boundary
    this.state.entryRate = 0.3;        // Rate at which particles enter from left
    this.state.exitRate = 0.3;         // Rate at which particles exit to the right
  }
  
  /**
   * Get parameters specific to this visualization
   * @returns {Array} Array of parameter definitions
   * @static
   */
  static getParameters() {
    return createParameters()
      .addSlider('numBoxes', 'Number of Sites', 10, { min: 3, max: 20, step: 1 })
      .addSlider('numParticles', 'Initial Particles', 5, { min: 0, max: 20, step: 1 })
      .addSlider('rightJumpRate', 'Right Jump Rate', 0.8, { min: 0.1, max: 3.0, step: 0.1 })
      .addSlider('leftJumpRate', 'Left Jump Rate', 0.2, { min: 0.0, max: 1.0, step: 0.1 })
      .addSlider('entryRate', 'Entry Rate', 0.3, { min: 0.0, max: 1.0, step: 0.1 })
      .addSlider('exitRate', 'Exit Rate', 0.3, { min: 0.0, max: 1.0, step: 0.1 })
      .build();
  }
  
  /**
   * Initialize the visualization with parameters
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Call base initialize to clear any existing state and setup animation
    await super.initialize(parameters);
    
    // Clear specific arrays for open boundary conditions
    this.state.enteringParticles = [];
    this.state.exitingParticles = [];
    
    // Set entry and exit rates
    this.state.entryRate = parameters.entryRate !== undefined ? parameters.entryRate : 0.3;
    this.state.exitRate = parameters.exitRate !== undefined ? parameters.exitRate : 0.3;
    
    // Generate entry and exit times
    this.state.nextEntryTime = this.state.currentTime + this.generateExponentialTime(this.state.entryRate);
    
    // Create boxes
    this.createBoxes(parameters);
    
    // Create initial particles with random positions
    this.createParticles(parameters);
    
    // Store particle count
    this.state.particleCount = this.state.particles.length;
    
    // Update numParticles parameter to match actual count
    this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
    
    return true;
  }
  
  /**
   * Create boxes for the ASEP lattice
   * @param {Object} parameters - Visualization parameters
   */
  createBoxes(parameters) {
    const numBoxes = parameters.numBoxes || 10;
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
        size: boxSize,
        isLeftEdge: i === 0,
        isRightEdge: i === numBoxes - 1
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
    // For right jumps, check if target position is within bounds
    return targetPosition < this.state.boxes.length;
  }
  
  /**
   * Check if a left jump to target position is valid
   * @param {Object} particle - Particle attempting to jump
   * @param {number} targetPosition - Position to jump to
   * @returns {boolean} Whether the jump is valid
   */
  isValidLeftJump(particle, targetPosition) {
    // For left jumps, check if target position is within bounds
    return targetPosition >= 0;
  }
  
  /**
   * Handle boundary dynamics - entry from left and exit to right
   * @param {number} deltaTime - Simulation time elapsed
   */
  handleBoundaryDynamics(deltaTime) {
    // Process entry events at the left boundary
    this.processEntryEvents();
    
    // Process exit events at the right boundary
    this.processExitEvents();
  }
  
  /**
   * Process particle entry events at the left boundary
   */
  processEntryEvents() {
    // Skip if paused
    if (this.state.isPaused) return;
    
    // Check if it's time for an entry event
    if (this.state.nextEntryTime <= this.state.currentTime) {
      // Check if first box is empty
      if (!this.isPositionOccupied(0) && this.state.enteringParticles.length === 0) {
        // Start entry animation
        this.startEntryAnimation();
      }
      
      // Generate next entry time, regardless of whether entry was successful
      this.state.nextEntryTime = this.state.currentTime + this.generateExponentialTime(this.state.entryRate);
    }
  }
  
  /**
   * Process exit events at the right boundary
   */
  processExitEvents() {
    // Skip if paused
    if (this.state.isPaused) return;
    
    // For particles at the right edge, check for exit events
    for (const particle of this.state.particles) {
      // Skip particles that are already jumping or not at the right edge
      if (particle.isJumping || particle.position !== this.state.boxes.length - 1) continue;
      
      // Check for exit events - this differs from our previous model where exit was handled
      // via a probability check during particle updates. Here we create a separate exit timer.
      if (!particle.exitJumpTime) {
        // Initialize exit jump time if not set
        particle.exitJumpTime = this.state.currentTime + this.generateExponentialTime(this.state.exitRate);
      }
      
      // Check if it's time for this particle to exit
      if (particle.exitJumpTime <= this.state.currentTime) {
        // Start exit animation
        this.startExitAnimation(particle);
        
        // No need to reset exit time as the particle is now exiting
        break;
      }
    }
  }
  
  /**
   * Start entry animation for a new particle
   */
  startEntryAnimation() {
    // Get particle color from palette
    const particleColor = this.getColorFromPalette(
      { colorPalette: this.getParameterValue('colorPalette') }, 
      this.state.colorIndices.particle
    );
    
    // Find highest ID to create a unique ID
    const maxId = Math.max(
      ...this.state.particles.map(p => p.id),
      ...this.state.enteringParticles.map(p => p.id),
      -1
    );
    
    // Get jump rates
    const rightRate = this.getParameterValue('rightJumpRate', 0.8);
    const leftRate = this.getParameterValue('leftJumpRate', 0.2);
    
    // Create the new entering particle
    const newParticle = {
      id: maxId + 1,
      position: -1, // Special value for entering particles
      isJumping: true,
      jumpProgress: 0,
      startPosition: -1,
      targetPosition: 0, // Will end up at position 0
      color: particleColor,
      originalColor: particleColor,
      radius: this.state.particleRadius,
      jumpSpeed: 2.0,
      jumpState: 'entering', // Animation state
      entryProgress: 0,
      // Continuous-time Markov chain specific properties
      rightJumpRate: rightRate,
      leftJumpRate: leftRate,
      rightJumpTime: this.state.currentTime + this.generateExponentialTime(rightRate),
      leftJumpTime: this.state.currentTime + this.generateExponentialTime(leftRate)
    };
    
    // Add to entering particles array
    this.state.enteringParticles.push(newParticle);
    
    // Increase particle count
    this.state.particleCount++;
    
    // Update numParticles parameter
    this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
  }
  
  /**
   * Start exit animation for a particle
   * @param {Object} particle - Particle to animate exiting
   */
  startExitAnimation(particle) {
    // Set particle to exiting state
    particle.isJumping = true;
    particle.jumpProgress = 0;
    particle.startPosition = particle.position;
    particle.targetPosition = -1; // Special value for exit
    particle.originalColor = particle.color;
    particle.jumpState = 'exiting';
    
    // Add to exiting particles list
    this.state.exitingParticles.push(particle);
    
    // Decrease particle count
    this.state.particleCount--;
    
    // Update numParticles parameter
    this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
  }
  
  /**
   * Complete a jump for a particle
   * @param {Object} particle - Particle that completed jump
   * @param {Array} particlesToRemove - Array to add particles to remove to
   */
  completeJump(particle, particlesToRemove) {
    // Check special case for exiting particles
    if (particle.targetPosition === -1) {
      // Remove from both the main particles array and exiting particles array
      particlesToRemove.push(particle);
      this.state.exitingParticles = this.state.exitingParticles.filter(p => p !== particle);
      return;
    }
    
    // Normal jump completion
    super.completeJump(particle, particlesToRemove);
    
    // For particles that just reached the right edge, set exit time
    if (particle.position === this.state.boxes.length - 1) {
      particle.exitJumpTime = this.state.currentTime + this.generateExponentialTime(this.state.exitRate);
    } else {
      // For all other particles, clear exit time if it exists
      delete particle.exitJumpTime;
    }
  }
  
  /**
   * Custom animate function for open model
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  customAnimate(deltaTime) {
    // Update entering particles
    this.updateEnteringParticles(deltaTime);
  }
  
  /**
   * Update animations for particles entering from the left
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  updateEnteringParticles(deltaTime) {
    // Get animation speed
    const animationSpeed = this.getParameterValue('animationSpeed', 1.0);
    
    // Create list of particles to complete entry
    const particlesToComplete = [];
    
    // Update each entering particle
    this.state.enteringParticles.forEach(particle => {
      // Progress the entry animation
      particle.entryProgress += deltaTime * particle.jumpSpeed * animationSpeed;
      
      // Check if entry is complete
      if (particle.entryProgress >= 1.0) {
        particlesToComplete.push(particle);
      }
    });
    
    // Complete entry for finished particles
    particlesToComplete.forEach(particle => {
      // Remove from entering array
      this.state.enteringParticles = this.state.enteringParticles.filter(p => p !== particle);
      
      // Complete the entry
      particle.position = 0; // Move to first box
      particle.isJumping = false;
      particle.jumpProgress = 0;
      particle.jumpState = 'none';
      particle.entryProgress = 0;
      
      // Add to main particles array
      this.state.particles.push(particle);
    });
  }
  
  /**
   * Handle parameter updates
   * @param {Object} parameters - New parameter values
   */
  handleParameterUpdate(parameters) {
    // Update entry and exit rates
    if (parameters.entryRate !== undefined) {
      this.state.entryRate = parameters.entryRate;
      // Recalculate next entry time proportionally
      const timeToEvent = this.state.nextEntryTime - this.state.currentTime;
      if (timeToEvent > 0) {
        // Scale the remaining time based on the ratio of old rate to new rate
        const newTimeToEvent = parameters.entryRate > 0 ? 
          timeToEvent * (this.state.entryRate / parameters.entryRate) : Infinity;
        this.state.nextEntryTime = this.state.currentTime + newTimeToEvent;
      } else {
        // If the entry event is already due, generate a new time
        this.state.nextEntryTime = this.state.currentTime + this.generateExponentialTime(parameters.entryRate);
      }
    }
    
    if (parameters.exitRate !== undefined) {
      const oldExitRate = this.state.exitRate;
      this.state.exitRate = parameters.exitRate;
      
      // Update exit jump times for particles at the right boundary
      for (const particle of this.state.particles) {
        if (!particle.isJumping && particle.position === this.state.boxes.length - 1 && particle.exitJumpTime) {
          // Recalculate next exit time proportionally
          const timeToEvent = particle.exitJumpTime - this.state.currentTime;
          if (timeToEvent > 0) {
            // Scale the remaining time based on the ratio of old rate to new rate
            const newTimeToEvent = parameters.exitRate > 0 ? 
              timeToEvent * (oldExitRate / parameters.exitRate) : Infinity;
            particle.exitJumpTime = this.state.currentTime + newTimeToEvent;
          } else {
            // If the exit event is already due, generate a new time
            particle.exitJumpTime = this.state.currentTime + this.generateExponentialTime(parameters.exitRate);
          }
        }
      }
    }
    
    // If numBoxes changed drastically, reset simulation
    if (parameters.numBoxes !== undefined && Math.abs(parameters.numBoxes - this.state.boxes.length) > 1) {
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
    if (!ctx) return;
    
    // Draw bounding box if enabled
    if (parameters.showBoundingBox) {
      this.drawBoundingBox(ctx, parameters);
    }
    
    // Draw the open system boxes
    this.drawOpenBoxes(ctx, parameters);
    
    // Draw regular particles
    this.drawParticles(ctx, parameters);
    
    // Draw entering particles
    this.drawEnteringParticles(ctx, parameters);
    
    // Draw debug info if enabled
    if (parameters.debugMode) {
      this.drawDebugInfo(ctx, parameters);
    }
  }
  
  /**
   * Draw the boxes with open boundaries
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
        // Left edge box - draw with left side open
        ctx.beginPath();
        // Top edge
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + boxSize, y1);
        // Right edge
        ctx.lineTo(x1 + boxSize, y1 + boxSize);
        // Bottom edge
        ctx.lineTo(x1, y1 + boxSize);
        ctx.stroke();
        
        // Draw entry arrow
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(x1 - 20, y1 + boxSize/2);
        ctx.lineTo(x1 - 5, y1 + boxSize/2);
        ctx.moveTo(x1 - 10, y1 + boxSize/2 - arrowSize/2);
        ctx.lineTo(x1 - 5, y1 + boxSize/2);
        ctx.lineTo(x1 - 10, y1 + boxSize/2 + arrowSize/2);
        ctx.stroke();
      } else if (box.isRightEdge) {
        // Right edge box - draw with right side open
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
        
        // Draw exit arrow
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(x1 + boxSize + 5, y1 + boxSize/2);
        ctx.lineTo(x1 + boxSize + 20, y1 + boxSize/2);
        ctx.moveTo(x1 + boxSize + 15, y1 + boxSize/2 - arrowSize/2);
        ctx.lineTo(x1 + boxSize + 20, y1 + boxSize/2);
        ctx.lineTo(x1 + boxSize + 15, y1 + boxSize/2 + arrowSize/2);
        ctx.stroke();
      } else {
        // Standard box - draw as a complete square
        ctx.beginPath();
        ctx.rect(x1, y1, boxSize, boxSize);
        ctx.stroke();
      }
      
      // Add site index if labels are enabled
      if (showLabels) {
        ctx.fillStyle = boxColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(box.index.toString(), box.x, box.y + boxSize/2 + 20);
      }
    });
    
    ctx.restore();
  }
  
  /**
   * Draw the entering particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawEnteringParticles(ctx, parameters) {
    if (!this.state.enteringParticles.length) return;
    
    const boxSize = this.state.boxSize;
    const jumpColor = this.getColorFromPalette(parameters, this.state.colorIndices.jump);
    
    // Get the first box for reference
    const firstBox = this.state.boxes[0];
    if (!firstBox) return;
    
    ctx.save();
    
    // Draw each entering particle
    this.state.enteringParticles.forEach(particle => {
      const t = particle.entryProgress;
      
      // Calculate start position (outside first box)
      const startX = firstBox.x - boxSize - 20;
      const startY = firstBox.y;
      
      // Calculate end position (center of first box)
      const endX = firstBox.x;
      const endY = firstBox.y;
      
      // Interpolate position
      const x = startX + (endX - startX) * t;
      const y = startY;
      
      // Scale grows as particle enters
      const scale = 0.5 + 0.5 * t;
      
      // Color transitions from jump color to particle color
      ctx.fillStyle = this.lerpColor(jumpColor, particle.originalColor, t);
      
      // Draw the particle
      this.drawParticle(ctx, particle, x, y, scale);
    });
    
    ctx.restore();
  }
  
  /**
   * Draw particles including those in transit
   * @param {CanvasRenderingContext2D} ctx - Canvas context 
   * @param {Object} parameters - Visualization parameters
   */
  drawParticles(ctx, parameters) {
    if (!ctx || !this.state.particles.length) return;
    
    const boxSize = this.state.boxSize;
    const jumpColor = this.getColorFromPalette(parameters, this.state.colorIndices.jump);
    
    ctx.save();
    
    // Draw each particle
    this.state.particles.forEach(particle => {
      if (particle.isJumping) {
        const t = particle.jumpProgress;
        
        // Handle exiting particles
        if (particle.targetPosition === -1) {
          const startBox = this.state.boxes[particle.startPosition];
          
          if (particle.jumpState === 'entering' || particle.jumpState === 'inside') {
            // Initial phase - still in the box
            const x = startBox.x;
            const y = startBox.y;
            const scale = 1.0 - 0.3 * particle.insideProgress;
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
            this.drawParticle(ctx, particle, x, y, scale);
          } else {
            // Moving out of the system
            const progress = (t - 0.5) * 2; // Scale to [0,1] for second half
            const rightEdge = startBox.x + boxSize/2;
            const xOffset = boxSize/2 + 30;
            const x = rightEdge + progress * xOffset;
            const y = startBox.y;
            const scale = 1.0 - 0.5 * progress; // Shrink as it exits
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.7);
            this.drawParticle(ctx, particle, x, y, scale);
          }
        } else {
          // Normal jump between boxes
          const startBox = this.state.boxes[particle.startPosition];
          const endBox = this.state.boxes[particle.targetPosition];
          
          if (particle.jumpState === 'entering') {
            // Entering a box
            const progress = t * 2; // Scale to [0,1] for first half
            const x = startBox.x;
            const y = startBox.y;
            const scale = 1.0 - 0.3 * Math.sin(Math.PI * progress);
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
            this.drawParticle(ctx, particle, x, y, scale);
          } else if (particle.jumpState === 'inside') {
            // Moving inside between boxes
            const progress = particle.insideProgress;
            const x = startBox.x + (endBox.x - startBox.x) * progress;
            const y = startBox.y;
            const scale = 0.7; // Smaller while inside
            
            ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.7);
            this.drawParticle(ctx, particle, x, y, scale);
          } else {
            // Exiting into the destination box
            const progress = (t - 0.5) * 2; // Scale to [0,1] for second half
            const x = endBox.x;
            const y = endBox.y;
            const scale = 0.7 + 0.3 * progress; // Grow when entering destination
            
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
    });
    
    ctx.restore();
  }
  
  /**
   * Draw model-specific debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startY - Y position to start drawing
   */
  drawSpecificDebugInfo(ctx, startY) {
    let y = startY;
    
    ctx.fillText(`Right Rate: ${this.getParameterValue('rightJumpRate', 0.8).toFixed(1)}`, 20, y);
    y += 20;
    ctx.fillText(`Left Rate: ${this.getParameterValue('leftJumpRate', 0.2).toFixed(1)}`, 20, y);
    y += 20;
    ctx.fillText(`Entry Rate: ${this.state.entryRate.toFixed(1)}`, 20, y);
    y += 20;
    ctx.fillText(`Exit Rate: ${this.state.exitRate.toFixed(1)}`, 20, y);
    y += 20;
    ctx.fillText(`Total Particles: ${this.state.particleCount}`, 20, y);
  }
  
  /**
   * Check if a position is occupied
   * @param {number} position - Position to check
   * @param {Object} excludeParticle - Particle to exclude from check
   * @returns {boolean} Whether position is occupied
   */
  isPositionOccupied(position, excludeParticle = null) {
    // Check regular particles
    const isOccupiedByRegular = this.state.particles.some(p => 
      p !== excludeParticle && 
      p.position === position && 
      !p.isJumping
    );
    
    if (isOccupiedByRegular) return true;
    
    // Check jumping particles targeting this position
    const isOccupiedByJumping = this.state.particles.some(p => 
      p !== excludeParticle && 
      p.isJumping && 
      p.targetPosition === position
    );
    
    if (isOccupiedByJumping) return true;
    
    // For position 0, also check if any particle is currently entering
    if (position === 0 && this.state.enteringParticles.length > 0) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle user interaction
   * @param {string} type - Interaction type
   * @param {Object} event - Event data
   * @returns {boolean} Whether interaction was handled
   */
  handleInteraction(type, event) {
    if (type === 'click') {
      const boxSize = this.state.boxSize;
      
      // Check for click on boxes to add/remove particles
      for (let i = 0; i < this.state.boxes.length; i++) {
        const box = this.state.boxes[i];
        const dx = event.x - box.x;
        const dy = event.y - box.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If clicked within box
        if (distance <= boxSize / 2) {
          // Check if box already has a particle
          const particleIndex = this.state.particles.findIndex(p => 
            p.position === i && !p.isJumping
          );
          
          if (particleIndex >= 0) {
            // Remove particle
            this.state.particles.splice(particleIndex, 1);
            this.state.particleCount--;
            
            // Update numParticles parameter
            this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
            return true;
          } else if (!this.isPositionOccupied(i)) {
            // Add particle if box is empty
            // Get particle color from palette
            const particleColor = this.getColorFromPalette(
              { colorPalette: this.getParameterValue('colorPalette') }, 
              this.state.colorIndices.particle
            );
            
            // Find highest ID
            const maxId = Math.max(
              ...this.state.particles.map(p => p.id),
              ...this.state.enteringParticles.map(p => p.id),
              -1
            );
            
            // Get jump rates
            const rightRate = this.getParameterValue('rightJumpRate', 0.8);
            const leftRate = this.getParameterValue('leftJumpRate', 0.2);
            
            // Create particle with exponential clocks
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
  leftJumpTime: this.state.currentTime + this.generateExponentialTime(leftRate),
  // Add exit time if at right edge
  exitJumpTime: i === this.state.boxes.length - 1 ? 
   this.state.currentTime + this.generateExponentialTime(this.state.exitRate) : undefined
            });
            
            this.state.particleCount++;
            
            // Update numParticles parameter
            this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
            
            return true;
          }
        }
      }
      
      // Check for click near left boundary to manually trigger entry
      const firstBox = this.state.boxes[0];
      if (firstBox) {
        const leftEdge = firstBox.x - boxSize/2;
        if (event.x < leftEdge && 
            Math.abs(event.y - firstBox.y) < boxSize/2 && 
            event.x > leftEdge - 30) {
          
          // Check if first position is empty and no particle is currently entering
          if (!this.isPositionOccupied(0) && this.state.enteringParticles.length === 0) {
            this.startEntryAnimation();
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Generate a time from exponential distribution
   * @param {number} rate - Rate parameter for exponential distribution
   * @returns {number} Random time value
   */
  generateExponentialTime(rate) {
    // For rate = 0, return Infinity (event never happens)
    if (rate <= 0) return Infinity;
    
    // Generate random exponential time with given rate
    // For exponential distribution: time = -ln(u)/rate where u is uniform(0,1)
    const u = Math.random();
    return -Math.log(u) / rate;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clean up entering/exiting particles
    this.state.enteringParticles = [];
    this.state.exitingParticles = [];
    
    // Reset particle count
    this.state.particleCount = 0;
    
    // Call base dispose method
    super.dispose();
  }
}