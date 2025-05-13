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
        this.distanceTraveled = 0; // Track distance for animation
        this.animationCurve = null;
        this.animationQueue = []; // Queue of curves to be animated
        this.lastFrameTime = 0;
        this.frameInterval = 1000/60; // Target 60 FPS but use for throttling if needed
        
        // Rendering objects
        this.gridRenderer = null;
        this.curveRenderer = null;
        
        // Konva objects
        this.backgroundRect = null;
        this.gridGroup = null;
        this.curveGroup = null;
        this.staticCurveGroup = null; // For completed curves that don't change
        this.animationGroup = null; // Just for the current animation
        
        // Layers
        this.backgroundLayer = null;
        this.gridLayer = null;
        this.staticCurveLayer = null; // Only redrawn when curves are added/removed
        this.animationLayer = null; // Redrawn every frame during animation
        
        // Track dirty states to know what to redraw
        this.isDirtyBackground = true;
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

        // Get available palette names from the color scheme manager
        const paletteNames = this.core.colorSchemeManager.getPaletteNames();

        // Add color palette selector
        this.addDropdown('colorPalette', 'Color Palette', 'default', paletteNames);
        
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
        this.animationQueue = []; // Clear queue
        this.isAnimating = false; // Reset animation flag
        this.animationCurve = null; // Reset current animation
        this.distanceTraveled = 0; // Reset distance
        
        // Clear renderer cache if available
        if (this.curveRenderer) {
            this.curveRenderer.clearCache();
        }
        
        // Mark everything as dirty to force redraw
        this.markAllDirty();
    }
    
    randomizeMirrors() {
        if (!this.grid) return;
        
        const probability = this.getParameter('mirrorProbability');
        this.grid.randomizeMirrors(probability);
        
        // Reset curves and animations when mirrors change
        this.clearCurves();
        this.markAllDirty();

        this.updateStaticCurves();
    }
    
    discoverAllCurves() {
        if (!this.grid) return;
        
        // Find all remaining curves by repeatedly calling findNextCurve
        // until no more curves are available
        const newCurves = [];
        let nextCurve;
        
        // Keep finding curves until there are no more
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
        this.animationQueue = []; // Clear animation queue
        this.distanceTraveled = 0; // Reset distance traveled
        
        // Clear renderer cache
        if (this.curveRenderer) {
            this.curveRenderer.clearCache();
        }
        
        // Reset used directions in the grid
        if (this.grid) {
            this.grid.resetUsedDirections();
        }
        
        // Mark relevant layers as dirty
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
        
        // Clear any cache for the current animation curve to ensure fresh rendering
        if (this.curveRenderer && this.animationCurve && this.animationCurve.gridLines[0]) {
            const curveId = this.animationCurve.gridLines[0].id;
            if (curveId) {
                this.curveRenderer.clearCurveFromCache(curveId);
            }
        }
    }
    
    // Mark all layers as dirty
    markAllDirty() {
        this.isDirtyBackground = true;
        this.isDirtyGrid = true;
        this.isDirtyStaticCurves = true;
        this.isDirtyAnimation = true;
    }
    
    animate(deltaTime) {
        // Apply background color from color scheme if background is dirty
        if (this.isDirtyBackground && this.renderEnv.stage) {
            const backgroundColor = this.core.colorSchemeManager.getBackgroundColor();
            this.renderEnv.stage.container().style.backgroundColor = backgroundColor;
            
            if (this.backgroundRect) {
                this.backgroundRect.fill(backgroundColor);
                this.backgroundLayer.batchDraw();
            }
            
            this.isDirtyBackground = false;
        }
        
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
        
        // Update animation layer if dirty, regardless of animation state
        if (this.isDirtyAnimation) {
            this.updateAnimation();
            this.isDirtyAnimation = false;
        }
        
        // Update static curves if needed (e.g., new curve completed or cleared)
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
        const { stage, konva } = this.renderEnv;
        
        // Create layers - in drawing order
        this.backgroundLayer = new konva.Layer();
        this.gridLayer = new konva.Layer();
        this.staticCurveLayer = new konva.Layer(); // Completed curves
        this.animationLayer = new konva.Layer(); // Current animation
        
        // Create background rectangle
        this.backgroundRect = new konva.Rect({
            x: 0,
            y: 0,
            width: stage.width(),
            height: stage.height(),
            fill: this.core.colorSchemeManager.getBackgroundColor()
        });
        
        // Add background to its layer
        this.backgroundLayer.add(this.backgroundRect);
        
        // Create groups
        this.gridGroup = new konva.Group();
        this.staticCurveGroup = new konva.Group(); // Completed curves
        this.animationGroup = new konva.Group(); // Current animation
        
        // Add groups to layers
        this.gridLayer.add(this.gridGroup);
        this.staticCurveLayer.add(this.staticCurveGroup);
        this.animationLayer.add(this.animationGroup);
        
        // Add layers to stage in correct order (background first)
        stage.add(this.backgroundLayer); 
        stage.add(this.gridLayer);
        stage.add(this.staticCurveLayer);
        stage.add(this.animationLayer);
        
        // Mark all dirty to ensure initial render
        this.markAllDirty();
        
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
            this.backgroundRect.fill(this.core.colorSchemeManager.getBackgroundColor());
            this.isDirtyBackground = true;
        }
        
        // Calculate layout
        this.gridLayout = calculateGridLayout(
            stageWidth,
            stageHeight,
            this.grid.rows,
            this.grid.cols
        );
        
        // Clear curves when layout changes to prevent animation issues
        this.clearCurves();
        
        // Apply layout to groups
        applyLayout(this.gridGroup, this.staticCurveGroup, this.gridLayout);
        applyLayout(this.gridGroup, this.animationGroup, this.gridLayout);
        
        // Store current dimensions
        this.lastWidth = stageWidth;
        this.lastHeight = stageHeight;
        
        // Mark all as dirty after layout change
        this.markAllDirty();
        
        // Update all components with new layout
        this.updateGrid();
        this.updateStaticCurves();
        this.updateAnimation();
    }
    
    // Update each component independently
    
    updateGrid() {
        // Get colors from color scheme
        const textColor = this.core.colorSchemeManager.getTextColor();
        const mirrorColor = this.core.colorSchemeManager.getStructuralColor('strong');
        
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
        this.gridLayer.batchDraw();
    }
    
    updateStaticCurves() {
        // Get color palette from color scheme manager
        const selectedPalette = this.getParameter('colorPalette');
        const colorPalette = this.core.colorSchemeManager.getPalette(selectedPalette);
        const helperPointColor = this.core.colorSchemeManager.getAccentColor();
        
        // Render only completed curves to static curve group
        this.curveRenderer.renderCurves(this.curves, this.staticCurveGroup, {
            cellSize: this.gridLayout.cellSize,
            colorScheme: colorPalette, // Use color palette for curves
            curveStyle: this.getParameter('curveStyle'),
            tension: this.getParameter('tension'),
            smooth: this.getParameter('smooth'),
            showHelperPoints: this.getParameter('showHelperPoints'),
            helperPointColor: helperPointColor,
            helperPoints: this.helperPoints,
            gridRows: this.getParameter('rows'), // Pass grid dimensions for dynamic subdivisions
            gridCols: this.getParameter('cols')
        });
        
        // Draw the static curve layer
        this.staticCurveLayer.batchDraw();
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
                gridRows: this.getParameter('rows'), // Pass grid dimensions for dynamic subdivisions
                gridCols: this.getParameter('cols')
            });
        }
        
        // Draw the animation layer
        this.animationLayer.batchDraw();
    }
    
    // Legacy method for full updates when needed
    updateVisualization() {
        this.isDirtyBackground = true;
        this.isDirtyGrid = true;
        this.isDirtyStaticCurves = true;
        this.isDirtyAnimation = true;
        
        this.updateGrid();
        this.updateStaticCurves();
        this.updateAnimation();
        
        if (this.backgroundRect) {
            this.backgroundRect.fill(this.core.colorSchemeManager.getBackgroundColor());
            this.backgroundLayer.batchDraw();
        }
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
        
        // Update background if color scheme related parameters change
        if (parameterId === 'colorPalette') {
            this.isDirtyBackground = true;
            this.isDirtyGrid = true;
            this.isDirtyStaticCurves = true;
            this.isDirtyAnimation = true;
        }
        
        // Update grid if grid parameters change
        if (parameterId === 'showGridLines' || parameterId === 'showGridPoints' || 
            parameterId === 'showMirrors' || parameterId === 'showCenterDots') {
            this.isDirtyGrid = true;
        }
        
        // Update static curves if curve style parameters change
        if (parameterId === 'showHelperPoints' || parameterId === 'tension' ||
            parameterId === 'curveStyle' || parameterId === 'smooth') {
            this.isDirtyStaticCurves = true;
            // Animation will pick up changes on next frame
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
        
        if (this.staticCurveGroup) {
            this.staticCurveGroup.destroy();
            this.staticCurveGroup = null;
        }
        
        if (this.animationGroup) {
            this.animationGroup.destroy();
            this.animationGroup = null;
        }
        
        // Clean up layers
        if (this.backgroundLayer) {
            this.backgroundLayer.destroy();
            this.backgroundLayer = null;
        }
        
        if (this.gridLayer) {
            this.gridLayer.destroy();
            this.gridLayer = null;
        }
        
        if (this.staticCurveLayer) {
            this.staticCurveLayer.destroy();
            this.staticCurveLayer = null;
        }
        
        if (this.animationLayer) {
            this.animationLayer.destroy();
            this.animationLayer = null;
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
    }
}
