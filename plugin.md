# Creating Plugins for the Math Visualization Framework

This guide explains how to create custom visualization plugins for the Math Visualization Framework. The framework uses a plugin-based architecture that makes it easy to add new visualizations without modifying the core code.

## Overview

Each plugin in the framework consists of:

1. A directory in `src/plugins/` with your plugin name
2. An `index.js` file containing your plugin's implementation code
3. A `manifest.json` file defining plugin metadata and default settings

The framework's Plugin Controller system handles plugin lifecycle management, ensuring proper initialization, activation, and cleanup.

## Plugin Structure

### Directory Structure

Create a new directory in the `src/plugins/` folder with your plugin name:

```
src/plugins/myPlugin/
├── index.js           # Main plugin implementation
├── manifest.json      # Plugin metadata
└── [other files]      # Optional additional files
```

### Manifest File

The `manifest.json` file defines your plugin's metadata, default settings, and environment requirements:

```json
{
  "id": "myPlugin",
  "name": "My Visualization",
  "version": "1.0.0",
  "description": "A custom visualization plugin",
  "author": "Your Name",
  "minFrameworkVersion": "1.0.0",
  "environment": {
    "type": "2d-camera",
    "options": {}
  },
  "defaultSettings": {
    "size": 100,
    "color": "#3498db",
    "opacity": 1.0,
    "rotation": 0,
    "backgroundColor": "#f5f5f5",
    "showBorder": true,
    "borderColor": "#000000",
    "borderWidth": 2
  },
  "uiCategories": [
    {
      "id": "structural",
      "label": "Structural Parameters",
      "settings": ["size", "rotation"]
    },
    {
      "id": "visual",
      "label": "Visual Parameters",
      "settings": ["color", "opacity", "backgroundColor", "showBorder", "borderColor", "borderWidth"]
    }
  ],
  "exportOptions": [
    {
      "id": "export-png",
      "label": "Export PNG",
      "type": "export"
    },
    {
      "id": "reset-settings",
      "label": "Reset Settings",
      "type": "export"
    }
  ]
}
```

### Main Plugin File

The `index.js` file contains your plugin's implementation:

```javascript
/**
 * Plugin entry point
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initMyPlugin(core) {
  const { hooks, state } = core;
  
  console.log("Initializing My Plugin");
  
  // Define settings metadata - these are YOUR plugin's settings only
  const mySettingsMetadata = {
    // Visual settings
    backgroundColor: { 
      type: 'visual', 
      label: 'Background Color', 
      control: 'color', 
      default: '#f5f5f5' 
    },
    color: { 
      type: 'visual', 
      label: 'Color', 
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
    size: { 
      type: 'structural', 
      label: 'Size', 
      control: 'slider', 
      min: 10, 
      max: 300, 
      step: 1, 
      default: 100 
    },
    rotation: { 
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
  hooks.addFilter('availableVisualizations', 'myPlugin', (visualizations) => {
    return [...visualizations, {
      id: 'myPlugin',
      name: 'My Visualization',
      description: 'A custom visualization'
    }];
  });
  
  // Register render function - will be called by the framework
  hooks.addAction('render', 'myPlugin', (ctx, canvas, settings) => {
    // Only render if this is the active plugin
    if (state.getState().activePluginId === 'myPlugin') {
      renderMyVisualization(ctx, canvas, settings);
      return true; // Indicate we handled the rendering
    }
    return false; // Not the active plugin
  });
  
  // Register UI controls
  hooks.addFilter('settingsMetadata', 'myPlugin', (metadata) => {
    console.log("My Plugin providing settings metadata");
    return mySettingsMetadata;
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'myPlugin', (options) => {
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
  hooks.addFilter('defaultSettings', 'myPlugin', (settings) => {
    return {
      size: 100,
      color: '#3498db',
      opacity: 1.0,
      rotation: 0,
      backgroundColor: '#f5f5f5',
      showBorder: true,
      borderColor: '#000000',
      borderWidth: 2,
    };
  });
  
  // Handle setting changes
  hooks.addAction('onSettingChanged', 'myPlugin', ({ path, value }) => {
    console.log(`My Plugin: Setting changed ${path} = ${value}`);
  });
  
  // Register activation handler
  hooks.addAction('activatePlugin', 'myPlugin', ({ pluginId }) => {
    if (pluginId === 'myPlugin') {
      console.log("My Plugin activated");
    }
  });
  
  // Register deactivation handler
  hooks.addAction('deactivatePlugin', 'myPlugin', ({ pluginId }) => {
    if (pluginId === 'myPlugin') {
      console.log("My Plugin deactivated");
      
      // Clean up any resources here
    }
  });
  
  console.log("My Plugin initialized");
}

/**
 * Render your visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 */
function renderMyVisualization(ctx, canvas, settings) {
  // Get properties from settings
  const size = settings.size || 100;
  const color = settings.color || '#3498db';
  const opacity = settings.opacity || 1.0;
  const rotation = settings.rotation || 0;
  const showBorder = settings.showBorder !== undefined ? settings.showBorder : true;
  const borderColor = settings.borderColor || '#000000';
  const borderWidth = settings.borderWidth || 2;
  
  // For 2d-camera environment, coordinates are relative to (0,0)
  // as the camera handles the transformation to the center of the canvas
  const x = 0;
  const y = 0;
  
  // Save the current context state
  ctx.save();
  
  // Apply rotation if needed (convert degrees to radians)
  if (rotation) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  
  // Set transparency
  ctx.globalAlpha = opacity;
  
  // Draw your visualization
  // Example: Draw a star shape
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const outerX = Math.cos(angle) * size;
    const outerY = Math.sin(angle) * size;
    
    if (i === 0) {
      ctx.moveTo(outerX, outerY);
    } else {
      ctx.lineTo(outerX, outerY);
    }
    
    const innerAngle = angle + Math.PI / 5;
    const innerX = Math.cos(innerAngle) * (size * 0.4);
    const innerY = Math.sin(innerAngle) * (size * 0.4);
    
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  
  // Fill with color
  ctx.fillStyle = color;
  ctx.fill();
  
  // Draw border if enabled
  if (showBorder) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }
  
  // Restore the context state
  ctx.restore();
}
```

## Plugin Lifecycle

With the Plugin Controller system, your plugin goes through these lifecycle states:

1. **Registered**: The plugin is registered with the framework but not initialized
2. **Initializing**: The plugin is being initialized (loading resources, registering hooks)
3. **Ready**: The plugin is initialized and ready to be activated
4. **Active**: The plugin is currently active and being displayed
5. **Error**: An error occurred during initialization or activation

## Required Hook Registration

Your plugin should register these hooks:

### Essential Hooks

1. **settingsMetadata**: Define UI controls for your plugin's settings
2. **render**: The main rendering function for your visualization
3. **availableVisualizations**: Register your plugin with the visualization system

```javascript
// Register settings metadata
hooks.addFilter('settingsMetadata', 'myPlugin', (metadata) => {
  return mySettingsMetadata;
});

// Register render function
hooks.addAction('render', 'myPlugin', (ctx, canvas, settings) => {
  if (state.getState().activePluginId === 'myPlugin') {
    renderMyVisualization(ctx, canvas, settings);
    return true;
  }
  return false;
});

// Register with visualization system
hooks.addFilter('availableVisualizations', 'myPlugin', (visualizations) => {
  return [...visualizations, {
    id: 'myPlugin',
    name: 'My Visualization',
    description: 'A custom visualization'
  }];
});
```

### Optional Hooks

1. **defaultSettings**: Default values for your plugin's settings
2. **exportOptions**: Options for exporting or interacting with your visualization
3. **activatePlugin/deactivatePlugin**: Handle plugin activation/deactivation
4. **onSettingChanged**: React to setting changes
5. **beforeRender/afterRender**: Perform actions before/after rendering

```javascript
// Handle setting changes
hooks.addAction('onSettingChanged', 'myPlugin', ({ path, value }) => {
  console.log(`Setting changed: ${path} = ${value}`);
});

// Handle plugin activation
hooks.addAction('activatePlugin', 'myPlugin', ({ pluginId }) => {
  if (pluginId === 'myPlugin') {
    console.log("Plugin activated");
  }
});

// Handle plugin deactivation
hooks.addAction('deactivatePlugin', 'myPlugin', ({ pluginId }) => {
  if (pluginId === 'myPlugin') {
    console.log("Plugin deactivated");
    // Clean up resources
  }
});
```

## Event Handling with 2D Event Environment

If you need to handle user interactions, use the 2D Event environment:

```json
// In manifest.json
{
  "environment": {
    "type": "2d-event",
    "options": {}
  }
}
```

Then register event handlers:

```javascript
// Handle mouse click events
hooks.addAction('onClick', 'myPlugin', (event) => {
  // Only handle events if this is the active plugin
  if (state.getState().activePluginId !== 'myPlugin') return false;
  
  const { x, y } = event;
  // Do something with the click coordinates
  
  return true; // Event was handled
});

// Handle mouse move events
hooks.addAction('onMouseMove', 'myPlugin', (event) => {
  if (state.getState().activePluginId !== 'myPlugin') return false;
  
  const { x, y } = event;
  // Handle mouse movement
  
  return true;
});
```

## 3D Visualization with THREE.js

For 3D visualizations, use the 3D Camera environment:

```json
// In manifest.json
{
  "environment": {
    "type": "3d-camera",
    "options": {
      "cameraPosition": [0, 0, 5],
      "lookAt": [0, 0, 0]
    }
  }
}
```

Then in your plugin:

```javascript
// Register activation handler - create the 3D scene
hooks.addAction('activatePlugin', 'myPlugin', ({ pluginId }) => {
  if (pluginId !== 'myPlugin') return;
  
  // Get the current environment
  const canvasManager = window.AppInstance.canvasManager;
  
  // Access the THREE.js scene
  if (canvasManager.currentEnvironment && 
      canvasManager.currentEnvironment.scene && 
      window.THREE) {
    
    const scene = canvasManager.currentEnvironment.scene;
    const THREE = window.THREE;
    
    // Create a mesh
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: settings.color,
      opacity: settings.opacity,
      transparent: settings.opacity < 1,
      wireframe: settings.wireframe
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    scene.add(this.mesh);
    
    // Set background color
    if (canvasManager.currentEnvironment.renderer) {
      canvasManager.currentEnvironment.renderer.setClearColor(
        settings.backgroundColor
      );
    }
  }
});

// Register deactivation handler - clean up the 3D scene
hooks.addAction('deactivatePlugin', 'myPlugin', ({ pluginId }) => {
  if (pluginId !== 'myPlugin') return;
  
  // Clean up the scene
  if (this.mesh) {
    const canvasManager = window.AppInstance.canvasManager;
    if (canvasManager.currentEnvironment && 
        canvasManager.currentEnvironment.scene) {
      canvasManager.currentEnvironment.scene.remove(this.mesh);
    }
    
    // Dispose of geometry and material
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh = null;
  }
});
```

## Async Resource Loading

For plugins that need to load resources asynchronously:

```javascript
export default async function initMyPlugin(core) {
  const { hooks, state, lifecycle } = core;
  
  // Indicate the plugin is initializing
  lifecycle.setPluginState('initializing');
  
  try {
    // Load resources asynchronously
    const data = await fetch('https://example.com/data.json')
      .then(response => response.json());
    
    // Register hooks with the loaded data
    registerPluginHooks(hooks, data);
    
    // Indicate the plugin is ready
    lifecycle.setPluginState('ready');
    
    console.log("Plugin initialized with async resources");
  } catch (error) {
    console.error("Failed to initialize plugin:", error);
    lifecycle.setPluginState('error');
  }
}
```

## Control Types

The framework supports these control types for settings:

### Slider
```javascript
{
  type: 'visual',
  label: 'Size',
  control: 'slider',
  min: 10,
  max: 200,
  step: 1,
  default: 100
}
```

### Checkbox
```javascript
{
  type: 'visual',
  label: 'Show Border',
  control: 'checkbox',
  default: true
}
```

### Color Picker
```javascript
{
  type: 'visual',
  label: 'Fill Color',
  control: 'color',
  default: '#3498db'
}
```

### Number Input
```javascript
{
  type: 'structural',
  label: 'Border Width',
  control: 'number',
  min: 0,
  max: 20,
  step: 1,
  default: 2
}
```

### Dropdown
```javascript
{
  type: 'structural',
  label: 'Shape Type',
  control: 'dropdown',
  options: ['circle', 'square', 'triangle'],
  default: 'circle'
}
```

## Plugin Registration

After creating your plugin, you need to register it in `src/core/pluginManager.js`:

1. Import your plugin at the top:
```javascript
import initMyPlugin from '../plugins/myPlugin/index.js';
```

2. Add your plugin to the `getPluginsList()` function:
```javascript
function getPluginsList() {
  return [
    // Existing plugins...
    
    // Your plugin
    { 
      id: 'myPlugin',
      name: 'My Visualization',
      description: 'A custom visualization',
      init: initMyPlugin,
      manifest: {
        defaultSettings: {
          size: 100,
          color: '#3498db',
          opacity: 1.0,
          rotation: 0,
          backgroundColor: '#f5f5f5',
          showBorder: true,
          borderColor: '#000000',
          borderWidth: 2,
        },
        environment: {
          type: '2d-camera',
          options: {}
        }
      }
    }
  ];
}
```

## Best Practices

1. **Unique Plugin ID**: Ensure your plugin ID is unique and consistent across all hook registrations
2. **Namespacing**: Use your plugin ID as the namespace for all hooks
3. **Resource Cleanup**: Clean up resources in the deactivation handler
4. **Async Operations**: Use async/await for resource loading and properly signal plugin state
5. **Setting Changes**: Handle setting changes properly to update your visualization
6. **Error Handling**: Add appropriate error handling throughout your plugin
7. **Active Plugin Check**: Always check if your plugin is active before rendering or handling events
8. **Event Handlers**: Return `true` from event handlers to indicate the event was handled
9. **Documentation**: Document your plugin's settings and functionality

## Example 2D Plugin: Simple Clock

Here's a complete example of a simple clock plugin:

```javascript
// src/plugins/clock/index.js
export default function initClockPlugin(core) {
  const { hooks, state } = core;
  
  // Define settings metadata
  const clockSettingsMetadata = {
    // Visual settings
    faceColor: { 
      type: 'visual', 
      label: 'Face Color', 
      control: 'color', 
      default: '#ffffff' 
    },
    borderColor: { 
      type: 'visual', 
      label: 'Border Color', 
      control: 'color', 
      default: '#000000' 
    },
    hourHandColor: { 
      type: 'visual', 
      label: 'Hour Hand Color', 
      control: 'color', 
      default: '#000000' 
    },
    minuteHandColor: { 
      type: 'visual', 
      label: 'Minute Hand Color', 
      control: 'color', 
      default: '#333333' 
    },
    secondHandColor: { 
      type: 'visual', 
      label: 'Second Hand Color', 
      control: 'color', 
      default: '#ff0000' 
    },
    
    // Structural settings
    size: { 
      type: 'structural', 
      label: 'Clock Size', 
      control: 'slider', 
      min: 50, 
      max: 300, 
      step: 1, 
      default: 150 
    },
    showSeconds: { 
      type: 'structural', 
      label: 'Show Seconds Hand', 
      control: 'checkbox', 
      default: true 
    },
    use24Hour: { 
      type: 'structural', 
      label: 'Use 24-Hour Format', 
      control: 'checkbox', 
      default: false 
    }
  };
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'clock', (visualizations) => {
    return [...visualizations, {
      id: 'clock',
      name: 'Analog Clock',
      description: 'A simple analog clock visualization'
    }];
  });
  
  // Register render function
  hooks.addAction('render', 'clock', (ctx, canvas, settings) => {
    if (state.getState().activePluginId === 'clock') {
      renderClock(ctx, canvas, settings);
      return true;
    }
    return false;
  });
  
  // Register UI controls
  hooks.addFilter('settingsMetadata', 'clock', (metadata) => {
    return clockSettingsMetadata;
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'clock', (settings) => {
    return {
      faceColor: '#ffffff',
      borderColor: '#000000',
      hourHandColor: '#000000',
      minuteHandColor: '#333333',
      secondHandColor: '#ff0000',
      size: 150,
      showSeconds: true,
      use24Hour: false
    };
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'clock', (options) => {
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
  
  // Handle animation - register with beforeRender hook
  hooks.addAction('beforeRender', 'clock', (ctx, canvas, settings) => {
    // Request constant rerendering for the clock to update
    if (state.getState().activePluginId === 'clock') {
      // Request next frame
      if (window.AppInstance && window.AppInstance.canvasManager) {
        window.AppInstance.canvasManager.render();
      }
    }
  });
  
  console.log("Clock plugin initialized");
}

/**
 * Render the clock visualization
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 */
function renderClock(ctx, canvas, settings) {
  const size = settings.size || 150;
  const showSeconds = settings.showSeconds !== undefined ? settings.showSeconds : true;
  
  // Get current time
  const now = new Date();
  const hours = now.getHours() % (settings.use24Hour ? 24 : 12);
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  // Draw at center
  const x = 0;
  const y = 0;
  
  // Save context
  ctx.save();
  
  // Draw clock face
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = settings.faceColor || '#ffffff';
  ctx.fill();
  ctx.strokeStyle = settings.borderColor || '#000000';
  ctx.lineWidth = size / 20;
  ctx.stroke();
  
  // Draw hour marks
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const markSize = size * 0.05;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(0, -size + markSize * 2);
    ctx.lineTo(0, -size + markSize);
    ctx.strokeStyle = settings.borderColor || '#000000';
    ctx.lineWidth = markSize;
    ctx.stroke();
    
    ctx.restore();
  }
  
  // Draw hour hand
  const hourAngle = ((hours % 12) * Math.PI) / 6 + (minutes * Math.PI) / (6 * 60);
  drawHand(ctx, x, y, hourAngle, size * 0.5, size * 0.07, settings.hourHandColor || '#000000');
  
  // Draw minute hand
  const minuteAngle = (minutes * Math.PI) / 30 + (seconds * Math.PI) / (30 * 60);
  drawHand(ctx, x, y, minuteAngle, size * 0.75, size * 0.04, settings.minuteHandColor || '#333333');
  
  // Draw second hand if enabled
  if (showSeconds) {
    const secondAngle = (seconds * Math.PI) / 30;
    drawHand(ctx, x, y, secondAngle, size * 0.85, size * 0.02, settings.secondHandColor || '#ff0000');
  }
  
  // Draw center circle
  ctx.beginPath();
  ctx.arc(x, y, size * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = settings.borderColor || '#000000';
  ctx.fill();
  
  // Restore context
  ctx.restore();
}

/**
 * Draw a clock hand
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} angle - Angle in radians
 * @param {number} length - Hand length
 * @param {number} width - Hand width
 * @param {string} color - Hand color
 */
function drawHand(ctx, x, y, angle, length, width, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -length);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  ctx.restore();
}
```

## Example 3D Plugin: Simple Cube

Here's an example of a 3D cube plugin using THREE.js:

```javascript
// src/plugins/3dcube/index.js
export default function initCubePlugin(core) {
  const { hooks, state } = core;
  
  // Store the cube object for animation and cleanup
  let cube = null;
  
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
      label: 'Wireframe Mode', 
      control: 'checkbox', 
      default: false 
    },
    backgroundColor: { 
      type: 'visual', 
      label: 'Background Color', 
      control: 'color', 
      default: '#f5f5f5' 
    },
    
    // Structural settings
    size: { 
      type: 'structural', 
      label: 'Cube Size', 
      control: 'slider', 
      min: 0.1, 
      max: 2, 
      step: 0.1, 
      default: 1 
    },
    rotation: { 
      type: 'structural', 
      label: 'Auto-rotate', 
      control: 'checkbox', 
      default: true 
    },
    rotationSpeed: { 
      type: 'structural', 
      label: 'Rotation Speed', 
      control: 'slider', 
      min: 0.1, 
      max: 2, 
      step: 0.1, 
      default: 1 
    }
  };
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'cube', (visualizations) => {
    return [...visualizations, {
      id: 'cube',
      name: '3D Cube',
      description: 'A 3D cube visualization'
    }];
  });
  
  // Register environment requirements
  hooks.addFilter('environmentRequirements', 'cube', () => {
    return {
      type: '3d-camera',
      options: {
        cameraPosition: [0, 0, 5],
        lookAt: [0, 0, 0]
      }
    };
  });
  
  // Register settings metadata
  hooks.addFilter('settingsMetadata', 'cube', (metadata) => {
    return cubeSettingsMetadata;
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'cube', (settings) => {
    return {
      cubeColor: '#3498db',
      opacity: 1.0,
      wireframe: false,
      backgroundColor: '#f5f5f5',
      size: 1,
      rotation: true,
      rotationSpeed: 1
    };
  });
  
  // Register render function
  hooks.addAction('render', 'cube', (ctx, canvas, settings) => {
    // For 3D, we set up the scene when the plugin is activated
    return true;
  });
  
  // Register activation handler - create the 3D scene
  hooks.addAction('activatePlugin', 'cube', ({ pluginId }) => {
    if (pluginId !== 'cube') return;
    
    // Get the current environment
    const canvasManager = window.AppInstance.canvasManager;
    
    // Access the THREE.js scene
    if (canvasManager.currentEnvironment && 
        canvasManager.currentEnvironment.scene && 
        window.THREE) {
      
      const scene = canvasManager.currentEnvironment.scene;
      const THREE = window.THREE;
      const settings = state.getState().settings;
      
      // Create a cube mesh
      const geometry = new THREE.BoxGeometry(settings.size, settings.size, settings.size);
      const material = new THREE.MeshStandardMaterial({
        color: settings.cubeColor,
        opacity: settings.opacity,
        transparent: settings.opacity < 1,
        wireframe: settings.wireframe
      });
      
      cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      
      // Set background color
      if (canvasManager.currentEnvironment.renderer) {
        canvasManager.currentEnvironment.renderer.setClearColor(
          settings.backgroundColor
        );
      }
    }
  });
  
  // Register animation function
  hooks.addAction('beforeRender', 'cube', (ctx, canvas, settings) => {
    // Animate the cube if rotation is enabled
    if (cube && settings.rotation) {
      cube.rotation.x += 0.01 * settings.rotationSpeed;
      cube.rotation.y += 0.01 * settings.rotationSpeed;
    }
  });
  
  // Handle setting changes
  hooks.addAction('onSettingChanged', 'cube', ({ path, value }) => {
    if (!cube) return;
    
    // Update the cube based on setting changes
    switch (path) {
      case 'size':
        const oldGeometry = cube.geometry;
        cube.geometry = new THREE.BoxGeometry(value, value, value);
        oldGeometry.dispose(); // Clean up old geometry
        break;
        
      case 'cubeColor':
        cube.material.color.set(value);
        break;
        
      case 'opacity':
        cube.material.opacity = value;
        cube.material.transparent = value < 1;
        break;
        
      case 'wireframe':
        cube.material.wireframe = value;
        break;
        
      case 'backgroundColor':
        const canvasManager = window.AppInstance.canvasManager;
        if (canvasManager.currentEnvironment && 
            canvasManager.currentEnvironment.renderer) {
          canvasManager.currentEnvironment.renderer.setClearColor(value);
        }
        break;
    }
  });
  
  // Register deactivation handler - clean up the 3D scene
  hooks.addAction('deactivatePlugin', 'cube', ({ pluginId }) => {
    if (pluginId !== 'cube') return;
    
    // Clean up the cube from the scene
    if (cube) {
      const canvasManager = window.AppInstance.canvasManager;
      if (canvasManager.currentEnvironment && 
          canvasManager.currentEnvironment.scene) {
        canvasManager.currentEnvironment.scene.remove(cube);
      }
      
      // Dispose of resources
      cube.geometry.dispose();
      cube.material.dispose();
      cube = null;
    }
  });
  
  console.log("Cube plugin initialized");
}
```

## Conclusion

By following this guide, you should be able to create custom visualization plugins for the Math Visualization Framework. Remember that each plugin should:

1. Register all necessary hooks with the framework
2. Implement a render function to draw the visualization
3. Handle plugin activation and deactivation properly
4. Clean up resources when deactivated
5. Properly handle setting changes

The Plugin Controller system will manage your plugin's lifecycle, ensuring that it's properly initialized, activated, and cleaned up when no longer in use.
