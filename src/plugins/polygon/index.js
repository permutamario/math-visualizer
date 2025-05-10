// src/plugins/polygon/index.js
// Polygon visualization plugin - draws regular polygons with a configurable number of sides

/**
 * Polygon visualization plugin entry point
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initPolygonPlugin(core) {
  const { hooks, state } = core;
  
  console.log("Initializing Polygon plugin");
  
  // Store interactive state for hover effects and selection
  let interactiveState = {
    isHovered: false,
    isSelected: false,
    animationAngle: 0
  };
  
  // Define settings metadata - ONLY for this plugin
  const polygonSettingsMetadata = {
    // Visual settings
    backgroundColor: { 
      type: 'visual', 
      label: 'Background Color', 
      control: 'color', 
      default: '#f5f5f5' 
    },
    polygonColor: { 
      type: 'visual', 
      label: 'Polygon Color', 
      control: 'color', 
      default: '#4285f4' 
    },
    polygonOpacity: { 
      type: 'visual', 
      label: 'Opacity', 
      control: 'slider', 
      min: 0, 
      max: 1, 
      step: 0.01, 
      default: 1.0 
    },
    showBorder: { 
      type: 'visual', 
      label: 'Show Border', 
      control: 'checkbox', 
      default: true 
    },
    borderColor: { 
      type: 'visual', 
      label: 'Border Color', 
      control: 'color', 
      default: '#000000' 
    },
    borderWidth: { 
      type: 'visual', 
      label: 'Border Width', 
      control: 'number', 
      min: 0, 
      max: 20, 
      step: 1, 
      default: 2 
    },
    highlightColor: {
      type: 'visual',
      label: 'Highlight Color',
      control: 'color',
      default: '#ff5722'
    },
    
    // Structural settings
    sides: { 
      type: 'structural', 
      label: 'Number of Sides', 
      control: 'slider', 
      min: 3, 
      max: 20, 
      step: 1, 
      default: 5
    },
    radius: { 
      type: 'structural', 
      label: 'Radius', 
      control: 'slider', 
      min: 10, 
      max: 300, 
      step: 1, 
      default: 100 
    },
    rotation: { 
      type: 'structural', 
      label: 'Rotation (degrees)', 
      control: 'slider', 
      min: 0, 
      max: 360, 
      step: 1, 
      default: 0 
    },
    animation: {
      type: 'structural',
      label: 'Auto Rotate',
      control: 'checkbox',
      default: false
    }
  };
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'polygon', (visualizations) => {
    return [...visualizations, {
      id: 'polygon',
      name: 'Polygon Visualization',
      description: 'A customizable regular polygon visualization'
    }];
  });
  
  // Register render function
  hooks.addAction('render', 'polygon', (ctx, canvas, settings) => {
    if (state.getState().activePluginId === 'polygon') {
      renderPolygon(ctx, canvas, settings, interactiveState);
      return true; // Indicate that rendering was handled
    }
    return false;
  });
  
  // Register UI controls
  hooks.addFilter('settingsMetadata', 'polygon', (metadata) => {
    return polygonSettingsMetadata;
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'polygon', (options) => {
    return [
      {
        id: 'export-png',
        label: 'Export PNG',
        type: 'export'
      },
      {
        id: 'reset-settings',
        label: 'Reset Settings',
        type: 'export'
      },
      {
        id: 'toggle-animation',
        label: 'Toggle Animation',
        type: 'action'
      }
    ];
  });
  
  // Handle export actions
  hooks.addAction('exportAction', 'polygon', (actionId) => {
    if (actionId === 'toggle-animation') {
      const currentSettings = state.getState().settings;
      window.changeState('settings.animation', !currentSettings.animation);
      return true; // Action was handled
    }
    return false;
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'polygon', (settings) => {
    return {
      sides: 5,
      radius: 100,
      rotation: 0,
      polygonColor: '#4285f4',
      polygonOpacity: 1.0,
      backgroundColor: '#f5f5f5',
      showBorder: true,
      borderColor: '#000000',
      borderWidth: 2,
      highlightColor: '#ff5722',
      animation: false
    };
  });
  
  // Animation handler
  hooks.addAction('beforeRender', 'polygon', (ctx, canvas, settings) => {
    if (settings.animation && state.getState().activePluginId === 'polygon') {
      // Update rotation for animation
      interactiveState.animationAngle = (interactiveState.animationAngle + 0.5) % 360;
      
      // Request render update
      if (window.AppInstance && window.AppInstance.canvasManager) {
        window.AppInstance.canvasManager.render();
      }
    }
  });
  
  // Handle mouse move for hover effects
  hooks.addAction('onMouseMove', 'polygon', (event) => {
    if (state.getState().activePluginId !== 'polygon') return false;
    
    const { x, y } = event;
    const canvas = event.canvas;
    const settings = state.getState().settings;
    
    // Check if mouse is over the polygon
    const wasHovered = interactiveState.isHovered;
    interactiveState.isHovered = isPointInPolygon(x, y, canvas, settings);
    
    // Only update state and re-render if hover state changed
    if (wasHovered !== interactiveState.isHovered) {
      // Request render update
      if (window.AppInstance && window.AppInstance.canvasManager) {
        window.AppInstance.canvasManager.render();
      }
    }
    
    return true; // Event was handled
  });
  
  // Handle click for selection
  hooks.addAction('onClick', 'polygon', (event) => {
    if (state.getState().activePluginId !== 'polygon') return false;
    
    const { x, y } = event;
    const canvas = event.canvas;
    const settings = state.getState().settings;
    
    // Check if click is on the polygon
    if (isPointInPolygon(x, y, canvas, settings)) {
      interactiveState.isSelected = !interactiveState.isSelected;
      
      // Request render update
      if (window.AppInstance && window.AppInstance.canvasManager) {
        window.AppInstance.canvasManager.render();
      }
    } else {
      // If clicked outside and polygon was selected, unselect it
      if (interactiveState.isSelected) {
        interactiveState.isSelected = false;
        
        // Request render update
        if (window.AppInstance && window.AppInstance.canvasManager) {
          window.AppInstance.canvasManager.render();
        }
      }
    }
    
    return true; // Event was handled
  });
  
  console.log("Polygon plugin initialized");
}

/**
 * Check if a point is inside the polygon
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 * @returns {boolean} Whether the point is inside the polygon
 */
function isPointInPolygon(x, y, canvas, settings) {
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

/**
 * Render the polygon visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 * @param {Object} interactiveState - Interactive state
 */
function renderPolygon(ctx, canvas, settings, interactiveState) {
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
}
