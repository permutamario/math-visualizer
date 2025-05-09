// src/plugins/interactive/index.js
// A plugin that demonstrates the 2D-event environment

/**
 * Plugin entry point
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initInteractivePlugin(core) {
  const { hooks, state } = core;
  
  console.log("Initializing Interactive Plugin");
  
  // Store interactive state
  let interactiveState = {
    elements: [
      { id: 1, type: 'circle', x: 100, y: 100, radius: 50, color: '#ff5722', selected: false },
      { id: 2, type: 'rectangle', x: 300, y: 150, width: 100, height: 80, color: '#4caf50', selected: false },
      { id: 3, type: 'triangle', x: 200, y: 250, size: 80, color: '#2196f3', selected: false }
    ],
    selectedElement: null,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  };
  
  // Define settings metadata
  const interactiveSettingsMetadata = {
    // Visual settings
    defaultColor: { 
      type: 'visual', 
      label: 'Default Shape Color', 
      control: 'color', 
      default: '#3498db' 
    },
    selectedColor: { 
      type: 'visual', 
      label: 'Selected Shape Color', 
      control: 'color', 
      default: '#e74c3c' 
    },
    
    // Structural settings
    snapToGrid: { 
      type: 'structural', 
      label: 'Snap to Grid', 
      control: 'checkbox', 
      default: false 
    },
    gridSize: { 
      type: 'structural', 
      label: 'Grid Size', 
      control: 'slider', 
      min: 5, 
      max: 50, 
      step: 1, 
      default: 20 
    }
  };
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'interactivePlugin', (visualizations) => {
    return [...visualizations, {
      id: 'interactive',
      name: 'Interactive Shapes',
      description: 'Interactive shapes demonstration with event handling'
    }];
  });
  
  // Register render function
  hooks.addAction('render', 'interactivePlugin', (ctx, canvas, settings) => {
    renderInteractiveVisualization(ctx, canvas, settings);
    return true;
  });
  
  // Register UI controls
  hooks.addFilter('settingsMetadata', 'interactivePlugin', (metadata) => {
    return interactiveSettingsMetadata;
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'interactivePlugin', (settings) => {
    return {
      defaultColor: '#3498db',
      selectedColor: '#e74c3c',
      snapToGrid: false,
      gridSize: 20,
      backgroundColor: '#f5f5f5'
    };
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'interactivePlugin', (options) => {
    return [
      {
        id: 'export-png',
        label: 'Export PNG',
        type: 'export'
      },
      {
        id: 'add-shape',
        label: 'Add Random Shape',
        type: 'action'
      },
      {
        id: 'reset-settings',
        label: 'Reset Settings',
        type: 'export'
      }
    ];
  });
  
  // Handle export actions
  hooks.addAction('exportAction', 'interactivePlugin', (actionId) => {
    if (actionId === 'add-shape') {
      addRandomShape();
      return true;
    }
    return false;
  });
  
  // Handle mouse down event
  hooks.addAction('onMouseDown', 'interactivePlugin', (event) => {
    const { x, y } = event;
    
    // Check if an element was clicked
    const clickedElement = findElementAtPosition(x, y);
    
    // Deselect all elements
    interactiveState.elements.forEach(el => el.selected = false);
    
    if (clickedElement) {
      // Select the clicked element
      clickedElement.selected = true;
      interactiveState.selectedElement = clickedElement;
      interactiveState.isDragging = true;
      interactiveState.lastMouseX = x;
      interactiveState.lastMouseY = y;
    } else {
      interactiveState.selectedElement = null;
    }
    
    // Request render update
    if (window.AppInstance && window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.render();
    }
    
    return true; // Event was handled
  });
  
  // Handle mouse move event
  hooks.addAction('onMouseMove', 'interactivePlugin', (event) => {
    const { x, y } = event;
    
    if (interactiveState.isDragging && interactiveState.selectedElement) {
      const element = interactiveState.selectedElement;
      
      // Calculate the movement delta
      const dx = x - interactiveState.lastMouseX;
      const dy = y - interactiveState.lastMouseY;
      
      // Move the element
      element.x += dx;
      element.y += dy;
      
      // Apply snap to grid if enabled
      const currentSettings = state.getState().settings;
      if (currentSettings && currentSettings.snapToGrid) {
        const gridSize = currentSettings.gridSize || 20;
        element.x = Math.round(element.x / gridSize) * gridSize;
        element.y = Math.round(element.y / gridSize) * gridSize;
      }
      
      // Update last mouse position
      interactiveState.lastMouseX = x;
      interactiveState.lastMouseY = y;
      
      // Request render update
      if (window.AppInstance && window.AppInstance.canvasManager) {
        window.AppInstance.canvasManager.render();
      }
    }
    
    return true; // Event was handled
  });
  
  // Handle mouse up event
  hooks.addAction('onMouseUp', 'interactivePlugin', (event) => {
    interactiveState.isDragging = false;
    return true; // Event was handled
  });
  
  /**
   * Find element at the given position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} The element at position or null
   */
  function findElementAtPosition(x, y) {
    // Check in reverse order to pick the top-most element
    for (let i = interactiveState.elements.length - 1; i >= 0; i--) {
      const element = interactiveState.elements[i];
      
      switch (element.type) {
        case 'circle':
          // Distance from center to point
          const distance = Math.sqrt(
            Math.pow(x - element.x, 2) + 
            Math.pow(y - element.y, 2)
          );
          if (distance <= element.radius) {
            return element;
          }
          break;
          
        case 'rectangle':
          // Check if point is inside rectangle
          if (
            x >= element.x - element.width/2 &&
            x <= element.x + element.width/2 &&
            y >= element.y - element.height/2 &&
            y <= element.y + element.height/2
          ) {
            return element;
          }
          break;
          
        case 'triangle':
          // Simple triangle hit test (not perfect but works for demo)
          const halfSize = element.size / 2;
          // Define triangle points
          const p1 = { x: element.x, y: element.y - halfSize };
          const p2 = { x: element.x - halfSize, y: element.y + halfSize };
          const p3 = { x: element.x + halfSize, y: element.y + halfSize };
          
          if (isPointInTriangle(x, y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)) {
            return element;
          }
          break;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a point is inside a triangle
   * @param {number} px - Point X
   * @param {number} py - Point Y
   * @param {number} ax - Triangle point A X
   * @param {number} ay - Triangle point A Y
   * @param {number} bx - Triangle point B X
   * @param {number} by - Triangle point B Y
   * @param {number} cx - Triangle point C X
   * @param {number} cy - Triangle point C Y
   * @returns {boolean} True if point is in triangle
   */
  function isPointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    // Compute vectors
    const v0x = cx - ax;
    const v0y = cy - ay;
    const v1x = bx - ax;
    const v1y = by - ay;
    const v2x = px - ax;
    const v2y = py - ay;
    
    // Compute dot products
    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;
    
    // Compute barycentric coordinates
    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
    
    // Check if point is in triangle
    return (u >= 0) && (v >= 0) && (u + v <= 1);
  }
  
  /**
   * Add a random shape to the scene
   */
  function addRandomShape() {
    const types = ['circle', 'rectangle', 'triangle'];
    const type = types[Math.floor(Math.random() * types.length)];
    const maxId = Math.max(...interactiveState.elements.map(el => el.id), 0);
    
    const newElement = {
      id: maxId + 1,
      type,
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      color: getRandomColor(),
      selected: false
    };
    
    // Add type-specific properties
    switch (type) {
      case 'circle':
        newElement.radius = 20 + Math.random() * 40;
        break;
      case 'rectangle':
        newElement.width = 40 + Math.random() * 80;
        newElement.height = 40 + Math.random() * 80;
        break;
      case 'triangle':
        newElement.size = 40 + Math.random() * 80;
        break;
    }
    
    // Add to elements
    interactiveState.elements.push(newElement);
    
    // Request render update
    if (window.AppInstance && window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.render();
    }
  }
  
  /**
   * Get a random color
   * @returns {string} Random color in hex format
   */
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  /**
   * Render the interactive visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Object} settings - Current settings
   */
  function renderInteractiveVisualization(ctx, canvas, settings) {
    // Draw grid if enabled
    if (settings.snapToGrid) {
      drawGrid(ctx, canvas, settings.gridSize || 20);
    }
    
    // Draw all elements
    interactiveState.elements.forEach(element => {
      drawElement(ctx, element, settings);
    });
    
    // Draw instructions
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click and drag shapes to move them', canvas.width / 2, 30);
  }
  
  /**
   * Draw a grid
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} gridSize - Size of grid cells
   */
  function drawGrid(ctx, canvas, gridSize) {
    ctx.save();
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * Draw an element
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} element - Element to draw
   * @param {Object} settings - Current settings
   */
  function drawElement(ctx, element, settings) {
    ctx.save();
    
    // Set color based on selection state
    ctx.fillStyle = element.selected ? (settings.selectedColor || '#e74c3c') : (element.color || settings.defaultColor || '#3498db');
    
    // Draw based on element type
    switch (element.type) {
      case 'circle':
        drawCircle(ctx, element);
        break;
      case 'rectangle':
        drawRectangle(ctx, element);
        break;
      case 'triangle':
        drawTriangle(ctx, element);
        break;
    }
    
    ctx.restore();
  }
  
  /**
   * Draw a circle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} element - Circle element
   */
  function drawCircle(ctx, element) {
    ctx.beginPath();
    ctx.arc(element.x, element.y, element.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw outline if selected
    if (element.selected) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  /**
   * Draw a rectangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} element - Rectangle element
   */
  function drawRectangle(ctx, element) {
    const halfWidth = element.width / 2;
    const halfHeight = element.height / 2;
    
    ctx.fillRect(
      element.x - halfWidth,
      element.y - halfHeight,
      element.width,
      element.height
    );
    
    // Draw outline if selected
    if (element.selected) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        element.x - halfWidth,
        element.y - halfHeight,
        element.width,
        element.height
      );
    }
  }
  
  /**
   * Draw a triangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} element - Triangle element
   */
  function drawTriangle(ctx, element) {
    const halfSize = element.size / 2;
    
    ctx.beginPath();
    ctx.moveTo(element.x, element.y - halfSize); // Top
    ctx.lineTo(element.x - halfSize, element.y + halfSize); // Bottom-left
    ctx.lineTo(element.x + halfSize, element.y + halfSize); // Bottom-right
    ctx.closePath();
    ctx.fill();
    
    // Draw outline if selected
    if (element.selected) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  console.log("Interactive Plugin initialized");
}
