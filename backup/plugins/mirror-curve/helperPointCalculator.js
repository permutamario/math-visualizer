// plugins/mirror-curve/helperPointCalculator.js

/**
 * Calculate a helper point for a grid line with directional offset
 * @param {Object} line - The grid line object 
 * @param {number} direction - Direction value (0=NW, 1=NE, 2=SW, 3=SE)
 * @param {number} cellSize - Size of a grid cell
 * @returns {Object} - Point coordinates {x, y}
 */
export function findHelperPoint(line, direction, cellSize) {
  // Get the basic midpoint
  let x, y;
  if (line.type === 'horizontal') {
    x = (line.col + 0.5) * cellSize;
    y = line.row * cellSize;
  } else { // vertical
    x = line.col * cellSize;
    y = (line.row + 0.5) * cellSize;
  }
  
  // Only apply offset if the line is a mirror
  if (line.isMirror) {
    // Calculate offset distance
    const d = cellSize / 6;
    
    if (line.type === 'vertical') {
      if (direction === 1 || direction === 3) { // NE or SE
        x += d;
      } else if (direction === 0 || direction === 2) { // NW or SW
        x -= d;
      }
    } else { // horizontal
      if (direction === 0 || direction === 1) { // NW or NE
        y -= d;
      } else if (direction === 2 || direction === 3) { // SW or SE
        y += d;
      }
    }
  }
  
  return { x, y };
}

/**
 * Calculate helper points for all curves
 * @param {Array} curves - Array of curves
 * @param {number} cellSize - Cell size
 * @returns {Array} Array of helper points for each curve
 */
export function calculateAllHelperPoints(curves, cellSize) {
  const allHelperPoints = [];
  
  curves.forEach(curve => {
    if (curve.isCompleted && curve.gridLines && Array.isArray(curve.gridLines)) {
      const helperPointsForCurve = curve.gridLines.map((line, index) => {
        const direction = curve.directions[index];
        const point = findHelperPoint(line, direction, cellSize);
        return { ...point, curveIndex: allHelperPoints.length };
      });
      
      allHelperPoints.push(helperPointsForCurve);
    }
  });
  
  return allHelperPoints;
}
