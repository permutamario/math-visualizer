import { Plugin } from '../../src/core/Plugin.js';
import { Grid } from './grid.js';
import { MirrorCurve } from './mirrorCurve.js';
import { findNextCurve, findAllCurves } from './curveStartFinder.js';
import { getSplinePoints } from './spline.js';

/**
 * Calculate a helper point for a grid line with directional offset
 * @param {Object} line - The grid line object 
 * @param {number} direction - Direction value (0=NW, 1=NE, 2=SW, 3=SE)
 * @param {number} cellSize - Size of a grid cell
 * @returns {Object} - Point coordinates {x, y}
 */
function findHelperPoint(line, direction, cellSize) {
    // Get the basic midpoint
    let x, y;
    if (line.type === 'horizontal') {
        x = (line.col + 0.5) * cellSize;
        y = line.row * cellSize;
    } else { // vertical
        x = line.col * cellSize;
        y = (line.row + 0.5) * cellSize;
    }
    
    // Offset based on direction (similar to calculateCurvedPoints in animationManager)
    const d = cellSize / 4;
    
    if (line.type === 'vertical') {
        if (direction === 1 || direction === 3) { // NE or SE
            x += d;
        } else if (direction === 0 || direction === 2) { // NW or SW
            x -= d;
        }
    } else { // horizontal
        if (direction === 0 || direction === 1) { // NW or NE
            y -= d;
        } else if (direction === 2 || direction === 3) { // SW or SE
            y += d;
        }
    }
    
    return { x, y };
}

export default class MirrorCurvesPlugin extends Plugin {
  // Required static properties
  static id = 'mirror-curves';
  static name = 'Mirror Curves';
  static description = 'Visualization of mirror curves based on grid reflections';
  static renderingType = '2d'; // Using Konva for 2D rendering
  
  constructor(core) {
    super(core);
    
    // Internal state - only store what can't be parameters
    this.grid = null;
    this.curves = [];
    this.animationPath = null;
    this.gridLayout = {};
    this.helperPoints = []; // Store helper points for visualization
    
    // Animation state
    this.isAnimating = false;
    this.animationFrame = 0;
    this.animationCurve = null;
    
    // Style settings (not exposed as parameters)
    this.styleSettings = {
      lineStyles: {
        grid: { width: 1 },
        gridPoint: { radius: 2 },
        mirror: { width: 2 },
        centerDot: { radius: 3 },
        curve: { width: 3 },
        helperPoint: { radius: 4 } // Style for helper points
      }
    };
    
    // Konva objects
    this.gridLayer = null;
    this.curveLayer = null;
  }
  
  async start() {
    // Add visual parameters
    this.addSlider('rows', 'Grid Rows', 5, { min: 2, max: 20, step: 1 });
    this.addSlider('cols', 'Grid Columns', 5, { min: 2, max: 20, step: 1 });
    this.addSlider('tension', 'Curve Smoothness', 0.5, { min: 0, max: 1, step: 0.1 });
    this.addCheckbox('showGridLines', 'Show Grid Lines', true);
    this.addCheckbox('showGridPoints', 'Show Grid Points', true);
    this.addCheckbox('showMirrors', 'Show Mirrors', true);
    this.addCheckbox('showCenterDots', 'Show Center Dots', false);
    this.addCheckbox('showHelperPoints', 'Show Helper Points', false); // New parameter
    this.addColor('backgroundColor', 'Background Color', '#f5f5f5');
    this.addColor('curveColor', 'Curve Color', '#3498db');
    this.addColor('gridLineColor', 'Grid Line Color', '#cccccc');
    this.addColor('mirrorColor', 'Mirror Color', '#333333');
    this.addColor('helperPointColor', 'Helper Point Color', '#ff0000'); // New parameter
    
    // Add structural parameters
    this.addSlider('mirrorProbability', 'Mirror Probability', 0.5, { min: 0, max: 1, step: 0.1 }, 'structural');
    this.addDropdown('curveStyle', 'Curve Style', 'curved', ['curved', 'jagged'], 'structural');
    this.addCheckbox('smooth', 'Smooth Curves', true, 'structural');
    
    // Add actions
    this.addAction('randomize', 'Randomize Mirrors', () => {
      this.randomizeMirrors();
    });
    
    this.addAction('findAllCurves', 'Find All Curves', () => {
      this.findAllCurves();
    });
    
    this.addAction('clearCurves', 'Clear Curves', () => {
      this.clearCurves();
    });
    
    this.addAction('animateCurve', 'Animate Next Curve', () => {
      this.animateNextCurve();
    });
    
    // Initialize the grid
    this.initializeGrid();
    
    // Set up Konva objects
    this.setupKonvaObjects();
    
    // Start animation
    this.animationHandler = this.requestAnimation(this.animate.bind(this));
  }
  
  initializeGrid() {
    const rows = this.getParameter('rows');
    const cols = this.getParameter('cols');
    
    // Create a new grid
    this.grid = new Grid(rows, cols);
    
    // Randomize mirrors with current probability
    this.randomizeMirrors();
    
    // Reset curves
    this.curves = [];
    this.animationPath = null;
    this.helperPoints = [];
  }
  
  randomizeMirrors() {
    if (!this.grid) return;
    
    const probability = this.getParameter('mirrorProbability');
    this.grid.randomizeMirrors(probability);
    
    // Reset curves when mirrors change
    this.curves = [];
    this.animationPath = null;
    this.helperPoints = [];
    
    // Update visualization
    this.updateGridVisualization();
  }
  
  findAllCurves() {
    if (!this.grid) return;
    
    // Reset used directions
    this.grid.resetUsedDirections();
    
    // Find all curves
    this.curves = findAllCurves(this.grid);
    
    // Mark all curves as completed
    this.curves.forEach(curve => {
      curve.isCompleted = true;
    });
    
    // Calculate helper points for all curves
    this.calculateHelperPoints();
    
    // Update visualization
    this.updateCurveVisualization();
  }
  
  clearCurves() {
    this.curves = [];
    this.animationPath = null;
    this.helperPoints = [];
    this.isAnimating = false;
    
    // Reset used directions in the grid
    if (this.grid) {
      this.grid.resetUsedDirections();
    }
    
    // Update visualization
    this.updateCurveVisualization();
  }
  
  calculateHelperPoints() {
    this.helperPoints = [];
    const cellSize = this.gridLayout.cellSize;
    
    // Get curves and calculate helper points for each
    this.curves.forEach(curve => {
      if (curve.isCompleted && curve.gridLines && Array.isArray(curve.gridLines)) {
        // Calculate helper points with offsets for smooth curves
        const helperPointsForCurve = curve.gridLines.map((line, index) => {
          const direction = curve.directions[index];
          const point = findHelperPoint(line, direction, cellSize);
          return { ...point, curveIndex: this.helperPoints.length };
        });
        
        this.helperPoints.push(helperPointsForCurve);
      }
    });
  }
  
  animateNextCurve() {
    if (!this.grid) return;
    
    // Stop current animation if running
    this.isAnimating = false;
    this.animationPath = null;
    
    // Find the next available curve
    const curve = findNextCurve(this.grid);
    
    if (curve) {
      // Start animation
      this.animationCurve = curve;
      this.animationFrame = 0;
      this.isAnimating = true;
    } else {
      // Show notification if no more curves
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showNotification('No more curves available');
      }
    }
  }
  
  setupKonvaObjects() {
    const { stage, layer, konva } = this.renderEnv;
    
    // Create layers for organizing content
    this.gridLayer = new konva.Layer();
    this.curveLayer = new konva.Layer();
    
    // Add layers to stage
    stage.add(this.gridLayer);
    stage.add(this.curveLayer);
    
    // Initial rendering
    this.updateGridVisualization();
  }
  
  updateGridVisualization() {
    if (!this.grid || !this.gridLayer) return;
    
    // Clear the grid layer
    this.gridLayer.destroyChildren();
    
    const showGridLines = this.getParameter('showGridLines');
    const showGridPoints = this.getParameter('showGridPoints');
    const showMirrors = this.getParameter('showMirrors');
    const showCenterDots = this.getParameter('showCenterDots');
    const gridLineColor = this.getParameter('gridLineColor');
    const mirrorColor = this.getParameter('mirrorColor');
    
    // Get stage dimensions
    const stageWidth = this.renderEnv.stage.width();
    const stageHeight = this.renderEnv.stage.height();
    
    // Calculate grid layout
    const padding = Math.min(stageWidth, stageHeight) * 0.05;
    const drawableWidth = stageWidth - (padding * 2);
    const drawableHeight = stageHeight - (padding * 2);
    
    // Calculate cell dimensions to ensure cells are square
    const cellSize = Math.min(
      drawableWidth / this.grid.cols, 
      drawableHeight / this.grid.rows
    );
    
    // Calculate centering offsets
    const offsetX = padding + (drawableWidth - (cellSize * this.grid.cols)) / 2;
    const offsetY = padding + (drawableHeight - (cellSize * this.grid.rows)) / 2;
    
    // Store layout values for reuse
    this.gridLayout = {
      cellSize,
      offsetX,
      offsetY,
      gridRows: this.grid.rows,
      gridCols: this.grid.cols
    };
    
    // Create a group to hold grid elements with proper translation
    const gridGroup = new this.renderEnv.konva.Group({
      x: offsetX,
      y: offsetY
    });
    
    // Draw grid lines
    if (showGridLines) {
      for (const line of this.grid.gridLines.values()) {
        const x1 = line.col * cellSize;
        const y1 = line.row * cellSize;
        const x2 = (line.type === 'horizontal' ? (line.col + 1) * cellSize : x1);
        const y2 = (line.type === 'vertical' ? (line.row + 1) * cellSize : y1);
        
        const lineObj = new this.renderEnv.konva.Line({
          points: [x1, y1, x2, y2],
          stroke: gridLineColor,
          strokeWidth: this.styleSettings.lineStyles.grid.width
        });
        
        gridGroup.add(lineObj);
      }
    }
    
    // Draw grid points
    if (showGridPoints) {
      for (let r = 0; r <= this.grid.rows; r++) {
        for (let c = 0; c <= this.grid.cols; c++) {
          const circle = new this.renderEnv.konva.Circle({
            x: c * cellSize,
            y: r * cellSize,
            radius: this.styleSettings.lineStyles.gridPoint.radius,
            fill: gridLineColor // Use same color as grid lines
          });
          
          gridGroup.add(circle);
        }
      }
    }
    
    // Draw mirror lines
    if (showMirrors) {
      for (const line of this.grid.gridLines.values()) {
        if (!line.isMirror) continue;
        
        const x1 = line.col * cellSize;
        const y1 = line.row * cellSize;
        const x2 = (line.type === 'horizontal' ? (line.col + 1) * cellSize : x1);
        const y2 = (line.type === 'vertical' ? (line.row + 1) * cellSize : y1);
        
        const mirrorLine = new this.renderEnv.konva.Line({
          points: [x1, y1, x2, y2],
          stroke: mirrorColor,
          strokeWidth: this.styleSettings.lineStyles.mirror.width
        });
        
        gridGroup.add(mirrorLine);
      }
    }
    
    // Draw center dots
    if (showCenterDots) {
      for (let r = 0; r < this.grid.rows; r++) {
        for (let c = 0; c < this.grid.cols; c++) {
          const centerDot = new this.renderEnv.konva.Circle({
            x: (c + 0.5) * cellSize,
            y: (r + 0.5) * cellSize,
            radius: this.styleSettings.lineStyles.centerDot.radius,
            fill: mirrorColor // Use same color as mirrors
          });
          
          gridGroup.add(centerDot);
        }
      }
    }
    
    // Add the grid group to the layer
    this.gridLayer.add(gridGroup);
    this.gridLayer.batchDraw();
    
    // Calculate helper points for curves
    this.calculateHelperPoints();
    
    // Update curve visualization with new layout
    this.updateCurveVisualization();
  }
  
  updateCurveVisualization() {
    if (!this.curveLayer) return;
    
    // Clear the curve layer
    this.curveLayer.destroyChildren();
    
    // Get layout values
    const { cellSize, offsetX, offsetY } = this.gridLayout;
    
    // Create a group for curves with the same offset as the grid
    const curveGroup = new this.renderEnv.konva.Group({
      x: offsetX,
      y: offsetY
    });
    
    // Draw completed curves
    const curveColor = this.getParameter('curveColor');
    const colorScheme = [curveColor];
    
    this.curves.forEach((curve, idx) => {
      // Create a curve line
      const konvaCurve = this.createKonvaCurve(curve, idx, cellSize, colorScheme);
      if (konvaCurve) {
        curveGroup.add(konvaCurve);
      }
    });
    
    // Draw animation path if it exists
    if (this.animationPath) {
      const animCurve = this.createKonvaCurve(
        this.animationPath, 
        this.curves.length, 
        cellSize, 
        colorScheme
      );
      
      if (animCurve) {
        curveGroup.add(animCurve);
      }
    }
    
    // Draw helper points if enabled
    if (this.getParameter('showHelperPoints')) {
      const helperPointColor = this.getParameter('helperPointColor');
      const helperPointRadius = this.styleSettings.lineStyles.helperPoint.radius;
      
      // Add helper points for all curves
      this.helperPoints.forEach(curvePoints => {
        curvePoints.forEach(point => {
          const helperPoint = new this.renderEnv.konva.Circle({
            x: point.x,
            y: point.y,
            radius: helperPointRadius,
            fill: helperPointColor
          });
          
          curveGroup.add(helperPoint);
        });
      });
    }
    
    // Add the curve group to the layer
    this.curveLayer.add(curveGroup);
    this.curveLayer.batchDraw();
  }
  
  createKonvaCurve(curve, idx, cellSize, colorScheme) {
    if (!curve) return null;
    
    // Get the curve style parameter
    const curveStyle = this.getParameter('curveStyle');
    const tension = this.getParameter('tension');
    const smooth = this.getParameter('smooth');
    
    // Extract points from the curve
    let points = [];
    let isClosed = false;
    let helperPointsForCurve = [];
    
    // Parse the points based on curve type
    if (curve.type === 'animationPath') {
      points = curve.points || [];
      isClosed = curve.isClosed || false;
    }
    else if (curve.gridLines && Array.isArray(curve.gridLines)) {
      isClosed = curve.isClosed || false;
      
      // Generate points based on curve style
      if (curve.isCompleted && curveStyle === 'curved') {
        // Calculate helper points with offsets for smooth curves
        helperPointsForCurve = curve.gridLines.map((line, index) => {
          const direction = curve.directions[index];
          return findHelperPoint(line, direction, cellSize);
        });
        
        // Apply spline for smooth curves
        points = getSplinePoints(helperPointsForCurve, tension, 10);
      } else {
        // Use regular midpoints for jagged style
        points = curve.gridLines.map(line => {
          if (line.type === 'horizontal') {
            return {
              x: (line.col + 0.5) * cellSize,
              y: line.row * cellSize
            };
          } else { // vertical
            return {
              x: line.col * cellSize,
              y: (line.row + 0.5) * cellSize
            };
          }
        });
      }
    }
    
    // Skip if no points
    if (points.length === 0) return null;
    
    // For non-animation paths, apply spline if needed
    const useSpline = !curve.isCompleted && 
                     smooth && 
                     isClosed &&
                     curve.type !== 'animationPath' && 
                     curveStyle === 'curved';
    
    const drawPoints = useSpline 
        ? getSplinePoints(points, tension)
        : points;
    
    // Convert points to flat array for Konva
    const flatPoints = [];
    drawPoints.forEach(point => {
      flatPoints.push(point.x, point.y);
    });
    
    // Create Konva line
    const curveWidth = this.styleSettings.lineStyles.curve.width;
    const color = colorScheme[idx % colorScheme.length];
    
    const konvaLine = new this.renderEnv.konva.Line({
      points: flatPoints,
      stroke: color,
      strokeWidth: curveWidth,
      lineCap: 'round',
      lineJoin: 'round',
      closed: isClosed
    });
    
    return konvaLine;
  }
  
  animate(deltaTime) {
    // Apply background color from parameter
    this.renderEnv.stage.container().style.backgroundColor = this.getParameter('backgroundColor');
    
    // Handle animation if active
    if (this.isAnimating && this.animationCurve) {
      // Increment animation frame
      this.animationFrame++;
      
      // Create animation path with current progress
      const frameCount = 30; // Animation frames per segment
      const currentSegment = Math.floor(this.animationFrame / frameCount);
      
      // Stop animation if we've reached the end of the curve
      if (currentSegment >= this.animationCurve.gridLines.length) {
        // Add the completed curve to the list
        this.animationCurve.isCompleted = true;
        this.curves.push(this.animationCurve);
        
        // Reset animation state
        this.animationPath = null;
        this.isAnimating = false;
        this.animationCurve = null;
        
        // Calculate helper points for new curve
        this.calculateHelperPoints();
        
        // Update visualization
        this.updateCurveVisualization();
        return true;
      }
      
      // Create partial animation path
      const progress = (this.animationFrame % frameCount) / frameCount;
      const segmentCount = Math.min(currentSegment + 1, this.animationCurve.gridLines.length);
      
      // Create animation path with current segments
      const points = [];
      for (let i = 0; i < segmentCount; i++) {
        const line = this.animationCurve.gridLines[i];
        let x, y;
        
        if (line.type === 'horizontal') {
          x = (line.col + 0.5) * this.gridLayout.cellSize;
          y = line.row * this.gridLayout.cellSize;
        } else { // vertical
          x = line.col * this.gridLayout.cellSize;
          y = (line.row + 0.5) * this.gridLayout.cellSize;
        }
        
        points.push({ x, y });
      }
      
      // For the last segment, interpolate based on progress
      if (segmentCount < this.animationCurve.gridLines.length) {
        const nextLine = this.animationCurve.gridLines[segmentCount];
        let nextX, nextY;
        
        if (nextLine.type === 'horizontal') {
          nextX = (nextLine.col + 0.5) * this.gridLayout.cellSize;
          nextY = nextLine.row * this.gridLayout.cellSize;
        } else { // vertical
          nextX = nextLine.col * this.gridLayout.cellSize;
          nextY = (nextLine.row + 0.5) * this.gridLayout.cellSize;
        }
        
        const lastPoint = points[points.length - 1];
        const interpX = lastPoint.x + (nextX - lastPoint.x) * progress;
        const interpY = lastPoint.y + (nextY - lastPoint.y) * progress;
        
        points.push({ x: interpX, y: interpY });
      }
      
      // Set animation path
      this.animationPath = {
        type: 'animationPath',
        points: points,
        isClosed: false
      };
      
      // Update visualization
      this.updateCurveVisualization();
    }
    
    return true;
  }
  
  onParameterChanged(parameterId, value) {
    // Rebuild grid if rows or columns change
    if (parameterId === 'rows' || parameterId === 'cols') {
      this.initializeGrid();
      this.updateGridVisualization();
    }
    
    // Update visualization if style parameters change
    if (parameterId === 'tension' || 
        parameterId === 'showGridLines' || 
        parameterId === 'showGridPoints' ||
        parameterId === 'showMirrors' ||
        parameterId === 'showCenterDots' ||
        parameterId === 'gridLineColor' ||
        parameterId === 'mirrorColor' ||
        parameterId === 'curveStyle' ||
        parameterId === 'smooth' ||
        parameterId === 'curveColor' ||
        parameterId === 'showHelperPoints' ||
        parameterId === 'helperPointColor') {
      this.updateCurveVisualization();
    }
  }
  
  handleInteraction(type, data) {
    // Handle clicks on grid lines to toggle mirrors
    if (type === 'click' && this.grid) {
      // Convert stage coordinates to grid coordinates
      const { cellSize, offsetX, offsetY } = this.gridLayout;
      const gridX = (data.x - offsetX) / cellSize;
      const gridY = (data.y - offsetY) / cellSize;
      
      // Check if click is within grid boundaries
      if (gridX >= 0 && gridX <= this.grid.cols && 
          gridY >= 0 && gridY <= this.grid.rows) {
        
        // Find the closest grid line
        let closestLine = null;
        let minDistance = Infinity;
        
        for (const line of this.grid.gridLines.values()) {
          if (this.grid.isBoundaryGridLine(line)) {
            // Skip boundary lines
            continue;
          }
          
          let distance;
          if (line.type === 'horizontal') {
            // For horizontal lines, check distance to y=row
            const lineY = line.row * cellSize;
            const lineX1 = line.col * cellSize;
            const lineX2 = (line.col + 1) * cellSize;
            
            // Check if x is within the line segment
            if (gridX >= lineX1 / cellSize && gridX <= lineX2 / cellSize) {
              distance = Math.abs(gridY - line.row);
            } else {
              continue;
            }
          } else { // vertical
            // For vertical lines, check distance to x=col
            const lineX = line.col * cellSize;
            const lineY1 = line.row * cellSize;
            const lineY2 = (line.row + 1) * cellSize;
            
            // Check if y is within the line segment
            if (gridY >= lineY1 / cellSize && gridY <= lineY2 / cellSize) {
              distance = Math.abs(gridX - line.col);
            } else {
              continue;
            }
          }
          
          // Update closest line if this one is closer
          if (distance < minDistance) {
            minDistance = distance;
            closestLine = line;
          }
        }
        
        // Toggle mirror if a line was found and is close enough
        if (closestLine && minDistance < 0.2) {
          // Toggle mirror status
          this.grid.setMirror(closestLine.id, !closestLine.isMirror);
          
          // Clear curves when mirrors change
          this.clearCurves();
          
          // Update visualization
          this.updateGridVisualization();
        }
      }
    }
  }
  
  async unload() {
    // Cancel animations
    if (this.animationHandler) {
      this.cancelAnimation(this.animationHandler);
    }
    
    // Let base class handle cleanup
    await super.unload();
    
    // Clean up Konva objects
    if (this.gridLayer) {
      this.gridLayer.destroy();
      this.gridLayer = null;
    }
    
    if (this.curveLayer) {
      this.curveLayer.destroy();
      this.curveLayer = null;
    }
    
    // Reset state
    this.grid = null;
    this.curves = [];
    this.animationPath = null;
    this.gridLayout = {};
    this.helperPoints = [];
    this.isAnimating = false;
    this.animationFrame = 0;
    this.animationCurve = null;
  }
}
