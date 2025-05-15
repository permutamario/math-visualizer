// LatticeRenderer.js - Handles visualization of lattice points and hyperplanes using Konva

export class LatticeRenderer {
    constructor(konva) {
        this.konva = konva;
        this.pointsCache = new Map(); // Cache points for hover info
    }

    // Calculate view bounds for hyperplane extension
    calculateViewBounds(stage) {
        const scale = stage.scale().x;
        const position = stage.position();
        const width = stage.width();
        const height = stage.height();

        // Convert stage bounds to world coordinates
        return {
            minX: (-position.x) / scale,
            minY: (-position.y) / scale,
            maxX: (width - position.x) / scale,
            maxY: (height - position.y) / scale
        };
    }

    // Render lattice points
    renderLatticePoints(points, group, options) {
        const {
            pointSize = 5,
            originSize = 10,
            pointColor = 'blue',
            originColor = 'red',
            showPointInfo = false,
            zoomLevel = 1
        } = options;

        // Calculate zoom-adjusted sizes based on zoom level
        const zoomAdjustment = Math.max(0.5, Math.min(1.5, 1/Math.sqrt(zoomLevel)));
        const adjustedPointSize = pointSize * zoomAdjustment;
        const adjustedOriginSize = originSize * zoomAdjustment;

        // Clear old points from cache
        this.pointsCache.clear();

        // Create points
        points.forEach((point, index) => {
            const isOrigin = point[0] === 0 && point[1] === 0;
            const circle = new this.konva.Circle({
                x: point[0],
                y: point[1],
                radius: isOrigin ? adjustedOriginSize : adjustedPointSize,
                fill: isOrigin ? originColor : pointColor,
                stroke: isOrigin ? 'black' : null,
                strokeWidth: isOrigin ? 1 * zoomAdjustment : 0,
                id: `point_${index}`
            });

            group.add(circle);

            // Store point for hover info
            this.pointsCache.set(circle._id, {
                x: point[0],
                y: point[1],
                isOrigin
            });

            // Add hover info if enabled
            if (showPointInfo) {
                this.addHoverInfo(circle, group, point, zoomLevel);
            }
        });
    }

    // Add hover information to points
    addHoverInfo(circle, group, point, zoomLevel = 1) {
        // Create text label (hidden initially)
        const label = new this.konva.Text({
            text: `(${point[0].toFixed(2)}, ${point[1].toFixed(2)})`,
            fontFamily: 'Arial',
            fontSize: 12 * Math.max(0.8, 1/Math.sqrt(zoomLevel)), // Scale font with zoom
            padding: 5,
            fill: 'black',
            background: '#f0f0f0',
            visible: false,
            opacity: 0.9
        });

        group.add(label);

        // Set up hover events
        circle.on('mouseover', () => {
            label.position({
                x: circle.x() + 10,
                y: circle.y() - 20
            });
            label.visible(true);
            group.draw();
        });

        circle.on('mouseout', () => {
            label.visible(false);
            group.draw();
        });
    }

    // Render root vectors
    renderRoots(roots, group, options) {
        const {
            rootColor = 'green',
            rootLength = 50,
            rootWidth = 2,
            originX = 0,
            originY = 0,
            zoomLevel = 1,
            shortRoots = [],
            longRoots = []
        } = options;

        // Calculate zoom-adjusted sizes
        const zoomAdjustment = Math.max(0.5, Math.min(1.5, 1/Math.sqrt(zoomLevel)));
        const adjustedRootWidth = rootWidth * zoomAdjustment;
        // Arrow size adjustments
        const pointerSize = 10 * zoomAdjustment;

        // Create arrows for roots
        roots.forEach((root, index) => {
            // Normalize the root direction
            const rootMagnitude = Math.sqrt(root[0] * root[0] + root[1] * root[1]);
            const normalizedRoot = [
                root[0] / rootMagnitude,
                root[1] / rootMagnitude
            ];

            // Determine if this is a short or long root
            let isLongRoot = false;
            
            // Check if this root is in the longRoots array (for B2 and G2)
            if (longRoots.length > 0) {
                isLongRoot = longRoots.some(longRoot => 
                    Math.abs(longRoot[0] - root[0]) < 0.01 && 
                    Math.abs(longRoot[1] - root[1]) < 0.01
                );
            }
            
            // Use a different color for short vs long roots
            const thisRootColor = isLongRoot ? '#ff5500' : rootColor;
            
            // Use the actual length for relative scaling
            const actualLength = isLongRoot ? rootLength * 1.5 : rootLength;

            // Calculate endpoint based on normalized direction and length parameter
            //const endX = originX + normalizedRoot[0] * actualLength;
            //const endY = originY + normalizedRoot[1] * actualLength;
            const endX = originX + root[0]*50;
            const endY = originY + root[1]*50;

            // Create arrow
            const arrow = new this.konva.Arrow({
                points: [originX, originY, endX, endY],
                pointerLength: pointerSize,
                pointerWidth: pointerSize,
                fill: thisRootColor,
                stroke: thisRootColor,
                strokeWidth: adjustedRootWidth,
                id: `root_${index}`
            });

            // Add tooltip text showing root vector
            const tooltip = new this.konva.Text({
                text: `${isLongRoot ? 'Long' : 'Short'} Root: (${root[0].toFixed(2)}, ${root[1].toFixed(2)})`,
                fontFamily: 'Arial',
                fontSize: 12 * zoomAdjustment,
                fill: thisRootColor,
                x: endX + 5,
                y: endY + 5,
                visible: false,
                background: '#f0f0f066',
                padding: 3
            });

            // Add hover behavior
            arrow.on('mouseover', () => {
                arrow.strokeWidth(adjustedRootWidth * 1.5);
                tooltip.visible(true);
                group.draw();
            });

            arrow.on('mouseout', () => {
                arrow.strokeWidth(adjustedRootWidth);
                tooltip.visible(false);
                group.draw();
            });

            group.add(arrow);
            group.add(tooltip);
        });
    }

    // Render hyperplanes (reflection lines)
    renderHyperplanes(hyperplanes, group, options) {
        const {
            hyperplaneColor = 'rgba(100, 100, 100, 0.5)',
            hyperplaneWidth = 1,
            zoomLevel = 1
        } = options;

        // Calculate zoom-adjusted sizes
        const zoomAdjustment = Math.max(0.5, Math.min(1.5, 1/Math.sqrt(zoomLevel)));
        const adjustedLineWidth = hyperplaneWidth * zoomAdjustment;
        const fontSize = 10 * zoomAdjustment;
        
        // Adjust dash pattern based on zoom level for consistent appearance
        const dashSize = 5 * zoomAdjustment;
        const dashPattern = [dashSize, dashSize];

        // Create lines for hyperplanes
        hyperplanes.forEach((hyperplane, index) => {
            const [start, end] = hyperplane.line;
            const root = hyperplane.root;

            // Calculate normalized root (for display on hyperplane)
            const rootMagnitude = Math.sqrt(root[0] * root[0] + root[1] * root[1]);
            const normalizedRoot = [
                root[0] / rootMagnitude,
                root[1] / rootMagnitude
            ];

            const line = new this.konva.Line({
                points: [start[0], start[1], end[0], end[1]],
                stroke: hyperplaneColor,
                strokeWidth: adjustedLineWidth,
                opacity: 0.7,
                dash: dashPattern,
                id: `hyperplane_${index}`
            });

            // Create a small label for the hyperplane
            const midX = (start[0] + end[0]) / 2;
            const midY = (start[1] + end[1]) / 2;
            
            // Offset the label slightly from the line
            const labelOffset = 20 * zoomAdjustment;
            const labelX = midX + normalizedRoot[0] * labelOffset;
            const labelY = midY + normalizedRoot[1] * labelOffset;

            const label = new this.konva.Text({
                text: `⊥ (${root[0].toFixed(1)}, ${root[1].toFixed(1)})`,
                x: labelX,
                y: labelY,
                fontSize: fontSize,
                fill: hyperplaneColor,
                opacity: 0.8,
                visible: false,
                background: '#f0f0f066',
                padding: 3
            });

            // Add hover behavior
            line.on('mouseover', () => {
                line.opacity(1);
                line.strokeWidth(adjustedLineWidth * 2);
                label.visible(true);
                group.draw();
            });

            line.on('mouseout', () => {
                line.opacity(0.7);
                line.strokeWidth(adjustedLineWidth);
                label.visible(false);
                group.draw();
            });

            group.add(line);
            group.add(label);
        });
    }

    // Render the entire lattice
    renderLattice(latticeData, group, options) {
        const {
            latticePoints,
            roots,
            shortRoots = [],
            longRoots = [],
            hyperplanes,
            showRoots = true,
            showHyperplanes = true,
            zoomLevel = 1 // Current zoom level for adjustments
        } = latticeData;

        // Clear the group
        group.destroyChildren();

        // Render hyperplanes if enabled (draw first so they're behind other elements)
        if (showHyperplanes && hyperplanes) {
            this.renderHyperplanes(hyperplanes, group, { 
                ...options,
                zoomLevel
            });
        }

        // Render roots if enabled
        if (showRoots && roots) {
            this.renderRoots(roots, group, {
                ...options,
                zoomLevel,
                shortRoots,
                longRoots
            });
        }

        // Render lattice points (on top)
        if (latticePoints) {
            this.renderLatticePoints(latticePoints, group, {
                ...options,
                zoomLevel
            });
        }
    }
// New methods to add to LatticeRenderer.js (within the LatticeRenderer class)
// Add these methods to the existing LatticeRenderer class

/**
 * Render the orbit of a selected point
 * @param {Array<Array<number>>} orbit - Array of orbit points
 * @param {Object} group - Konva group to add the orbit to
 * @param {Object} options - Rendering options
 * @returns {Object} The orbit group
 */
renderOrbit(orbit, group, options) {
    const {
        orbitPointColor = '#9c27b0', // Default purple color
        orbitPointSize = 8,
        orbitPointBorderColor = 'white',
        orbitPointBorderWidth = 2,
        zoomLevel = 1
    } = options;
    
    // Calculate zoom-adjusted sizes
    const zoomAdjustment = Math.max(0.5, Math.min(1.5, 1/Math.sqrt(zoomLevel)));
    const adjustedPointSize = orbitPointSize * zoomAdjustment;
    const adjustedBorderWidth = orbitPointBorderWidth * zoomAdjustment;
    
    // Create a group for orbit points
    const orbitGroup = new this.konva.Group({
        id: 'orbit_group'
    });
    
    // Create points for each orbit element
    orbit.forEach((point, index) => {
        const circle = new this.konva.Circle({
            x: point[0],
            y: point[1],
            radius: adjustedPointSize,
            fill: orbitPointColor,
            stroke: orbitPointBorderColor,
            strokeWidth: adjustedBorderWidth,
            id: `orbit_point_${index}`
        });
        
        // Add a pulsing animation to make orbit points stand out
        const pulseAnimation = new this.konva.Animation((frame) => {
            if (!frame) return;
            // Pulse with a 1-second period
            const scale = 1 + 0.1 * Math.sin(frame.time * 0.002);
            circle.radius(adjustedPointSize * scale);
        }, orbitGroup);
        
        // Start the animation
        pulseAnimation.start();
        
        orbitGroup.add(circle);
    });
    
    group.add(orbitGroup);
    return orbitGroup;
}

/**
 * Highlight the selected point
 * @param {Array<number>} point - The selected point coordinates
 * @param {Object} group - Konva group to add the highlight to
 * @param {Object} options - Rendering options
 * @returns {Object} The highlight object
 */
highlightSelectedPoint(point, group, options) {
    const {
        selectedPointColor = '#ffeb3b', // Default yellow color
        selectedPointSize = 10,
        selectedPointBorderColor = 'black',
        selectedPointBorderWidth = 2,
        zoomLevel = 1
    } = options;
    
    // Calculate zoom-adjusted sizes
    const zoomAdjustment = Math.max(0.5, Math.min(1.5, 1/Math.sqrt(zoomLevel)));
    const adjustedPointSize = selectedPointSize * zoomAdjustment;
    const adjustedBorderWidth = selectedPointBorderWidth * zoomAdjustment;
    
    // Remove any existing selection
    const existingSelection = group.findOne('#selected_point');
    if (existingSelection) {
        existingSelection.destroy();
    }
    
    // Create the highlighted point with a double circle effect
    const outerCircle = new this.konva.Circle({
        x: point[0],
        y: point[1],
        radius: adjustedPointSize + 2 * adjustedBorderWidth,
        fill: selectedPointBorderColor,
        id: 'selected_point_outer'
    });
    
    const innerCircle = new this.konva.Circle({
        x: point[0],
        y: point[1],
        radius: adjustedPointSize,
        fill: selectedPointColor,
        id: 'selected_point'
    });
    
    // Create a selection group
    const selectionGroup = new this.konva.Group({
        id: 'selection_group'
    });
    
    // Add pulsing effect to selection
    const pulseAnimation = new this.konva.Animation((frame) => {
        if (!frame) return;
        // Pulse with a 1-second period, slightly faster than orbit points
        const scale = 1 + 0.15 * Math.sin(frame.time * 0.003);
        outerCircle.radius((adjustedPointSize + 2 * adjustedBorderWidth) * scale);
        innerCircle.radius(adjustedPointSize * scale);
    }, selectionGroup);
    
    // Add circles to group
    selectionGroup.add(outerCircle);
    selectionGroup.add(innerCircle);
    
    // Add to main group
    group.add(selectionGroup);
    
    // Start animation
    pulseAnimation.start();
    
    return selectionGroup;
}
}
