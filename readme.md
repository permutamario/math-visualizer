# Math Visualization Plugin Framework

A modular, extensible framework for creating interactive mathematical visualizations through a plugin-based architecture.

## Overview

This framework allows for easy creation and management of different mathematical visualizations with a consistent, data-driven UI. The plugin architecture ensures that new visualizations can be added without modifying core code.

## Directory Structure

```
[project root]
├── index.html                # Main entry point HTML
├── styles/                   # CSS styles
│   ├── base.css              # Global styles
│   ├── desktop.css           # Desktop-specific styles
│   └── mobile.css            # Mobile-specific styles
└── src/
    ├── index.js              # Application bootstrap
    ├── core/                 # Core functionality
    │   ├── app.js            # Main application controller
    │   ├── pluginManager.js  # Discovers, loads and registers plugins
    │   ├── stateManager.js   # State storage and management
    │   ├── uiManager.js      # Core UI initialization and coordination
    │   ├── canvasManager.js  # Canvas rendering and management
    │   ├── hooks.js          # Plugin hook system for extensibility
    │   └── utils.js          # Utility functions & EventEmitter
    ├── ui/                   # User interface
    │   ├── baseControls.js   # UI control factories
    │   ├── desktopUI.js      # Desktop interface
    │   └── mobileUI.js       # Mobile interface
    └── plugins/              # Plugin directory
        ├── square/           # Square Visualization Plugin
        │   ├── index.js      # Plugin entry point
        │   └── manifest.json # Plugin metadata and configuration
        └── circle/           # Circle Visualization Plugin
            ├── index.js      # Plugin entry point
            └── manifest.json # Plugin metadata and configuration
```

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern browser
3. Select a visualization from the dropdown menu
4. Adjust parameters using the control panels

## Core Features

- **Plugin Architecture**: Add new visualizations without modifying core code
- **Responsive UI**: Works on both desktop and mobile devices
- **Hook System**: Allows plugins to extend core functionality
- **State Management**: Centralized state with change notifications
- **Export Options**: Export visualizations as images

## Creating New Plugins

To create a new plugin:

1. Create a new directory in `src/plugins/` with your plugin name
2. Create an `index.js` file that exports a plugin initialization function
3. Create a `manifest.json` file with plugin metadata
4. Implement the necessary hook callbacks for rendering and UI

### Plugin Structure

#### index.js Example

```javascript
export default function initPlugin(core) {
  const { hooks, state } = core;
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'myPlugin', (visualizations) => {
    return [...visualizations, {
      id: 'myPlugin',
      name: 'My Visualization',
      description: 'A custom visualization'
    }];
  });
  
  // Register render function
  hooks.addAction('render', 'myPlugin', (ctx, canvas, settings) => {
    if (state.getState().activePluginId === 'myPlugin') {
      // Rendering code here
    }
  });
  
  // Register UI controls
  hooks.addFilter('settingsMetadata', 'myPlugin', (metadata) => {
    return {
      ...metadata,
      // Define settings here
    };
  });
}
```

#### manifest.json Example

```json
{
  "id": "myPlugin",
  "name": "My Visualization",
  "version": "1.0.0",
  "description": "A custom visualization for the Math Visualization Framework",
  "author": "Your Name",
  "minFrameworkVersion": "1.0.0",
  "defaultSettings": {
    "param1": 100,
    "param2": "#ff0000"
  },
  "uiCategories": [
    {
      "id": "structural",
      "label": "Structural Parameters",
      "settings": ["param1"]
    },
    {
      "id": "visual",
      "label": "Visual Parameters",
      "settings": ["param2"]
    }
  ]
}
```

## Available Hook Points

### Actions (void functions)

- `render`: Called to render the visualization
- `beforeRender`: Called before rendering starts
- `afterRender`: Called after rendering completes
- `onSettingChanged`: Called when a setting changes
- `exportAction`: Called when an export action is triggered

### Filters (modify and return data)

- `availableVisualizations`: Add to the list of available visualizations
- `settingsMetadata`: Define UI controls for settings
- `defaultSettings`: Set default values for settings
- `exportOptions`: Define export options

