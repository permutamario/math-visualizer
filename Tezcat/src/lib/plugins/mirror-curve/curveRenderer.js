// plugins/mirror-curve/curveRenderer.js
import { getSplinePoints } from './spline.js';
import { findHelperPoint } from './helperPointCalculator.js';

/**
 * Calculate appropriate number of subdivisions based on grid size
 * @param {number} rows - Number of grid rows
 * @param {number} cols - Number of grid columns
 * @param {boolean} isAnimation - Whether this is for animation (needs fewer points)
 * @returns {number} Number of subdivisions to use
 */
function calculateSubdivisions(rows, cols, isAnimation = false) {
    // Calculate grid complexity
    const cellCount = rows * cols;
    
    // Base values
    const baseSubdivisions = 8;
    
    // For small grids (less than 25 cells), use more subdivisions
    if (cellCount <= 25) {
        return baseSubdivisions + 4;
    }
    
    // For medium grids (26-100 cells), use standard subdivisions
    if (cellCount <= 100) {
        return baseSubdivisions + 2;
    }
    
    // For large grids (101-400 cells), reduce subdivisions
    if (cellCount <= 400) {
        return Math.max(3, baseSubdivisions - 2);
    }
    
    // For very large grids (over 400 cells), use minimum subdivisions
    return Math.max(2, baseSubdivisions - 4);
}

export class CurveRenderer {
    constructor(konva) {
        this.konva = konva;
        this.styleSettings = {
            lineStyles: {
                curve: { width: 3 },
                helperPoint: { radius: 4 }
            }
        };
        
        // Cache for animation points to avoid recalculating full paths
        this.animationCache = new Map();
    }

    renderCurves(curves, group, options) {
        // Clear the group
        group.destroyChildren();
        
        const {
            cellSize = 1,
            colorScheme = ['#3498db'], 
            curveStyle = 'curved',
            tension = 0,
            smooth = true,
            showHelperPoints = false,
            helperPointColor = '#ff0000',
            animationPath = null,
            helperPoints = [],
            gridRows = 5,  // Add grid dimensions for dynamic subdivision
            gridCols = 5
        } = options;
        
        // Draw completed curves
        curves.forEach((curve, idx) => {
            const konvaCurve = this.createKonvaCurve(curve, idx, cellSize, colorScheme, {
                curveStyle, 
                tension, 
                smooth,
                gridRows,
                gridCols
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
                { 
                    curveStyle, 
                    tension, 
                    smooth,
                    gridRows,
                    gridCols
                }
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
            smooth = true,
            gridRows = 5,
            gridCols = 5
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
                
                // Calculate dynamic subdivision based on grid size
                const subdivisions = calculateSubdivisions(gridRows, gridCols, false);
                
                // Apply spline for smooth curves with dynamic subdivisions
                points = getSplinePoints(helperPointsForCurve, tension, subdivisions);
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
            smooth = true,
            gridRows = 5,  // Add grid dimensions for dynamic subdivision
            gridCols = 5
        } = options;
        
        // Create a unique key for this curve and settings combination
        const curveKey = `${curve.gridLines[0].id}-${tension}-${curveStyle}`;
        
        // Check if we already computed the full curve points
        let allSplinePoints = null;
        let totalLength = 0;
        let segmentLengths = [];
        
        if (this.animationCache.has(curveKey)) {
            // Use cached data
            const cachedData = this.animationCache.get(curveKey);
            allSplinePoints = cachedData.points;
            totalLength = cachedData.totalLength;
            segmentLengths = cachedData.segmentLengths;
        } else {
            // First time - calculate all points for the full curve
            
            // Calculate dynamic subdivision based on grid size
            const animSubdivisions = calculateSubdivisions(gridRows, gridCols, true);
            
            // Get all helper points for the full curve
            const allHelperPoints = curve.gridLines.map((line, index) => {
                const direction = curve.directions[index];
                return findHelperPoint(line, direction, cellSize);
            });
            
            // Generate the complete spline path with dynamic subdivisions
            allSplinePoints = getSplinePoints(allHelperPoints, tension, animSubdivisions);
            
            // Calculate total length and segment lengths
            totalLength = 0;
            segmentLengths = [];
            
            for (let i = 1; i < allSplinePoints.length; i++) {
                const dx = allSplinePoints[i].x - allSplinePoints[i-1].x;
                const dy = allSplinePoints[i].y - allSplinePoints[i-1].y;
                const segmentLength = Math.sqrt(dx*dx + dy*dy);
                
                segmentLengths.push(segmentLength);
                totalLength += segmentLength;
            }
            
            // Cache the results
            this.animationCache.set(curveKey, {
                points: allSplinePoints,
                totalLength,
                segmentLengths
            });
        }
        
        if (allSplinePoints.length < 2) {
            return { completed: true };
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

    // Clear animation cache when no longer needed
    clearCache() {
        this.animationCache.clear();
    }
    
    // Clear a specific curve from the cache
    clearCurveFromCache(curveId) {
        // Find and remove entries that start with this curve ID
        for (const key of this.animationCache.keys()) {
            if (key.startsWith(curveId)) {
                this.animationCache.delete(key);
            }
        }
    }
}
