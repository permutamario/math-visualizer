// src/plugins/cube/index.js
// A 3D cube visualization plugin

/**
 * Plugin entry point
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initCubePlugin(core) {
  const { hooks, state } = core;
  
  console.log("Initializing Cube Plugin");
  
  // Define settings metadata
  const cubeSettingsMetadata = {
    // Visual settings
    cubeColor: { 
      type: 'visual', 
      label: 'Cube Color', 
      control: 'color', 
      default: '#3498db' 
    },
    opacity: { 
      type: 'visual', 
      label: 'Opacity', 
      control: 'slider', 
      min: 0, 
      max: 1, 
      step: 0.01, 
      default: 1.0 
    },
    wireframe: { 
      type: 'visual', 
      label: 'Show Wireframe', 
      control: 'checkbox', 
      default: true 
    },
    wireframeColor: { 
      type: 'visual', 
      label: 'Wireframe Color', 
      control: 'color', 
      default: '#000000' 
    },
    
    // Structural settings
    cubeSize: { 
      type: 'structural', 
      label: 'Size', 
      control: 'slider', 
      min: 10, 
      max: 500, 
      step: 1, 
      default: 100 
    },
    rotation: { 
      type: 'structural', 
      label: 'Auto Rotation', 
      control: 'checkbox', 
      default: true 
    }
  };
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'cubePlugin', (visualizations) => {
    return [...visualizations, {
      id: 'cube',
      name: 'Cube Visualization',
      description: '3D Cube with camera controls'
    }];
  });
  
  // Register render function
  hooks.addAction('render', 'cubePlugin', (ctx, canvas, settings) => {
    renderCubeVisualization(ctx, canvas, settings);
    return true; // Indicate we handled the rendering
  });
  
  // Register UI controls
  hooks.addFilter('settingsMetadata', 'cubePlugin', (metadata) => {
    return cubeSettingsMetadata;
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'cubePlugin', (options) => {
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
  hooks.addFilter('defaultSettings', 'cubePlugin', (settings) => {
    return {
      cubeSize: 100,
      cubeColor: '#3498db',
      opacity: 1.0,
      wireframe: true,
      wireframeColor: '#000000',
      rotation: true,
      backgroundColor: '#f5f5f5'
    };
  });
  
  // Handle setting changes
  hooks.addAction('onSettingChanged', 'cubePlugin', ({ path, value }) => {
    console.log(`Cube Plugin: Setting changed ${path} = ${value}`);
  });
  
  // Register activation handler
  hooks.addAction('activatePlugin', 'cubePlugin', ({ pluginId }) => {
    if (pluginId === 'cube') {
      console.log("Cube Plugin activated");
    }
  });
  
  // Register deactivation handler
  hooks.addAction('deactivatePlugin', 'cubePlugin', ({ pluginId }) => {
    if (pluginId === 'cube') {
      console.log("Cube Plugin deactivated");
    }
  });
  
  console.log("Cube Plugin initialized");
}

/**
 * Render cube visualization (placeholder for now)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 */
function renderCubeVisualization(ctx, canvas, settings) {
  // For now, just render a cube-like shape in 2D
  // In a real implementation with THREE.js, this would create a 3D cube
  
  // Get properties from settings
  const size = settings.cubeSize || 100;
  const color = settings.cubeColor || '#3498db';
  const opacity = settings.opacity || 1.0;
  const showWireframe = settings.wireframe !== undefined ? settings.wireframe : true;
  const wireframeColor = settings.wireframeColor || '#000000';
  
  // Position in center of canvas
  const x = canvas.width / 2;
  const y = canvas.height / 2;
  
  // Cube perspective (simple isometric)
  const frontFace = [
    { x: -size/2, y: -size/2 },
    { x: size/2, y: -size/2 },
    { x: size/2, y: size/2 },
    { x: -size/2, y: size/2 }
  ];
  
  const backFace = frontFace.map(point => ({
    x: point.x - size/4,
    y: point.y - size/4
  }));
  
  // Save context
  ctx.save();
  
  // Set transparency
  ctx.globalAlpha = opacity;
  
  // Apply translation to center
  ctx.translate(x, y);
  
  // Draw front face
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(frontFace[0].x, frontFace[0].y);
  ctx.lineTo(frontFace[1].x, frontFace[1].y);
  ctx.lineTo(frontFace[2].x, frontFace[2].y);
  ctx.lineTo(frontFace[3].x, frontFace[3].y);
  ctx.closePath();
  ctx.fill();
  
  if (showWireframe) {
    ctx.strokeStyle = wireframeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Draw back face
  ctx.fillStyle = shadeColor(color, -20); // Slightly darker
  ctx.beginPath();
  ctx.moveTo(backFace[0].x, backFace[0].y);
  ctx.lineTo(backFace[1].x, backFace[1].y);
  ctx.lineTo(backFace[2].x, backFace[2].y);
  ctx.lineTo(backFace[3].x, backFace[3].y);
  ctx.closePath();
  ctx.fill();
  
  if (showWireframe) {
    ctx.strokeStyle = wireframeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Draw connecting lines
  if (showWireframe) {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.moveTo(frontFace[i].x, frontFace[i].y);
      ctx.lineTo(backFace[i].x, backFace[i].y);
    }
    ctx.stroke();
  }
  
  // Draw top face
  ctx.fillStyle = shadeColor(color, -10);
  ctx.beginPath();
  ctx.moveTo(frontFace[0].x, frontFace[0].y);
  ctx.lineTo(backFace[0].x, backFace[0].y);
  ctx.lineTo(backFace[1].x, backFace[1].y);
  ctx.lineTo(frontFace[1].x, frontFace[1].y);
  ctx.closePath();
  ctx.fill();
  
  if (showWireframe) {
    ctx.stroke();
  }
  
  // Draw side face
  ctx.fillStyle = shadeColor(color, -30);
  ctx.beginPath();
  ctx.moveTo(frontFace[1].x, frontFace[1].y);
  ctx.lineTo(backFace[1].x, backFace[1].y);
  ctx.lineTo(backFace[2].x, backFace[2].y);
  ctx.lineTo(frontFace[2].x, frontFace[2].y);
  ctx.closePath();
  ctx.fill();
  
  if (showWireframe) {
    ctx.stroke();
  }
  
  // Restore context
  ctx.restore();
  
  // Add a label
  ctx.fillStyle = '#000';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('3D Cube (2D Placeholder)', canvas.width / 2, canvas.height - 20);
  ctx.fillText('In real implementation, this would use THREE.js', canvas.width / 2, canvas.height - 40);
}

/**
 * Shade a color by percentage
 * @param {string} color - Hex color
 * @param {number} percent - Percentage to lighten or darken
 * @returns {string} Modified color
 */
function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = Math.max(0, R);
  G = Math.max(0, G);
  B = Math.max(0, B);

  const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
  const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
  const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

  return "#" + RR + GG + BB;
}
