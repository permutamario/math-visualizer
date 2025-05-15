// index.js - Updated for deselection, nearest point, and convex hull

import { Plugin2D } from '../../src/core/Plugin2D.js';
import { LatticeGenerator } from './LatticeGenerator.js';
import { LatticeRenderer } from './LatticeRenderer.js';
import { WeylGroup } from './WeylGroup.js';
import { ConvexHull } from './ConvexHull.js';

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
        this.weylGroup = null; // For Weyl group operations
        
        // Internal state
        this.latticeData = {
            latticePoints: [],
            roots: [],
            hyperplanes: []
        };
        
        // Point selection and orbit tracking
        this.selectedPoints = new Map(); // Map of point keys to point coordinates
        this.orbits = new Map(); // Map of point keys to orbit array
        this.convexHull = []; // Convex hull of all orbit points
        
        // Rendering groups
        this.mainGroup = null;
        
        // Tracking for view changes
        this.lastScale = 1;
        this.lastPosition = { x: 0, y: 0 };
        
        // Dirty flags
        this.isDirtyLattice = true;
        this.isDirtyView = true;
        this.isDirtyOrbit = false;
        this.isDirtyHull = false;
    }
    
    async start() {
        // Initialize the lattice generator, renderer and Weyl group
        this.latticeGenerator = new LatticeGenerator();
        this.latticeRenderer = new LatticeRenderer(this.renderEnv.konva);
        this.weylGroup = new WeylGroup();
        
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
        
        // Add Weyl orbit feature parameters
        this.addCheckbox('showOrbits', 'Show Weyl Group Orbits', true);
        this.addColor('orbitColor', 'Orbit Point Color', '#9c27b0');
        this.addSlider('orbitPointSize', 'Orbit Point Size', 8, { min: 2, max: 15, step: 0.5 });
        this.addCheckbox('useMultiColorOrbits', 'Use Multiple Colors for Orbits', true);
        
        // Add convex hull parameters
        this.addCheckbox('showConvexHull', 'Show Orbit Convex Hull', true);
        this.addColor('hullStrokeColor', 'Hull Outline Color', '#ff9800');
        this.addColor('hullFillColor', 'Hull Fill Color', '#fffde7');
        this.addSlider('hullOpacity', 'Hull Opacity', 0.3, { min: 0.1, max: 1, step: 0.1 });
        
        this.addColorPalette();
        
        // Add advanced parameters
        this.addSlider('originSize', 'Origin Size', 8, { min: 2, max: 20, step: 1 }, 'advanced');
        this.addSlider('lineThickness', 'Line Thickness', 1, { min: 0.5, max: 5, step: 0.5 }, 'advanced');
        this.addSlider('rootLength', 'Root Length', 50, { min: 10, max: 100, step: 5 }, 'advanced');
        this.addCheckbox('showPointInfo', 'Show Point Info on Hover', false, 'advanced');
        this.addSlider('zoomSensitivity', 'Zoom Sensitivity', 0.1, { min: 0.05, max: 0.3, step: 0.05 }, 'advanced');
        
        // Add orbit-related advanced parameters
        this.addColor('selectedPointColor', 'Selected Point Color', '#ffeb3b', 'advanced');
        this.addSlider('selectedPointSize', 'Selected Point Size', 10, { min: 5, max: 20, step: 1 }, 'advanced');
        this.addSlider('maxSelectedPoints', 'Maximum Selected Points', 5, { min: 1, max: 10, step: 1 }, 'advanced');
        this.addSlider('clickDetectionRadius', 'Click Detection Radius', 30, { min: 10, max: 100, step: 5 }, 'advanced');
        
        // Create main group and add to layer
        this.mainGroup = this.createGroup('main');
        
        // Get center position
        const stage = this.renderEnv.stage;
        const centerX = stage.width() / 2;
        const centerY = stage.height() / 2;
        
        // Position the group at the center
        this.mainGroup.position({ x: centerX, y: centerY });
        
        // Direct wheel event listener on stage for zooming
        const stageElement = this.renderEnv.stage.container();
        stageElement.addEventListener('wheel', this._handleWheelZoom.bind(this), { passive: false });
        
        // Only enable automatic camera controls for panning
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
        
        // Update convex hull if orbits changed
        if (this.isDirtyOrbit && this.getParameter('showConvexHull')) {
            this.updateConvexHull();
            this.isDirtyHull = true;
        }
        
        // Update lattice if needed
        if (this.isDirtyLattice || this.isDirtyOrbit || this.isDirtyHull) {
            this.updateLattice();
            this.isDirtyLattice = false;
            this.isDirtyOrbit = false;
            this.isDirtyHull = false;
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
        
        // Recompute orbits for all selected points if any
        if (this.selectedPoints.size > 0 && this.getParameter('showOrbits')) {
            this.computeAllOrbits();
        }
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
    
    updateConvexHull() {
        // Only calculate if we have orbits and should show the hull
        if (this.orbits.size > 0 && this.getParameter('showConvexHull')) {
            // Calculate the combined convex hull of all orbits
            this.convexHull = ConvexHull.calculateCombinedHull(this.orbits);
        } else {
            this.convexHull = [];
        }
    }
    
    
updateLattice() {
    // Clear the main group first
    this.mainGroup.destroyChildren();
    
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
    const scaleAdjustment = Math.min(1, 1/currentScale);
    
    // Render the convex hull first (so it appears behind everything else)
    if (this.convexHull.length > 2 && this.getParameter('showConvexHull')) {
        const hullOpacity = this.getParameter('hullOpacity');
        const hullFillColor = this.getParameter('hullFillColor');
        const hullStrokeColor = this.getParameter('hullStrokeColor');
        
        // Add opacity to colors
        const fillColorWithOpacity = this._addOpacityToColor(hullFillColor, hullOpacity);
        const strokeColorWithOpacity = this._addOpacityToColor(hullStrokeColor, Math.min(1, hullOpacity + 0.3));
        
        // Create a flattened array of points for the hull polygon
        const hullPoints = [];
        this.convexHull.forEach(point => {
            hullPoints.push(point[0], point[1]);
        });
        
        // Create the hull polygon directly
        const hull = new this.renderEnv.konva.Line({
            points: hullPoints,
            fill: fillColorWithOpacity,
            stroke: strokeColorWithOpacity,
            strokeWidth: this.getParameter('lineThickness') * scaleAdjustment,
            closed: true,
            id: 'convex_hull'
        });
        
        // Add it to the main group first, so it's at the bottom
        this.mainGroup.add(hull);
    }
    
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
    
    // Add orbit visualization if there are selected points
    if (this.selectedPoints.size > 0 && this.getParameter('showOrbits')) {
        // Whether to use multiple colors for different orbits
        const useMultiColorOrbits = this.getParameter('useMultiColorOrbits');
        
        // Get base orbit color
        const baseOrbitColor = this.getParameter('orbitColor');
        
        // Get a list of distinct colors for multiple orbits if needed
        let orbitColors = [];
        if (useMultiColorOrbits) {
            // Use colors from the color palette
            orbitColors = this.core.colorSchemeManager.getMainColors();
        }
        
        // Track orbit count for color assignment
        let orbitCount = 0;
        
        // Render all orbits for all selected points
        this.orbits.forEach((orbit, pointKey) => {
            // Use a different color for each orbit if enabled
            let orbitColor = baseOrbitColor;
            if (useMultiColorOrbits && orbitColors.length > 0) {
                orbitColor = orbitColors[orbitCount % orbitColors.length];
                orbitCount++;
            }
            
            // Render the orbit
            this.latticeRenderer.renderOrbit(orbit, this.mainGroup, {
                orbitPointColor: orbitColor,
                orbitPointSize: this.getParameter('orbitPointSize') * scaleAdjustment,
                orbitPointBorderColor: 'white',
                orbitPointBorderWidth: 1,
                zoomLevel: currentScale,
                pulsing: true,
                orbitId: 'orbit_' + pointKey.replace(/[.,]/g, '_')
            });
        });
        
        // Highlight all selected points
        this.selectedPoints.forEach((point, pointKey) => {
            // Highlight the selected point
            this.latticeRenderer.highlightSelectedPoint(point, this.mainGroup, {
                selectedPointColor: this.getParameter('selectedPointColor'),
                selectedPointSize: this.getParameter('selectedPointSize') * scaleAdjustment,
                selectedPointBorderColor: 'black',
                selectedPointBorderWidth: 2,
                zoomLevel: currentScale,
                pointId: 'selected_point_' + pointKey.replace(/[.,]/g, '_')
            });
        });
    }
    
    // Add explanatory text about the current root system
    this.addExplanatoryText();
    
    // Update the layer
    this.redrawLayer('main');
}
    
    // Helper to add opacity to a color
    _addOpacityToColor(color, opacity) {
        // Check if it's already an rgba color
        if (color.startsWith('rgba(')) {
            return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/, 
                                 `rgba($1, $2, $3, ${opacity})`);
        }
        
        // Check if it's an rgb color
        if (color.startsWith('rgb(')) {
            return color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, 
                                 `rgba($1, $2, $3, ${opacity})`);
        }
        
        // Check if it's a hex color
        if (color.startsWith('#')) {
            // Convert hex to rgb
            let r = 0, g = 0, b = 0;
            
            // 3-digit hex
            if (color.length === 4) {
                r = parseInt(color[1] + color[1], 16);
                g = parseInt(color[2] + color[2], 16);
                b = parseInt(color[3] + color[3], 16);
            } 
            // 6-digit hex
            else if (color.length === 7) {
                r = parseInt(color.substring(1, 3), 16);
                g = parseInt(color.substring(3, 5), 16);
                b = parseInt(color.substring(5, 7), 16);
            }
            
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        // If it's a named color, just return with opacity
        return `${color.replace(/\s/g, '')}${opacity}`;
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
        
        // Add Weyl group information
        description += "\n\nClick on any lattice point to toggle selection.";
        description += "\nMultiple points can be selected to see their orbits.";
        
        // Add convex hull information if enabled
        if (this.getParameter('showConvexHull')) {
            description += "\nConvex hull shows the boundary of all orbit points.";
        }
        
        // Add orbit info if there are selected points
        if (this.selectedPoints.size > 0 && this.getParameter('showOrbits')) {
            description += `\n\n${this.selectedPoints.size} point(s) selected:`;
            
            // Information about the Weyl group for the current type
            switch(latticeType) {
                case 'A2':
                    description += `\nWeyl group: S₃ (dihedral group of order 6)`;
                    break;
                case 'B2':
                    description += `\nWeyl group: D₄ (dihedral group of order 8)`;
                    break;
                case 'G2':
                    description += `\nWeyl group: D₆ (dihedral group of order 12)`;
                    break;
            }
            
            // List the selected points and their orbit sizes (limit to first 3 if there are many)
            let pointCount = 0;
            this.selectedPoints.forEach((point, key) => {
                if (pointCount < 3) {
                    const orbit = this.orbits.get(key) || [];
                    description += `\n• (${point[0].toFixed(1)}, ${point[1].toFixed(1)}) - Orbit size: ${orbit.length}`;
                    pointCount++;
                }
            });
            
            // If there are more than 3 points, add an ellipsis
            if (this.selectedPoints.size > 3) {
                description += `\n• ...and ${this.selectedPoints.size - 3} more`;
            }
            
            // Add total number of orbit points in convex hull if enabled
            if (this.getParameter('showConvexHull') && this.convexHull.length > 0) {
                description += `\n\nConvex hull: ${this.convexHull.length} vertices`;
            }
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
    
    // Create a point key for map storage
    getPointKey(point) {
        return `${point[0].toFixed(4)},${point[1].toFixed(4)}`;
    }
    
    // Handle user interactions including point selection
    handleInteraction(type, data) {
        // Handle click events for point selection
        if (type === 'click') {
            // First check if we clicked on a selected point highlight (to handle deselection)
            const target = data.target;
            let clickedPointInfo = null;
            
            // Check if we clicked on an already selected point or its highlight
            if (target && target.id().startsWith('selected_point_')) {
                const targetId = target.id();
                // Extract point key from the ID
                const pointKey = targetId.replace('selected_point_', '').replace(/_/g, '.');
                
                // Find the actual point coordinates in our selected points
                const selectedPoint = this.selectedPoints.get(pointKey);
                if (selectedPoint) {
                    // This is a selected point, toggle it off
                    this.togglePointSelection(selectedPoint);
                    return;
                }
            }
            
            // Check if we clicked on a regular lattice point
            if (target && target.id().startsWith('point_')) {
                // Get the clicked point from our cache
                clickedPointInfo = this.latticeRenderer.pointsCache.get(target._id);
                if (clickedPointInfo) {
                    this.togglePointSelection([clickedPointInfo.x, clickedPointInfo.y]);
                    return;
                }
            }
            
            // If we didn't click directly on a point, check for nearest point within threshold
            if (!clickedPointInfo) {
                // Get stage-related data for coordinate conversion
                const stage = this.renderEnv.stage;
                const stagePos = stage.position();
                const scale = stage.scale().x;
                
                // Convert screen coordinates to world coordinates
                const worldX = (data.x - stagePos.x) / scale;
                const worldY = (data.y - stagePos.y) / scale;
                
                // Get click detection radius (in world units)
                const clickRadius = this.getParameter('clickDetectionRadius') / scale;
                
                // Find the nearest point within radius
                const nearestPoint = this.latticeRenderer.findNearestLatticePoint(
                    worldX, worldY, clickRadius
                );
                
                if (nearestPoint) {
                    this.togglePointSelection([nearestPoint.x, nearestPoint.y]);
                    return;
                }
            }
            
            // For debugging purposes
            if (data.evt && data.evt.ctrlKey) {
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
    }
    
    // Toggle a point's selection status
    togglePointSelection(point) {
        const pointKey = this.getPointKey(point);
        
        if (this.selectedPoints.has(pointKey)) {
            // Point is already selected, deselect it
            this.selectedPoints.delete(pointKey);
            this.orbits.delete(pointKey);
        } else {
            // Check if we've reached the maximum number of selected points
            const maxPoints = this.getParameter('maxSelectedPoints');
            if (this.selectedPoints.size >= maxPoints) {
                // If at limit, remove the oldest point (first in the Map)
                const oldestKey = this.selectedPoints.keys().next().value;
                this.selectedPoints.delete(oldestKey);
                this.orbits.delete(oldestKey);
            }
            
            // Add the new point
            this.selectedPoints.set(pointKey, point);
            
            // Compute the orbit if visualization is enabled
            if (this.getParameter('showOrbits')) {
                this.computeOrbit(point, pointKey);
            }
        }
        
        // Update convex hull if enabled
        if (this.getParameter('showConvexHull')) {
            this.updateConvexHull();
            this.isDirtyHull = true;
        }
        
        // Mark as dirty to trigger redraw
        this.isDirtyLattice = true;
    }
    
    // Compute the orbit for a single point
    computeOrbit(point, pointKey) {
        if (!point) return;
        
        const latticeType = this.getParameter('latticeType');
        const roots = this.latticeGenerator.getRoots(latticeType);
        
        // Compute the orbit
        const orbit = this.weylGroup.generateOrbit(point, roots);
        
        // Store the orbit
        this.orbits.set(pointKey, orbit);
        
        // Mark orbit as dirty
        this.isDirtyOrbit = true;
    }
    
    // Compute orbits for all selected points
    computeAllOrbits() {
        // Clear existing orbits
        this.orbits.clear();
        
        // Compute orbit for each selected point
        this.selectedPoints.forEach((point, pointKey) => {
            this.computeOrbit(point, pointKey);
        });
        
        // Update convex hull
        this.updateConvexHull();
        this.isDirtyHull = true;
    }
    
    onParameterChanged(parameterId, value) {
        // Handle parameter changes
        if (parameterId === 'latticeType' || parameterId === 'latticeDensity') {
            // Regenerate entire lattice data
            this.generateLatticeData();
            
            // Recompute orbit for new root system
            if (this.selectedPoints.size > 0 && this.getParameter('showOrbits')) {
                this.computeAllOrbits();
            }
        } else if (parameterId === 'showRoots' || parameterId === 'showHyperplanes') {
            // Update visibility flags
            this.latticeData.showRoots = this.getParameter('showRoots');
            this.latticeData.showHyperplanes = this.getParameter('showHyperplanes');
            this.isDirtyLattice = true;
        } else if (parameterId === 'showOrbits') {
            // Toggle orbit visualization
            if (value && this.selectedPoints.size > 0) {
                // Compute orbits if they were turned on
                this.computeAllOrbits();
            }
            this.isDirtyLattice = true;
        } else if (parameterId === 'showConvexHull') {
            // Toggle convex hull visualization
            if (value && this.selectedPoints.size > 0) {
                this.updateConvexHull();
                this.isDirtyHull = true;
            }
            this.isDirtyLattice = true;
        } else if (parameterId === 'orbitColor' || parameterId === 'orbitPointSize' || 
                   parameterId === 'selectedPointColor' || parameterId === 'selectedPointSize' ||
                   parameterId === 'useMultiColorOrbits') {
            // Update orbit visuals
            this.isDirtyLattice = true;
        } else if (parameterId === 'hullFillColor' || parameterId === 'hullStrokeColor' ||
                   parameterId === 'hullOpacity') {
            // Update convex hull visuals
            this.isDirtyLattice = true;
        } else if (parameterId === 'maxSelectedPoints') {
            // If the maximum is reduced below current selection count, remove excess points
            const maxPoints = value;
            if (this.selectedPoints.size > maxPoints) {
                // Convert to array for easier slicing
                const pointEntries = Array.from(this.selectedPoints.entries());
                
                // Keep only the most recent 'maxPoints' entries
                const pointsToKeep = pointEntries.slice(-maxPoints);
                
                // Clear and rebuild the maps
                this.selectedPoints.clear();
                this.orbits.clear();
                
                // Add back the points to keep
                pointsToKeep.forEach(([key, point]) => {
                    this.selectedPoints.set(key, point);
                });
                
                // Recompute orbits for the remaining points
                this.computeAllOrbits();
                
                // Mark as dirty
                this.isDirtyLattice = true;
            }
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
        
        // Clean up orbit data
        this.selectedPoints.clear();
        this.orbits.clear();
        this.convexHull = [];
        
        this.latticeData = null;
        this.latticeGenerator = null;
        this.latticeRenderer = null;
        this.weylGroup = null;
        
        // Let the base class handle animation and event cleanup
        await super.unload();
    }
}
