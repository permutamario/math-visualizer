// plugins/mirror-curve/index.js
import { Plugin2D } from '../../core/Plugin2D.js';
import { Grid } from './grid.js';
import { findNextCurve, findAllCurves } from './curveStartFinder.js';
import { GridRenderer } from './gridRenderer.js';
import { CurveRenderer } from './curveRenderer.js';
import { calculateAllHelperPoints } from './helperPointCalculator.js';
import { handleGridInteraction } from './interactionHandler.js';
import { calculateGridLayout } from './layoutManager.js';

export default class MirrorCurvesPlugin extends Plugin2D {
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
        this.distanceTraveled = 0;
        this.animationCurve = null;
        this.animationQueue = [];
        
        // Rendering objects
        this.gridRenderer = null;
        this.curveRenderer = null;
        
        // Groups for organizing visualization elements
        this.gridGroup = null;
        this.staticCurveGroup = null;
        this.animationGroup = null;
        
        // Track dirty states
        this.isDirtyGrid = true;
        this.isDirtyStaticCurves = true;
        this.isDirtyAnimation = true;
        
        // For resize tracking
        this.lastWidth = 0;
        this.lastHeight = 0;
    }
    
    async start() {
        // Add visual parameters
        this.addSlider('rows', 'Grid Rows', 5, { min: 2, max: 60, step: 1 });
        this.addSlider('cols', 'Grid Columns', 5, { min: 2, max: 60, step: 1 });
        this.addCheckbox('showGridLines', 'Show Grid Lines', true);
        this.addCheckbox('showGridPoints', 'Show Grid Points', true);
        this.addCheckbox('showMirrors', 'Show Mirrors', true);
        this.addCheckbox('showCenterDots', 'Show Center Dots', false);
        this.addColorPalette();

        // Add structural parameters
        this.addSlider('mirrorProbability', 'Mirror Probability', 0.5, { min: 0.1, max: 1, step: 0.1 }, 'structural');
        this.addCheckbox('animateCurves', 'Animate Curves', true, 'structural');
        this.addSlider('animationSpeed', 'Animation Speed', 15.0, 
                       { min: 1, max: 50, step: 1 }, 'structural');

        // Add advanced parameters
        this.addCheckbox('smooth', 'Smooth Curves', true, 'advanced');
        this.addSlider('tension', 'Curve Smoothness', 0.01, { min: 0, max: 1, step: 0.1 }, 'advanced');
        this.addDropdown('curveStyle', 'Curve Style', 'curved', ['curved', 'jagged'], 'advanced');
        this.addCheckbox('showHelperPoints', 'Show Helper Points', false, 'advanced');
        
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
        
        // Reset curves AND animation state
        this.curves = [];
        this.animationPath = null;
        this.helperPoints = [];
        this.animationQueue = [];
        this.isAnimating = false;
        this.animationCurve = null;
        this.distanceTraveled = 0;
        
        // Clear renderer cache if available
        if (this.curveRenderer) {
            this.curveRenderer.clearCache();
        }
        
        // Mark everything as dirty to force redraw
        this.isDirtyGrid = true;
        this.isDirtyStaticCurves = true;
        this.isDirtyAnimation = true;
    }
    
    randomizeMirrors() {
        if (!this.grid) return;
        
        const probability = this.getParameter('mirrorProbability');
        this.grid.randomizeMirrors(probability);
        
        // Reset curves and animations when mirrors change
        this.clearCurves();
        this.isDirtyGrid = true;
        this.updateStaticCurves();
    }
    
    discoverAllCurves() {
        if (!this.grid) return;
        
        // Find all remaining curves by repeatedly calling findNextCurve
        const newCurves = [];
        let nextCurve;
        
        while ((nextCurve = findNextCurve(this.grid)) !== null) {
            newCurves.push(nextCurve);
        }
        
        if (newCurves.length === 0) {
            console.log('No new curves found');
            return;
        }
        
        console.log(`Found ${newCurves.length} new curves`);
        
        if (this.getParameter('animateCurves')) {
            // Queue new curves for animation
            this.animationQueue = [...this.animationQueue, ...newCurves];
            
            // Start animation if not already running
            if (!this.isAnimating) {
                this.startNextAnimation();
            }
        } else {
            // Add all new curves at once without animation
            newCurves.forEach(curve => {
                curve.isCompleted = true;
            });
            this.curves = [...this.curves, ...newCurves];
            this.updateHelperPoints();
            this.isDirtyStaticCurves = true;
        }
    }
    
    clearCurves() {
        this.curves = [];
        this.animationPath = null;
        this.helperPoints = [];
        this.isAnimating = false;
        this.animationCurve = null;
        this.animationQueue = [];
        this.distanceTraveled = 0;
        
        // Clear renderer cache
        if (this.curveRenderer) {
            this.curveRenderer.clearCache();
        }
        
        // Reset used directions in the grid
        if (this.grid) {
            this.grid.resetUsedDirections();
        }
        
        this.isDirtyStaticCurves = true;
        this.isDirtyAnimation = true;
    }
    
    updateHelperPoints() {
        this.helperPoints = calculateAllHelperPoints(this.curves, this.gridLayout.cellSize);
        this.isDirtyStaticCurves = true;
    }

    startNextAnimation() {
        if (this.animationQueue.length === 0) {
            this.isAnimating = false;
            this.animationPath = null;
            this.isDirtyAnimation = true;
            return;
        }
        
        // Get the next curve from the queue
        this.animationCurve = this.animationQueue.shift();
        
        // Reset animation state
        this.distanceTraveled = 0;
        this.isAnimating = true;
        this.isDirtyAnimation = true;
        
        // Clear any cache for the current animation curve
        if (this.curveRenderer && this.animationCurve && this.animationCurve.gridLines[0]) {
            const curveId = this.animationCurve.gridLines[0].id;
            if (curveId) {
                this.curveRenderer.clearCurveFromCache(curveId);
            }
        }
    }
    
    animate(deltaTime) {
        // Check if stage size has changed
        const stage = this.renderEnv.stage;
        const currentWidth = stage.width();
        const currentHeight = stage.height();
        
        if (currentWidth !== this.lastWidth || currentHeight !== this.lastHeight) {
            this.updateLayout();
        }
        
        // Handle animation if active
        if (this.isAnimating && this.animationCurve) {
            // Calculate how much distance to travel this frame
            const animationSpeed = this.getParameter('animationSpeed');
            const distance = deltaTime * animationSpeed * 100; // Scale speed appropriately
            this.distanceTraveled += distance;

            // Create animation path based on distance traveled
            this.animationPath = this.curveRenderer.createAnimationPathByDistance(
                this.animationCurve, 
                this.gridLayout.cellSize, 
                this.distanceTraveled,
                {
                    tension: this.getParameter('tension'),
                    curveStyle: this.getParameter('curveStyle'),
                    gridRows: this.getParameter('rows'),
                    gridCols: this.getParameter('cols')
                }
            );

            // Mark animation layer as dirty to trigger redraw
            this.isDirtyAnimation = true;

            // Check if animation is complete
            if (this.animationPath && this.animationPath.completed) {
                // Add the completed curve to static curves
                this.animationCurve.isCompleted = true;
                this.curves.push(this.animationCurve);
                
                // Update helper points for all curves
                this.updateHelperPoints();
                
                // Mark static curves as dirty to include the new curve
                this.isDirtyStaticCurves = true;
                
                // Start the next animation if available
                this.startNextAnimation();
            }
        }
        
        // Update animation layer if dirty
        if (this.isDirtyAnimation) {
            this.updateAnimation();
            this.isDirtyAnimation = false;
        }
        
        // Update static curves if needed
        if (this.isDirtyStaticCurves) {
            this.updateStaticCurves();
            this.isDirtyStaticCurves = false;
        }
        
        // Update grid if needed
        if (this.isDirtyGrid) {
            this.updateGrid();
            this.isDirtyGrid = false;
        }
        
        return true; // Continue animation
    }
    
    setupKonvaObjects() {
        // Create groups for different parts of the visualization
        this.gridGroup = this.createGroup('grid');
        this.staticCurveGroup = this.createGroup('main'); // Use 'main' layer for completed curves
        this.animationGroup = this.createGroup('animation');
        
        // Mark all dirty to ensure initial render
        this.isDirtyGrid = true;
        this.isDirtyStaticCurves = true;
        this.isDirtyAnimation = true;
        
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
        
        // Position groups
        const { offsetX, offsetY } = this.gridLayout;
        
        this.gridGroup.position({ x: offsetX, y: offsetY });
        this.staticCurveGroup.position({ x: offsetX, y: offsetY });
        this.animationGroup.position({ x: offsetX, y: offsetY });
        
        // Clear curves when layout changes to prevent animation issues
        this.clearCurves();
        
        // Store current dimensions
        this.lastWidth = stageWidth;
        this.lastHeight = stageHeight;
        
        // Mark all as dirty after layout change
        this.isDirtyGrid = true;
        this.isDirtyStaticCurves = true;
        this.isDirtyAnimation = true;
        
        // Update all components with new layout
        this.updateGrid();
        this.updateStaticCurves();
        this.updateAnimation();
    }
    
    updateGrid() {
        // Get colors from color scheme
        const textColor = this.core.colorSchemeManager.getTextColor();
        const mirrorColor = this.core.colorSchemeManager.getStructuralColor('strong');
        
        // Clear the grid group
        this.gridGroup.destroyChildren();
        
        // Update grid visualization
        this.gridRenderer.renderGrid(this.grid, this.gridGroup, {
            cellSize: this.gridLayout.cellSize,
            showGridLines: this.getParameter('showGridLines'),
            showGridPoints: this.getParameter('showGridPoints'),
            showMirrors: this.getParameter('showMirrors'),
            showCenterDots: this.getParameter('showCenterDots'),
            gridLineColor: textColor + '44', // Add transparency to text color for grid lines
            mirrorColor: mirrorColor // Use strong color for mirrors
        });
        
        // Draw the grid layer
        this.redrawLayer('grid');
    }
    
    updateStaticCurves() {
        // Get color palette from color scheme manager
        const selectedPalette = this.getParameter('colorPalette');
        const colorPalette = this.core.colorSchemeManager.getPalette(selectedPalette);
        const helperPointColor = this.core.colorSchemeManager.getAccentColor();
        
        // Clear the static curve group
        this.staticCurveGroup.destroyChildren();
        
        // Render completed curves to static curve group
        this.curveRenderer.renderCurves(this.curves, this.staticCurveGroup, {
            cellSize: this.gridLayout.cellSize,
            colorScheme: colorPalette,
            curveStyle: this.getParameter('curveStyle'),
            tension: this.getParameter('tension'),
            smooth: this.getParameter('smooth'),
            showHelperPoints: this.getParameter('showHelperPoints'),
            helperPointColor: helperPointColor,
            helperPoints: this.helperPoints,
            gridRows: this.getParameter('rows'),
            gridCols: this.getParameter('cols')
        });
        
        // Draw the static curve layer
        this.redrawLayer('main');
    }
    
    updateAnimation() {
        // Get color palette
        const selectedPalette = this.getParameter('colorPalette');
        const colorPalette = this.core.colorSchemeManager.getPalette(selectedPalette);
        
        // Clear the animation group
        this.animationGroup.destroyChildren();
        
        // Only draw animation path if it exists
        if (this.animationPath) {
            // Use the same color as the static curve would have
            let animationColor = colorPalette[this.curves.length % colorPalette.length];
            
            this.curveRenderer.renderCurves([], this.animationGroup, {
                cellSize: this.gridLayout.cellSize,
                colorScheme: [animationColor], // Use a single color for the animation
                curveStyle: this.getParameter('curveStyle'),
                tension: this.getParameter('tension'),
                smooth: this.getParameter('smooth'),
                animationPath: this.animationPath,
                gridRows: this.getParameter('rows'),
                gridCols: this.getParameter('cols')
            });
        }
        
        // Draw the animation layer
        this.redrawLayer('animation');
    }

    animateNextCurve() {
        if (!this.grid) {
            console.warn('Grid not initialized');
            return;
        }
        
        // Find the next available curve
        const nextCurve = findNextCurve(this.grid);
        
        if (nextCurve) {
            console.log('Found next curve, queueing for animation');
            
            // Add curve to animation queue
            this.animationQueue.push(nextCurve);
            
            // Start animation if not already running
            if (!this.isAnimating) {
                this.startNextAnimation();
            }
        } else {
            console.log('No more curves available');
        }
    }
    
    onParameterChanged(parameterId, value) {
        // Rebuild grid if rows or columns change
        if (parameterId === 'rows' || parameterId === 'cols') {
            this.initializeGrid();
            this.updateLayout();
            return;
        }
        
        // Update grid if grid parameters change
        if (parameterId === 'showGridLines' || parameterId === 'showGridPoints' || 
            parameterId === 'showMirrors' || parameterId === 'showCenterDots') {
            this.isDirtyGrid = true;
        }
        
        // Update static curves if curve style parameters change
        if (parameterId === 'colorPalette' || parameterId === 'showHelperPoints' || 
            parameterId === 'tension' || parameterId === 'curveStyle' || 
            parameterId === 'smooth') {
            this.isDirtyStaticCurves = true;
            this.isDirtyAnimation = true;
        }
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
                
                // Mark grid as dirty
                this.isDirtyGrid = true;
            }
        }
    }
    
    async unload() {
        // Cancel animations
        if (this.animationHandler) {
            this.cancelAnimation(this.animationHandler);
        }
        
        // Reset state
        this.grid = null;
        this.curves = [];
        this.animationPath = null;
        this.gridLayout = {};
        this.helperPoints = [];
        this.isAnimating = false;
        this.distanceTraveled = 0;
        this.animationCurve = null;
        this.animationQueue = [];
        this.gridRenderer = null;
        this.curveRenderer = null;
        
        // Let the base class handle cleanup of Konva objects
        await super.unload();
    }
}
