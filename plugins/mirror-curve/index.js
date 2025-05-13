import { Plugin } from '../../src/core/Plugin.js';
import { Grid } from './grid.js';
import { MirrorCurve } from './mirrorCurve.js';
import { findNextCurve, findAllCurves } from './curveStartFinder.js';
import { 
  createKonvaLine, 
  getCurvePoints, 
  getAnimationPath 
} from './drawingUtils.js';

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
        tension: 0.1,
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
    this.gridLayer = null;
    this.curveLayer = null;
    
    // Animation state
    this.isAnimating = false;
    this.animationFrame = 0;
    this.animationCurve = null;
    this.animationDuration = 2000; // 2 seconds for full animation
    this.animationLastUpdate = 0;
  }
  
  async start() {
    // Add visual parameters
    this.addSlider('rows', 'Grid Rows', 5, { min: 2, max: 20, step: 1 });
    this.addSlider('cols', 'Grid Columns', 5, { min: 2, max: 20, step: 1 });
    this.addSlider('tension', 'Curve Smoothness', 0.5, { min: 0, max: 1, step: 0.1 });
    this.addSlider('animationSpeed', 'Animation Speed', 1, { min: 0.1, max: 3, step: 0.1 });
    this.addCheckbox('showGridLines', 'Show Grid Lines', this.state.settings.showGridLines);
    this.addCheckbox('showMirrors', 'Show Mirrors', this.state.settings.showMirrors);
    this.addColor('backgroundColor', 'Background Color', '#f5f5f5');
    this.addColor('curveColor', 'Curve Color', '#3498db');
    
    // Add structural parameters
    this.addSlider('mirrorProbability', 'Mirror Probability', 0.5, { min: 0, max: 1, step: 0.1 }, 'structural');
    this.addDropdown('curveStyle', 'Curve Style', 'curved', ['curved', 'jagged'], 'structural');
    
    // Add advanced parameters
    this.addCheckbox('showHelperPoints', 'Show Helper Points (Debug)', true, 'advanced');
    
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
      this.animationLastUpdate = performance.now();
      this.isAnimating = true;
    } else {
      // Show notification if no more curves
      if (this.core && this.core.uiManager) {
        this.core.uiManager.showNotification('No more curves available');
      }
    }
  }
  
  setupKonvaObjects() {
    const { stage, konva } = this.renderEnv;
    
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
    if (!cellSize) return;
    
    // Create a group for curves with the same offset as the grid
    const curveGroup = new this.renderEnv.konva.Group({
      x: offsetX,
      y: offsetY
    });
    
    // Get curve style and color 
    const useCurvedStyle = this.getParameter('curveStyle') === 'curved';
    const curveColor = this.getParameter('curveColor');
    const tension = this.getParameter('tension');
    const showHelperPoints = this.getParameter('showHelperPoints');
    
    // Draw completed curves
    this.state.curves.forEach((curve, idx) => {
      // Draw the main curve line
      const konvaLine = createKonvaLine(
        curve, 
        cellSize, 
        this.renderEnv.konva, 
        {
          color: curveColor,
          strokeWidth: this.state.settings.lineStyles.curve.width,
          useCurvedStyle,
          tension
        }
      );
      
      if (konvaLine) {
        curveGroup.add(konvaLine);
      }
      
      // Draw helper points if debugging is enabled
      if (showHelperPoints && useCurvedStyle && curve.gridLines) {
        // Calculate helper points
        const { calculateHelperPoints } = require('./drawingUtils.js');
        const helperPoints = calculateHelperPoints(curve, cellSize);
        
        // Draw helper points
        helperPoints.forEach(point => {
          const helperDot = new this.renderEnv.konva.Circle({
            x: point.x,
            y: point.y,
            radius: 4,
            fill: '#ff0000',
            stroke: '#ffffff',
            strokeWidth: 1
          });
          
          curveGroup.add(helperDot);
        });
      }
    });
    
    // Draw animation path if it exists
    if (this.state.animationPath) {
      const animLine = createKonvaLine(
        this.state.animationPath,
        cellSize,
        this.renderEnv.konva,
        {
          color: curveColor,
          strokeWidth: this.state.settings.lineStyles.curve.width,
          useCurvedStyle: true, // Always use curved style for animation
          tension
        }
      );
      
      if (animLine) {
        curveGroup.add(animLine);
      }
      
      // Draw helper points for animation path if debugging is enabled
      if (showHelperPoints && this.animationCurve && this.animationCurve.gridLines) {
        // Calculate helper points
        const { calculateHelperPoints } = require('./drawingUtils.js');
        const helperPoints = calculateHelperPoints(this.animationCurve, cellSize);
        
        // Draw helper points
        helperPoints.forEach(point => {
          const helperDot = new this.renderEnv.konva.Circle({
            x: point.x,
            y: point.y,
            radius: 4,
            fill: '#ff0000',
            stroke: '#ffffff',
            strokeWidth: 1
          });
          
          curveGroup.add(helperDot);
        });
      }
    }
    
    // Add the curve group to the layer
    this.curveLayer.add(curveGroup);
    this.curveLayer.batchDraw();
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
      const now = performance.now();
      const elapsedTime = now - this.animationLastUpdate;
      this.animationLastUpdate = now;
      
      // Calculate animation duration based on speed parameter
      const speed = this.getParameter('animationSpeed');
      const duration = this.animationDuration / speed;
      
      // Update animation progress
      this.animationFrame += elapsedTime;
      const progress = Math.min(this.animationFrame / duration, 1);
      
      // Generate animation path
      const { cellSize } = this.state.gridLayout;
      const useCurvedStyle = this.getParameter('curveStyle') === 'curved';
      const tension = this.getParameter('tension');
      
      this.state.animationPath = getAnimationPath(
        this.animationCurve,
        cellSize,
        progress,
        {
          useCurvedStyle,
          tension
        }
      );
      
      // Update visualization
      this.updateCurveVisualization();
      
      // Check if animation is complete
      if (progress >= 1) {
        // Add the completed curve
        this.animationCurve.isCompleted = true;
        this.state.curves.push(this.animationCurve);
        
        // Reset animation state
        this.state.animationPath = null;
        this.isAnimating = false;
        this.animationCurve = null;
        
        // Update visualization
        this.updateCurveVisualization();
      }
    }
    
    return true; // Continue animation
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
