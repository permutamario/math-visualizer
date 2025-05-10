// src/plugins/asep-plugin/ASEPBaseVisualization.js
import { Visualization } from '../../core/Visualization.js';

export class ASEPBaseVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Simulation state
    this.lattice = [];
    this.density = [];
    this.current = [];
    this.isRunning = true;
    this.timeStep = 0;
    
    // Stats tracking
    this.densityHistory = [];
    this.currentHistory = [];
    this.historyLength = 100; // Keep last 100 timesteps for graphs
    
    // Canvas positioning
    this.latticeOffset = { x: 0, y: 50 };
    this.graphOffset = { x: 0, y: 220 };
    this.graphHeight = 100;
    this.graphMargin = { top: 10, right: 20, bottom: 20, left: 40 };
    
    // Timing
    this.lastUpdateTime = 0;
    this.updateInterval = 100; // ms between simulation steps
  }
  
  async initialize(parameters) {
    // Initialize simulation
    this.resetSimulation(parameters);
    return true;
  }
  
  resetSimulation(parameters = null) {
    const params = parameters || this.plugin.parameters;
    
    // Reset state
    this.lattice = [];
    this.density = [];
    this.current = [];
    this.densityHistory = [];
    this.currentHistory = [];
    this.timeStep = 0;
    this.isRunning = true;
    
    // Initialize lattice with random particles based on density
    const size = params.latticeSize;
    for (let i = 0; i < size; i++) {
      // Randomly place particles based on density
      this.lattice[i] = Math.random() < params.particleDensity ? 1 : 0;
    }
    
    // Initialize density and current arrays
    this.density = new Array(size).fill(0);
    this.current = new Array(size).fill(0);
    
    // Initialize history
    for (let i = 0; i < this.historyLength; i++) {
      this.densityHistory.push(new Array(size).fill(params.particleDensity));
      this.currentHistory.push(new Array(size).fill(0));
    }
    
    // Calculate initial density profile (just for display)
    this.updateDensityProfile();
  }
  
  update(parameters) {
    // Update animation speed based on simulation speed
    this.updateInterval = 100 / parameters.simulationSpeed;
  }
  
  togglePause() {
    this.isRunning = !this.isRunning;
  }
  
  updateDensityProfile() {
    // Moving average of density over time
    const windowSize = 10; // How many time steps to average
    
    for (let i = 0; i < this.lattice.length; i++) {
      // Simple approach: use the current state
      this.density[i] = this.lattice[i];
      
      // For a more sophisticated approach, we'd average over recent history
      // This could be implemented in subclasses
    }
    
    // Add current density to history
    this.densityHistory.push([...this.density]);
    if (this.densityHistory.length > this.historyLength) {
      this.densityHistory.shift();
    }
  }
  
  updateCurrentProfile() {
    // For subclasses to implement
  }
  
  // Single Monte Carlo step - implemented by subclasses
  performSimulationStep(parameters) {
    // Subclasses will implement
  }
  
  animate(deltaTime) {
    if (!this.isRunning) return true;
    
    const now = Date.now();
    if (now - this.lastUpdateTime > this.updateInterval) {
      this.lastUpdateTime = now;
      
      // Perform simulation step
      this.performSimulationStep(this.plugin.parameters);
      
      // Update density and current profiles
      this.updateDensityProfile();
      this.updateCurrentProfile();
      
      this.timeStep++;
    }
    
    return true; // Continue animation
  }
  
  render2D(ctx, parameters) {
    // Clear the canvas
    ctx.clearRect(-1000, -1000, 2000, 2000); // Large area to handle camera movement
    
    // Draw title and info
    this.drawTitle(ctx, parameters);
    
    // Draw lattice
    this.drawLattice(ctx, parameters);
    
    // Draw density profile if enabled
    if (parameters.showDensityProfile) {
      this.drawDensityProfile(ctx, parameters);
    }
    
    // Draw current profile if enabled
    if (parameters.showCurrentProfile) {
      this.drawCurrentProfile(ctx, parameters);
    }
  }
  
  drawTitle(ctx, parameters) {
    const size = parameters.latticeSize;
    const siteSize = parameters.siteSize;
    const width = size * siteSize;
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(`ASEP Simulation - ${this.getBoundaryName()} Boundaries`, 
                 this.latticeOffset.x + width/2, this.latticeOffset.y - 25);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(`Right rate: ${parameters.rightHopRate}, Left rate: ${parameters.leftHopRate}, Step: ${this.timeStep}`,
                 this.latticeOffset.x + width/2, this.latticeOffset.y - 5);
  }
  
  drawLattice(ctx, parameters) {
    const size = parameters.latticeSize;
    const siteSize = parameters.siteSize;
    const particleColor = parameters.particleColor;
    const emptyColor = parameters.emptyColor;
    
    // Draw each lattice site
    for (let i = 0; i < size; i++) {
      const x = this.latticeOffset.x + i * siteSize;
      const y = this.latticeOffset.y;
      
      // Draw site background
      ctx.fillStyle = emptyColor;
      ctx.fillRect(x, y, siteSize, siteSize);
      
      // Draw site border
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, siteSize, siteSize);
      
      // Draw particle if present
      if (this.lattice[i] === 1) {
        ctx.fillStyle = particleColor;
        const margin = siteSize * 0.1;
        const particleSize = siteSize - 2 * margin;
        ctx.beginPath();
        ctx.arc(x + siteSize/2, y + siteSize/2, particleSize/2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Subclasses will add additional boundary rendering
  }
  
  drawDensityProfile(ctx, parameters) {
    const size = parameters.latticeSize;
    const siteSize = parameters.siteSize;
    const width = size * siteSize;
    const height = this.graphHeight;
    
    const startX = this.latticeOffset.x;
    const startY = this.graphOffset.y;
    
    // Draw graph background
    ctx.fillStyle = 'rgba(240, 240, 240, 0.8)';
    ctx.fillRect(startX, startY, width, height);
    
    // Draw graph borders
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, startY, width, height);
    
    // Draw title
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('Density Profile', startX + width/2, startY - 5);
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(startX, startY + height - this.graphMargin.bottom);
    ctx.lineTo(startX + width, startY + height - this.graphMargin.bottom);
    ctx.strokeStyle = '#666';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(startX + this.graphMargin.left, startY);
    ctx.lineTo(startX + this.graphMargin.left, startY + height);
    ctx.stroke();
    
    // Draw labels
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Position', startX + width/2, startY + height - 5);
    
    ctx.textAlign = 'right';
    ctx.fillText('1.0', startX + this.graphMargin.left - 5, startY + this.graphMargin.top + 5);
    ctx.fillText('0.5', startX + this.graphMargin.left - 5, startY + height/2);
    ctx.fillText('0.0', startX + this.graphMargin.left - 5, startY + height - this.graphMargin.bottom - 5);
    
    // Plot density
    const plotHeight = height - this.graphMargin.top - this.graphMargin.bottom;
    const plotWidth = width - this.graphMargin.left - this.graphMargin.right;
    
    // Draw density profile line
    ctx.beginPath();
    ctx.moveTo(startX + this.graphMargin.left, 
              startY + height - this.graphMargin.bottom - this.density[0] * plotHeight);
    
    for (let i = 1; i < size; i++) {
      const x = startX + this.graphMargin.left + (i / (size - 1)) * plotWidth;
      const y = startY + height - this.graphMargin.bottom - this.density[i] * plotHeight;
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  drawCurrentProfile(ctx, parameters) {
    const size = parameters.latticeSize;
    const siteSize = parameters.siteSize;
    const width = size * siteSize;
    const height = this.graphHeight;
    
    const startX = this.latticeOffset.x;
    const startY = this.graphOffset.y + height + 20;
    
    // Draw graph background
    ctx.fillStyle = 'rgba(240, 240, 240, 0.8)';
    ctx.fillRect(startX, startY, width, height);
    
    // Draw graph borders
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, startY, width, height);
    
    // Draw title
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('Current Profile', startX + width/2, startY - 5);
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(startX, startY + height/2);
    ctx.lineTo(startX + width, startY + height/2);
    ctx.strokeStyle = '#666';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(startX + this.graphMargin.left, startY);
    ctx.lineTo(startX + this.graphMargin.left, startY + height);
    ctx.stroke();
    
    // Draw labels
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Position', startX + width/2, startY + height - 5);
    
    ctx.textAlign = 'right';
    ctx.fillText('0.5', startX + this.graphMargin.left - 5, startY + this.graphMargin.top + 5);
    ctx.fillText('0.0', startX + this.graphMargin.left - 5, startY + height/2);
    ctx.fillText('-0.5', startX + this.graphMargin.left - 5, startY + height - this.graphMargin.bottom - 5);
    
    // Plot current
    const plotHeight = height - this.graphMargin.top - this.graphMargin.bottom;
    const plotWidth = width - this.graphMargin.left - this.graphMargin.right;
    
    // Find max current value for scaling
    let maxCurrent = 0.5; // Default scale
    for (let i = 0; i < size; i++) {
      maxCurrent = Math.max(maxCurrent, Math.abs(this.current[i]));
    }
    
    // Draw current profile line
    ctx.beginPath();
    const scale = plotHeight / (maxCurrent * 2);
    ctx.moveTo(startX + this.graphMargin.left, 
              startY + height/2 - this.current[0] * scale);
    
    for (let i = 1; i < size; i++) {
      const x = startX + this.graphMargin.left + (i / (size - 1)) * plotWidth;
      const y = startY + height/2 - this.current[i] * scale;
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Helper methods for subclasses to implement
  getBoundaryName() {
    return "Unknown";
  }
  
  handleInteraction(type, event) {
    if (type === 'click') {
      // Check if click is on the lattice
      const parameters = this.plugin.parameters;
      const siteSize = parameters.siteSize;
      const size = parameters.latticeSize;
      const x = event.x - this.latticeOffset.x;
      const y = event.y - this.latticeOffset.y;
      
      if (y >= 0 && y < siteSize) {
        const siteIndex = Math.floor(x / siteSize);
        if (siteIndex >= 0 && siteIndex < size) {
          // Toggle particle at this site
          this.lattice[siteIndex] = 1 - this.lattice[siteIndex];
          this.updateDensityProfile();
          return true;
        }
      }
    }
    
    return false;
  }
  
  dispose() {
    // Clean up resources
  }
}