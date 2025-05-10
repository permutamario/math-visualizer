# Math Visualization Plugin Framework

A modular, extensible framework for creating interactive mathematical visualizations through a plugin-based architecture.

## Overview

This framework allows for creating and managing different mathematical visualizations with a consistent UI. The plugin architecture ensures that new visualizations can be added without modifying core code. Each visualization exists as a separate plugin with its own settings, controls, and rendering logic.

## Table of Contents

- [Directory Structure](#directory-structure)
- [Core Components](#core-components)
- [Plugin System](#plugin-system)
- [Plugin Lifecycle](#plugin-lifecycle)
- [Manifest-Based Plugin Registration](#manifest-based-plugin-registration)
- [UI System](#ui-system)
- [State Management](#state-management)
- [Rendering Environments](#rendering-environments)
- [Getting Started](#getting-started)
- [Creating Plugins](#creating-plugins)
- [Debug Tools](#debug-tools)

## Directory Structure

```
[project root]
├── index.html                # Main entry point HTML
├── styles/                   # CSS styles
│   ├── base.css              # Global styles
│   ├── desktop.css           # Desktop-specific styles
│   ├── mobile.css            # Mobile-specific styles
│   └── loading.css           # Loading screen styles
└── src/
    ├── index.js              # Application bootstrap
    ├── core/                 # Core functionality
    │   ├── app.js            # Main application controller
    │   ├── pluginManager.js  # Plugin discovery and loading
    │   ├── PluginController.js    # Plugin lifecycle management
    │   ├── PluginControllerRegistry.js  # Registry of plugin controllers 
    │   ├── stateManager.js   # State management
    │   ├── canvasManager.js  # Canvas rendering
    │   ├── hooks.js          # Plugin hook system
    │   ├── utils.js          # Utility functions
    │   └── renderingEnvironments/ # Rendering environments
    │       ├── baseEnvironment.js        # Base environment class
    │       ├── 2dCameraEnvironment.js    # 2D with camera controls
    │       ├── 2dEventEnvironment.js     # 2D with event handling
    │       ├── 3dCameraEnvironment.js    # 3D with camera controls
    │       └── environmentFactory.js     # Environment factory
    ├── ui/                   # User interface
    │   ├── baseControls.js   # UI control components
    │   ├── desktopUI.js      # Desktop interface
    │   └── mobileUI.js       # Mobile interface
    └── plugins/              # Plugin directory
        ├── square/           # Example square plugin (2D camera)
        │   ├── index.js      # Plugin implementation
        │   └── manifest.json # Plugin metadata
        ├── circle/           # Example circle plugin (2D event)
        │   ├── index.js      # Plugin implementation
        │   └── manifest.json # Plugin metadata
        ├── cube/             # Example cube plugin (3D camera)
        │   ├── index.js      # Plugin implementation
        │   └── manifest.json # Plugin metadata
        └── interactive/      # Example interactive plugin (2D event)
            ├── index.js      # Plugin implementation
            └── manifest.json # Plugin metadata
└── vendors/                  # Third-party libraries
    ├── three.module.js       # THREE.js library
    └── cameraControls3d/     # Camera controls for 3D environment
        └── camera-controls.module.js  # Camera controls module
```

## Core Components

### src/index.js

The application entry point that bootstraps the framework:
- Detects the platform (mobile/desktop)
- Initializes the app core
- Loads available plugins (registration only)
- Sets up the appropriate UI
- Initializes and activates the default plugin only
- Handles the loading screen
- Manages the initialization sequence

### src/core/app.js

The central controller for the application:
- Initializes the framework components
- Manages the plugin lifecycle through the Plugin Controller Registry
- Coordinates between plugins and the UI
- Handles the rebuilding of UI components
- Manages settings and metadata for active plugins
- Sets up appropriate rendering environments
- Provides global access to core functionality
- Handles plugin loading screens and transitions

### src/core/pluginManager.js

Responsible for discovering and managing plugins:
- Scans for available plugins
- Registers plugins with the Plugin Controller Registry
- Only initializes plugins when actually needed
- Manages plugin initialization
- Provides information about available plugins

### src/core/PluginController.js

Manages the complete lifecycle of individual plugins:
- Controls the plugin states (registered, ready, active, error)
- Ensures metadata and settings are properly loaded
- Manages plugin resources
- Centralizes plugin activation/deactivation logic
- Ensures settings changes are properly propagated

### src/core/PluginControllerRegistry.js

Maintains a registry of all plugin controllers:
- Tracks the active plugin
- Manages plugin state transitions
- Ensures only one plugin is active at a time
- Handles plugin activation/deactivation sequences
- Provides access to plugin controllers

### src/core/stateManager.js

A centralized state management system:
- Maintains the application state
- Provides methods to get and update state values
- Emits events when state changes
- Supports nested state paths using dot notation
- Handles subscriptions to state changes

### src/core/canvasManager.js

Manages the canvas element and rendering:
- Creates and initializes the canvas
- Provides the rendering loop
- Sets up appropriate rendering environments
- Calls plugin render functions
- Handles canvas resizing
- Manages animation
- Supports exporting canvas content

### src/core/hooks.js

A flexible hook system that allows plugins to extend functionality:
- Supports action hooks for performing operations
- Supports filter hooks for modifying data
- Provides plugin isolation 
- Manages hook priority
- Ensures the correct plugin is called for specific operations

### src/core/utils.js

Utility functions used throughout the application:
- Platform detection (mobile/desktop)
- Event emitter for publisher/subscriber pattern
- Debounce and throttle functions
- Toast notification system

## Plugin System

The framework uses a plugin architecture that allows for easy extension. Each plugin is isolated and has its own:
- Settings and metadata
- Rendering logic
- UI controls
- Export options
- Environment requirements

## Plugin Lifecycle

The framework implements a clean plugin lifecycle that ensures complete separation between visualizations:

### 1. Registration
- Plugin is registered with the framework
- Manifest is loaded
- No initialization occurs yet

### 2. Activation
- Plugin is activated when selected by the user
- All initialization happens at this point
- Rendering environment is set up
- Resources are allocated
- Initial state is established
- UI controls are generated based on manifest
- First render occurs

### 3. Active State
- Plugin handles rendering
- Plugin responds to user interactions
- Plugin reacts to setting changes
- Plugin handles animation frames

### 4. Deactivation
- Plugin is deactivated when user switches to another visualization
- All resources are released
- All state is cleared
- No information persists for next activation
- Complete cleanup ensures no memory leaks

### 5. Re-Activation
- If the plugin is selected again, it starts fresh
- Treated as if it's the first activation
- Previous state is not restored
- All initialization happens again

This approach ensures a clean separation between visualizations, prevents state leakage between activations, and makes each visualization truly independent.

## Manifest-Based Plugin Registration

The framework uses a declarative, manifest-based approach for plugin registration:

### Key Components

1. **manifest.json**: A declarative configuration file that defines:
   - Plugin metadata (ID, name, description)
   - Environment requirements
   - Hook bindings
   - Default settings
   - UI controls metadata
   - Export options

2. **Implementation Files**:
   - `requiredFunctions.js`: Core visualization functions (render, activate, deactivate, etc.)
   - `exportActions.js`: Export-related functionality
   - `interactionHandlers.js`: User interaction handlers

3. **Plugin Entry Point**:
   - `index.js`: Imports the manifest and implementation files and registers the plugin

This approach simplifies plugin development by handling boilerplate code, providing clear separation of concerns, and making plugins self-documenting.

### Hooks in the Lifecycle

- `activate`: Complete initialization, create all resources, set up environment
- `render`: Draw the visualization based on current settings
- `beforeRender`: Handle animation frames or prepare for rendering
- `afterRender`: Perform any post-render operations
- `settingChanged`: React to user changing settings
- `deactivate`: Complete cleanup, release all resources, reset state
- Various event handlers (click, mousemove, etc.): Handle user interactions

## UI System

### src/ui/baseControls.js

Factory functions for creating UI controls:
- Sliders for numeric values
- Checkboxes for boolean values
- Color pickers for color values
- Dropdowns for selection
- Number inputs for precise numeric values
- Buttons for actions
- Vector inputs for multi-value inputs

### src/ui/desktopUI.js

Builds and manages the desktop user interface:
- Creates control panels for different parameter types
- Builds plugin selector dropdown
- Creates the visual parameters panel
- Creates the structural parameters panel
- Creates the export options panel
- Creates a debug panel when debug mode is enabled
- Handles UI rebuilding when plugin changes

### src/ui/mobileUI.js

Builds and manages the mobile user interface:
- Creates a mobile-optimized layout
- Adds touch-friendly controls
- Uses collapsible menus to save screen space
- Adapts desktop controls for mobile use
- Handles UI rebuilding for mobile devices

## State Management

The framework uses a centralized state store with these key sections:

### Core State
- `plugins`: Registered plugin objects
- `activePluginId`: Currently active plugin
- `previousPluginId`: Previously active plugin
- `currentEnvironment`: Currently active environment type
- `pluginLoading`: Whether a plugin is loading
- `loadingPluginId`: ID of the plugin currently loading

### UI State
- `availablePlugins`: List of available plugins
- `rebuildUI`: Flag to trigger UI rebuilding

### Settings and Metadata
- `settings`: Current settings values
- `settingsMetadata`: Metadata about settings (type, range, etc.)
- `exportOptions`: Available export options

### Debug Options
- `debugMode`: Whether debug mode is enabled
- `debugOptions`: Available debug options

## Rendering Environments

The framework includes a flexible rendering environment system that allows plugins to specify their control scheme requirements.

### Available Environments

#### 2D Camera Environment (`2d-camera`)

This environment provides a 2D canvas with camera controls:
- Panning via mouse drag
- Zooming via mouse wheel
- Camera transformations applied automatically
- Coordinate system centered at origin

Use this environment for visualizations that need camera navigation.

#### 2D Event Environment (`2d-event`)

This environment passes interaction events directly to plugins:
- Mouse events: `onClick`, `onMouseDown`, `onMouseMove`, `onMouseUp`
- Keyboard events: `onKeyDown`, `onKeyUp`
- Wheel events: `onWheel`

Use this environment for interactive visualizations that need to handle user input directly.

#### 3D Camera Environment (`3d-camera`)

This environment provides 3D rendering with THREE.js:
- WebGL-based 3D rendering
- Uses camera-controls package for camera navigation
- Manages scene, camera, and lighting setup
- Supports complex 3D visualizations
- Requires THREE.js library

This environment supports advanced 3D visualization and must be properly initialized with THREE.js. It requires the camera-controls library to be properly installed and initialized with THREE.js.

### Specifying Environment in Plugin Manifest

Plugins specify their environment requirements in the manifest:

```json
{
  "environment": {
    "type": "2d-camera",
    "options": {
      "initialZoom": 1.0
    }
  }
}
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of JavaScript (for plugin development)
- For 3D visualizations: Understanding of THREE.js basics

### Installation

1. Clone the repository
2. Open `index.html` in a browser or use a local server

### Usage

1. Select a visualization from the dropdown menu
2. Adjust parameters using the control panels:
   - **Structural Parameters**: Change the mathematical object itself
   - **Visual Parameters**: Adjust appearance (colors, opacity, etc.)
3. Use export options to save your visualizations

## Creating Plugins

To create a new plugin:

1. Create a directory in `src/plugins/` with your plugin name
2. Create the plugin files:
   - `manifest.json`: Plugin configuration
   - `requiredFunctions.js`: Core visualization functions
   - `exportActions.js`: Export-related functionality
   - `interactionHandlers.js`: User interaction handlers
   - `index.js`: Plugin entry point
3. Register your plugin in `pluginManager.js`

This modular, declarative approach simplifies plugin development by handling boilerplate code while you focus on creating outstanding visualizations.

### Recommended File Structure

```
src/plugins/myPlugin/
├── manifest.json           # Plugin configuration
├── requiredFunctions.js    # Core visualization functions
├── exportActions.js        # Export-related functionality
├── interactionHandlers.js  # User interaction handlers
└── index.js                # Main entry point
```

## Dependencies for 3D Visualization

The 3D environment has specific dependencies:

1. **THREE.js**: The core 3D rendering library
   - Required for all 3D visualizations
   - Must be loaded before any 3D environment is initialized

2. **camera-controls**: A camera control library for THREE.js
   - Provides smooth camera navigation
   - Must be initialized with THREE.js reference

The framework handles the initialization of these dependencies, but plugin developers should be aware of them when creating 3D visualizations.

## Debug Tools

The framework includes several debug tools:

### Debug Panel
- Displays current state information
- Shows active plugin
- Counts settings and metadata
- Provides a log of state changes

### Debug Controls
- Log State: Outputs the complete state to the console
- Force UI Rebuild: Manually triggers UI rebuilding
- Show FPS: Displays frames per second
- Show Boundaries: Shows canvas boundaries
- Log Events: Logs state changes

### Console Logging
- Extensive logging during initialization
- Plugin loading and activation logging
- UI building process logging
- State change logging
- Rendering process logging

## Browser Support

The framework is designed to work on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Note: 3D features require WebGL support in the browser.
