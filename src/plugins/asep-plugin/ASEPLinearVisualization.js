// src/plugins/asep-plugin/LinearASEPVisualization.js
import { Visualization } from '../../core/Visualization.js';

export class LinearASEPVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Store simulation state
    this.state = {
      isAnimating: true,       // Flag to ensure continuous rendering
      isPaused: false,         // Flag to control simulation pausing
      boxes: [],               // Array of box positions
      particles: [],           // Array of particle objects
      jumpEvents: [],          // Array to track scheduled jump events
      timeScale: 1.0           // Time scaling factor for simulation speed
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
    
    // Create initial particles with random positions
    this.createParticles(parameters);
    
    // Schedule initial jumps for each particle
    this.scheduleInitialJumps();
    
    // Set animation flag
    this.state.isAnimating = true;
    this.state.isPaused = false;
    
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
  }
  
  /**
   * Create boxes for the ASEP lattice
   * @param {Object} parameters - Visualization parameters
   */
  createBoxes(parameters) {
    const numBoxes = parameters.numBoxes;
    const boxWidth = parameters.boxWidth;
    const boxHeight = parameters.boxHeight;
    
    // Calculate total width to center the boxes
    const totalWidth = numBoxes * boxWidth;
    const startX = -totalWidth / 2;
    
    // Create boxes
    for (let i = 0; i < numBoxes; i++) {
      this.state.boxes.push({
        index: i,
        x: startX + (i * boxWidth) + boxWidth / 2, // center x position
        y: 0,  // center y position
        width: boxWidth,
        height: boxHeight
      });
    }
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
        jumpSpeed: 2.0
      });
    }
  }
  
  /**
   * Schedule initial jumps for particles
   */
  scheduleInitialJumps() {
    this.state.particles.forEach(particle => {
      this.scheduleNextJump(particle);
    });
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
          const targetIsEmpty = !this.state.particles.some(p => 
            p !== particle && 
            p.position === targetPos && 
            !p.isJumping && 
            // Also check if there's no particle jumping to the same position
            !(p.isJumping && p.targetPosition === targetPos)
          );
          
          if (targetIsEmpty) {
            // Start jump animation
            particle.isJumping = true;
            particle.jumpProgress = 0;
            particle.startPosition = particle.position;
            particle.targetPosition = targetPos;
            particle.originalColor = particle.color;
            
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
    // Always request continuous rendering
    let needsUpdate = false;
    
    // Update particle jump animations
    this.state.particles.forEach(particle => {
      if (particle.isJumping) {
        needsUpdate = true;
        // Update jump progress
        particle.jumpProgress += deltaTime * particle.jumpSpeed;
        
        if (particle.jumpProgress >= 1) {
          // Jump complete
          particle.isJumping = false;
          particle.jumpProgress = 0;
          particle.position = particle.targetPosition;
          particle.color = particle.originalColor;
          
          // Schedule next jump if not paused
          if (!this.state.isPaused) {
            this.scheduleNextJump(particle);
          }
        }
      }
    });
    
    // Return true to ensure continuous rendering
    return true;
  }
  
  /**
   * Render the visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  render2D(ctx, parameters) {
    // Draw boxes
    this.drawBoxes(ctx, parameters);
    
    // Draw particles
    this.drawParticles(ctx, parameters);
    
    // Draw status indicators
    this.drawStatusIndicators(ctx, parameters);
  }
  
  /**
   * Draw the boxes/lattice
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawBoxes(ctx, parameters) {
    const boxColor = parameters.boxColor;
    const boxWidth = parameters.boxWidth;
    const boxHeight = parameters.boxHeight;
    
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2;
    
    // Draw each box
    this.state.boxes.forEach(box => {
      // Draw a box with open top
      ctx.beginPath();
      
      // Start from top left corner
      const x1 = box.x - boxWidth / 2;
      const y1 = box.y - boxHeight / 2;
      
      // Draw three sides (leaving top open)
      ctx.moveTo(x1, y1);             // Top left
      ctx.lineTo(x1, y1 + boxHeight); // Down to bottom left
      ctx.lineTo(x1 + boxWidth, y1 + boxHeight); // Across to bottom right
      ctx.lineTo(x1 + boxWidth, y1);  // Up to top right
      
      ctx.stroke();
      
      // Add site index below box
      ctx.fillStyle = boxColor;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(box.index.toString(), box.x, box.y + boxHeight/2 + 20);
    });
  }
  
  /**
   * Draw the particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawParticles(ctx, parameters) {
    const particleRadius = parameters.particleRadius;
    const particleColor = parameters.particleColor;
    const jumpColor = parameters.jumpColor;
    const boxHeight = parameters.boxHeight;
    
    // Draw each particle
    this.state.particles.forEach(particle => {
      ctx.save();
      
      let x, y;
      
      if (particle.isJumping) {
        // Calculate position for jumping particle
        const t = particle.jumpProgress;
        const startBox = this.state.boxes[particle.startPosition];
        const endBox = this.state.boxes[particle.targetPosition];
        
        // Linear interpolation for x position
        x = startBox.x + (endBox.x - startBox.x) * t;
        
        // Arc motion for y position (higher in middle of jump)
        const baseY = startBox.y - boxHeight/2 - particleRadius;
        const jumpHeight = boxHeight * 0.8;
        y = baseY - jumpHeight * Math.sin(Math.PI * t);
        
        // Interpolate color during jump
        ctx.fillStyle = this.lerpColor(
          particle.originalColor, 
          jumpColor, 
          Math.sin(Math.PI * t)
        );
      } else {
        // Static particle
        const box = this.state.boxes[particle.position];
        x = box.x;
        y = box.y - boxHeight/2 - particleRadius;
        ctx.fillStyle = particle.color;
      }
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(x, y, particleRadius, 0, Math.PI * 2);
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
   * Draw status indicators (pause/play, rates)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Visualization parameters
   */
  drawStatusIndicators(ctx, parameters) {
    ctx.save();
    
    // Move to top-left corner of the view
    const viewCenter = this.state.boxes[Math.floor(this.state.boxes.length / 2)];
    const viewWidth = (this.state.boxes.length * parameters.boxWidth) + 200;
    const x = viewCenter.x - viewWidth/2 + 20;
    const y = viewCenter.y - 200;
    
    // Draw simulation status
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Simulation: ${this.state.isPaused ? 'Paused' : 'Running'}`, 
      x, 
      y
    );
    
    // Draw rates
    ctx.fillText(
      `Right Rate: ${parameters.rightJumpRate.toFixed(1)}`, 
      x, 
      y + 25
    );
    
    ctx.fillText(
      `Left Rate: ${parameters.leftJumpRate.toFixed(1)}`, 
      x, 
      y + 50
    );
    
    // Draw particle count
    ctx.fillText(
      `Particles: ${this.state.particles.length}`, 
      x, 
      y + 75
    );
    
    ctx.restore();
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
    // For visual parameters, we don't need to reinitialize
    // They will be used in the next render cycle
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
  }
}