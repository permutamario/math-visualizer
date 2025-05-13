// src/plugins/example2d-plugin/AdvancedVisualization.js
import { Visualization } from '../../core/Visualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

/**
 * Advanced pattern visualization with multiple elements
 */
export class AdvancedVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Flag for animation
    this.isAnimating = true;
    
    // Initialize internal state
    this.state = {
      pattern: 'grid',
      primaryColor: '#3498db',
      secondaryColor: '#e74c3c',
      cellSize: 30,
      animationSpeed: 1.0,
      rows: 5,
      columns: 5,
      cells: [], // Will store cell states
      phase: 0   // Animation phase
    };
  }

  /**
   * Define visualization-specific parameters
   * @returns {Array} Array of parameter definitions
   * @static
   */
  static getParameters() {
    return createParameters()
      .addDropdown('pattern', 'Pattern Type', 'grid', [
        { value: 'grid', label: 'Grid' },
        { value: 'checkerboard', label: 'Checkerboard' },
        { value: 'concentric', label: 'Concentric' },
        { value: 'wave', label: 'Wave Pattern' }
      ])
      .addColor('primaryColor', 'Primary Color', '#3498db')
      .addColor('secondaryColor', 'Secondary Color', '#e74c3c')
      .addSlider('cellSize', 'Cell Size', 30, { min: 10, max: 50, step: 5 })
      .addSlider('rows', 'Rows', 5, { min: 3, max: 15, step: 1 })
      .addSlider('columns', 'Columns', 5, { min: 3, max: 15, step: 1 })
      .addSlider('animationSpeed', 'Animation Speed', 1.0, { min: 0.1, max: 3.0, step: 0.1 })
      .build();
  }

  /**
   * Initialize the visualization
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    try {
      // Update state with initial parameters
      this.updateState(parameters);
      
      // Initialize the cells based on pattern
      this.initializeCells();
      
      return true;
    } catch (error) {
      console.error("Error initializing AdvancedVisualization:", error);
      return false;
    }
  }

  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - Changed parameters only
   */
  update(parameters) {
    // Check if pattern, rows, or columns changed - these require re-initialization
    const needsReinitialize = 
      parameters.pattern !== undefined || 
      parameters.rows !== undefined || 
      parameters.columns !== undefined;
    
    // Update state with changed parameters
    this.updateState(parameters);
    
    // Re-initialize cells if necessary
    if (needsReinitialize) {
      this.initializeCells();
    }
  }

  /**
   * Update internal state from parameters
   * @param {Object} parameters - Parameter values
   * @private
   */
  updateState(parameters) {
    if (!parameters) return;
    
    // Only update defined parameters
    if (parameters.pattern !== undefined) this.state.pattern = parameters.pattern;
    if (parameters.primaryColor !== undefined) this.state.primaryColor = parameters.primaryColor;
    if (parameters.secondaryColor !== undefined) this.state.secondaryColor = parameters.secondaryColor;
    if (parameters.cellSize !== undefined) this.state.cellSize = parameters.cellSize;
    if (parameters.rows !== undefined) this.state.rows = parameters.rows;
    if (parameters.columns !== undefined) this.state.columns = parameters.columns;
    if (parameters.animationSpeed !== undefined) this.state.animationSpeed = parameters.animationSpeed;
    
    // Handle global scale from plugin parameters
    if (parameters.globalScale !== undefined) {
      // Apply global scale to cell size
      this.state.scaledCellSize = this.state.cellSize * parameters.globalScale;
    } else if (this.state.scaledCellSize === undefined) {
      // Initialize scaled cell size if not set
      this.state.scaledCellSize = this.state.cellSize * (parameters.globalScale || 1.0);
    }
  }

  /**
   * Initialize cells based on pattern
   * @private
   */
  initializeCells() {
    // Create cell grid
    const cells = [];
    const rows = this.state.rows;
    const columns = this.state.columns;
    
    for (let row = 0; row < rows; row++) {
      const rowCells = [];
      for (let col = 0; col < columns; col++) {
        // Initialize cell state based on pattern
        let state = 0;
        
        switch (this.state.pattern) {
          case 'checkerboard':
            // Alternating pattern
            state = (row + col) % 2;
            break;
          case 'concentric':
            // Distance from center determines state
            const centerRow = Math.floor(rows / 2);
            const centerCol = Math.floor(columns / 2);
            const distRow = Math.abs(row - centerRow);
            const distCol = Math.abs(col - centerCol);
            const maxDist = Math.max(distRow, distCol);
            state = maxDist % 2;
            break;
          case 'wave':
            // Will be calculated dynamically in animation
            state = 0;
            break;
          case 'grid':
          default:
            // Default grid pattern
            state = 0;
        }
        
        // Add cell to the row
        rowCells.push({
          row,
          col,
          state,
          animation: 0
        });
      }
      cells.push(rowCells);
    }
    
    this.state.cells = cells;
  }

  /**
   * Render the visualization in 2D
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} parameters - Current parameters
   */
  render2D(ctx, parameters) {
    if (!ctx) return;
    
    // Apply global state
    const showBoundingBox = parameters.showBoundingBox || false;
    const globalScale = parameters.globalScale || 1.0;
    const debug = parameters.debugMode || false;
    
    // Calculate scaled size
    const cellSize = this.state.cellSize * globalScale;
    
    // Calculate grid dimensions
    const totalWidth = this.state.columns * cellSize;
    const totalHeight = this.state.rows * cellSize;
    const startX = -totalWidth / 2;
    const startY = -totalHeight / 2;
    
    ctx.save();
    
    // Draw bounding box if enabled
    if (showBoundingBox) {
      ctx.strokeStyle = '#999999';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, startY, totalWidth, totalHeight);
      ctx.setLineDash([]);
    }
    
    // Draw cells
    for (let row = 0; row < this.state.rows; row++) {
      for (let col = 0; col < this.state.columns; col++) {
        const cell = this.state.cells[row][col];
        
        // Calculate cell position
        const x = startX + col * cellSize;
        const y = startY + row * cellSize;
        
        // Get cell color based on state and pattern
        let color;
        
        if (this.state.pattern === 'wave') {
          // Calculate wave pattern
          const centerRow = this.state.rows / 2;
          const centerCol = this.state.columns / 2;
          const dx = col - centerCol;
          const dy = row - centerRow;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Create wave effect
          const wave = Math.sin(distance * 0.5 - this.state.phase);
          const colorMix = (wave + 1) / 2; // Map from [-1,1] to [0,1]
          
          // Interpolate between colors
          color = this.lerpColor(
            this.state.primaryColor, 
            this.state.secondaryColor, 
            colorMix
          );
        } else {
          // Use primary/secondary color based on state
          color = cell.state === 0 ? this.state.primaryColor : this.state.secondaryColor;
        }
        
        // Draw cell
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellSize, cellSize);
        
        // Draw cell border
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);
        
        // Draw debug info
        if (debug) {
          ctx.fillStyle = 'white';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${row},${col}`, x + cellSize/2, y + cellSize/2);
        }
      }
    }
    
    // Draw debug overlay if enabled
    if (debug) {
      this.drawDebugInfo(ctx, parameters);
    }
    
    ctx.restore();
  }

  /**
   * Draw debug information
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} parameters - Current parameters
   */
  drawDebugInfo(ctx, parameters) {
    ctx.save();
    
    // Reset transform to work in screen space for text
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw a semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 220, 90);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Pattern: ${this.state.pattern}`, 20, 30);
    ctx.fillText(`Cell Size: ${this.state.cellSize}`, 20, 45);
    ctx.fillText(`Grid: ${this.state.rows}×${this.state.columns}`, 20, 60);
    ctx.fillText(`Animation Phase: ${this.state.phase.toFixed(2)}`, 20, 75);
    
    ctx.restore();
  }

  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @returns {boolean} Whether a render is needed
   */
  animate(deltaTime) {
    if (!this.isAnimating) return false;
    
    // Apply animation based on pattern
    switch (this.state.pattern) {
      case 'grid':
        // Toggle states randomly
        if (Math.random() < deltaTime * this.state.animationSpeed * 0.5) {
          const row = Math.floor(Math.random() * this.state.rows);
          const col = Math.floor(Math.random() * this.state.columns);
          this.state.cells[row][col].state = 1 - this.state.cells[row][col].state;
        }
        break;
      
      case 'wave':
        // Update wave phase
        this.state.phase += deltaTime * this.state.animationSpeed;
        break;
        
      case 'checkerboard':
        // Toggle checkerboard occasionally
        if (Math.random() < deltaTime * this.state.animationSpeed * 0.2) {
          for (let row = 0; row < this.state.rows; row++) {
            for (let col = 0; col < this.state.columns; col++) {
              this.state.cells[row][col].state = 1 - this.state.cells[row][col].state;
            }
          }
        }
        break;
        
      case 'concentric':
        // Update concentric rings
        if (Math.random() < deltaTime * this.state.animationSpeed * 0.2) {
          for (let row = 0; row < this.state.rows; row++) {
            for (let col = 0; col < this.state.columns; col++) {
              const centerRow = Math.floor(this.state.rows / 2);
              const centerCol = Math.floor(this.state.columns / 2);
              const distRow = Math.abs(row - centerRow);
              const distCol = Math.abs(col - centerCol);
              const maxDist = Math.max(distRow, distCol);
              
              // Shift the pattern
              this.state.cells[row][col].state = (maxDist + Math.floor(this.state.phase)) % 2;
            }
          }
          this.state.phase += 0.05;
        }
        break;
    }
    
    return true;
  }

  /**
   * Handle user interaction
   * @param {string} type - Interaction type
   * @param {Object} event - Event data
   * @returns {boolean} Whether the interaction was handled
   */
  handleInteraction(type, event) {
    if (type === 'click') {
      // Calculate grid position from click coordinates
      const globalScale = this.plugin.pluginParameters.globalScale || 1.0;
      const cellSize = this.state.cellSize * globalScale;
      
      // Calculate grid dimensions
      const totalWidth = this.state.columns * cellSize;
      const totalHeight = this.state.rows * cellSize;
      const startX = -totalWidth / 2;
      const startY = -totalHeight / 2;
      
      // Calculate clicked cell
      const col = Math.floor((event.x - startX) / cellSize);
      const row = Math.floor((event.y - startY) / cellSize);
      
      // Check if click is within grid
      if (col >= 0 && col < this.state.columns && 
          row >= 0 && row < this.state.rows) {
        
        // Toggle cell state
        this.state.cells[row][col].state = 1 - this.state.cells[row][col].state;
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Interpolate between colors
   * @param {string} colorA - First color (hex)
   * @param {string} colorB - Second color (hex)
   * @param {number} amount - Interpolation amount (0-1)
   * @returns {string} Interpolated color (rgba)
   */
  lerpColor(colorA, colorB, amount) {
    const parseColor = (color) => {
      // Check if it's a hex color and convert to RGB
      if (color.startsWith('#')) {
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);
        return { r, g, b };
      }
      
      // Handle rgb/rgba formats
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: match[4] ? parseFloat(match[4]) : 1
        };
      }
      
      // Default fallback
      return { r: 0, g: 0, b: 0, a: 1 };
    };
    
    const colorObjA = parseColor(colorA);
    const colorObjB = parseColor(colorB);
    
    const r = Math.round(colorObjA.r + (colorObjB.r - colorObjA.r) * amount);
    const g = Math.round(colorObjA.g + (colorObjB.g - colorObjA.g) * amount);
    const b = Math.round(colorObjA.b + (colorObjB.b - colorObjA.b) * amount);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Reset animation state
    this.isAnimating = false;
  }
}