// plugins/mirror-curve/drawingUtils.js

import { getSplinePoints } from './spline.js';
import { Grid } from './grid.js';

/**
 * Calculate the midpoint of a grid line
 * @param {Object} gridLine - The grid line object
 * @param {number} cellSize - Size of a grid cell
 * @returns {Object} Point with x, y coordinates
 */
export function getGridLineMidpoint(gridLine, cellSize) {
  if (!gridLine) return { x: 0, y: 0 };
  
  if (gridLine.type === 'horizontal') {
    return {
      x: (gridLine.col + 0.5) * cellSize,
      y: gridLine.row * cellSize
    };
  } else { // vertical
    return {
      x: gridLine.col * cellSize,
      y: (gridLine.row + 0.5) * cellSize
    };
  }
}

/**
 * Calculate helper points for smooth curve drawing
 * @param {Object} curve - MirrorCurve object with gridLines and directions
 * @param {number} cellSize - Size of a grid cell
 * @returns {Array} Array of points with offsets for smoother curves
 */
export function calculateHelperPoints(curve, cellSize) {
  if (!curve || !curve.gridLines || !curve.directions) {
    return [];
  }
  
  // Offset distance (1/4 of cell size for better curves)
  const offset = cellSize / 4;
  
  return curve.gridLines.map((line, index) => {
    // Get the basic midpoint first
    const midpoint = getGridLineMidpoint(line, cellSize);
    
    // Get the direction for this segment
    const direction = curve.directions[index];
    
    // Apply offset based on direction and line type
    if (line.type === 'vertical') {
      if (direction === Grid.NE || direction === Grid.SE) { // East directions
        midpoint.x += offset;
      } else if (direction === Grid.NW || direction === Grid.SW) { // West directions
        midpoint.x -= offset;
      }
    } else { // horizontal
      if (direction === Grid.NW || direction === Grid.NE) { // North directions
        midpoint.y -= offset;
      } else if (direction === Grid.SW || direction === Grid.SE) { // South directions
        midpoint.y += offset;
      }
    }
    
    return midpoint;
  });
}

/**
 * Convert a curve to drawable points
 * @param {Object} curve - The curve object
 * @param {number} cellSize - Size of a grid cell
 * @param {Object} options - Drawing options
 * @param {boolean} options.useCurvedStyle - Whether to use curved style
 * @param {number} options.tension - Tension parameter for spline (0-1)
 * @param {number} options.subdivisions - Number of subdivisions for spline
 * @returns {Object} Object with points array and isClosed flag
 */
export function getCurvePoints(curve, cellSize, options = {}) {
  const { 
    useCurvedStyle = true, 
    tension = 0.5, 
    subdivisions = 10 
  } = options;
  
  let points = [];
  let isClosed = false;
  
  // Handle different curve formats
  if (!curve) {
    return { points, isClosed };
  }
  
  // Check if this is an animation path object
  if (curve.type === 'animationPath') {
    return {
      points: curve.points || [],
      isClosed: curve.isClosed || false
    };
  }
  
  // If this is a completed curve that already has points
  if (curve.curvedStyle && curve.points && Array.isArray(curve.points)) {
    return {
      points: curve.points,
      isClosed: curve.isClosed || false
    };
  }
  
  // If this is a MirrorCurve object with gridLines
  if (curve.gridLines && Array.isArray(curve.gridLines)) {
    isClosed = curve.isClosed || false;
    
    // Use curved style for completed curves if specified
    if (curve.isCompleted && useCurvedStyle) {
      // Calculate helper points with offsets
      const helperPoints = calculateHelperPoints(curve, cellSize);
      
      // Apply spline for smooth curves
      points = getSplinePoints(helperPoints, tension, subdivisions);
    } else {
      // Use regular midpoints for jagged style
      points = curve.gridLines.map(line => getGridLineMidpoint(line, cellSize));
    }
  }
  
  return { points, isClosed };
}

/**
 * Generate a partial path for animation
 * @param {Object} curve - The curve to animate
 * @param {number} cellSize - Size of a grid cell
 * @param {number} progress - Animation progress (0-1)
 * @param {Object} options - Drawing options
 * @returns {Object} Partial curve for animation
 */
export function getAnimationPath(curve, cellSize, progress, options = {}) {
  if (!curve || !curve.gridLines || progress < 0 || progress > 1) {
    return null;
  }
  
  // Get full path points
  const { points, isClosed } = getCurvePoints(curve, cellSize, options);
  
  if (points.length < 2) {
    return null;
  }
  
  // Calculate the number of points to show based on progress
  const pointCount = Math.max(2, Math.ceil(points.length * progress));
  const visiblePoints = points.slice(0, pointCount);
  
  // If we need a partial last segment
  if (pointCount < points.length && progress > 0) {
    const lastIdx = pointCount - 1;
    const nextIdx = Math.min(pointCount, points.length - 1);
    
    // Calculate the fractional progress within the current segment
    const segmentProgress = (progress * points.length) % 1;
    
    // Interpolate between the last visible point and the next point
    const lastPoint = points[lastIdx];
    const nextPoint = points[nextIdx];
    
    const interpPoint = {
      x: lastPoint.x + (nextPoint.x - lastPoint.x) * segmentProgress,
      y: lastPoint.y + (nextPoint.y - lastPoint.y) * segmentProgress
    };
    
    // Add the interpolated point
    visiblePoints.push(interpPoint);
  }
  
  return {
    type: 'animationPath',
    points: visiblePoints,
    isClosed: false, // Never closed during animation
    originalCurve: curve
  };
}

/**
 * Create a Konva line for a curve
 * @param {Object} curve - The curve object
 * @param {number} cellSize - Size of a grid cell
 * @param {Object} konva - Konva library reference
 * @param {Object} options - Drawing options
 * @returns {Object} Konva line object
 */
export function createKonvaLine(curve, cellSize, konva, options = {}) {
  const {
    color = '#3498db',
    strokeWidth = 3,
    useCurvedStyle = true,
    tension = 0.5
  } = options;
  
  // Get the points for the curve
  const { points, isClosed } = getCurvePoints(curve, cellSize, {
    useCurvedStyle,
    tension
  });
  
  if (points.length < 2) {
    return null;
  }
  
  // Convert points to flat array for Konva
  const flatPoints = [];
  points.forEach(point => {
    flatPoints.push(point.x, point.y);
  });
  
  // Create and return the Konva line
  return new konva.Line({
    points: flatPoints,
    stroke: color,
    strokeWidth: strokeWidth,
    lineCap: 'round',
    lineJoin: 'round',
    closed: isClosed
  });
}
