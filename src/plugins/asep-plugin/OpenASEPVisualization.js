// src/plugins/asep-plugin/OpenASEPVisualization.js
import { BaseASEPVisualization } from './BaseASEPVisualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Open boundary ASEP model - particles can enter/exit at the boundaries
 */
export class OpenASEPVisualization extends BaseASEPVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Add specific state for open system
    this.state.entryEvents = [];  // Track entry events
    this.state.exitEvents = [];   // Track exit events
    this.state.enteringParticles = []; // Particles currently entering the system
    this.state.exitingParticles = [];  // Particles currently exiting the system
    this.state.particleCount = 0;  // Track total particle count for UI updates
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
    this.state.entryEvents = [];
    this.state.exitEvents = [];
    this.state.enteringParticles = [];
    this.state.exitingParticles = [];
    
    // Create boxes
    this.createBoxes(parameters);
    
    // Create initial particles with random positions
    this.createParticles(parameters);
    
    // Store particle count
    this.state.particleCount = this.state.particles.length;
    
    // Update numParticles parameter to match actual count
    this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
    
    // Schedule initial jumps for each particle
    this.scheduleInitialJumps();
    
    // Schedule entry attempts
    this.scheduleEntryAttempt();
    
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
   * Create initial particles with random positions
   * @param {Object} parameters - Visualization parameters
   */
  createParticles(parameters) {
    // Get parameter values with defaults
    const numParticles = Math.min(
      parameters.numParticles !== undefined ? parameters.numParticles : 5,
      parameters.numBoxes || 10
    );
    const numBoxes = parameters.numBoxes || 10;
    
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
    
    // Create particles
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
        insideProgress: 0
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
    
    // Calculate total rate based on position
    let totalRate = rightRate + leftRate;
    
    // Add exit rate if at the rightmost box
    if (particle.position === this.state.boxes.length - 1) {
      totalRate += exitRate;
    }
    
    // Calculate waiting time (exponential distribution)
    const waitTime = -Math.log(Math.random()) / totalRate;
    const scaledWaitTime = waitTime / this.state.timeScale;
    
    // Create jump event
    const jumpEvent = {
      particleId: particle.id,
      timeoutId: setTimeout(() => {
        // Choose jump type based on rates
        const rand = Math.random() * totalRate;
        
        // Check for exit from right boundary
        if (particle.position === this.state.boxes.length - 1 && rand >= rightRate + leftRate) {
          // Exit right boundary
          this.startExitAnimation(particle);
          
          // Decrease particle count
          this.state.particleCount--;
          
          // Update numParticles parameter
          this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
          
          // Remove this event
          this.state.jumpEvents = this.state.jumpEvents.filter(e => e.timeoutId !== jumpEvent.timeoutId);
          return;
        }
        
        // Otherwise, regular left/right jump
        const jumpRight = rand < rightRate;
        const targetPos = jumpRight ? particle.position + 1 : particle.position - 1;
        
        // Check if target position is valid
        if (targetPos >= 0 && targetPos < this.state.boxes.length) {
          // Check if target position is empty
          if (!this.isPositionOccupied(targetPos, particle)) {
            // Start jump animation
            particle.isJumping = true;
            particle.jumpProgress = 0;
            particle.startPosition = particle.position;
            particle.targetPosition = targetPos;
            particle.originalColor = particle.color;
            particle.jumpState = 'entering'; // Start the animation sequence
            
            // Remove this event from tracking
            this.state.jumpEvents = this.state.jumpEvents.filter(e => e.timeoutId !== jumpEvent.timeoutId);
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
  }
  
  /**
   * Schedule an entry attempt at the left boundary
   */
  scheduleEntryAttempt() {
    if (this.state.isPaused) return;
    
    // Get entry rate from parameters
    const entryRate = this.getParameterValue('entryRate', 0.5);
    
    // Calculate waiting time (exponential distribution)
    const waitTime = -Math.log(Math.random()) / entryRate;
    const scaledWaitTime = waitTime / this.state.timeScale;
    
    // Create entry event
    const entryEvent = {
      timeoutId: setTimeout(() => {
        // Check if first position is empty
        if (!this.isPositionOccupied(0)) {
          // Start entry animation
          this.startEntryAnimation();
          
          // Increase particle count
          this.state.particleCount++;
          
          // Update numParticles parameter
          this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
        }
        
        // Schedule next entry attempt regardless of whether this one succeeded
        this.scheduleEntryAttempt();
        
        // Remove this event
        this.state.entryEvents = this.state.entryEvents.filter(e => e.timeoutId !== entryEvent.timeoutId);
      }, scaledWaitTime * 1000) // Convert to milliseconds
    };
    
    // Add to entry events array for tracking
    this.state.entryEvents.push(entryEvent);
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
    
    // Get position of first box
    const firstBox = this.state.boxes[0];
    if (!firstBox) return;
    
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
      entryProgress: 0
    };
    
    // Add to entering particles array
    this.state.enteringParticles.push(newParticle);
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
    // Create list of particles to complete entry
    const particlesToComplete = [];
    
    // Update each entering particle
    this.state.enteringParticles.forEach(particle => {
      // Progress the entry animation
      particle.entryProgress += deltaTime * particle.jumpSpeed * this.state.timeScale;
      
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
      
      // Schedule next jump
      if (!this.state.isPaused) {
        this.scheduleNextJump(particle);
      }
    });
  }
  
  /**
   * Update the visualization parameters
   * @param {Object} parameters - Parameters to update
   */
  update(parameters) {
    // First call the parent update method for common parameters
    super.update(parameters);
    
    // Handle specific parameters for open ASEP
    if (parameters.entryRate !== undefined) {
      // If entry rate changed, we need to reschedule entry events
      // Clear existing entry events
      this.state.entryEvents.forEach(event => {
        if (event.timeoutId) {
          clearTimeout(event.timeoutId);
        }
      });
      this.state.entryEvents = [];
      
      // Reschedule entry attempts
      if (!this.state.isPaused) {
        this.scheduleEntryAttempt();
      }
    }
    
    // If isPaused changed, handle pause/resume
    if (parameters.isPaused !== undefined && parameters.isPaused !== this.state.isPaused) {
      this.state.isPaused = parameters.isPaused;
      
      if (!this.state.isPaused) {
        // Resume - schedule jumps for non-jumping particles
        this.state.particles.forEach(particle => {
          if (!particle.isJumping) {
            this.scheduleNextJump(particle);
          }
        });
        
        // Resume entry attempts
        this.scheduleEntryAttempt();
      } else {
        // Pause - clear all scheduled events
        this.state.jumpEvents.forEach(event => {
          if (event.timeoutId) {
            clearTimeout(event.timeoutId);
          }
        });
        this.state.jumpEvents = [];
        
        this.state.entryEvents.forEach(event => {
          if (event.timeoutId) {
            clearTimeout(event.timeoutId);
          }
        });
        this.state.entryEvents = [];
      }
    }
    
    // If numBoxes or numParticles changed drastically, reset simulation
    if ((parameters.numBoxes !== undefined && Math.abs(parameters.numBoxes - this.state.boxes.length) > 1) ||
        (parameters.numParticles !== undefined && Math.abs(parameters.numParticles - this.state.particleCount) > 2)) {
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
   * Draw debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawDebugInfo(ctx, parameters) {
    ctx.save();
    
    // Reset transform to work in screen space
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw a semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 220, 130);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Entry Rate: ${this.getParameterValue('entryRate', 0.5)}`, 20, 20);
    ctx.fillText(`Exit Rate: ${this.getParameterValue('exitRate', 0.5)}`, 20, 40);
    ctx.fillText(`Right Rate: ${this.getParameterValue('rightJumpRate', 0.8)}`, 20, 60);
    ctx.fillText(`Left Rate: ${this.getParameterValue('leftJumpRate', 0.2)}`, 20, 80);
    ctx.fillText(`Particles: ${this.state.particles.length}`, 20, 100);
    ctx.fillText(`Total Count: ${this.state.particleCount}`, 20, 120);
    
    ctx.restore();
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
   * Toggle simulation pause state
   */
  toggleSimulation() {
    this.state.isPaused = !this.state.isPaused;
    
    // Update plugin parameter
    this.plugin.updateParameter('isPaused', this.state.isPaused, 'plugin');
    
    if (!this.state.isPaused) {
      // Resume by scheduling jumps for all stationary particles
      this.state.particles.forEach(particle => {
        if (!particle.isJumping) {
          this.scheduleNextJump(particle);
        }
      });
      
      // Schedule entry attempts
      this.scheduleEntryAttempt();
    } else {
      // Pause by clearing all scheduled jumps
      this.state.jumpEvents.forEach(event => {
        if (event.timeoutId) {
          clearTimeout(event.timeoutId);
        }
      });
      this.state.jumpEvents = [];
      
      // Clear entry events
      this.state.entryEvents.forEach(event => {
        if (event.timeoutId) {
          clearTimeout(event.timeoutId);
        }
      });
      this.state.entryEvents = [];
    }
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
            
            // Create particle
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
            
            // Update numParticles parameter
            this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
            
            // Schedule jump
            if (!this.state.isPaused) {
              this.scheduleNextJump(this.state.particles[this.state.particles.length - 1]);
            }
            
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
            
            // Increase particle count
            this.state.particleCount++;
            
            // Update numParticles parameter
            this.plugin.updateParameter('numParticles', this.state.particleCount, 'visualization');
            
            return true;
          }
        }
      }
      
      return false;
    }
    
    return false;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clean up entry events
    this.state.entryEvents.forEach(event => {
      if (event.timeoutId) {
        clearTimeout(event.timeoutId);
      }
    });
    this.state.entryEvents = [];
    
    // Clean up exit events
    this.state.exitEvents.forEach(event => {
      if (event.timeoutId) {
        clearTimeout(event.timeoutId);
      }
    });
    this.state.exitEvents = [];
    
    // Clean up entering/exiting particles
    this.state.enteringParticles = [];
    this.state.exitingParticles = [];
    
    // Reset particle count
    this.state.particleCount = 0;
    
    // Call base dispose method
    super.dispose();
  }
}