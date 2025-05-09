// src/plugins/square/index.js
// Square visualization plugin

/**
 * Square visualization plugin entry point
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initSquarePlugin(core) {
  const { hooks, state } = core;
  
  //console.log("Initializing Square plugin");
  
  // Define settings metadata - ONLY for this plugin
  const squareSettingsMetadata = {
    // Visual settings
    backgroundColor: { 
      type: 'visual', 
      label: 'Background Color', 
      control: 'color', 
      default: '#f5f5f5' 
    },
    squareColor: { 
      type: 'visual', 
      label: 'Square Color', 
      control: 'color', 
      default: '#156289' 
    },
    squareOpacity: { 
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
    squareSize: { 
      type: 'structural', 
      label: 'Size', 
      control: 'slider', 
      min: 10, 
      max: 300, 
      step: 1, 
      default: 100 
    },
    squareRotation: { 
      type: 'structural', 
      label: 'Rotation', 
      control: 'slider', 
      min: 0, 
      max: 360, 
      step: 1, 
      default: 0 
    }
  };
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'square', (visualizations) => {
    return [...visualizations, {
      id: 'square',
      name: 'Square Visualization',
      description: 'A simple square visualization'
    }];
  });
  
  // Register render function
  hooks.addAction('render', 'square', (ctx, canvas, settings) => {
    // Return true to indicate the plugin handled rendering
    renderSquare(ctx, canvas, settings);
    return true;
  });
  
  // Register UI controls
  hooks.addFilter('settingsMetadata', 'square', (metadata) => {
    //console.log("Square plugin providing settings metadata");
    // Return ONLY this plugin's metadata
    return squareSettingsMetadata;
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'square', (options) => {
    // Return ONLY this plugin's export options
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
      }
    ];
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'square', (settings) => {
    // Return ONLY this plugin's default settings
    return {
      squareSize: 100,
      squareColor: '#156289',
      squareOpacity: 1.0,
      squareRotation: 0,
      backgroundColor: '#f5f5f5',
      showBorder: true,
      borderColor: '#000000',
      borderWidth: 2,
    };
  });
  
  // Handle setting changes
  hooks.addAction('onSettingChanged', 'square', ({ path, value }) => {
    //console.log(`Square plugin: Setting changed ${path} = ${value}`);
  });
  
  // Register activation handler
  hooks.addAction('activatePlugin', 'square', ({ pluginId }) => {
    if (pluginId === 'square') {
      //console.log("Square plugin activated");
    }
  });
  
  // Register deactivation handler
  hooks.addAction('deactivatePlugin', 'square', ({ pluginId }) => {
    if (pluginId === 'square') {
      //console.log("Square plugin deactivated");
    }
  });
  
  // Handle animation - register with beforeRender hook
  hooks.addAction('beforeRender', 'square', (ctx, canvas, settings) => {
    // Let's add some simple animation for demonstration
    if (settings.animation && state.getState().activePluginId === 'square') {
      // Update rotation for animation
      const currentRotation = settings.squareRotation || 0;
      const newRotation = (currentRotation + 0.5) % 360;
      window.changeState('settings.squareRotation', newRotation);
    }
  });
  
  //console.log("Square plugin initialized");
}

/**
 * Render the square visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 */
function renderSquare(ctx, canvas, settings) {
  // Get square properties from settings
  const size = settings.squareSize || 100;
  const color = settings.squareColor || '#156289';
  const opacity = settings.squareOpacity || 1.0;
  const rotation = settings.squareRotation || 0;
  const showBorder = settings.showBorder !== undefined ? settings.showBorder : true;
  const borderColor = settings.borderColor || '#000000';
  const borderWidth = settings.borderWidth || 2;
  
  // Position in center of canvas (already transformed by camera in 2d-camera environment)
  const x = 0;
  const y = 0;
  
  // Save the current context state
  ctx.save();
  
  // Rotate the square if needed (convert degrees to radians)
  if (rotation) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  
  // Set transparency
  ctx.globalAlpha = opacity;
  
  // Draw the square (centered at 0,0)
  ctx.fillStyle = color;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  
  // Draw border if enabled
  if (showBorder) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(-size / 2, -size / 2, size, size);
  }
  
  // Restore the context state
  ctx.restore();
}
