// src/plugins/circle/index.js
// Circle visualization plugin with event handling

/**
 * Circle visualization plugin entry point
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initCirclePlugin(core) {
  const { hooks, state } = core;
  
  console.log("Initializing Circle plugin");
  
  // Store interactive state
  let interactiveState = {
    hoveredSection: null,
    selectedSection: null,
    rotation: 0,
    isAnimating: false
  };
  
  // Define settings metadata
  const circleSettingsMetadata = {
    // Visual settings
    backgroundColor: { 
      type: 'visual', 
      label: 'Background Color', 
      control: 'color', 
      default: '#f5f5f5' 
    },
    circleColor: { 
      type: 'visual', 
      label: 'Circle Color', 
      control: 'color', 
      default: '#4285f4' 
    },
    circleOpacity: { 
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
    circleRadius: { 
      type: 'structural', 
      label: 'Radius', 
      control: 'slider', 
      min: 10, 
      max: 300, 
      step: 1, 
      default: 100 
    },
    circleSections: { 
      type: 'structural', 
      label: 'Sections', 
      control: 'slider', 
      min: 1, 
      max: 16, 
      step: 1, 
      default: 4 
    },
    animation: {
      type: 'structural',
      label: 'Auto Rotate',
      control: 'checkbox',
      default: false
    }
  };
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'circle', (visualizations) => {
    return [...visualizations, {
      id: 'circle',
      name: 'Circle Visualization',
      description: 'A sectioned circle visualization with interaction'
    }];
  });
  
  // Register render function
  hooks.addAction('render', 'circle', (ctx, canvas, settings) => {
    if (state.getState().activePluginId === 'circle') {
      renderCircle(ctx, canvas, settings, interactiveState);
      return true; // Indicate that rendering was handled
    }
    return false;
  });
  
  // Register UI controls
  hooks.addFilter('settingsMetadata', 'circle', (metadata) => {
    return circleSettingsMetadata;
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'circle', (options) => {
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
  hooks.addAction('exportAction', 'circle', (actionId) => {
    if (actionId === 'toggle-animation') {
      const currentSettings = state.getState().settings;
      window.changeState('settings.animation', !currentSettings.animation);
      return true; // Action was handled
    }
    return false;
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'circle', (settings) => {
    return {
      circleRadius: 100,
      circleColor: '#4285f4',
      circleOpacity: 1.0,
      circleSections: 4,
      backgroundColor: '#f5f5f5',
      showBorder: true,
      borderColor: '#000000',
      borderWidth: 2,
      highlightColor: '#ff5722',
      animation: false
    };
  });
  
  // Animation handler
  hooks.addAction('beforeRender', 'circle', (ctx, canvas, settings) => {
    if (settings.animation && state.getState().activePluginId === 'circle') {
      // Update rotation for animation
      interactiveState.rotation = (interactiveState.rotation + 0.5) % 360;
      
      // Request render update
      if (window.AppInstance && window.AppInstance.canvasManager) {
        window.AppInstance.canvasManager.render();
      }
    }
  });
  
  // Handle mouse move for hover effects
  hooks.addAction('onMouseMove', 'circle', (event) => {
    if (state.getState().activePluginId !== 'circle') return false;
    
    const { x, y } = event;
    const canvas = event.canvas;
    const settings = state.getState().settings;
    
    // Find which section is being hovered
    const hoveredSection = findSectionAtPosition(x, y, canvas, settings);
    
    // Only update state and re-render if hover state changed
    if (hoveredSection !== interactiveState.hoveredSection) {
      interactiveState.hoveredSection = hoveredSection;
      
      // Request render update
      if (window.AppInstance && window.AppInstance.canvasManager) {
        window.AppInstance.canvasManager.render();
      }
    }
    
    return true; // Event was handled
  });
  
  // Handle mouse click for selection
  hooks.addAction('onClick', 'circle', (event) => {
    if (state.getState().activePluginId !== 'circle') return false;
    
    const { x, y } = event;
    const canvas = event.canvas;
    const settings = state.getState().settings;
    
    // Find which section was clicked
    const clickedSection = findSectionAtPosition(x, y, canvas, settings);
    
    // Update selected section
    interactiveState.selectedSection = clickedSection;
    
    // Request render update
    if (window.AppInstance && window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.render();
    }
    
    return true; // Event was handled
  });
  
  /**
   * Find which section contains the given position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Object} settings - Current settings
   * @returns {number|null} Section index or null if not over any section
   */
  function findSectionAtPosition(x, y, canvas, settings) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = settings.circleRadius || 100;
    const sections = settings.circleSections || 1;
    
    // Calculate distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If outside circle, return null
    if (distance > radius) {
      return null;
    }
    
    // If only one section or inside inner circle, return 0
    if (sections === 1) {
      return 0;
    }
    
    // Calculate angle in radians (adjusted for rotation)
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += Math.PI * 2; // Convert to 0-2π range
    
    // Adjust for rotation
    angle = (angle - (interactiveState.rotation * Math.PI / 180)) % (Math.PI * 2);
    if (angle < 0) angle += Math.PI * 2;
    
    // Calculate section index
    const anglePerSection = (Math.PI * 2) / sections;
    const sectionIndex = Math.floor(angle / anglePerSection);
    
    return sectionIndex;
  }
  
  console.log("Circle plugin initialized");
}

/**
 * Render the circle visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 * @param {Object} interactiveState - Interactive state
 */
function renderCircle(ctx, canvas, settings, interactiveState) {
  // Get circle properties from settings
  const radius = settings.circleRadius || 100;
  const baseColor = settings.circleColor || '#4285f4';
  const opacity = settings.circleOpacity || 1.0;
  const sections = settings.circleSections || 1;
  const showBorder = settings.showBorder !== undefined ? settings.showBorder : true;
  const borderColor = settings.borderColor || '#000000';
  const borderWidth = settings.borderWidth || 2;
  const highlightColor = settings.highlightColor || '#ff5722';
  
  // Position in center of canvas
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  
  // Save the current context state
  ctx.save();
  
  // Move to the center position and apply rotation
  ctx.translate(x, y);
  ctx.rotate((interactiveState.rotation * Math.PI) / 180);
  
  // Set transparency
  ctx.globalAlpha = opacity;
  
  // Draw circle sections
  if (sections === 1) {
    // Simple circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
    ctx.fillStyle = baseColor;
    ctx.fill();
    
    // Draw border if enabled
    if (showBorder) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
    }
  } else {
    // Draw sections
    const anglePerSection = (Math.PI * 2) / sections;
    
    for (let i = 0; i < sections; i++) {
      // Calculate start and end angles
      const startAngle = i * anglePerSection;
      const endAngle = (i + 1) * anglePerSection;
      
      // Generate section color
      let sectionColor;
      
      // Handle selection and hover states
      if (i === interactiveState.selectedSection) {
        sectionColor = highlightColor;
      } else if (i === interactiveState.hoveredSection) {
        // Create a light version of the highlight color
        const lightenColor = (hex, percent) => {
          const num = parseInt(hex.slice(1), 16);
          const amt = Math.round(2.55 * percent);
          const R = (num >> 16) + amt;
          const G = (num >> 8 & 0x00FF) + amt;
          const B = (num & 0x0000FF) + amt;
          return `#${(1 << 24 | (R < 255 ? R : 255) << 16 | (G < 255 ? G : 255) << 8 | (B < 255 ? B : 255)).toString(16).slice(1)}`;
        };
        sectionColor = lightenColor(highlightColor, 30);
      } else {
        // Alternate colors for basic sections
        if (i % 2 === 0) {
          sectionColor = baseColor;
        } else {
          // Create alternating color by adjusting brightness
          const hexToRgb = hex => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : null;
          };
          
          const rgb = hexToRgb(baseColor);
          if (rgb) {
            // Darken by 20%
            const darken = c => Math.floor(c * 0.8);
            sectionColor = `rgb(${darken(rgb.r)}, ${darken(rgb.g)}, ${darken(rgb.b)})`;
          } else {
            sectionColor = baseColor;
          }
        }
      }
      
      // Draw the section
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle, false);
      ctx.closePath();
      
      ctx.fillStyle = sectionColor;
      ctx.fill();
      
      // Draw border if enabled
      if (showBorder) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.stroke();
      }
    }
  }
  
  // Draw instructions
  ctx.restore(); // Restore before drawing text
  
  ctx.fillStyle = '#333';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  
  if (sections > 1) {
    ctx.fillText('Click on a section to select it', canvas.width / 2, 30);
    
    // Draw status at the bottom
    if (interactiveState.selectedSection !== null) {
      ctx.fillText(`Selected section: ${interactiveState.selectedSection + 1}`, canvas.width / 2, canvas.height - 20);
    }
  }
}
