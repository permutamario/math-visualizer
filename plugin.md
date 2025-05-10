# Creating a Visualization Plugin for the Math Framework

## Overview

This guide walks you through creating a visualization plugin using our declarative manifest-based system. By separating configuration from implementation, you can focus on visualization logic while our framework handles the boilerplate.

## File Structure

Create a new directory in `src/plugins/` with your plugin name and these files:

```
src/plugins/myPlugin/
├── manifest.json           # Plugin configuration
├── requiredFunctions.js    # Core visualization functions
├── exportActions.js        # Export-related functionality
├── interactionHandlers.js  # User interaction handlers
└── index.js                # Main entry point
```

## 1. Define Your Manifest

The `manifest.json` file acts as the single source of truth for your plugin:

```json
{
  "id": "myPlugin",
  "name": "My Visualization",
  "version": "1.0.0",
  "description": "A custom visualization plugin",
  "author": "Your Name",
  
  "environment": {
    "type": "2d-camera",
    "options": {
      "initialZoom": 1.0
    }
  },
  
  "hooks": {
    "render": "renderVisualization",
    "beforeRender": "animate",
    "afterRender": "postProcess",
    "activate": "onActivate",
    "deactivate": "onDeactivate",
    "settingChanged": "handleSettingChanged",
    "mouseEvents": {
      "click": "handleClick",
      "mousemove": "handleMouseMove"
    }
  },
  
  "defaultSettings": {
    "size": 100,
    "color": "#3498db",
    "opacity": 1.0,
    "showBorder": true
  },
  
  "settingsMetadata": {
    "visual": [
      {
        "key": "color",
        "label": "Color",
        "control": "color",
        "default": "#3498db"
      },
      {
        "key": "opacity",
        "label": "Opacity",
        "control": "slider", 
        "min": 0,
        "max": 1,
        "step": 0.01,
        "default": 1.0
      },
      {
        "key": "showBorder",
        "label": "Show Border",
        "control": "checkbox",
        "default": true
      }
    ],
    "structural": [
      {
        "key": "size",
        "label": "Size",
        "control": "slider",
        "min": 10,
        "max": 300,
        "step": 1,
        "default": 100
      }
    ]
  },
  
  "exportOptions": [
    {
      "id": "export-png",
      "label": "Export PNG",
      "type": "export",
      "handler": "exportPNG"
    },
    {
      "id": "reset-settings",
      "label": "Reset Settings",
      "type": "export",
      "handler": "resetSettings"
    }
  ]
}
```

## 2. Implement Required Functions

The `requiredFunctions.js` file contains the core visualization logic:

```javascript
// src/plugins/myPlugin/requiredFunctions.js

/**
 * Main rendering function 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 * @returns {boolean} - Whether rendering was handled
 */
export function renderVisualization(ctx, canvas, settings) {
  // Get properties from settings
  const size = settings.size || 100;
  const color = settings.color || '#3498db';
  const opacity = settings.opacity || 1.0;
  const showBorder = settings.showBorder !== undefined ? settings.showBorder : true;
  
  // Save context
  ctx.save();
  
  // Set transparency
  ctx.globalAlpha = opacity;
  
  // Draw your visualization
  ctx.beginPath();
  ctx.rect(-size/2, -size/2, size, size);
  ctx.fillStyle = color;
  ctx.fill();
  
  if (showBorder) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Restore context
  ctx.restore();
  
  return true;
}

/**
 * Animation function called before rendering
 */
export function animate(ctx, canvas, settings) {
  // Animation logic
}

/**
 * Post-processing function called after rendering
 */
export function postProcess(ctx, canvas, settings) {
  // Post-render operations
}

/**
 * Called when the plugin is activated
 */
export function onActivate() {
  console.log("Plugin activated");
  // Initialize resources
}

/**
 * Called when the plugin is deactivated
 */
export function onDeactivate() {
  console.log("Plugin deactivated");
  // Clean up resources
}

/**
 * Called when a setting is changed
 * @param {string} path - Setting path
 * @param {*} value - New value
 */
export function handleSettingChanged(path, value) {
  console.log(`Setting changed: ${path} = ${value}`);
  // React to setting changes
}
```

## 3. Implement Export Actions

The `exportActions.js` file handles export-related functionality:

```javascript
// src/plugins/myPlugin/exportActions.js

/**
 * Export visualization as PNG
 * @returns {boolean} - Success status
 */
export function exportPNG() {
  console.log("Exporting as PNG");
  
  // Get the canvas and export it
  if (window.AppInstance && window.AppInstance.canvasManager) {
    window.AppInstance.canvasManager.exportAsPNG();
    return true;
  }
  
  return false;
}

/**
 * Reset settings to defaults
 * @returns {boolean} - Success status
 */
export function resetSettings() {
  console.log("Resetting settings");
  
  // Reset settings through the state manager
  if (window.AppInstance && window.AppInstance.pluginRegistry) {
    window.AppInstance.pluginRegistry.resetActiveSettings();
    return true;
  }
  
  return false;
}
```

## 4. Implement Interaction Handlers

The `interactionHandlers.js` file manages user interactions:

```javascript
// src/plugins/myPlugin/interactionHandlers.js

/**
 * Handle click events
 * @param {Object} event - Click event data
 * @returns {boolean} - Whether the event was handled
 */
export function handleClick(event) {
  const { x, y } = event;
  console.log(`Click at (${x}, ${y})`);
  
  // Handle click interactions
  return true;
}

/**
 * Handle mouse movement
 * @param {Object} event - Mouse event data
 * @returns {boolean} - Whether the event was handled
 */
export function handleMouseMove(event) {
  const { x, y } = event;
  
  // Handle mouse movement
  return true;
}
```

## 5. Create Main Entry Point

The `index.js` file ties everything together:

```javascript
// src/plugins/myPlugin/index.js

// Import manifest and implementation files
import manifest from './manifest.json';
import * as requiredFunctions from './requiredFunctions.js';
import * as exportActions from './exportActions.js';
import * as interactionHandlers from './interactionHandlers.js';

export default function initMyPlugin(core) {
  // Combine all implementation functions
  const implementation = {
    ...requiredFunctions,
    ...exportActions,
    ...interactionHandlers
  };
  
  // Register the plugin with its manifest and implementation
  core.hooks.registerPluginFromManifest(manifest, implementation, core);
  
  console.log(`Plugin ${manifest.id} initialized`);
  
  return implementation;
}
```

## Testing Your Plugin

After creating your plugin, add it to the `plugins` list in `src/core/pluginManager.js`:

```javascript
// In getPluginsList()
{
  id: 'myPlugin',
  name: 'My Visualization',
  description: 'A custom visualization plugin',
  init: initMyPlugin,
  manifest: manifest
}
```

## Next Steps

- Add more interactive features by registering additional event handlers
- Implement custom UI elements with specialized controls
- Use custom shaders for GPU-accelerated visualizations
- Create data-driven visualizations by adding data import options

This modular, declarative approach simplifies plugin development by handling boilerplate code while you focus on creating outstanding visualizations.
