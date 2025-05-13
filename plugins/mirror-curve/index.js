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
	this.animationQueue = []; // Queue of curves to be animated
        
        // Rendering objects
        this.gridRenderer = null;
        this.curveRenderer = null;
        
        // Konva objects
        this.backgroundRect = null;
        this.gridGroup = null;
        this.curveGroup = null;
        this.gridLayer = null;
        this.curveLayer = null;
        this.backgroundLayer = null;
        
        // For resize tracking
        this.lastWidth = 0;
        this.lastHeight = 0;
    }
    
    async start() {
        // Add visual parameters
        this.addSlider('rows', 'Grid Rows', 5, { min: 2, max: 20, step: 1 });
        this.addSlider('cols', 'Grid Columns', 5, { min: 2, max: 20, step: 1 });
        this.addCheckbox('showGridLines', 'Show Grid Lines', true);
        this.addCheckbox('showGridPoints', 'Show Grid Points', true);
        this.addCheckbox('showMirrors', 'Show Mirrors', true);
        this.addCheckbox('showCenterDots', 'Show Center Dots', false);
        this.addCheckbox('showHelperPoints', 'Show Helper Points', false);

        
        // Add structural parameters
        this.addSlider('mirrorProbability', 'Mirror Probability', 0.5, { min: 0.1, max: 1, step: 0.1 }, 'structural');
        this.addDropdown('curveStyle', 'Curve Style', 'curved', ['curved', 'jagged'], 'structural');
	
	this.addCheckbox('animateCurves', 'Animate Curves', true, 'structural');
	this.addSlider('animationSpeed', 'Animation Speed', 1.0, 
		       { min: 0.1, max: 5.0, step: 0.1 }, 'structural');



        // Add advanced parameters
        this.addColor('backgroundColor', 'Background Color', 'transparent','advanced');
        this.addColor('curveColor', 'Curve Color', '#3498db','advanced');
        this.addColor('gridLineColor', 'Grid Line Color', '#cccccc','advanced');
        this.addColor('mirrorColor', 'Mirror Color', '#333333','advanced');
        this.addColor('helperPointColor', 'Helper Point Color', '#ff0000','advanced');
	this.addCheckbox('smooth', 'Smooth Curves', true, 'advanced');
        this.addSlider('tension', 'Curve Smoothness', 0, { min: 0, max: 1, step: 0.1 },'advanced');
        
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
	
	// Reset curves and animations when mirrors change
	this.clearCurves();
	this.updateVisualization();
    }
    
    discoverAllCurves() {
	if (!this.grid) return;
	
	// Reset used directions
	this.grid.resetUsedDirections();

	// Find all curves
	const allCurves = findAllCurves(this.grid);
	
	if (this.getParameter('animateCurves')) {
            // Queue all curves for animation
            this.animationQueue = [...this.animationQueue, ...allCurves];
            
            // Start animation if not already running
            if (!this.isAnimating) {
		this.startNextAnimation();
            }
	} else {
            // Add all curves at once without animation
            allCurves.forEach(curve => {
		curve.isCompleted = true;
            });
            this.curves = [...this.curves, ...allCurves];
            this.updateHelperPoints();
            this.updateVisualization();
	}
    }

    
    clearCurves() {
	this.curves = [];
	this.animationPath = null;
	this.helperPoints = [];
	this.isAnimating = false;
	this.animationCurve = null;
	this.animationQueue = []; // Clear animation queue
	
	// Reset used directions in the grid
	if (this.grid) {
            this.grid.resetUsedDirections();
	}
	this.updateVisualization();
    }
    
    updateHelperPoints() {
        this.helperPoints = calculateAllHelperPoints(this.curves, this.gridLayout.cellSize);
    }

    startNextAnimation() {
	if (this.animationQueue.length === 0) {
	    this.isAnimating = false;
	    this.animationPath = null;
	    return;
	}
	
	// Get the next curve from the queue
	this.animationCurve = this.animationQueue.shift();
	
	// Reset animation progress (using progress instead of frame)
	this.animationProgress = 0;
	
	this.isAnimating = true;
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
        
        // Get animation speed parameter and calculate frame count
        const baseFrameCount = 30; 
        const speedMultiplier = this.getParameter('animationSpeed');
        const frameCount = Math.ceil(baseFrameCount / speedMultiplier);
        
        // Update animation path
        const animResult = this.curveRenderer.createAnimationPath(
            this.animationCurve,
            this.gridLayout.cellSize,
            this.animationFrame,
            frameCount
        );
        
        if (animResult && animResult.completed) {
            // Animation is complete, add curve to list
            this.animationCurve.isCompleted = true;
            this.curves.push(this.animationCurve);
            
            // Reset animation state
            this.animationPath = null;
            this.animationCurve = null;
            
            // Update helper points
            this.updateHelperPoints();
            
            // Start next animation in queue
            this.startNextAnimation();
        } else if (animResult) {
            // Update animation path
            this.animationPath = animResult;
        }
        
        // Update visualization
        this.updateVisualization();
    }
    
    return true; // Continue animation
}
    
    setupKonvaObjects() {
        const { stage, konva } = this.renderEnv;
        
        // Create layers
        this.backgroundLayer = new konva.Layer();
        this.gridLayer = new konva.Layer();
        this.curveLayer = new konva.Layer();
        
        // Create background rectangle
        this.backgroundRect = new konva.Rect({
            x: 0,
            y: 0,
            width: stage.width(),
            height: stage.height(),
            fill: this.getParameter('backgroundColor')
        });
        
        // Add background to its layer
        this.backgroundLayer.add(this.backgroundRect);
        
        // Create groups
        this.gridGroup = new konva.Group();
        this.curveGroup = new konva.Group();
        
        // Add groups to layers
        this.gridLayer.add(this.gridGroup);
        this.curveLayer.add(this.curveGroup);
        
        // Add layers to stage in correct order (background first)
        stage.add(this.backgroundLayer); 
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
        
        // Update background rectangle size
        if (this.backgroundRect) {
            this.backgroundRect.width(stageWidth);
            this.backgroundRect.height(stageHeight);
            this.backgroundRect.fill(this.getParameter('backgroundColor'));
        }
        
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
        // Update background color
        if (this.backgroundRect) {
            this.backgroundRect.fill(this.getParameter('backgroundColor'));
        }
        
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
        
        // Force redraw of all layers
        this.backgroundLayer.batchDraw();
        this.gridLayer.batchDraw();
        this.curveLayer.batchDraw();
    }
    

    animateNextCurve() {
	if (this.isAnimating) {
	    console.log('Animation already in progress');
	    return;
	}
	
	if (!this.grid) {
	    console.warn('Grid not initialized');
	    return;
	}
	
	// Find the next available curve
	const nextCurve = findNextCurve(this.grid);
	
	if (nextCurve) {
	    // Add curve to animation queue
	    this.animationQueue.push(nextCurve);
	    
	    // Start animation
	    this.startNextAnimation();
	} else {
	    console.log('No more curves available');
	}
    }
    
    onParameterChanged(parameterId, value) {
	// Rebuild grid if rows or columns change
	if (parameterId === 'rows' || parameterId === 'cols') {
	    this.initializeGrid();
	    this.updateLayout();
	}
	
	// If animation style parameters change during animation, ensure they take effect
	if (parameterId === 'tension' || parameterId === 'curveStyle' || parameterId === 'smooth') {
	    // These will be picked up on the next animation frame
	    if (this.isAnimating) {
		// Force an update of the current animation path on next frame
		// This ensures style parameters apply immediately to ongoing animations
		this.animationPath = null; 
	    }
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
        if (this.backgroundRect) {
            this.backgroundRect.destroy();
            this.backgroundRect = null;
        }
        
        if (this.gridGroup) {
            this.gridGroup.destroy();
            this.gridGroup = null;
        }
        
        if (this.curveGroup) {
            this.curveGroup.destroy();
            this.curveGroup = null;
        }
        
        if (this.backgroundLayer) {
            this.backgroundLayer.destroy();
            this.backgroundLayer = null;
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
