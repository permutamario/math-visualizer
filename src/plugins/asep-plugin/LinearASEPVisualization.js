// src/plugins/asep-plugin/LinearASEPVisualization.js
import { Visualization } from '../../core/Visualization.js';

export class LinearASEPVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Set the direct isAnimating property for the rendering manager
    this.isAnimating = true;
    
    // Store simulation state
    this.state = {
      isAnimating: true,        // Flag to ensure continuous rendering
      isPaused: false,          // Flag to control simulation pausing
      boxes: [],                // Array of box positions
      particles: [],            // Array of particle objects
      jumpEvents: [],           // Array to track scheduled jump events
      timeScale: 1.0,           // Time scaling factor for simulation speed
      leftPortal: null,         // Left entrance/exit portal
      rightPortal: null,        // Right entrance/exit portal
      boxSize: 40,              // Fixed box size (pixels)
      particleRadius: 14        // Fixed particle radius (pixels)
    };
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
    this.createPortals();
    
    // Create initial particles with random positions
    this.createParticles(parameters);
    
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
   * Clear any existing simulation state
   */
  clearSimulation() {
    // Clear existing jump timeouts
    this.state.jumpEvents.forEach(event => {
      if (event.timeoutId) {
        clearTimeout(event.timeoutId);
      }
    });
    
    // Reset state
    this.state.boxes = [];
    this.state.particles = [];
    this.state.jumpEvents = [];
    this.state.leftPortal = null;
    this.state.rightPortal = null;
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
   */
  createPortals() {
    const boxSize = this.state.boxSize;
    const firstBox = this.state.boxes[0];
    const lastBox = this.state.boxes[this.state.boxes.length - 1];
    
    // Create left portal (entry)
    this.state.leftPortal = {
      x: firstBox.x - boxSize,
      y: firstBox.y,
      size: boxSize * 0.8,
      color: '#9C27B0' // Purple portal
    };
    
    // Create right portal (exit)
    this.state.rightPortal = {
      x: lastBox.x + boxSize,
      y: lastBox.y,
      size: boxSize * 0.8,
      color: '#FF9800' // Orange portal
    };
  }
  
  /**
   * Create initial particles
   * @param {Object} parameters - Visualization parameters
   */
  createParticles(parameters) {
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
    
    // Create particles
    for (let i = 0; i < numParticles; i++) {
      this.state.particles.push({
        id: i,
        position: positions[i],
        isJumping: false,
        jumpProgress: 0,
        startPosition: positions[i],
        targetPosition: positions[i],
        color: parameters.particleColor,
        originalColor: parameters.particleColor,
        radius: this.state.particleRadius,
        jumpSpeed: 2.0,
        jumpState: 'none', // 'none', 'entering', 'inside', 'exiting'
        insideProgress: 0
      });
    }
  }
  
  /**
   * Schedule initial jumps for particles
   */
  scheduleInitialJumps() {
    if (!this.state.isPaused) {
      this.state.particles.forEach(particle => {
        this.scheduleNextJump(particle);
      });
    }
  }
  
  /**
   * Check if a position is already occupied
   * @param {number} position - Position to check
   * @param {Object} excludeParticle - Particle to exclude from check
   * @returns {boolean} True if position is occupied
   */
  isPositionOccupied(position, excludeParticle = null) {
    return this.state.particles.some(p => 
      p !== excludeParticle && 
      ((p.position === position && (p.jumpState === 'none' || p.jumpState === 'inside')) || 
       (p.isJumping && p.targetPosition === position))
    );
  }
  
  /**
   * Schedule the next jump for a particle
   * @param {Object} particle - Particle to schedule jump for
   */
  scheduleNextJump(particle) {
    if (this.state.isPaused) return;
    
    const rightRate = this.plugin.parameters.rightJumpRate;
    const leftRate = this.plugin.parameters.leftJumpRate;
    
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
            particle.jumpState = 'entering'; // Start the jump animation sequence
            
            // Remove event from tracking array
            this.state.jumpEvents = this.state.jumpEvents.filter(
              e => e.timeoutId !== jumpEvent.timeoutId
            );
          } else {
            // Target is occupied, try again
            this.scheduleNextJump(particle);
          }
        } else if (targetPos === -1) {
          // Exit left through portal
          particle.isJumping = true;
          particle.jumpProgress = 0;
          particle.startPosition = particle.position;
          particle.targetPosition = -1; // Special value for portal
          particle.originalColor = particle.color;
          particle.jumpState = 'exiting'; // Exiting the system
          
          // Remove event from tracking array
          this.state.jumpEvents = this.state.jumpEvents.filter(
            e => e.timeoutId !== jumpEvent.timeoutId
          );
        } else if (targetPos === this.state.boxes.length) {
          // Exit right through portal
          particle.isJumping = true;
          particle.jumpProgress = 0;
          particle.startPosition = particle.position;
          particle.targetPosition = this.state.boxes.length; // Special value for portal
          particle.originalColor = particle.color;
          particle.jumpState = 'exiting'; // Exiting the system
          
          // Remove event from tracking array
          this.state.jumpEvents = this.state.jumpEvents.filter(
            e => e.timeoutId !== jumpEvent.timeoutId
          );
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
   * Generate a new particle from a portal
   * @param {boolean} fromLeft - Whether particle enters from left portal
   */
  generateNewParticle(fromLeft) {
    // Find the highest ID to create a new unique ID
    const maxId = Math.max(...this.state.particles.map(p => p.id), -1);
    
    // Create the new particle
    const newParticle = {
      id: maxId + 1,
      position: fromLeft ? 0 : this.state.boxes.length - 1,
      isJumping: true,
      jumpProgress: 0,
      startPosition: fromLeft ? -1 : this.state.boxes.length,
      targetPosition: fromLeft ? 0 : this.state.boxes.length - 1,
      color: this.plugin.parameters.particleColor,
      originalColor: this.plugin.parameters.particleColor,
      radius: this.state.particleRadius,
      jumpSpeed: 2.0,
      jumpState: 'entering',
      insideProgress: 0
    };
    
    // Check if the target position is occupied
    if (!this.isPositionOccupied(newParticle.targetPosition)) {
      this.state.particles.push(newParticle);
    }
  }
  
  /**
   * Toggle simulation pause state
   */
  toggleSimulation() {
    this.state.isPaused = !this.state.isPaused;
    
    if (!this.state.isPaused) {
      // Resume by scheduling new jumps for non-jumping particles
      this.state.particles.forEach(particle => {
        if (!particle.isJumping) {
          this.scheduleNextJump(particle);
        }
      });
    } else {
      // Pause by clearing all scheduled jumps
      this.state.jumpEvents.forEach(event => {
        if (event.timeoutId) {
          clearTimeout(event.timeoutId);
        }
      });
      this.state.jumpEvents = [];
    }
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  animate(deltaTime) {
    // Update speed from parameters
    this.state.timeScale = this.plugin.parameters.animationSpeed;
    
    // Always request continuous rendering by setting direct property
    this.isAnimating = true;
    
    // Check for random particle generation from portals
    if (!this.state.isPaused) {
      const rightRate = this.plugin.parameters.rightJumpRate;
      const leftRate = this.plugin.parameters.leftJumpRate;
      
      // Chance of generating a particle from the left (right-moving)
      if (Math.random() < rightRate * 0.01 * deltaTime) {
        this.generateNewParticle(true); // From left
      }
      
      // Chance of generating a particle from the right (left-moving)
      if (Math.random() < leftRate * 0.01 * deltaTime) {
        this.generateNewParticle(false); // From right
      }
    }
    
    // Update particle jump animations
    let needsUpdate = false;
    
    // Update each particle
    const particlesToRemove = [];
    this.state.particles.forEach(particle => {
      if (particle.isJumping) {
        needsUpdate = true;
        // Update jump progress
        particle.jumpProgress += deltaTime * particle.jumpSpeed * this.state.timeScale;
        
        // Check for entering a box
        if (particle.jumpState === 'entering' && particle.jumpProgress >= 0.5) {
          particle.jumpState = 'inside';
          particle.insideProgress = 0;
        }
        // Check for exiting a box
        else if (particle.jumpState === 'inside' && particle.insideProgress >= 1.0) {
          particle.jumpState = 'exiting';
        }
        
        // Update inside progress if particle is inside a box
        if (particle.jumpState === 'inside') {
          particle.insideProgress += deltaTime * particle.jumpSpeed * this.state.timeScale * 2;
        }
        
        // Check if jump is complete
        if (particle.jumpProgress >= 1) {
          // Check if particle is exiting the system
          if ((particle.targetPosition === -1 || particle.targetPosition === this.state.boxes.length)) {
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
      }
    });
    
    // Remove particles that exited the system
    if (particlesToRemove.length > 0) {
      this.state.particles = this.state.particles.filter(p => !particlesToRemove.includes(p));
    }
    
    // Return true to ensure continuous rendering
    return true;
  }
  
  /**
   * Render the visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  render2D(ctx, parameters) {
    // Draw portals first
    this.drawPortals(ctx, parameters);
    
    // Draw boxes
    this.drawBoxes(ctx, parameters);
    
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
   * Draw the boxes/lattice
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawBoxes(ctx, parameters) {
    const boxColor = parameters.boxColor;
    const boxSize = this.state.boxSize;
    
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
      
      // Add site index below box
      ctx.fillStyle = boxColor;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(box.index.toString(), box.x, box.y + boxSize/2 + 20);
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
    const jumpColor = parameters.jumpColor;
    
    // Draw each particle
    this.state.particles.forEach(particle => {
      ctx.save();
      
      let x, y, scale;
      
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
            x = portalX + (targetBox.x - boxSize/2 - portalX) * progress;
            y = portalY;
            scale = 1.0;
          } else if (particle.jumpState === 'inside') {
            // Inside the box
            x = targetBox.x;
            y = targetBox.y;
            scale = 1.0 - 0.3 * Math.sin(Math.PI * particle.insideProgress); // Shrink a bit when inside
          } else {
            // Exiting the box
            const progress = (t - 0.5) * 2; // Scale to [0,1] for the second half
            x = targetBox.x;
            y = targetBox.y;
            scale = 1.0;
          }
        } else if (particle.targetPosition === -1) {
          // Exiting to left portal
          const startBox = this.state.boxes[particle.startPosition];
          const portalX = this.state.leftPortal.x;
          const portalY = this.state.leftPortal.y;
          
          if (particle.jumpState === 'entering') {
            // Entering the box
            x = startBox.x;
            y = startBox.y;
            scale = 1.0 - 0.3 * Math.sin(Math.PI * 0.5); // Shrink at start
          } else if (particle.jumpState === 'inside') {
            // Inside the box
            x = startBox.x;
            y = startBox.y;
            scale = 1.0 - 0.3 * Math.sin(Math.PI * particle.insideProgress); // Shrink inside
          } else {
            // Moving from box edge to portal
            const progress = (t - 0.5) * 2; // Scale to [0,1] for the second half
            x = (startBox.x - boxSize/2) + (portalX - (startBox.x - boxSize/2)) * progress;
            y = portalY;
            scale = 1.0;
          }
        } else if (particle.targetPosition === this.state.boxes.length) {
          // Exiting to right portal
          const startBox = this.state.boxes[particle.startPosition];
          const portalX = this.state.rightPortal.x;
          const portalY = this.state.rightPortal.y;
          
          if (particle.jumpState === 'entering') {
            // Entering the box
            x = startBox.x;
            y = startBox.y;
            scale = 1.0 - 0.3 * Math.sin(Math.PI * 0.5); // Shrink at start
          } else if (particle.jumpState === 'inside') {
            // Inside the box
            x = startBox.x;
            y = startBox.y;
            scale = 1.0 - 0.3 * Math.sin(Math.PI * particle.insideProgress); // Shrink inside
          } else {
            // Moving from box edge to portal
            const progress = (t - 0.5) * 2; // Scale to [0,1] for the second half
            x = (startBox.x + boxSize/2) + (portalX - (startBox.x + boxSize/2)) * progress;
            y = portalY;
            scale = 1.0;
          }
        } else {
          // Normal jump between boxes
          const startBox = this.state.boxes[particle.startPosition];
          const endBox = this.state.boxes[particle.targetPosition];
          
          if (particle.jumpState === 'entering') {
            // Entering the box
            const progress = t * 2; // Scale to [0,1] for the first half
            x = startBox.x;
            y = startBox.y;
            scale = 1.0 - 0.3 * Math.sin(Math.PI * progress); // Shrink when entering
          } else if (particle.jumpState === 'inside') {
            // Moving from startBox to endBox while inside
            const progress = particle.insideProgress;
            x = startBox.x + (endBox.x - startBox.x) * progress;
            y = startBox.y;
            scale = 0.7; // Consistently smaller while inside
          } else {
            // Exiting the box
            const progress = (t - 0.5) * 2; // Scale to [0,1] for the second half
            x = endBox.x;
            y = endBox.y;
            scale = 0.7 + 0.3 * progress; // Grow when exiting
          }
        }
        
        // Set particle color based on state
        if (particle.jumpState === 'inside') {
          ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.7);
        } else {
          ctx.fillStyle = this.lerpColor(particle.originalColor, jumpColor, 0.3);
        }
      } else {
        // Static particle
        const box = this.state.boxes[particle.position];
        x = box.x;
        y = box.y;
        scale = 1.0;
        ctx.fillStyle = particle.color;
      }
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(x, y, particle.radius * scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw particle ID
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(particle.id.toString(), x, y);
      
      ctx.restore();
    });
  }
  
  /**
   * Interpolate between two colors
   * @param {string} startColor - Starting color (hex or rgb)
   * @param {string} endColor - Ending color (hex or rgb)
   * @param {number} t - Interpolation factor (0-1)
   * @returns {string} Interpolated color
   */
  lerpColor(startColor, endColor, t) {
    // Parse colors to RGB
    const start = this.parseColor(startColor);
    const end = this.parseColor(endColor);
    
    // Interpolate RGB components
    const r = Math.floor(start.r + (end.r - start.r) * t);
    const g = Math.floor(start.g + (end.g - start.g) * t);
    const b = Math.floor(start.b + (end.b - start.b) * t);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Parse a color string to RGB components
   * @param {string} colorStr - Color string (hex or rgb)
   * @returns {Object} RGB components
   */
  parseColor(colorStr) {
    // Handle hex colors
    if (colorStr.startsWith('#')) {
      const r = parseInt(colorStr.slice(1, 3), 16);
      const g = parseInt(colorStr.slice(3, 5), 16);
      const b = parseInt(colorStr.slice(5, 7), 16);
      return { r, g, b };
    }
    
    // Handle rgb colors
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    
    // Default to black
    return { r: 0, g: 0, b: 0 };
  }
  
  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - New parameter values
   */
  update(parameters) {
    // Update animation state based on isPaused parameter
    if (parameters.isPaused !== undefined && parameters.isPaused !== this.state.isPaused) {
      this.state.isPaused = parameters.isPaused;
      
      if (!this.state.isPaused) {
        // Resume simulation
        this.state.particles.forEach(particle => {
          if (!particle.isJumping) {
            this.scheduleNextJump(particle);
          }
        });
      } else {
        // Pause simulation
        this.state.jumpEvents.forEach(event => {
          if (event.timeoutId) {
            clearTimeout(event.timeoutId);
          }
        });
        this.state.jumpEvents = [];
      }
    }
    
    // Update timeScale
    if (parameters.animationSpeed !== undefined) {
      this.state.timeScale = parameters.animationSpeed;
    }
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
          } else if (!this.isPositionOccupied(i)) {
            // Add particle if box is empty
            const maxId = Math.max(...this.state.particles.map(p => p.id), -1);
            
            this.state.particles.push({
              id: maxId + 1,
              position: i,
              isJumping: false,
              jumpProgress: 0,
              startPosition: i,
              targetPosition: i,
              color: this.plugin.parameters.particleColor,
              originalColor: this.plugin.parameters.particleColor,
              radius: this.state.particleRadius,
              jumpSpeed: 2.0,
              jumpState: 'none',
              insideProgress: 0
            });
            
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
  
  /**
   * Clean up resources when visualization is no longer needed
   */
  dispose() {
    // Clear all timeouts
    this.state.jumpEvents.forEach(event => {
      if (event.timeoutId) {
        clearTimeout(event.timeoutId);
      }
    });
    
    // Reset state
    this.state.jumpEvents = [];
    this.state.particles = [];
    this.state.boxes = [];
    this.state.isAnimating = false;
    this.isAnimating = false;
  }
}