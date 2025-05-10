// src/plugins/asep-plugin/ASEPCircularVisualization.js
import { ASEPBaseVisualization } from './ASEPBaseVisualization.js';

export class ASEPCircularVisualization extends ASEPBaseVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Specific properties for circular visualization
    this.circleRadius = 150;
    this.particleCount = 0;
  }
  
  getBoundaryName() {
    return "Circular";
  }
  
  async initialize(parameters) {
    await super.initialize(parameters);
    
    // Count initial particles for conservation check
    this.countParticles();
    
    return true;
  }
  
  countParticles() {
    this.particleCount = this.lattice.reduce((sum, site) => sum + site, 0);
  }
  
  performSimulationStep(parameters) {
    const size = parameters.latticeSize;
    const rightHopRate = parameters.rightHopRate;
    const leftHopRate = parameters.leftHopRate;
    
    // Monte Carlo step: 
    // Attempt N random updates where N is the number of sites
    for (let attempt = 0; attempt < size; attempt++) {
      // Choose a random site
      const i = Math.floor(Math.random() * size);
      
      if (this.lattice[i] === 1) {
        // Site has particle
        // Try to hop right (with periodic boundary)
        const rightIndex = (i + 1) % size;
        if (this.lattice[rightIndex] === 0 && Math.random() < rightHopRate) {
          this.lattice[i] = 0;
          this.lattice[rightIndex] = 1;
        } 
        // Try to hop left (with periodic boundary)
        else {
          const leftIndex = (i - 1 + size) % size;
          if (this.lattice[leftIndex] === 0 && Math.random() < leftHopRate) {
            this.lattice[i] = 0;
            this.lattice[leftIndex] = 1;
          }
        }
      }
    }
    
    // Verify conservation (for debugging)
    const newCount = this.lattice.reduce((sum, site) => sum + site, 0);
    if (newCount !== this.particleCount) {
      console.error("Particle conservation violated!", this.particleCount, newCount);
      this.particleCount = newCount;
    }
    
    // Update current profile
    this.updateCurrentProfile();
  }
  
  updateCurrentProfile() {
    const size = this.lattice.length;
    const rightHopRate = this.plugin.parameters.rightHopRate;
    const leftHopRate = this.plugin.parameters.leftHopRate;
    
    // Calculate local current approximation with periodic boundary
    for (let i = 0; i < size; i++) {
      const nextIndex = (i + 1) % size;
      // Current = rightHopRate * (density at i) * (1 - density at next) - leftHopRate * (density at next) * (1 - density at i)
      this.current[i] = rightHopRate * this.density[i] * (1 - this.density[nextIndex]) - 
                        leftHopRate * this.density[nextIndex] * (1 - this.density[i]);
    }
    
    // Add to history
    this.currentHistory.push([...this.current]);
    if (this.currentHistory.length > this.historyLength) {
      this.currentHistory.shift();
    }
  }
  
  render2D(ctx, parameters) {
    // Different rendering for circular layout
    const size = parameters.latticeSize;
    
    // Clear the canvas
    ctx.clearRect(-1000, -1000, 2000, 2000);
    
    // Draw title and info
    this.drawTitle(ctx, parameters);
    
    // Draw circular lattice
    this.drawCircularLattice(ctx, parameters);
    
    // Draw density profile if enabled
    if (parameters.showDensityProfile) {
      this.drawDensityProfile(ctx, parameters);
    }
    
    // Draw current profile if enabled
    if (parameters.showCurrentProfile) {
      this.drawCurrentProfile(ctx, parameters);
    }
  }
  
  drawCircularLattice(ctx, parameters) {
    const size = parameters.latticeSize;
    const siteSize = parameters.siteSize;
    const particleColor = parameters.particleColor;
    const emptyColor = parameters.emptyColor;
    
    // Draw a ring of sites
    const centerX = 0;
    const centerY = 100;
    const radius = this.circleRadius;
    
    // Draw circular track
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = siteSize;
    ctx.stroke();
    
    // Draw sites and particles
    for (let i = 0; i < size; i++) {
      const angle = (i / size) * Math.PI * 2;
      
      // Calculate position on circle
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Draw site
      ctx.beginPath();
      ctx.arc(x, y, siteSize/2, 0, Math.PI * 2);
      ctx.fillStyle = emptyColor;
      ctx.fill();
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw particle if present
      if (this.lattice[i] === 1) {
        ctx.beginPath();
        ctx.arc(x, y, siteSize/3, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();
      }
    }
    
    // Draw flow arrows
    this.drawFlowArrows(ctx, parameters);
    
    // Draw particle count
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(`Particles: ${this.particleCount} (${(this.particleCount/size).toFixed(2)} density)`, 
                 centerX, centerY - 15);
  }
  
  drawFlowArrows(ctx, parameters) {
    const rightHopRate = parameters.rightHopRate;
    const leftHopRate = parameters.leftHopRate;
    
    // Check dominant flow direction
    const netFlow = rightHopRate - leftHopRate;
    const centerX = 0;
    const centerY = 100;
    const arrowRadius = this.circleRadius + 20;
    
    // Draw clockwise/counterclockwise arrow
    ctx.beginPath();
    if (netFlow > 0) {
      // Clockwise flow (to the right)
      ctx.arc(centerX, centerY, arrowRadius, 0.7 * Math.PI, 0.3 * Math.PI);
    } else {
      // Counterclockwise flow (to the left)
      ctx.arc(centerX, centerY, arrowRadius, 0.3 * Math.PI, 0.7 * Math.PI, true);
    }
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw arrowhead
    const angle = netFlow > 0 ? 0.3 * Math.PI : 0.7 * Math.PI;
    const arrowX = centerX + arrowRadius * Math.cos(angle);
    const arrowY = centerY + arrowRadius * Math.sin(angle);
    
    ctx.beginPath();
    if (netFlow > 0) {
      // Right-pointing arrowhead
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 10, arrowY - 5);
      ctx.lineTo(arrowX - 10, arrowY + 5);
    } else {
      // Left-pointing arrowhead
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + 10, arrowY - 5);
      ctx.lineTo(arrowX + 10, arrowY + 5);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    
    // Draw hop rates
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    
    ctx.fillText(`p = ${rightHopRate.toFixed(2)}`, centerX + 40, centerY - arrowRadius - 5);
    ctx.fillText(`q = ${leftHopRate.toFixed(2)}`, centerX - 40, centerY - arrowRadius - 5);
  }
  
  handleInteraction(type, event) {
    if (type === 'click') {
      const centerX = 0;
      const centerY = 100;
      const radius = this.circleRadius;
      const size = this.plugin.parameters.latticeSize;
      const siteSize = this.plugin.parameters.siteSize;
      
      // Calculate distance from center
      const dx = event.x - centerX;
      const dy = event.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if click is near the circle
      if (Math.abs(distance - radius) < siteSize) {
        // Calculate angle
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;
        
        // Convert to site index
        const siteIndex = Math.floor((angle / (Math.PI * 2)) * size);
        
        // Toggle particle at this site
        this.lattice[siteIndex] = 1 - this.lattice[siteIndex];
        
        // Update particle count
        this.countParticles();
        
        // Update density profile
        this.updateDensityProfile();
        
        return true;
      }
    }
    
    return false;
  }
}