// src/plugins/asep-plugin/ASEPOpenVisualization.js
import { ASEPBaseVisualization } from './ASEPBaseVisualization.js';

export class ASEPOpenVisualization extends ASEPBaseVisualization {
  constructor(plugin) {
    super(plugin);
    
    // Parameters specific to open boundaries
    this.leftReservoirDensity = 0.9;  // Alpha - insertion rate at left
    this.rightReservoirDensity = 0.1; // Beta - extraction rate at right
  }
  
  async initialize(parameters) {
    // Set reservoir parameters
    this.leftReservoirDensity = parameters.leftHopRate * 2;
    if (this.leftReservoirDensity > 0.95) this.leftReservoirDensity = 0.95;
    
    this.rightReservoirDensity = 1 - parameters.rightHopRate * 2;
    if (this.rightReservoirDensity < 0.05) this.rightReservoirDensity = 0.05;
    
    return super.initialize(parameters);
  }
  
  update(parameters) {
    super.update(parameters);
    
    // Update reservoir parameters based on hop rates
    // (This is just one way to relate them - in real research you might want different controls)
    this.leftReservoirDensity = parameters.leftHopRate * 2;
    if (this.leftReservoirDensity > 0.95) this.leftReservoirDensity = 0.95;
    
    this.rightReservoirDensity = 1 - parameters.rightHopRate * 2;
    if (this.rightReservoirDensity < 0.05) this.rightReservoirDensity = 0.05;
  }
  
  getBoundaryName() {
    return "Open";
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
      
      if (i === 0) {
        // Left boundary (entry)
        if (this.lattice[i] === 0) {
          // Site is empty, try to insert a particle
          if (Math.random() < this.leftReservoirDensity) {
            this.lattice[i] = 1;
          }
        } else {
          // Site has particle, try to hop right
          if (i + 1 < size && this.lattice[i + 1] === 0 && Math.random() < rightHopRate) {
            this.lattice[i] = 0;
            this.lattice[i + 1] = 1;
          }
        }
      } else if (i === size - 1) {
        // Right boundary (exit)
        if (this.lattice[i] === 1) {
          // Site has particle, try to remove it
          if (Math.random() < 1 - this.rightReservoirDensity) {
            this.lattice[i] = 0;
          } else if (i - 1 >= 0 && this.lattice[i - 1] === 0 && Math.random() < leftHopRate) {
            // Or hop left
            this.lattice[i] = 0;
            this.lattice[i - 1] = 1;
          }
        }
      } else {
        // Bulk dynamics
        if (this.lattice[i] === 1) {
          // Site has particle
          // Try to hop right
          if (i + 1 < size && this.lattice[i + 1] === 0 && Math.random() < rightHopRate) {
            this.lattice[i] = 0;
            this.lattice[i + 1] = 1;
          } 
          // Try to hop left
          else if (i - 1 >= 0 && this.lattice[i - 1] === 0 && Math.random() < leftHopRate) {
            this.lattice[i] = 0;
            this.lattice[i - 1] = 1;
          }
        }
      }
    }
    
    // Update current profile
    this.updateCurrentProfile();
  }
  
  updateCurrentProfile() {
    const size = this.lattice.length;
    const rightHopRate = this.plugin.parameters.rightHopRate;
    const leftHopRate = this.plugin.parameters.leftHopRate;
    
    // Calculate local current approximation
    for (let i = 0; i < size - 1; i++) {
      // Current = rightHopRate * (density at i) * (1 - density at i+1) - leftHopRate * (density at i+1) * (1 - density at i)
      this.current[i] = rightHopRate * this.density[i] * (1 - this.density[i+1]) - 
                       leftHopRate * this.density[i+1] * (1 - this.density[i]);
    }
    
    // Handle rightmost site
    this.current[size-1] = 0;
    
    // Add to history
    this.currentHistory.push([...this.current]);
    if (this.currentHistory.length > this.historyLength) {
      this.currentHistory.shift();
    }
  }
  
  drawLattice(ctx, parameters) {
    // Draw the base lattice
    super.drawLattice(ctx, parameters);
    
    const size = parameters.latticeSize;
    const siteSize = parameters.siteSize;
    
    // Left reservoir
    const leftX = this.latticeOffset.x - siteSize;
    const leftY = this.latticeOffset.y;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(leftX, leftY, siteSize, siteSize);
    ctx.strokeStyle = '#aaa';
    ctx.strokeRect(leftX, leftY, siteSize, siteSize);
    
    // Right reservoir
    const rightX = this.latticeOffset.x + size * siteSize;
    const rightY = this.latticeOffset.y;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(rightX, rightY, siteSize, siteSize);
    ctx.strokeStyle = '#aaa';
    ctx.strokeRect(rightX, rightY, siteSize, siteSize);
    
    // Draw particles in reservoirs (density representation)
    const leftParticles = Math.round(this.leftReservoirDensity * 5);
    const rightParticles = Math.round(this.rightReservoirDensity * 5);
    
    ctx.fillStyle = parameters.particleColor;
    const dotSize = siteSize / 10;
    
    // Left reservoir particles
    for (let i = 0; i < leftParticles; i++) {
      const dotX = leftX + siteSize / 2 - dotSize * 2 + (i % 3) * dotSize * 2;
      const dotY = leftY + siteSize / 3 + Math.floor(i / 3) * dotSize * 2;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Right reservoir particles
    for (let i = 0; i < rightParticles; i++) {
      const dotX = rightX + siteSize / 2 - dotSize * 2 + (i % 3) * dotSize * 2;
      const dotY = rightY + siteSize / 3 + Math.floor(i / 3) * dotSize * 2;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw reservoir labels
    ctx.font = '10px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    
    ctx.fillText(`α=${this.leftReservoirDensity.toFixed(2)}`, leftX + siteSize/2, leftY + siteSize + 15);
    ctx.fillText(`β=${(1 - this.rightReservoirDensity).toFixed(2)}`, rightX + siteSize/2, rightY + siteSize + 15);
    
    // Draw arrows indicating direction
    ctx.beginPath();
    ctx.moveTo(leftX + siteSize + 5, leftY + siteSize/2);
    ctx.lineTo(leftX + siteSize - 5, leftY + siteSize/2 - 5);
    ctx.lineTo(leftX + siteSize - 5, leftY + siteSize/2 + 5);
    ctx.fillStyle = '#333';
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(rightX - 5, rightY + siteSize/2);
    ctx.lineTo(rightX + 5, rightY + siteSize/2 - 5);
    ctx.lineTo(rightX + 5, rightY + siteSize/2 + 5);
    ctx.fill();
  }
}