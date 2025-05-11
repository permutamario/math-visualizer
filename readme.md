# Math Visualization Framework

A modular, extensible framework for creating interactive mathematical visualizations in 2D and 3D.

## Overview

The Math Visualization Framework provides a plugin-based architecture for creating and exploring mathematical visualizations. It supports both 2D canvas and 3D WebGL rendering, seamlessly switching between them based on the active plugin's requirements.

## Architecture Style

The framework follows an event-driven, component-based architecture with clear separation of concerns:

- **Modular Design**: Core functionality is separated into independent, loosely coupled components
- **Event-Driven Communication**: Components interact through events rather than direct method calls
- **Layered Architecture**: Clear separation between core, rendering, UI, and plugin layers
- **Dependency Injection**: Components receive their dependencies through constructors
- **Observable State**: State changes are propagated through listeners/subscribers
- **Command Pattern**: Actions are encapsulated as commands that can be executed and tracked
- **Plugin-Based Extension**: Core functionality is extended through a plugin system

## Features

- **Plugin-based Architecture**: Easily extend with custom visualizations
- **Dual Rendering Support**: 2D canvas and 3D WebGL environments
- **Responsive UI**: Adapts to both desktop and mobile devices
- **Intuitive Parameter System**: Simplified fluent interface for defining UI controls
- **Theme Support**: Light and dark mode with customizable color schemes
- **Export Capabilities**: Save visualizations as PNG images

## Core Architecture

The framework is built with a modular architecture to ensure clean separation of concerns:

### Component Interactions

Components interact primarily through events and well-defined interfaces:

```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   AppCore     │◄────►│  UIManager    │◄────►│  User         │
│   ----------  │      │  ----------   │      │  Interface    │
│   Coordinates │      │  Builds UI    │      │  Controls     │
│   Components  │      │  from Schemas │      └───────────────┘
└───────┬───────┘      └───────┬───────┘               ▲
        │                      │                       │
        ▼                      ▼                       │
┌───────────────┐      ┌───────────────┐      ┌───────┴───────┐
│ PluginSystem  │      │ Parameter     │      │ Rendering     │
│ ----------    │◄────►│ Builder       │◄────►│ Manager       │
│ Loads/Manages │      │ ----------    │      │ ----------    │
│ Plugins       │      │ Creates UI    │      │ Manages 2D/3D │
└───────┬───────┘      │ Controls      │      │ Environments  │
        │              └───────────────┘      └───────────────┘
        ▼                                             ▲
┌───────────────┐                            ┌────────┴──────┐
│ Active Plugin │                            │ Visualization │
│ ----------    │◄───────────────────────────┤ ----------    │
│ Parameters    │                            │ Renders to    │
│ Visualizations│                            │ Canvas/WebGL  │
└───────────────┘                            └───────────────┘
```

### Core Components

- **AppCore**: Central controller that coordinates all components
- **StateManager**: Manages application state with subscription capabilities
- **ParameterBuilder**: Creates UI controls with a simplified fluent interface
- **EventEmitter**: Provides event-based communication between components
- **ColorSchemeManager**: Handles theme colors and palette management
- **PluginDiscovery**: Dynamically loads available plugins

### Rendering System

- **RenderingManager**: Coordinates between rendering environments
- **Canvas2DEnvironment**: Handles 2D canvas rendering with pan/zoom
- **ThreeJSEnvironment**: Provides 3D rendering via THREE.js

### UI System

- **UIManager**: Controls UI creation based on device type
- **DesktopLayout**: Desktop-specific UI with floating panels
- **MobileLayout**: Mobile-specific UI with sliding menus
- **UIBuilder**: Creates UI controls from parameter definitions

### Plugin System

- **Plugin**: Base class for all visualization plugins with streamlined parameter definition
- **Visualization**: Base class for rendering implementations
- **ParameterBuilder**: Fluent interface for defining UI controls

### Plugin Lifecycle

The framework implements a well-defined lifecycle for plugins:

1. **Discovery**:
   - The application scans the `plugin_list.json` file
   - Plugin metadata is collected (id, name, description, renderingType)
   - Plugin classes are dynamically imported but not instantiated

2. **Instantiation**:
   - When a plugin is selected, its class is instantiated
   - The plugin receives a reference to the AppCore
   - Memory is allocated only for active plugins

3. **Loading**:
   - The `load()` method is called on the plugin
   - Parameters are defined using the fluent ParameterBuilder interface
   - Visualizations are created and initialized
   - UI controls are built based on the parameter definitions
   - The appropriate rendering environment (2D/3D) is activated

4. **Interaction**:
   - Parameter changes from UI are passed to the plugin's onParameterChanged method
   - The plugin updates its state and passes just changed parameters to visualization
   - Rendering is triggered to reflect changes
   - Action buttons trigger plugin methods

5. **Animation**:
   - If the visualization has animation, the render loop calls `animate(deltaTime)`
   - The visualization returns whether continuous rendering is needed

6. **Unloading**:
   - When another plugin is selected, the current plugin's `unload()` method is called
   - Resources are released (visualizations disposed, event handlers removed)
   - The plugin returns to a clean state for potential reuse

7. **Cleanup**:
   - When the application shuts down, all active plugins are unloaded
   - All framework resources are properly disposed

## Available Visualizations

The framework includes several example plugins:

### Circle Plugin
A simple 2D visualization demonstrating basic framework capabilities.

### Polytope Viewer
An advanced 3D visualization for exploring different polytopes:
- Platonic Solids (tetrahedron, cube, octahedron, dodecahedron, icosahedron)
- Permutahedron
- Root Polytope (A3, B3, C3, D3, H3 types)
- Stellahedron
- Orbit Polytope
- Associahedron

### ASEP Simulation
Asymmetric Simple Exclusion Process simulation with multiple variants:
- Closed Linear ASEP
- Open Boundary ASEP
- Circular ASEP

## Creating Your Own Plugin

Plugins consist of two main components:

1. **Plugin Class**: Manages parameters and visualizations
2. **Visualization Classes**: Handle the actual rendering

### Application Flow

When a user interacts with the framework, the following sequence occurs:

1. **User Action**:
   - User selects a plugin or changes a parameter via the UI
   - The UIManager captures the event

2. **Event Propagation**:
   - For plugin selection: UIManager emits a 'pluginSelect' event
   - For parameter changes: UIManager emits a 'parameterChange' event
   - AppCore receives these events through its event handlers

3. **Plugin Management**:
   - For plugin selection: AppCore loads the selected plugin
   - For parameter changes: AppCore forwards to the plugin's onParameterChanged method

4. **Parameter Processing**:
   - Plugin updates its state and passes only changed parameters to visualizations
   - Visualization's `update()` method handles specific parameter changes

5. **Rendering**:
   - Plugin requests a render through RenderingManager
   - RenderingManager activates the appropriate environment
   - Visualization's `render2D()` or `render3D()` method is called
   - Result is displayed on screen

### Step 1: Create Plugin Directory

```
src/plugins/your-plugin/
```

### Step 2: Create Plugin Main Class

```javascript
// src/plugins/your-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { YourVisualization } from './YourVisualization.js';

export default class YourPlugin extends Plugin {
  static id = "your-plugin";
  static name = "Your Plugin";
  static description = "Description of your plugin";
  static renderingType = "2d"; // or "3d"

  // Define parameters using the fluent interface
  defineParameters() {
    return createParameters()
      .addSlider('paramName', 'Parameter Label', 50, { min: 0, max: 100, step: 1 })
      .addColor('color', 'Color', '#3498db', 'visual');
  }
  
  // Define available actions
  defineActions() {
    return [
      ...super.defineActions(),
      {
        id: 'custom-action',
        label: 'Custom Action'
      }
    ];
  }

  // Initialize visualization
  async _initializeDefaultVisualization() {
    const visualization = new YourVisualization(this);
    this.registerVisualization('default', visualization);
    this.currentVisualization = visualization;
    await visualization.initialize(this.parameters);
  }
  
  // Handle parameter changes
  onParameterChanged(parameterId, value) {
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Update visualization with just the changed parameter
    if (this.currentVisualization) {
      this.currentVisualization.update({ [parameterId]: value });
    }
    
    // Update UI
    this.giveParameters(false);
    
    // Request render
    if (this.core && this.core.renderingManager) {
      this.core.renderingManager.requestRender();
    }
  }
  
  // Handle custom actions
  executeAction(actionId, ...args) {
    if (actionId === 'custom-action') {
      // Handle custom action
      return true;
    }
    
    // Let parent handle standard actions
    return super.executeAction(actionId, ...args);
  }
}
```

### Step 3: Create Visualization Class

```javascript
// src/plugins/your-plugin/YourVisualization.js
import { Visualization } from '../../core/Visualization.js';

export class YourVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    this.state = { /* visualization state */ };
  }

  async initialize(parameters) {
    // Setup with initial parameters
    return true;
  }

  update(parameters) {
    // Update based on changed parameters only
    if (parameters.paramName !== undefined) {
      // Handle paramName change
    }
    
    if (parameters.color !== undefined) {
      // Handle color change
    }
  }

  // For 2D rendering
  render2D(ctx, parameters) {
    // Implement 2D rendering
  }

  // OR for 3D rendering
  render3D(THREE, scene, parameters) {
    // Implement 3D rendering
  }

  animate(deltaTime) {
    // Update animation (return true to request continuous rendering)
    return false;
  }

  handleInteraction(type, event) {
    // Handle user interaction
    return false;
  }

  dispose() {
    // Clean up resources
  }
}
```

### Step 4: Register Your Plugin

Add your plugin to `src/plugins/plugin_list.json`:

```json
[
  "circle-plugin",
  "polytope-viewer",
  "asep-plugin",
  "your-plugin"
]
```

## Parameter Builder System

The new parameter builder system provides a simple, intuitive interface for defining UI controls:

```javascript
// Import the parameter builder
import { createParameters } from '../../ui/ParameterBuilder.js';

// Define parameters using fluent interface
defineParameters() {
  return createParameters()
    .addSlider('radius', 'Radius', 100, { min: 10, max: 200, step: 5 })
    .addColor('fillColor', 'Fill Color', '#3498db')
    .addCheckbox('stroke', 'Show Outline', true)
    .addDropdown('shape', 'Shape Type', 'circle', [
      { value: 'circle', label: 'Circle' },
      { value: 'square', label: 'Square' },
      { value: 'triangle', label: 'Triangle' }
    ])
    .addNumber('opacity', 'Opacity', 1.0, { min: 0, max: 1, step: 0.1 })
    .addText('label', 'Label Text', 'Hello World');
}
```

Available parameter types:

- **addSlider**: Range slider with min/max/step
- **addCheckbox**: Boolean toggle
- **addColor**: Color picker
- **addDropdown**: Selection from options
- **addNumber**: Numeric input field
- **addText**: Text input field

Parameters are organized into two categories:
- **structural**: Core parameters defining the visualization structure (default for sliders, dropdowns, numbers, text)
- **visual**: Parameters affecting visual appearance (default for color, checkbox)

You can override the default category by passing a category parameter:
```javascript
.addColor('borderColor', 'Border Color', '#000000', 'structural')
.addCheckbox('showGrid', 'Show Grid', true, 'structural')
```

## User Interface

The framework provides responsive UI that adapts to the device:

### Desktop UI
- Floating panels for parameters
- Plugin selector dropdown
- Export options panel
- Fullscreen toggle

### Mobile UI
- Header with structural controls
- Bottom action bar
- Sliding panels for options
- Touch-friendly controls

## Browser Support

The framework requires modern browser features:
- ES6 Module support
- Canvas 2D API
- WebGL for 3D visualizations
- CSS Custom Properties

## Installation and Setup

1. Clone the repository
2. Serve the files using a local web server
3. Open the application in a browser

No build step is required as the framework uses native ES modules.

## License

[License information]