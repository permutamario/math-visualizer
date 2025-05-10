# Math Visualization Framework - Plugin System

The Math Visualization Framework is built around a powerful plugin system that enables the creation of diverse mathematical visualizations. This document details how the plugin system works and how to create custom plugins.

## Plugin Architecture

### Plugin Base Class

All plugins inherit from the base `Plugin` class (`src/core/Plugin.js`), which provides:

- Standard lifecycle methods (initialize, activate, deactivate)
- Parameter management
- Visualization registration and switching
- Action handling

### Plugin Metadata

Each plugin class defines static metadata properties:

```javascript
static id = "my-plugin";            // Unique plugin identifier
static name = "My Plugin";          // Human-readable name
static description = "Description"; // Brief description
static renderingType = "2d";        // Rendering environment ("2d" or "3d")
```

### Plugin Lifecycle

1. **Discovery**: `PluginRegistry` loads plugins from `plugin_list.json`
2. **Instantiation**: Plugin class is instantiated when first accessed
3. **Initialization**: `initialize()` is called for lightweight setup
4. **Activation**: `activate()` is called when plugin is selected
5. **Deactivation**: `deactivate()` is called when another plugin is selected

## Visualization System

### Visualization Base Class

Plugins contain one or more visualizations that inherit from the `Visualization` base class (`src/core/Visualization.js`):

```javascript
class MyVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    this.state = { /* visualization-specific state */ };
  }
  
  initialize(parameters) { /* Setup visualization */ }
  update(parameters) { /* Update with new parameters */ }
  render2D(ctx, parameters) { /* 2D rendering */ }
  render3D(THREE, scene, parameters) { /* 3D rendering */ }
  animate(deltaTime) { /* Animation updates */ }
  handleInteraction(type, event) { /* User interaction */ }
  dispose() { /* Clean up resources */ }
}
```

### Visualization Management

A plugin can contain multiple visualizations:

1. Visualizations are registered with the plugin via `registerVisualization(id, visualization)`
2. One visualization is set as the "current" visualization
3. The framework calls the appropriate rendering method based on the plugin's `renderingType`

## Parameter System

### Parameter Schema

Plugins define their parameters using a standardized schema:

```javascript
getParameterSchema() {
  return {
    structural: [
      // Core parameters that define the structure
      {
        id: "numSides",
        type: "slider",
        label: "Number of Sides",
        min: 3,
        max: 20,
        step: 1,
        default: 5
      }
    ],
    visual: [
      // Parameters for visual appearance
      {
        id: "color",
        type: "color",
        label: "Fill Color",
        default: "#3498db"
      }
    ]
  };
}
```

### Parameter Types

The framework supports these parameter control types:

- **slider**: Range input with min/max/step
- **checkbox**: Boolean toggle
- **color**: Color picker
- **dropdown**: Selection from options
- **number**: Numerical input with optional constraints
- **text**: Free text input

### Parameter Handling

1. UI controls are generated from the parameter schema
2. When values change, `onParameterChanged(parameterId, value)` is called
3. The plugin updates its state and visualization accordingly
4. The rendering system is notified to update the display

## Action System

### Action Registration

Plugins can define actions (buttons in the UI) via the `getActions()` method:

```javascript
getActions() {
  return [
    {
      id: "export-png",
      label: "Export as PNG"
    },
    {
      id: "toggle-animation",
      label: "Play/Pause Animation"
    }
  ];
}
```

### Action Handling

When an action button is clicked:

1. `executeAction(actionId, ...args)` is called on the plugin
2. The plugin handles the action or delegates to parent class
3. UI is updated if needed

## Plugin Registration

Plugins are registered in `src/plugins/plugin_list.json`:

```json
[
  "circle-plugin",
  "platonic-solids",
  "asep-plugin",
  "polytope-viewer"
]
```

The framework loads plugins dynamically at startup, making it easy to add or remove visualizations.

## Responsive UI

The framework automatically adapts the UI based on parameters:

- **Desktop**: Parameters are displayed in separate panels
  - Structural parameters on the right
  - Visual parameters on the left
  - Action buttons in an export panel

- **Mobile**: Parameters are displayed in different areas
  - Structural parameters in the header
  - Visual parameters and actions in sliding panels
  - Bottom bar with quick access buttons

## Plugin Best Practices

### State Management

- Store visualization state in the visualization class
- Use the `parameters` object for user-configurable values
- Cache expensive computations in the visualization's state
- Clean up resources in `dispose()` method

### Animation

- Return `true` from `animate()` to request continuous rendering
- Set `isAnimating` property for more efficient rendering
- Use `deltaTime` for frame-rate independent animation

### Interaction

- Handle user events in `handleInteraction(type, event)`
- Supported event types: click, mousedown, mouseup, mousemove, wheel, keydown, keyup
- Convert screen coordinates to visualization coordinates

### Error Handling

- Validate parameters in `onParameterChanged`
- Use try-catch in rendering and animation code
- Report errors via UI notifications

## Advanced Features

### Shared Utilities

Plugins can use shared utility classes for common tasks:

```javascript
// Example from polytope-viewer plugin
import { PolytopeUtils } from '../PolytopeUtils.js';

// Use utility methods
const vertices = PolytopeUtils.createTypeAPermutahedronVertices(4);
```

### Multiple Visualizations

A plugin can provide multiple visualization types:

```javascript
// Register multiple visualizations
this.registerVisualization('default', new DefaultVisualization(this));
this.registerVisualization('alternative', new AlternativeVisualization(this));

// Switch between visualizations
async setVisualization(visualizationId) {
  // Clean up current visualization
  if (this.currentVisualization) {
    this.currentVisualization.dispose();
  }
  
  // Set and initialize new visualization
  this.currentVisualization = this.visualizations.get(visualizationId);
  await this.currentVisualization.initialize(this.parameters);
}
```

### Base Visualization Classes

To share behavior between similar visualizations, create base visualization classes:

```javascript
// Base class for all polytope visualizations
class BasePolytopeVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    /* Common initialization */
  }
  
  /* Common methods */
}

// Specific implementation
class PlatonicVisualization extends BasePolytopeVisualization {
  /* Specific implementation */
}
```

## Performance Considerations

- Minimize DOM updates in animation callbacks
- Use `requestRender()` instead of continuous rendering when possible
- Dispose of THREE.js resources (geometries, materials, textures)
- Use shared geometries and materials for similar objects
- Scale detail level based on device capabilities