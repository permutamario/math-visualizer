// plugins/mirror-curve/curveRenderer.js
import { getSplinePoints } from './spline.js';
import { findHelperPoint } from './helperPointCalculator.js';

export class CurveRenderer {
    constructor(konva) {
	this.konva = konva;
	this.styleSettings = {
	    lineStyles: {
		curve: { width: 3 },
		helperPoint: { radius: 4 }
	    }
	};
    }

    renderCurves(curves, group, options) {
	// Clear the group
	group.destroyChildren();
	
	const {
	    cellSize = 1,
	    curveColor = '#3498db',
	    curveStyle = 'curved',
	    tension = 0,
	    smooth = true,
	    showHelperPoints = false,
	    helperPointColor = '#ff0000',
	    animationPath = null,
	    helperPoints = []
	} = options;
	
	// Color scheme
	const colorScheme = [curveColor];
	
	// Draw completed curves
	curves.forEach((curve, idx) => {
	    const konvaCurve = this.createKonvaCurve(curve, idx, cellSize, colorScheme, {
		curveStyle, tension, smooth
	    });
	    
	    if (konvaCurve) {
		group.add(konvaCurve);
	    }
	});
	
	// Draw animation path if it exists
	if (animationPath) {
	    const animCurve = this.createKonvaCurve(
		animationPath, 
		curves.length, 
		cellSize, 
		colorScheme,
		{ curveStyle, tension, smooth }
	    );
	    
	    if (animCurve) {
		group.add(animCurve);
	    }
	}
	
	// Draw helper points if enabled
	if (showHelperPoints) {
	    const helperPointRadius = this.styleSettings.lineStyles.helperPoint.radius;
	    
	    // Add helper points for all curves
	    helperPoints.forEach(curvePoints => {
		curvePoints.forEach(point => {
		    const helperPoint = new this.konva.Circle({
			x: point.x,
			y: point.y,
			radius: helperPointRadius,
			fill: helperPointColor
		    });
		    
		    group.add(helperPoint);
		});
	    });
	}
    }

    createKonvaCurve(curve, idx, cellSize, colorScheme, options) {
	if (!curve) return null;
	
	const { 
	    curveStyle = 'curved', 
	    tension = 0, 
	    smooth = true 
	} = options;
	
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
	    if (curveStyle === 'curved') {
		// Calculate helper points with offsets for smooth curves
		const helperPointsForCurve = curve.gridLines.map((line, index) => {
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
	
	// Convert points to flat array for Konva
	const flatPoints = [];
	points.forEach(point => {
	    flatPoints.push(point.x, point.y);
	});
	
	// Create Konva line
	const curveWidth = this.styleSettings.lineStyles.curve.width;
	const color = colorScheme[idx % colorScheme.length];
	
	const konvaLine = new this.konva.Line({
	    points: flatPoints,
	    stroke: color,
	    strokeWidth: curveWidth,
	    lineCap: 'round',
	    lineJoin: 'round',
	    closed: isClosed
	});
	
	return konvaLine;
    }

    
createAnimationPathByDistance(curve, cellSize, distance, options = {}) {
    if (!curve || !curve.gridLines || curve.gridLines.length === 0) {
        return null;
    }
    
    const { 
        tension = 0.5,
        curveStyle = 'curved',
        smooth = true
    } = options;
    
    // Get all helper points for the full curve
    const allHelperPoints = curve.gridLines.map((line, index) => {
        const direction = curve.directions[index];
        return findHelperPoint(line, direction, cellSize);
    });
    
    // Generate the complete spline path
    const allSplinePoints = getSplinePoints(allHelperPoints, tension, 10);
    
    if (allSplinePoints.length < 2) {
        return { completed: true };
    }
    
    // Calculate the total path length and segment lengths
    let totalLength = 0;
    const segmentLengths = [];
    
    for (let i = 1; i < allSplinePoints.length; i++) {
        const dx = allSplinePoints[i].x - allSplinePoints[i-1].x;
        const dy = allSplinePoints[i].y - allSplinePoints[i-1].y;
        const segmentLength = Math.sqrt(dx*dx + dy*dy);
        
        segmentLengths.push(segmentLength);
        totalLength += segmentLength;
    }
    
    // If the curve has no real length, consider it completed
    if (totalLength < 0.001) {
        return { completed: true };
    }
    
    // Cap the distance at the total length
    const cappedDistance = Math.min(distance, totalLength);
    
    // Find up to which point we should draw
    let currentLength = 0;
    let segmentIndex = 0;
    
    // Find the segment where our current distance falls
    while (segmentIndex < segmentLengths.length && currentLength + segmentLengths[segmentIndex] < cappedDistance) {
        currentLength += segmentLengths[segmentIndex];
        segmentIndex++;
    }
    
    // Include all complete segments
    const visiblePoints = allSplinePoints.slice(0, segmentIndex + 1);
    
    // If we're not at the end, add the partial segment point
    if (segmentIndex < segmentLengths.length) {
        const remainingDistance = cappedDistance - currentLength;
        const segmentFraction = remainingDistance / segmentLengths[segmentIndex];
        
        const lastPoint = allSplinePoints[segmentIndex];
        const nextPoint = allSplinePoints[segmentIndex + 1];
        
        // Linear interpolation for the partial segment
        const interpPoint = {
            x: lastPoint.x + (nextPoint.x - lastPoint.x) * segmentFraction,
            y: lastPoint.y + (nextPoint.y - lastPoint.y) * segmentFraction
        };
        
        // Add the interpolated point
        visiblePoints.push(interpPoint);
    }
    
    // Check if animation is complete
    if (cappedDistance >= totalLength) {
        return { completed: true };
    }
    
    return {
        type: 'animationPath',
        points: visiblePoints,
        isClosed: false,
        completed: false,
        totalLength: totalLength // Store for reference
    };
}

    // Updated method for CurveRenderer class
    createAnimationPath(curve, cellSize, progress, maxProgress = 1.0, options = {}) {
	if (!curve || !curve.gridLines || curve.gridLines.length === 0) {
	    return null;
	}
	
	const { 
	    tension = 0.5,
	    curveStyle = 'curved',
	    smooth = true
	} = options;
	
	// Get all helper points for the full curve
	const allHelperPoints = curve.gridLines.map((line, index) => {
	    const direction = curve.directions[index];
	    return findHelperPoint(line, direction, cellSize);
	});
	
	// Generate the complete spline path with the user's tension parameter
	const allSplinePoints = getSplinePoints(allHelperPoints, tension, 10);
	
	// Calculate how many points to show based on animation progress
	const totalPoints = allSplinePoints.length;
	
	// Normalize the progress value
	const normalizedProgress = Math.min(1.0, progress / maxProgress);
	
	// Calculate the exact number of points to show, including partial points
	const exactPointCount = totalPoints * normalizedProgress;
	const wholePoints = Math.floor(exactPointCount);
	const fraction = exactPointCount - wholePoints;
	
	// Get the whole points to show
	let visiblePoints = allSplinePoints.slice(0, wholePoints);
	
	// Add the interpolated last point if we're not at the end
	if (fraction > 0 && wholePoints < totalPoints - 1) {
	    const lastPoint = allSplinePoints[wholePoints];
	    const nextPoint = allSplinePoints[wholePoints + 1];
	    
	    // Linear interpolation between the last whole point and the next point
	    const interpPoint = {
		x: lastPoint.x + (nextPoint.x - lastPoint.x) * fraction,
		y: lastPoint.y + (nextPoint.y - lastPoint.y) * fraction
	    };
	    
	    visiblePoints.push(interpPoint);
	}
	
	// Check if animation is complete
	if (normalizedProgress >= 1.0) {
	    return { completed: true };
	}
	
	return {
	    type: 'animationPath',
	    points: visiblePoints,
	    isClosed: false,
	    completed: false
	};
    }
}
