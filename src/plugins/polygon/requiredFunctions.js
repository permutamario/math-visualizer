// src/plugins/polygon/requiredFunctions.js

// Shared state for the plugin
let interactiveState = {
  isHovered: false,
  isSelected: false,
  animationAngle: 0
};

/**
 * Main rendering function for the polygon visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 * @returns {boolean} - Whether rendering was handled
 */
export function renderVisualization(ctx, canvas, settings) {
  // Get polygon properties from settings
  const sides = Math.max(3, settings.sides || 5); // Minimum 3 sides
  const radius = settings.radius || 100;
  const baseColor = settings.polygonColor || '#4285f4';
  const opacity = settings.polygonOpacity || 1.0;
  const showBorder = settings.showBorder !== undefined ? settings.showBorder : true;
  const borderColor = settings.borderColor || '#000000';
  const borderWidth = settings.borderWidth || 2;
  const highlightColor = settings.highlightColor || '#ff5722';
  const rotation = settings.rotation || 0;
  
  // Apply animation angle if animating
  const totalRotation = (rotation + interactiveState.animationAngle) * (Math.PI / 180);
  
  // Position in center of canvas
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  
  // Save the current context state
  ctx.save();
  
  // Set transparency
  ctx.globalAlpha = opacity;
  
  // Determine polygon color based on state
  let polygonColor;
  if (interactiveState.isSelected) {
    polygonColor = highlightColor;
  } else if (interactiveState.isHovered) {
    // Create a light version of the highlight color
    const lightenColor = (hex, percent) => {
      const num = parseInt(hex.slice(1), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return `#${(1 << 24 | (R < 255 ? R : 255) << 16 | (G < 255 ? G : 255) << 8 | (B < 255 ? B : 255)).toString(16).slice(1)}`;
    };
    polygonColor = lightenColor(highlightColor, 30);
  } else {
    polygonColor = baseColor;
  }
  
  // Begin polygon path
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.rotate(totalRotation);
  
  // Calculate polygon vertices
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides;
    const vertexX = radius * Math.cos(angle);
    const vertexY = radius * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(vertexX, vertexY);
    } else {
      ctx.lineTo(vertexX, vertexY);
    }
  }
  
  ctx.closePath();
  
  // Fill polygon
  ctx.fillStyle = polygonColor;
  ctx.fill();
  
  // Draw border if enabled
  if (showBorder) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }
  
  // Draw instructions
  ctx.restore(); // Restore before drawing text
  
  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Click on the polygon to select it', canvas.width / 2, 30);
  
  // Draw status at the bottom
  if (interactiveState.isSelected) {
    ctx.fillText(`Selected a ${sides}-sided polygon`, canvas.width / 2, canvas.height - 20);
  }
  
  return true; // Indicate that rendering was handled
}

/**
 * Animation handler called before rendering
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 */
export function handleAnimation(ctx, canvas, settings) {
  if (settings.animation) {
    // Update rotation for animation
    interactiveState.animationAngle = (interactiveState.animationAngle + 0.5) % 360;
    
    // Request render update
    if (window.AppInstance && window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.render();
    }
  }
}

/**
 * Called when the plugin is activated
 */
export function onActivate() {
  console.log("Polygon plugin activated");
  
  // Reset interactive state
  interactiveState = {
    isHovered: false,
    isSelected: false,
    animationAngle: 0
  };
}

/**
 * Called when the plugin is deactivated
 */
export function onDeactivate() {
  console.log("Polygon plugin deactivated");
  
  // Cleanup if needed
}

/**
 * Handle setting changes
 * @param {string} path - Setting path that changed
 * @param {*} value - New value
 */
export function handleSettingChanged(path, value) {
  console.log(`Polygon plugin: Setting changed ${path} = ${value}`);
  
  // Specific handling for animation toggle if needed
  if (path === 'animation' && value === true) {
    // Animation was just turned on, could initialize animation state here
  }
}

/**
 * Check if a point is inside the polygon
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 * @returns {boolean} Whether the point is inside the polygon
 */
export function isPointInPolygon(x, y, canvas, settings) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = settings.radius || 100;
  
  // Calculate distance from center
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Simple circle check for now (approximation)
  return distance <= radius;
}
