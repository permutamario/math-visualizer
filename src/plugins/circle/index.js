// src/plugins/circle/index.js
// Circle visualization plugin

/**
 * Circle visualization plugin entry point
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initCirclePlugin(core) {
  const { hooks, state } = core;
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'circle', (visualizations) => {
    return [...visualizations, {
      id: 'circle',
      name: 'Circle Visualization',
      description: 'A sectioned circle visualization'
    }];
  });
  
  // Register render function
  hooks.addAction('render', 'circle', (ctx, canvas, settings) => {
    if (state.getState().activePluginId === 'circle') {
      renderCircle(ctx, canvas, settings);
    }
  });
  
  // Register UI controls
  hooks.addFilter('settingsMetadata', 'circle', (metadata) => {
    return {
      ...metadata,
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
        default: 1 
      }
    };
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'circle', (options) => {
    return [
      ...options,
      {
        id: 'export-png',
        label: 'Export PNG',
        type: 'export'
      },
      {
        id: 'reset-settings',
        label: 'Reset Settings',
        type: 'export'
      }
    ];
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'circle', (settings) => {
    return {
      ...settings,
      circleRadius: 100,
      circleColor: '#4285f4',
      circleOpacity: 1.0,
      circleSections: 1,
      backgroundColor: '#f5f5f5',
      showBorder: true,
      borderColor: '#000000',
      borderWidth: 2,
    };
  });
  
  // Handle animation - optional
  hooks.addAction('onSettingChanged', 'circle', ({ path, value }) => {
    // Custom logic when settings change
    console.log(`Circle plugin: Setting changed ${path} = ${value}`);
  });
}

/**
 * Render the circle visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 */
function renderCircle(ctx, canvas, settings) {
  // Get circle properties from settings
  const radius = settings.circleRadius || 100;
  const color = settings.circleColor || '#4285f4';
  const opacity = settings.circleOpacity || 1.0;
  const sections = settings.circleSections || 1;
  const showBorder = settings.showBorder !== undefined ? settings.showBorder : true;
  const borderColor = settings.borderColor || '#000000';
  const borderWidth = settings.borderWidth || 2;
  
  // Position in center of canvas
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  
  // Save the current context state
  ctx.save();
  
  // Move to the center position
  ctx.translate(x, y);
  
  // Set transparency
  ctx.globalAlpha = opacity;
  
  // Draw circle sections
  if (sections === 1) {
    // Simple circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
    ctx.fillStyle = color;
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
      
      // Generate alternating colors for sections
      let sectionColor;
      if (i % 2 === 0) {
        sectionColor = color;
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
        
        const rgb = hexToRgb(color);
        if (rgb) {
          // Darken by 20%
          const darken = c => Math.floor(c * 0.8);
          sectionColor = `rgb(${darken(rgb.r)}, ${darken(rgb.g)}, ${darken(rgb.b)})`;
        } else {
          sectionColor = color;
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
  
  // Restore the context state
  ctx.restore();
}
