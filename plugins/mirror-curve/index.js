import { Plugin } from '../../src/core/Plugin.js';
import { Grid } from './grid.js';
import { MirrorCurve } from './mirrorCurve.js';
import { findNextCurve, findAllCurves } from './curveStartFinder.js';
import { getSplinePoints } from './spline.js';

export default class MirrorCurvesPlugin extends Plugin {
  // Required static properties
  static id = 'mirror-curves';
  static name = 'Mirror Curves';
  static description = 'Visualization of mirror curves based on grid reflections';
  static renderingType = '2d'; // Using Konva for 2D rendering
  
  constructor(core) {
    super(core);
    
    // Internal state
    this.state = {
      grid: null,
      curves: [],
      animationPath: null,
      gridLayout: {},
      settings: {
        showGridLines: true,
        showGridPoints: true,
        showMirrors: true,
        showCenterDots: false,
        smooth: true,
        tension: 0.5,
        backgroundColor: 'transparent',
        animationStyle: 'curved', // 'jagged' or 'curved'
        lineStyles: {
          grid: { color: '#cccccc', width: 1 },
          gridPoint: { color: '#999999', radius: 2 },
          mirror: { color: '#333333', width: 2 },
          centerDot: { color: '#555555', radius: 3 },
          curve: { width: 3 }
        }
      }
    };
    
    // Konva objects
    this.mainLayer = null;
    this.gridLayer = null;
    this.curveLayer = null;
    
    // Animation state
    this.isAnimating = false;
    this.animationFrame = 0;
    this.animationCurve = null;
  }
  
  async start() {
    // Add visual parameters
    this.addSlider('rows', 'Grid Rows', 5, { min: 2, max: 20, step: 1 });
    this.addSlider('cols', 'Grid Columns', 5, { min: 2, max: 20, step: 1 });
    this.addSlider('tension', 'Curve Smoothness', 0.5, { min: 0, max: 1, step: 0.1 });
    this.addCheckbox('showGridLines', 'Show Grid Lines', this.state.settings.showGridLines);
    this.addCheckbox('showMirrors', 'Show Mirrors', this.state.settings.showMirrors);
    this.addColor('backgroundColor', 'Background Color', '#f5f5f5');
    this.addColor('curveColor', 'Curve Color', '#3498db');
    
    // Add structural parameters
    this.addSlider('mirrorProbability', 'Mirror Probability', 0.5, { min: 0, max: 1, step: 0.1 }, 'structural');
    this.addDropdown('curveStyle', 'Curve Style', 'curved', ['curved', 'jagged'], 'structural');
    
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
    this.state.grid = new Grid(rows, cols);
    
    // Randomize mirrors with current probability
    this.randomizeMirrors();
    
    // Reset curves
    this.state.curves = [];
    this.state.animationPath = null;
  }
  
  randomizeMirrors() {
    if (!this.state.grid) return;
    
    const probability = this.getParameter('mirrorProbability');
    this.state.grid.randomizeMirrors(probability);
    
    // Reset curves when mirrors change
    this.state.curves = [];
    this.state.animationPath = null;
    
    // Update visualization
    this.updateGridVisualization();
  }
  
  findAllCurves() {
    if (!this.state.grid) return;
    
    // Reset used directions
    this.state.grid.resetUsedDirections();
    
    // Find all curves
    this.state.curves = findAllCurves(this.state.grid);
    
    // Mark all curves as completed
    this.state.curves.forEach(curve => {
      curve.isCompleted = true;
    });
    
    // Update visualization
    this.updateCurveVisualization();
  }
  
  clearCurves() {
    this.state.curves = [];
    this.state.animationPath = null;
    this.isAnimating = false;
    
    // Reset used directions in the grid
    if (this.state.grid) {
      this.state.grid.resetUsedDirections();
    }
    
    // Update visualization
    this.updateCurveVisualization();
  }
  
  animateNextCurve() {
    if (!this.state.grid) return;
    
    // Stop current animation if running
    this.isAnimating = false;
    this.state.animationPath = null;
    
    // Find the next available curve
    const curve = findNextCurve(this.state.grid);
    
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
    if (!this.state.grid || !this.gridLayer) return;
    
    // Clear the grid layer
    this.gridLayer.destroyChildren();
    
    const { showGridLines, showGridPoints, showMirrors, showCenterDots, lineStyles } = this.state.settings;
    
    // Get stage dimensions
    const stageWidth = this.renderEnv.stage.width();
    const stageHeight = this.renderEnv.stage.height();
    
    // Calculate grid layout
    const padding = Math.min(stageWidth, stageHeight) * 0.05;
    const drawableWidth = stageWidth - (padding * 2);
    const drawableHeight = stageHeight - (padding * 2);
    
    // Calculate cell dimensions to ensure cells are square
    const cellSize = Math.min(
      drawableWidth / this.state.grid.cols, 
      drawableHeight / this.state.grid.rows
    );
    
    // Calculate centering offsets
    const offsetX = padding + (drawableWidth - (cellSize * this.state.grid.cols)) / 2;
    const offsetY = padding + (drawableHeight - (cellSize * this.state.grid.rows)) / 2;
    
    // Store layout values for reuse
    this.state.gridLayout = {
      cellSize,
      offsetX,
      offsetY,
      gridRows: this.state.grid.rows,
      gridCols: this.state.grid.cols
    };
    
    // Create a group to hold grid elements with proper translation
    const gridGroup = new this.renderEnv.konva.Group({
      x: offsetX,
      y: offsetY
    });
    
    // Draw grid lines
    if (showGridLines) {
      for (const line of this.state.grid.gridLines.values()) {
        const x1 = line.col * cellSize;
        const y1 = line.row * cellSize;
        const x2 = (line.type === 'horizontal' ? (line.col + 1) * cellSize : x1);
        const y2 = (line.type === 'vertical' ? (line.row + 1) * cellSize : y1);
        
        const lineObj = new this.renderEnv.konva.Line({
          points: [x1, y1, x2, y2],
          stroke: lineStyles.grid.color,
          strokeWidth: lineStyles.grid.width
        });
        
        gridGroup.add(lineObj);
      }
    }
    
    // Draw grid points
    if (showGridPoints) {
      for (let r = 0; r <= this.state.grid.rows; r++) {
        for (let c = 0; c <= this.state.grid.cols; c++) {
          const circle = new this.renderEnv.konva.Circle({
            x: c * cellSize,
            y: r * cellSize,
            radius: lineStyles.gridPoint.radius,
            fill: lineStyles.gridPoint.color
          });
          
          gridGroup.add(circle);
        }
      }
    }
    
    // Draw mirror lines
    if (showMirrors) {
      for (const line of this.state.grid.gridLines.values()) {
        if (!line.isMirror) continue;
        
        const x1 = line.col * cellSize;
        const y1 = line.row * cellSize;
        const x2 = (line.type === 'horizontal' ? (line.col + 1) * cellSize : x1);
        const y2 = (line.type === 'vertical' ? (line.row + 1) * cellSize : y1);
        
        const mirrorLine = new this.renderEnv.konva.Line({
          points: [x1, y1, x2, y2],
          stroke: lineStyles.mirror.color,
          strokeWidth: lineStyles.mirror.width
        });
        
        gridGroup.add(mirrorLine);
      }
    }
    
    // Draw center dots
    if (showCenterDots) {
      for (let r = 0; r < this.state.grid.rows; r++) {
        for (let c = 0; c < this.state.grid.cols; c++) {
          const centerDot = new this.renderEnv.konva.Circle({
            x: (c + 0.5) * cellSize,
            y: (r + 0.5) * cellSize,
            radius: lineStyles.centerDot.radius,
            fill: lineStyles.centerDot.color
          });
          
          gridGroup.add(centerDot);
        }
      }
    }
    
    // Add the grid group to the layer
    this.gridLayer.add(gridGroup);
    this.gridLayer.batchDraw();
    
    // Update curve visualization with new layout
    this.updateCurveVisualization();
  }
  
  updateCurveVisualization() {
    if (!this.curveLayer) return;
    
    // Clear the curve layer
    this.curveLayer.destroyChildren();
    
    // Get layout values
    const { cellSize, offsetX, offsetY } = this.state.gridLayout;
    
    // Create a group for curves with the same offset as the grid
    const curveGroup = new this.renderEnv.konva.Group({
      x: offsetX,
      y: offsetY
    });
    
    // Draw completed curves
    const colorScheme = [this.getParameter('curveColor')];
    const { state, renderEnv } = this;
    
    state.curves.forEach((curve, idx) => {
      // Create a curve line
      const konvaCurve = this.createKonvaCurve(curve, idx, cellSize, colorScheme);
      if (konvaCurve) {
        curveGroup.add(konvaCurve);
      }
    });
    
    // Draw animation path if it exists
    if (state.animationPath) {
      const animCurve = this.createKonvaCurve(
        state.animationPath, 
        state.curves.length, 
        cellSize, 
        colorScheme
      );
      
      if (animCurve) {
        curveGroup.add(animCurve);
      }
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
    
    // Extract points from the curve
    let points = [];
    let isClosed = false;
    
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
        const helperPoints = curve.gridLines.map((line, index) => {
          // Get the basic midpoint
          let x, y;
          if (line.type === 'horizontal') {
            x = (line.col + 0.5) * cellSize;
            y = line.row * cellSize;
          } else { // vertical
            x = line.col * cellSize;
            y = (line.row + 0.5) * cellSize;
          }
          
          // Get the direction
          const direction = curve.directions[index];
          
          // Offset based on direction for better curves
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
        });
        
        // Apply spline for smooth curves
        points = getSplinePoints(helperPoints, tension, 10);
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
                     this.state.settings.smooth && 
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
    const lineStyle = this.state.settings.lineStyles.curve;
    const color = colorScheme[idx % colorScheme.length];
    
    const konvaLine = new this.renderEnv.konva.Line({
      points: flatPoints,
      stroke: color,
      strokeWidth: lineStyle.width,
      lineCap: 'round',
      lineJoin: 'round',
      closed: isClosed
    });
    
    return konvaLine;
  }
  
  animate(deltaTime) {
    // Apply background color from parameter
    this.renderEnv.stage.container().style.backgroundColor = this.getParameter('backgroundColor');
    
    // Update curve style settings
    this.state.settings.tension = this.getParameter('tension');
    this.state.settings.showGridLines = this.getParameter('showGridLines');
    this.state.settings.showMirrors = this.getParameter('showMirrors');
    
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
        this.state.curves.push(this.animationCurve);
        
        // Reset animation state
        this.state.animationPath = null;
        this.isAnimating = false;
        this.animationCurve = null;
        
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
          x = (line.col + 0.5) * this.state.gridLayout.cellSize;
          y = line.row * this.state.gridLayout.cellSize;
        } else { // vertical
          x = line.col * this.state.gridLayout.cellSize;
          y = (line.row + 0.5) * this.state.gridLayout.cellSize;
        }
        
        points.push({ x, y });
      }
      
      // For the last segment, interpolate based on progress
      if (segmentCount < this.animationCurve.gridLines.length) {
        const nextLine = this.animationCurve.gridLines[segmentCount];
        let nextX, nextY;
        
        if (nextLine.type === 'horizontal') {
          nextX = (nextLine.col + 0.5) * this.state.gridLayout.cellSize;
          nextY = nextLine.row * this.state.gridLayout.cellSize;
        } else { // vertical
          nextX = nextLine.col * this.state.gridLayout.cellSize;
          nextY = (nextLine.row + 0.5) * this.state.gridLayout.cellSize;
        }
        
        const lastPoint = points[points.length - 1];
        const interpX = lastPoint.x + (nextX - lastPoint.x) * progress;
        const interpY = lastPoint.y + (nextY - lastPoint.y) * progress;
        
        points.push({ x: interpX, y: interpY });
      }
      
      // Set animation path
      this.state.animationPath = {
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
        parameterId === 'showMirrors' ||
        parameterId === 'curveStyle' ||
        parameterId === 'curveColor') {
      this.updateCurveVisualization();
    }
  }
  
  handleInteraction(type, data) {
    // Handle clicks on grid lines to toggle mirrors
    if (type === 'click' && this.state.grid) {
      // Convert stage coordinates to grid coordinates
      const { cellSize, offsetX, offsetY } = this.state.gridLayout;
      const gridX = (data.x - offsetX) / cellSize;
      const gridY = (data.y - offsetY) / cellSize;
      
      // Check if click is within grid boundaries
      if (gridX >= 0 && gridX <= this.state.grid.cols && 
          gridY >= 0 && gridY <= this.state.grid.rows) {
        
        // Find the closest grid line
        let closestLine = null;
        let minDistance = Infinity;
        
        for (const line of this.state.grid.gridLines.values()) {
          if (this.state.grid.isBoundaryGridLine(line)) {
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
          this.state.grid.setMirror(closestLine.id, !closestLine.isMirror);
          
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
    this.state = {
      grid: null,
      curves: [],
      animationPath: null,
      gridLayout: {},
      settings: {
        showGridLines: true,
        showGridPoints: true,
        showMirrors: true,
        showCenterDots: false,
        smooth: true,
        tension: 0.5,
        backgroundColor: 'transparent',
        animationStyle: 'curved',
        lineStyles: {
          grid: { color: '#cccccc', width: 1 },
          gridPoint: { color: '#999999', radius: 2 },
          mirror: { color: '#333333', width: 2 },
          centerDot: { color: '#555555', radius: 3 },
          curve: { width: 3 }
        }
      }
    };
  }
}
