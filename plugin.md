# How to Create a Plugin

This guide walks you through creating a custom visualization plugin for the Math Visualization Framework.

## Overview

Each plugin in the framework consists of:
1. A directory in `src/plugins/` with the plugin name
2. An `index.js` file with the plugin implementation
3. A `manifest.json` file with plugin metadata

## Step-by-Step Guide

### 1. Create Plugin Directory

Create a new directory in the `src/plugins/` folder with your plugin name:

```
src/plugins/myPlugin/
```

### 2. Create manifest.json

Create a `manifest.json` file with metadata about your plugin:

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

### 3. Create index.js

Create an `index.js` file with your plugin implementation:

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

### 4. Update Plugin Registry

You need to update the `pluginManager.js` file to include your new plugin:

1. Import your plugin:
```javascript
import initMyPlugin from '../plugins/myPlugin/index.js';
```

2. Add your plugin to the `PLUGINS` array:
```javascript
const PLUGINS = [
  // ... other plugins
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
```

## Rendering Environments

The framework supports different rendering environments for different types of visualizations. You can specify which environment your plugin requires in its manifest.

### Available Environments

#### 2D Camera Environment (`2d-camera`)

Best for visualizations that need camera navigation:

```json
"environment": {
  "type": "2d-camera",
  "options": {
    "initialZoom": 1.0
  }
}
```

In this environment, your render function should draw relative to (0,0), as the camera handles positioning.

#### 2D Event Environment (`2d-event`)

Best for interactive visualizations that need to handle user input:

```json
"environment": {
  "type": "2d-event",
  "options": {}
}
```

In this environment, you can register event handlers:

```javascript
// Handle mouse click events
hooks.addAction('onClick', 'myPlugin', (event) => {
  // Only handle events if this is the active plugin
  if (state.getState().activePluginId !== 'myPlugin') return false;
  
  const { x, y } = event;
  // Do something with the click coordinates
  
  return true; // Event was handled
});
```

#### 3D Camera Environment (`3d-camera`)

For 3D visualizations (currently a placeholder):

```json
"environment": {
  "type": "3d-camera",
  "options": {
    "cameraPosition": [0, 0, 5],
    "lookAt": [0, 0, 0]
  }
}
```

## Key Components Explained

### Settings Metadata

Settings metadata defines the UI controls for your plugin's settings. Each setting has:

- **key**: The setting identifier
- **type**: Category of the setting (visual, structural)
- **label**: Display name in the UI
- **control**: Type of control (slider, checkbox, color, etc.)
- **default**: Default value
- Additional properties based on the control type (min, max, step, options)

### Hook Points

Your plugin interacts with the framework through these hooks:

#### Action Hooks

- **render**: Draws your visualization
  ```javascript
  hooks.addAction('render', 'pluginId', (ctx, canvas, settings) => {
    // Your rendering code
    return true; // Return true to indicate rendering was handled
  });
  ```

- **activatePlugin**: Called when your plugin is activated
  ```javascript
  hooks.addAction('activatePlugin', 'pluginId', ({ pluginId }) => {
    if (pluginId === 'myPlugin') {
      // Your activation code
    }
  });
  ```

- **deactivatePlugin**: Called when your plugin is deactivated
  ```javascript
  hooks.addAction('deactivatePlugin', 'pluginId', ({ pluginId }) => {
    if (pluginId === 'myPlugin') {
      // Your deactivation code
    }
  });
  ```

- **onSettingChanged**: Called when a setting changes
  ```javascript
  hooks.addAction('onSettingChanged', 'pluginId', ({ path, value }) => {
    // React to setting changes
  });
  ```

- **Event Hooks** (for 2d-event environment):
  ```javascript
  hooks.addAction('onMouseDown', 'pluginId', (event) => {
    // Handle mouse down event
    return true; // Return true to indicate the event was handled
  });
  ```

#### Filter Hooks

- **settingsMetadata**: Define UI controls for settings
  ```javascript
  hooks.addFilter('settingsMetadata', 'pluginId', (metadata) => {
    return yourSettingsMetadata;
  });
  ```

- **defaultSettings**: Set default values for settings
  ```javascript
  hooks.addFilter('defaultSettings', 'pluginId', (settings) => {
    return yourDefaultSettings;
  });
  ```

- **exportOptions**: Define export options
  ```javascript
  hooks.addFilter('exportOptions', 'pluginId', (options) => {
    return yourExportOptions;
  });
  ```

## Available Control Types

The framework supports these control types:

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

## Best Practices

1. **Unique Plugin ID**: Ensure your plugin ID is unique
2. **Namespacing**: Use your plugin ID as the namespace for all hooks
3. **Clean Activation/Deactivation**: Properly handle plugin lifecycle
4. **Resource Cleanup**: Clean up resources on deactivation
5. **Descriptive Settings**: Use clear labels and appropriate defaults
6. **Optimized Rendering**: Keep your render function efficient
7. **Error Handling**: Include error handling in your code
8. **Active Plugin Check**: Always check if your plugin is active before rendering
9. **Documentation**: Document your plugin functionality

## Troubleshooting

- **Plugin not showing**: Check if it's registered in `pluginManager.js`
- **Settings not displaying**: Verify your `settingsMetadata` filter
- **Rendering issues**: Debug your render function with console logs
- **Settings not applying**: Check your default settings and control types
- **UI not updating**: Force a UI rebuild through the debug panel
- **Plugins drawing over each other**: Make sure to check if your plugin is active before rendering

## Example: Animation

To add animation to your visualization:

```javascript
// In your plugin's init function
hooks.addAction('beforeRender', 'myPlugin', (ctx, canvas, settings) => {
  // Only animate if this is the active plugin
  if (settings.animation && state.getState().activePluginId === 'myPlugin') {
    // Update animation state
    const currentRotation = settings.rotation || 0;
    const newRotation = (currentRotation + 1) % 360;
    window.changeState('settings.rotation', newRotation);
  }
});
```

## Example: Custom Export

To add a custom export option:

```javascript
hooks.addFilter('exportOptions', 'myPlugin', (options) => {
  return [
    ...options,
    {
      id: 'export-data',
      label: 'Export Data',
      type: 'export'
    }
  ];
});

hooks.addAction('exportAction', 'myPlugin', (actionId) => {
  if (actionId === 'export-data') {
    // Handle custom export
    const data = generateDataFromVisualization();
    downloadData(data, 'visualization-data.json');
    return true; // Action handled
  }
  return false; // Not handled
});
```

## Example: Interactive Plugin (2D Event Environment)

For plugins that need to handle user interactions directly:

```javascript
// In your manifest.json:
"environment": {
  "type": "2d-event",
  "options": {}
}

// In your index.js:
hooks.addAction('onMouseDown', 'myPlugin', (event) => {
  // Only handle events if this is the active plugin
  if (state.getState().activePluginId !== 'myPlugin') return false;
  
  const { x, y } = event;
  // Handle mouse down event
  
  return true; // Event was handled
});

hooks.addAction('onMouseMove', 'myPlugin', (event) => {
  // Only handle events if this is the active plugin
  if (state.getState().activePluginId !== 'myPlugin') return false;
  
  const { x, y } = event;
  // Handle mouse move event
  
  return true; // Event was handled
});
```

## Example: 3D Plugin (3D Camera Environment)

For plugins that will use the 3D environment (when fully implemented):

```javascript
// In your manifest.json:
"environment": {
  "type": "3d-camera",
  "options": {
    "cameraPosition": [0, 0, 5],
    "lookAt": [0, 0, 0]
  }
}

// In your render function:
function render3D(scene, camera, renderer, settings) {
  // Create THREE.js objects
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: settings.color });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
}
```
