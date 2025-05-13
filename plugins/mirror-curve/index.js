// plugins/mirror-curve/index.js
import { Plugin } from '../../src/core/Plugin.js';
import { Grid } from './grid.js';
import { findNextCurve, findAllCurves } from './curveStartFinder.js';
import { GridRenderer } from './gridRenderer.js';
import { CurveRenderer } from './curveRenderer.js';
import { calculateAllHelperPoints } from './helperPointCalculator.js';
import { handleGridInteraction } from './interactionHandler.js';
import { calculateGridLayout, applyLayout } from './layoutManager.js';

export default class MirrorCurvesPlugin extends Plugin {
    // Required static properties
    static id = 'mirror-curves';
    static name = 'Mirror Curves';
    static description = 'Visualization of mirror curves based on grid reflections';
    static renderingType = '2d'; // Using Konva for 2D rendering
    
    constructor(core) {
	super(core);
	
	// Internal state
	this.grid = null;
	this.curves = [];
	this.animationPath = null;
	this.gridLayout = {};
	this.helperPoints = [];
	
	// Animation state
	this.isAnimating = false;
	this.animationFrame = 0;
	this.animationCurve = null;
	
	// Rendering objects
	this.gridRenderer = null;
	this.curveRenderer = null;
	
	// Konva objects
	this.gridGroup = null;
	this.curveGroup = null;
	this.gridLayer = null;
	this.curveLayer = null;
	
	// For resize tracking
	this.lastWidth = 0;
	this.lastHeight = 0;
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
	this.addCheckbox('showHelperPoints', 'Show Helper Points', false);

	
	// Add structural parameters
	this.addSlider('mirrorProbability', 'Mirror Probability', 0.5, { min: 0, max: 1, step: 0.1 }, 'structural');
	this.addDropdown('curveStyle', 'Curve Style', 'curved', ['curved', 'jagged'], 'structural');
	this.addCheckbox('smooth', 'Smooth Curves', true, 'structural');


	// Add advanced parameters
	this.addColor('backgroundColor', 'Background Color', '#f5f5f5','advanced');
	this.addColor('curveColor', 'Curve Color', '#3498db','advanced');
	this.addColor('gridLineColor', 'Grid Line Color', '#cccccc','advanced');
	this.addColor('mirrorColor', 'Mirror Color', '#333333','advanced');
	this.addColor('helperPointColor', 'Helper Point Color', '#ff0000','advanced');
	
	// Add actions
	this.addAction('randomize', 'Randomize Mirrors', () => this.randomizeMirrors());
	this.addAction('findAllCurves', 'Find All Curves', () => this.discoverAllCurves());
	this.addAction('clearCurves', 'Clear Curves', () => this.clearCurves());
	this.addAction('animateCurve', 'Animate Next Curve', () => this.animateNextCurve());
	
	// Initialize the grid
	this.initializeGrid();
	
	// Initialize renderers
	this.gridRenderer = new GridRenderer(this.renderEnv.konva);
	this.curveRenderer = new CurveRenderer(this.renderEnv.konva);
	
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
	const probability = this.getParameter('mirrorProbability');
	this.grid.randomizeMirrors(probability);
	
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
	this.clearCurves();
    }
    
    discoverAllCurves() {
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
	this.updateHelperPoints();
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
    }
    
    updateHelperPoints() {
	this.helperPoints = calculateAllHelperPoints(this.curves, this.gridLayout.cellSize);
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
	const { stage, konva } = this.renderEnv;
	
	// Create layers
	this.gridLayer = new konva.Layer();
	this.curveLayer = new konva.Layer();
	
	// Create groups
	this.gridGroup = new konva.Group();
	this.curveGroup = new konva.Group();
	
	// Add groups to layers
	this.gridLayer.add(this.gridGroup);
	this.curveLayer.add(this.curveGroup);
	
	// Add layers to stage
	stage.add(this.gridLayer);
	stage.add(this.curveLayer);
	
	// Initial update
	this.updateLayout();
    }
    
    updateLayout() {
	const stage = this.renderEnv.stage;
	
	// Get stage dimensions
	const stageWidth = stage.width();
	const stageHeight = stage.height();
	
	// Calculate layout
	this.gridLayout = calculateGridLayout(
	    stageWidth,
	    stageHeight,
	    this.grid.rows,
	    this.grid.cols
	);
	
	// Apply layout to groups
	applyLayout(this.gridGroup, this.curveGroup, this.gridLayout);
	
	// Store current dimensions
	this.lastWidth = stageWidth;
	this.lastHeight = stageHeight;
	
	// Update visualization
	this.updateVisualization();
    }
    
    updateVisualization() {
	// Update grid visualization
	this.gridRenderer.renderGrid(this.grid, this.gridGroup, {
	    cellSize: this.gridLayout.cellSize,
	    showGridLines: this.getParameter('showGridLines'),
	    showGridPoints: this.getParameter('showGridPoints'),
	    showMirrors: this.getParameter('showMirrors'),
	    showCenterDots: this.getParameter('showCenterDots'),
	    gridLineColor: this.getParameter('gridLineColor'),
	    mirrorColor: this.getParameter('mirrorColor')
	});
	
	// Update helper points if needed
	this.updateHelperPoints();
	
	// Update curve visualization
	this.curveRenderer.renderCurves(this.curves, this.curveGroup, {
	    cellSize: this.gridLayout.cellSize,
	    curveColor: this.getParameter('curveColor'),
	    curveStyle: this.getParameter('curveStyle'),
	    tension: this.getParameter('tension'),
	    smooth: this.getParameter('smooth'),
	    showHelperPoints: this.getParameter('showHelperPoints'),
	    helperPointColor: this.getParameter('helperPointColor'),
	    animationPath: this.animationPath,
	    helperPoints: this.helperPoints
	});
	
	// Force redraw
	this.gridLayer.batchDraw();
	this.curveLayer.batchDraw();
    }
    
    animate(deltaTime) {
	// Apply background color from parameter
	this.renderEnv.stage.container().style.backgroundColor = 
	    this.getParameter('backgroundColor');
	
	// Check if stage size has changed
	const stage = this.renderEnv.stage;
	const currentWidth = stage.width();
	const currentHeight = stage.height();
	
	if (currentWidth !== this.lastWidth || currentHeight !== this.lastHeight) {
	    this.updateLayout();
	}
	
	// Handle animation if active
	if (this.isAnimating && this.animationCurve) {
	    // Increment animation frame
	    this.animationFrame++;
	    
	    // Create animation path with current progress
	    const frameCount = 30; // Animation frames per segment
	    
	    // Update animation path
	    const animResult = this.curveRenderer.createAnimationPath(
		this.animationCurve,
		this.gridLayout.cellSize,
		this.animationFrame,
		frameCount
	    );
	    
	    if (animResult.completed) {
		// Animation is complete, add curve to list
		this.animationCurve.isCompleted = true;
		this.curves.push(this.animationCurve);
		
		// Reset animation state
		this.animationPath = null;
		this.isAnimating = false;
		this.animationCurve = null;
		
		// Update helper points
		this.updateHelperPoints();
	    } else {
		// Update animation path
		this.animationPath = animResult;
	    }
	    
	    // Update visualization
	    this.updateVisualization();
	}
	
	return true;
    }
    
    onParameterChanged(parameterId, value) {
	// Rebuild grid if rows or columns change
	if (parameterId === 'rows' || parameterId === 'cols') {
	    this.initializeGrid();
	    this.updateLayout();
	}
	
	// Update visualization if any style parameter changes
	this.updateVisualization();
    }
    
    handleInteraction(type, data) {
	// Handle clicks on grid lines to toggle mirrors
	if (type === 'click' && this.grid) {
	    // Find the grid line that was clicked
	    const clickedLine = handleGridInteraction(this.grid, data, this.gridLayout);
	    
	    if (clickedLine) {
		// Toggle mirror status
		this.grid.setMirror(clickedLine.id, !clickedLine.isMirror);
		
		// Clear curves when mirrors change
		this.clearCurves();
		
		// Update visualization
		this.updateVisualization();
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
	if (this.gridGroup) {
	    this.gridGroup.destroy();
	    this.gridGroup = null;
	}
	
	if (this.curveGroup) {
	    this.curveGroup.destroy();
	    this.curveGroup = null;
	}
	
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
	this.gridRenderer = null;
	this.curveRenderer = null;
    }
}
