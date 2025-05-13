// plugins/mirror-curve/interactionHandler.js

/**
 * Handle interaction with the grid
 * @param {Object} grid - The grid object
 * @param {Object} event - Interaction event
 * @param {Object} gridLayout - Grid layout information
 * @returns {Object|null} The line that was clicked, or null
 */
export function handleGridInteraction(grid, event, gridLayout) {
  if (!grid || !event || !gridLayout) {
    return null;
  }
  
  const { cellSize, offsetX, offsetY } = gridLayout;
  const gridX = (event.x - offsetX) / cellSize;
  const gridY = (event.y - offsetY) / cellSize;
  
  // Check if click is within grid boundaries
  if (gridX >= 0 && gridX <= grid.cols && 
      gridY >= 0 && gridY <= grid.rows) {
    
    // Find the closest grid line
    let closestLine = null;
    let minDistance = Infinity;
    
    for (const line of grid.gridLines.values()) {
      if (grid.isBoundaryGridLine(line)) {
        // Skip boundary lines
        continue;
      }
      
      let distance;
      if (line.type === 'horizontal') {
        // For horizontal lines, check distance to y=row
        const lineX1 = line.col * cellSize;
        const lineX2 = (line.col + 1) * cellSize;
        
        // Check if x is within the line segment
        if (gridX >= lineX1 / cellSize && gridX <= lineX2 / cellSize) {
          distance = Math.abs(gridY - line.row);
        } else {
          continue;
        }
      } else { // vertical
        // For vertical lines, check distance to x=col
        const lineY1 = line.row * cellSize;
        const lineY2 = (line.row + 1) * cellSize;
        
        // Check if y is within the line segment
        if (gridY >= lineY1 / cellSize && gridY <= lineY2 / cellSize) {
          distance = Math.abs(gridX - line.col);
        } else {
          continue;
        }
      }
      
      // Update closest line if this one is closer
      if (distance < minDistance) {
        minDistance = distance;
        closestLine = line;
      }
    }
    
    // Return the line if it's close enough
    if (closestLine && minDistance < 0.2) {
      return closestLine;
    }
  }
  
  return null;
}
