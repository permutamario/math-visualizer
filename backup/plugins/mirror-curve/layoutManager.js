// plugins/mirror-curve/layoutManager.js

/**
 * Calculate grid layout based on stage dimensions
 * @param {number} stageWidth - Width of the stage
 * @param {number} stageHeight - Height of the stage
 * @param {number} rows - Number of grid rows
 * @param {number} cols - Number of grid columns
 * @returns {Object} Layout parameters
 */
export function calculateGridLayout(stageWidth, stageHeight, rows, cols) {
  // Calculate padding
  const padding = Math.min(stageWidth, stageHeight) * 0.05;
  
  // Calculate drawable area
  const drawableWidth = stageWidth - (padding * 2);
  const drawableHeight = stageHeight - (padding * 2);
  
  // Calculate cell size to maintain square cells
  const cellSize = Math.min(
    drawableWidth / cols,
    drawableHeight / rows
  );
  
  // Calculate centering offsets
  const offsetX = padding + (drawableWidth - (cellSize * cols)) / 2;
  const offsetY = padding + (drawableHeight - (cellSize * rows)) / 2;
  
  return {
    cellSize,
    offsetX,
    offsetY,
    padding,
    drawableWidth,
    drawableHeight,
    gridRows: rows,
    gridCols: cols
  };
}

/**
 * Apply layout transformations to Konva groups
 * @param {Object} gridGroup - Konva group for the grid
 * @param {Object} curveGroup - Konva group for the curves
 * @param {Object} layout - Layout parameters
 */
export function applyLayout(gridGroup, curveGroup, layout) {
  const { offsetX, offsetY } = layout;
  
  // Position grid group
  gridGroup.position({
    x: offsetX,
    y: offsetY
  });
  
  // Position curve group to match grid
  curveGroup.position({
    x: offsetX,
    y: offsetY
  });
}
