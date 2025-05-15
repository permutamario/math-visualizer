// index.js - Main plugin class for Root Lattice Visualization

import { Plugin2D } from '../../src/core/Plugin2D.js';
import { LatticeGenerator } from './LatticeGenerator.js';
import { LatticeRenderer } from './LatticeRenderer.js';

export default class RootLatticePlugin extends Plugin2D {
    // Required static properties
    static id = 'root-lattice';
    static name = '2D Root Lattice Viewer';
    static description = 'Visualization of 2D root lattices with reflection hyperplanes';
    static renderingType = '2d';
    
    constructor(core) {
        super(core);
        
        // Initialize required components
        this.latticeGenerator = null;
        this.latticeRenderer = null;
        
        // Internal state
        this.latticeData = {
            latticePoints: [],
            roots: [],
            hyperplanes: []
        };
        
        // Rendering groups
        this.mainGroup = null;
        
        // Tracking for view changes
        this.lastScale = 1;
        this.lastPosition = { x: 0, y: 0 };
        
        // Dirty flags
        this.isDirtyLattice = true;
        this.isDirtyView = true;
    }
    
    async start() {
        // Initialize the lattice generator and renderer
        this.latticeGenerator = new LatticeGenerator();
        this.latticeRenderer = new LatticeRenderer(this.renderEnv.konva);
        
        // Add visual parameters
        this.addDropdown('latticeType', 'Lattice Type', 'A2', [
            { value: 'A2', label: 'A2 - Triangular Lattice' },
            { value: 'B2', label: 'B2 - Square Lattice' },
            { value: 'G2', label: 'G2 - Exceptional Root System' }
        ]);
        this.addSlider('latticePointSize', 'Point Size', 5, { min: 1, max: 10, step: 0.5 });
        this.addSlider('latticeDensity', 'Lattice Density', 10, { min: 1, max: 50, step: 1 });
        this.addCheckbox('showRoots', 'Show Root Vectors', true);
        this.addCheckbox('showHyperplanes', 'Show Hyperplanes', true);
        this.addColorPalette();
        
        // Add advanced parameters
        this.addSlider('originSize', 'Origin Size', 8, { min: 2, max: 20, step: 1 }, 'advanced');
        this.addSlider('lineThickness', 'Line Thickness', 1, { min: 0.5, max: 5, step: 0.5 }, 'advanced');
        this.addSlider('rootLength', 'Root Length', 50, { min: 10, max: 100, step: 5 }, 'advanced');
        this.addCheckbox('showPointInfo', 'Show Point Info on Hover', false, 'advanced');
        this.addSlider('zoomSensitivity', 'Zoom Sensitivity', 0.1, { min: 0.05, max: 0.3, step: 0.05 }, 'advanced');
        
        // Create main group and add to layer
        this.mainGroup = this.createGroup('main');
        
        // Get center position
        const stage = this.renderEnv.stage;
        const centerX = stage.width() / 2;
        const centerY = stage.height() / 2;
        
        // Position the group at the center
        this.mainGroup.position({ x: centerX, y: centerY });
        
        // Direct wheel event listener on stage for zooming
        // This bypasses any potential issues with the framework's zoom handler
        const stageElement = this.renderEnv.stage.container();
        stageElement.addEventListener('wheel', this._handleWheelZoom.bind(this), { passive: false });
        
        // Only enable automatic camera controls for panning
        // We'll handle zooming ourselves
        this.renderEnv.setAutomaticCameraControls(true);
        
        // Generate initial lattice data
        this.generateLatticeData();
        
        // Start animation for camera tracking and updates
        this.animationHandler = this.requestAnimation(this.animate.bind(this));
    }
    
    // Direct wheel event handler for zooming
    _handleWheelZoom(event) {
        // Always prevent default to avoid page scrolling
        event.preventDefault();
        
        // Get the Konva stage
        const stage = this.renderEnv.stage;
        if (!stage) return;
        
        // Get zoom sensitivity from parameters
        const sensitivity = this.getParameter('zoomSensitivity');
        
        // Get current scale
        const oldScale = stage.scaleX();
        
        // Calculate new scale - delta up (negative) = zoom in, delta down (positive) = zoom out
        const delta = event.deltaY;
        const sign = delta > 0 ? -1 : 1;
        const scaleBy = 1 + (sign * sensitivity);
        const newScale = oldScale * scaleBy;
        
        // Limit zoom range to prevent extreme zoom
        const minScale = 0.01;
        const maxScale = 50;
        if (newScale < minScale || newScale > maxScale) return;
        
        // Get mouse position relative to stage
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        
        // Get current position
        const oldPos = {
            x: stage.x(),
            y: stage.y()
        };
        
        // Calculate new position to zoom toward mouse pointer
        const mousePointTo = {
            x: (pointer.x - oldPos.x) / oldScale,
            y: (pointer.y - oldPos.y) / oldScale
        };
        
        // Calculate new position
        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale
        };
        
        // Apply scale and position in a single update to avoid jumps
        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
        stage.batchDraw();
        
        // Mark view as dirty to update visuals
        this.isDirtyView = true;
        this.isDirtyLattice = true;
    }
    
    animate(deltaTime) {
        // Check if view has changed
        const stage = this.renderEnv.stage;
        const scale = stage.scale().x;
        const position = stage.position();
        
        if (scale !== this.lastScale || 
            position.x !== this.lastPosition.x || 
            position.y !== this.lastPosition.y) {
            
            // View has changed, update tracking variables
            this.lastScale = scale;
            this.lastPosition = { ...position };
            this.isDirtyView = true;
            
            // Force update of lattice to adjust for zoom level
            this.isDirtyLattice = true;
        }
        
        // Update hyperplanes if view changed (they need to extend to current view bounds)
        if (this.isDirtyView && this.getParameter('showHyperplanes')) {
            this.updateHyperplanes();
            this.isDirtyView = false;
        }
        
        // Update lattice if needed
        if (this.isDirtyLattice) {
            this.updateLattice();
            this.isDirtyLattice = false;
        }
        
        return true; // Continue animation
    }
    
    generateLatticeData() {
        const latticeType = this.getParameter('latticeType');
        const density = this.getParameter('latticeDensity');
        
        // Get roots for selected lattice type
        const roots = this.latticeGenerator.getRoots(latticeType);
        
        // Get short and long roots if available
        let shortRoots = [];
        let longRoots = [];
        
        if (this.latticeGenerator.rootSystems[latticeType].shortRoots) {
            shortRoots = this.latticeGenerator.rootSystems[latticeType].shortRoots;
        }
        
        if (this.latticeGenerator.rootSystems[latticeType].longRoots) {
            longRoots = this.latticeGenerator.rootSystems[latticeType].longRoots;
        }
        
        // Generate lattice points
        const latticePoints = this.latticeGenerator.generateLatticePoints(latticeType, density);
        
        // Calculate view bounds for hyperplanes
        const stage = this.renderEnv.stage;
        const viewBounds = this.latticeRenderer.calculateViewBounds(stage);
        
        // Generate hyperplanes
        const hyperplanes = this.latticeGenerator.generateHyperplanes(latticeType, viewBounds);
        
        // Store lattice data
        this.latticeData = {
            latticePoints,
            roots,
            shortRoots,
            longRoots,
            hyperplanes,
            showRoots: this.getParameter('showRoots'),
            showHyperplanes: this.getParameter('showHyperplanes')
        };
        
        // Mark as dirty to trigger redraw
        this.isDirtyLattice = true;
    }
    
    updateHyperplanes() {
        const latticeType = this.getParameter('latticeType');
        const stage = this.renderEnv.stage;
        const viewBounds = this.latticeRenderer.calculateViewBounds(stage);
        
        // Regenerate hyperplanes for new view bounds
        this.latticeData.hyperplanes = this.latticeGenerator.generateHyperplanes(
            latticeType, viewBounds
        );
        
        // Mark lattice as dirty to redraw
        this.isDirtyLattice = true;
    }
    
    updateLattice() {
        // Get colors from color scheme
        const selectedPalette = this.getParameter('colorPalette');
        const colorPalette = this.core.colorSchemeManager.getPalette(selectedPalette);
        
        // Use the framework's color system
        const pointColor = this.getMainColor(0);
        const rootColor = this.getMainColor(1);
        const hyperplaneColor = this.getStructuralColor('grid');
        const originColor = this.getFunctionalColor('selected');
        
        // Get current scale for zoom-adjusted sizes
        const stage = this.renderEnv.stage;
        const currentScale = stage.scale().x;
        
        // Adjust visual element sizes based on zoom level
        // For zoom-out (scale < 1), increase element size; for zoom-in (scale > 1), keep reasonable size
        const scaleAdjustment = Math.min(1, 1/currentScale);
        
        // Render the lattice with current parameters
        this.latticeRenderer.renderLattice(this.latticeData, this.mainGroup, {
            pointSize: this.getParameter('latticePointSize') * scaleAdjustment,
            originSize: this.getParameter('originSize') * scaleAdjustment,
            pointColor: pointColor,
            originColor: originColor,
            rootColor: rootColor,
            rootLength: this.getParameter('rootLength'),
            rootWidth: this.getParameter('lineThickness') * scaleAdjustment,
            hyperplaneColor: hyperplaneColor,
            hyperplaneWidth: this.getParameter('lineThickness') * scaleAdjustment,
            showPointInfo: this.getParameter('showPointInfo'),
            zoomLevel: currentScale,
            latticeType: this.getParameter('latticeType')
        });
        
        // Add explanatory text about the current root system
        this.addExplanatoryText();
        
        // Update the layer
        this.redrawLayer('main');
    }
    
    // Add explanatory text about the current root system
    addExplanatoryText() {
        const stage = this.renderEnv.stage;
        const latticeType = this.getParameter('latticeType');
        const stageWidth = stage.width();
        
        // Create a text description of the current root system
        let description = "";
        
        switch(latticeType) {
            case 'A2':
                description = "A₂ Root System: All roots have equal length, forming a regular hexagon.\nCorresponds to the Lie algebra of SU(3).";
                break;
            case 'B2':
                description = "B₂ Root System: Has long roots (orange) and short roots (green).\nLong roots are √2 times longer than short roots.\nCorresponds to the Lie algebra of SO(5).";
                break;
            case 'G2':
                description = "G₂ Root System: Has long roots (orange) and short roots (green).\nLong roots are √3 times longer than short roots.\nThis is one of the exceptional Lie algebras.";
                break;
        }
        
        // Create text box with the background and padding
        const textBox = new this.renderEnv.konva.Text({
            x: 10,
            y: 10,
            text: description,
            fontSize: 14,
            fontFamily: 'Arial',
            fill: this.core.colorSchemeManager.getTextColor(),
            padding: 10,
            background: this.core.colorSchemeManager.getBackgroundColor(),
            opacity: 0.8,
            cornerRadius: 5,
            width: stageWidth * 0.3
        });
        
        // Add to layer (not the main group, so it stays fixed on screen)
        this.getLayer('overlay').add(textBox);
        
        // Redraw overlay layer
        this.redrawLayer('overlay');
    }
    
    // Also remove our wheel handling in handleInteraction since we're handling it directly
    handleInteraction(type, data) {
        // We're now handling wheel events directly at the DOM level
        // so we don't need to process them here
        
        // For debugging purposes only
        if (type === 'click' && data.evt && data.evt.ctrlKey) {
            // Log coordinates when control+click (for debugging)
            const stage = this.renderEnv.stage;
            const scale = stage.scale().x;
            const stagePos = stage.position();
            
            // Convert screen coordinates to world coordinates
            const worldX = (data.x - stagePos.x) / scale;
            const worldY = (data.y - stagePos.y) / scale;
            
            console.log(`Clicked at world coordinates: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`);
        }
    }
    
    onParameterChanged(parameterId, value) {
        // Handle parameter changes
        if (parameterId === 'latticeType' || parameterId === 'latticeDensity') {
            // Regenerate entire lattice data
            this.generateLatticeData();
        } else if (parameterId === 'showRoots' || parameterId === 'showHyperplanes') {
            // Update visibility flags
            this.latticeData.showRoots = this.getParameter('showRoots');
            this.latticeData.showHyperplanes = this.getParameter('showHyperplanes');
            this.isDirtyLattice = true;
        } else {
            // Other visual parameters changed
            this.isDirtyLattice = true;
        }
    }
    
    onPaletteChanged() {
        // Update colors when palette changes
        this.isDirtyLattice = true;
    }
    
    // Add cleanup for our wheel event listener
    async unload() {
        // Remove the wheel event listener we added
        const stageElement = this.renderEnv.stage?.container();
        if (stageElement) {
            stageElement.removeEventListener('wheel', this._handleWheelZoom);
        }
        
        // Clean up resources
        if (this.mainGroup) {
            this.mainGroup.destroy();
            this.mainGroup = null;
        }
        
        this.latticeData = null;
        this.latticeGenerator = null;
        this.latticeRenderer = null;
        
        // Let the base class handle animation and event cleanup
        await super.unload();
    }
}
