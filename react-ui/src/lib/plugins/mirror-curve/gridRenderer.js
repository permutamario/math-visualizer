// plugins/mirror-curve/gridRenderer.js

export class GridRenderer {
  constructor(konva) {
    this.konva = konva;
    this.styleSettings = {
      lineStyles: {
        grid: { width: 1 },
        gridPoint: { radius: 2 },
        mirror: { width: 2 },
        centerDot: { radius: 3 }
      }
    };
  }

  renderGrid(grid, group, options) {
    const {
      cellSize = 1,
      showGridLines = true,
      showGridPoints = true,
      showMirrors = true,
      showCenterDots = false,
      gridLineColor = '#cccccc',
      mirrorColor = '#333333'
    } = options;

    // Clear the group
    group.destroyChildren();

    // Draw grid lines
    if (showGridLines) {
      for (const line of grid.gridLines.values()) {
        const x1 = line.col * cellSize;
        const y1 = line.row * cellSize;
        const x2 = (line.type === 'horizontal' ? (line.col + 1) * cellSize : x1);
        const y2 = (line.type === 'vertical' ? (line.row + 1) * cellSize : y1);
        
        const lineObj = new this.konva.Line({
          points: [x1, y1, x2, y2],
          stroke: gridLineColor,
          strokeWidth: this.styleSettings.lineStyles.grid.width
        });
        
        group.add(lineObj);
      }
    }
    
    // Draw grid points
    if (showGridPoints) {
      for (let r = 0; r <= grid.rows; r++) {
        for (let c = 0; c <= grid.cols; c++) {
          const circle = new this.konva.Circle({
            x: c * cellSize,
            y: r * cellSize,
            radius: this.styleSettings.lineStyles.gridPoint.radius,
            fill: gridLineColor
          });
          
          group.add(circle);
        }
      }
    }
    
    // Draw mirror lines
    if (showMirrors) {
      for (const line of grid.gridLines.values()) {
        if (!line.isMirror) continue;
        
        const x1 = line.col * cellSize;
        const y1 = line.row * cellSize;
        const x2 = (line.type === 'horizontal' ? (line.col + 1) * cellSize : x1);
        const y2 = (line.type === 'vertical' ? (line.row + 1) * cellSize : y1);
        
        const mirrorLine = new this.konva.Line({
          points: [x1, y1, x2, y2],
          stroke: mirrorColor,
          strokeWidth: this.styleSettings.lineStyles.mirror.width
        });
        
        group.add(mirrorLine);
      }
    }
    
    // Draw center dots
    if (showCenterDots) {
      for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
          const centerDot = new this.konva.Circle({
            x: (c + 0.5) * cellSize,
            y: (r + 0.5) * cellSize,
            radius: this.styleSettings.lineStyles.centerDot.radius,
            fill: mirrorColor
          });
          
          group.add(centerDot);
        }
      }
    }
  }
}
