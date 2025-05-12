# Math Visualization Framework - Plugin Developer Guide

This comprehensive guide outlines the plugin architecture for the Math Visualization Framework, providing developers with the knowledge needed to create custom visualizations.

## Plugin Architecture Overview

Plugins are the primary extension mechanism for the framework, allowing developers to add new visualizations with minimal boilerplate. Each plugin can contain multiple visualization types, with a flexible parameter system to control the appearance and behavior of visualizations.

## Creating a Basic Plugin

Here's a minimal plugin implementation:

```javascript
import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { CircleVisualization } from './CircleVisualization.js';

export default class CirclePlugin extends Plugin {
  static id = "circle-plugin";
  static name = "Circle Visualization";
  static description = "A simple circle visualization demo";
  static renderingType = "2d";  // Can be "2d" or "3d"

  constructor(core) {
    super(core);
    
    // Define available visualization types
    this.visualizationTypes = [
      {
        id: 'default',
        name: 'Basic Circle',
        class: CircleVisualization
      }
    ];
  }

  // Define plugin-level parameters
  definePluginParameters() {
    return createParameters()
      .addCheckbox('showBoundingBox', 'Show Bounding Box', false)
      .addSlider('globalScale', 'Global Scale', 1.0, { min: 0.5, max: 2.0, step: 0.1 })
      .build();
  }
  
  // Initialize default visualization
  async _initializeDefaultVisualization() {
    // Create and register visualization
    const visualization = new CircleVisualization(this);
    this.registerVisualization('default', visualization);
    
    // Set as current visualization
    this.currentVisualization = visualization;
    
    // Initialize with all parameters
    await visualization.initialize({
      ...this.pluginParameters,
      ...this.visualizationParameters,
      ...this.advancedParameters
    });
    
    return true;
  }
}
```

## Plugin Lifecycle

Plugins follow these lifecycle stages:

1. **Discovery**: The framework discovers available plugins at startup
2. **Instantiation**: When selected, the plugin is instantiated with a reference to the AppCore
3. **Loading**: The `load()` method is called, initializing parameters and visualizations
4. **User Interaction**: The plugin responds to parameter changes and user actions
5. **Unloading**: When another plugin is selected, `unload()` is called to clean up resources

### The Load Method

The framework calls `load()` when the plugin is selected:

```javascript
async load() {
  if (this.isLoaded) return true;
  
  try {
    console.log("Loading plugin...");
    
    // Initialize default visualization
    await this._initializeDefaultVisualization();
    
    // Mark as loaded
    this.isLoaded = true;
    
    // Send parameters to UI
    this.giveParameters(true);
    
    // Update actions
    if (this.core && this.core.uiManager) {
      const actions = this.defineActions();
      this.core.uiManager.updateActions(actions);
    }
    
    return true;
  } catch (error) {
    console.error(`Error loading plugin:`, error);
    await this.unload();
    return false;
  }
}
```

## Parameter System

The parameter system uses a three-tier architecture:

### 1. Parameter Groups

Parameters are organized into three distinct groups:

- **Plugin Parameters**: Global parameters affecting all visualizations
- **Visualization Parameters**: Specific to the currently active visualization
- **Advanced Parameters**: Optional parameters typically hidden by default

### 2. Parameter Definition

Parameters are defined using the `createParameters()` builder:

```javascript
// Plugin parameters
definePluginParameters() {
  return createParameters()
    .addCheckbox('showBoundingBox', 'Show Bounding Box', false)
    .addSlider('globalScale', 'Global Scale', 1.0, { min: 0.5, max: 2.0, step: 0.1 })
    .build();
}

// Advanced parameters
defineAdvancedParameters() {
  return createParameters()
    .addCheckbox('debugMode', 'Debug Mode', false)
    .addNumber('seed', 'Random Seed', 42, { min: 0, max: 1000, step: 1 })
    .build();
}
```

In visualizations, parameters are defined using a static method:

```javascript
// In your Visualization class
static getParameters() {
  return createParameters()
    .addSlider('radius', 'Radius', 100, { min: 10, max: 200, step: 5 })
    .addColor('fillColor', 'Fill Color', '#3498db')
    .addCheckbox('hasStroke', 'Show Outline', true)
    .build();
}
```

### 3. Available Parameter Types

The framework provides these parameter types:

- `addSlider`: Numeric slider with min/max/step
- `addCheckbox`: Boolean toggle
- `addColor`: Color picker
- `addDropdown`: Selection from a list of options
- `addNumber`: Numeric input with min/max/step
- `addText`: Text input field

### 4. Parameter Flow

When parameters change:

1. The framework calls `onParameterChanged(parameterId, value, group)`
2. The plugin updates its internal state
3. The plugin passes relevant parameters to the current visualization via `update()`

## Creating Visualizations

Each plugin can contain multiple visualizations. A basic visualization looks like:

```javascript
import { Visualization } from '../../core/Visualization.js';
import { createParameters } from '../../ui/ParameterBuilder.js';

export class CircleVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Initialize state
    this.state = {
      radius: 100,
      fillColor: '#3498db',
      hasStroke: true
    };
    
    // Set animation flag (used by RenderingManager)
    this.isAnimating = false;
  }

  // Define visualization-specific parameters
  static getParameters() {
    return createParameters()
      .addSlider('radius', 'Radius', 100, { min: 10, max: 200, step: 5 })
      .addColor('fillColor', 'Fill Color', '#3498db')
      .addCheckbox('hasStroke', 'Show Outline', true)
      .build();
  }

  // Initialize the visualization
  async initialize(parameters) {
    this.updateState(parameters);
    return true;
  }

  // Update when parameters change
  update(parameters) {
    this.updateState(parameters);
  }

  // Helper to update state from parameters
  updateState(parameters) {
    if (!parameters) return;
    
    // Only update defined parameters
    if (parameters.radius !== undefined) this.state.radius = parameters.radius;
    if (parameters.fillColor !== undefined) this.state.fillColor = parameters.fillColor;
    if (parameters.hasStroke !== undefined) this.state.hasStroke = parameters.hasStroke;
    
    // Handle global scale from plugin parameters
    if (parameters.globalScale !== undefined) {
      this.state.scaledRadius = this.state.radius * parameters.globalScale;
    }
  }

  // Render the visualization in 2D
  render2D(ctx, parameters) {
    if (!ctx) return;
    
    // Get global parameters
    const showBoundingBox = parameters.showBoundingBox || false;
    const globalScale = parameters.globalScale || 1.0;
    
    // Calculate scaled radius
    const radius = this.state.radius * globalScale;
    
    // Save context state
    ctx.save();
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = this.state.fillColor;
    ctx.fill();
    
    if (this.state.hasStroke) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.restore();
  }

  // Handle user interaction
  handleInteraction(type, event) {
    if (type === 'click') {
      // Calculate distance from center
      const distance = Math.sqrt(event.x * event.x + event.y * event.y);
      
      // Check if click is inside the circle
      const radius = this.state.radius * (this.plugin.pluginParameters.globalScale || 1.0);
      if (distance < radius) {
        // Toggle stroke
        const newStroke = !this.state.hasStroke;
        this.plugin.updateParameter('hasStroke', newStroke, 'visualization');
        return true;
      }
    }
    return false;
  }

  // Clean up resources
  dispose() {
    this.isAnimating = false;
  }
}
```

### Visualization Lifecycle

1. **Registration**: The plugin registers visualizations in `_initializeDefaultVisualization()`
2. **Initialization**: The `initialize()` method receives initial parameters
3. **Updates**: The `update()` method receives parameter changes
4. **Rendering**: The rendering manager calls `render2D()` or `render3D()` methods
5. **Interaction**: The `handleInteraction()` method responds to user interactions
6. **Animation**: The `animate()` method updates state between frames
7. **Disposal**: The `dispose()` method cleans up resources when the visualization is no longer needed

## Multiple Visualizations in a Plugin

Plugins can implement multiple visualization types:

```javascript
constructor(core) {
  super(core);
  
  // Define available visualization types
  this.visualizationTypes = [
    {
      id: 'basic',
      name: 'Basic Shape',
      class: BasicVisualization
    },
    {
      id: 'advanced',
      name: 'Advanced Pattern',
      class: AdvancedVisualization
    },
    {
      id: 'wave',
      name: 'Wave Animation',
      class: WaveVisualization
    }
  ];
}

async _initializeDefaultVisualization() {
  // Create all visualization instances
  for (const vizType of this.visualizationTypes) {
    const visualization = new vizType.class(this);
    this.registerVisualization(vizType.id, visualization);
  }
  
  // Set current visualization to the first one
  this.currentVisualization = this.visualizations.get(this.visualizationTypes[0].id);
  
  // Initialize with all parameters
  await this.currentVisualization.initialize({
    ...this.pluginParameters,
    ...this.visualizationParameters,
    ...this.advancedParameters
  });
  
  return true;
}
```

### Switching Visualizations

When the user selects a different visualization:

1. The plugin receives a parameter change for 'currentVisualization'
2. The plugin calls `setVisualization(visualizationId)`
3. The current visualization is disposed, and the new one is initialized
4. Visualization-specific parameters are reset to defaults
5. UI controls are updated to show the new visualization's parameters

```javascript
async setVisualization(visualizationId) {
  if (!this.visualizations.has(visualizationId)) {
    console.error(`Visualization ${visualizationId} not found`);
    return false;
  }
  
  try {
    // Clean up current visualization
    if (this.currentVisualization) {
      this.currentVisualization.dispose();
    }
    
    // Set new visualization
    this.currentVisualization = this.visualizations.get(visualizationId);
    
    // Reset visualization parameters to defaults
    const vizSchema = this.getVisualizationParameters();
    this.visualizationParameters = this._getDefaultValuesFromSchema(vizSchema);
    
    // Initialize with all parameters
    await this.currentVisualization.initialize({
      ...this.pluginParameters,
      ...this.visualizationParameters,
      ...this.advancedParameters
    });
    
    // Update UI
    this.giveParameters(true);
    
    return true;
  } catch (error) {
    console.error(`Error setting visualization ${visualizationId}:`, error);
    return false;
  }
}
```

## Handling Rendering

The framework supports both 2D and 3D rendering:

### 2D Rendering

For 2D visualizations, implement the `render2D(ctx, parameters)` method:

```javascript
render2D(ctx, parameters) {
  if (!ctx) return;
  
  // Get global parameters
  const showBoundingBox = parameters.showBoundingBox || false;
  const globalScale = parameters.globalScale || 1.0;
  
  ctx.save();
  
  // Draw your visualization here
  ctx.beginPath();
  ctx.arc(0, 0, 100 * globalScale, 0, Math.PI * 2);
  ctx.fillStyle = this.state.fillColor;
  ctx.fill();
  
  ctx.restore();
}
```

Note that the 2D canvas is centered at (0, 0) with y-axis pointing up, and has a camera/transform system for panning and zooming.

### 3D Rendering

For 3D visualizations, implement the `render3D(THREE, scene, parameters)` method:

```javascript
render3D(THREE, scene, parameters) {
  if (!this.state.meshGroup) {
    // Create mesh group to hold all objects
    this.state.meshGroup = new THREE.Group();
    
    // Create geometry
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: parameters.color || 0x3498db
    });
    
    // Create mesh and add to group
    const mesh = new THREE.Mesh(geometry, material);
    this.state.meshGroup.add(mesh);
    
    // Add group to scene
    scene.add(this.state.meshGroup);
  }
  
  // Update existing mesh
  if (parameters.opacity !== undefined) {
    this.state.meshGroup.traverse(child => {
      if (child.material) {
        child.material.opacity = parameters.opacity;
        child.material.transparent = parameters.opacity < 1.0;
        child.material.needsUpdate = true;
      }
    });
  }
}
```

## Animation

To enable animation, set `isAnimating` to true and implement the `animate()` method:

```javascript
constructor(plugin) {
  super(plugin);
  this.isAnimating = true;
  this.state = {
    rotation: 0
  };
}

animate(deltaTime) {
  // Update state based on time elapsed
  this.state.rotation += deltaTime * 0.5;
  
  // Return true if a render is needed
  return true;
}
```

## User Interaction

Handle user interactions in the `handleInteraction()` method:

```javascript
handleInteraction(type, event) {
  if (type === 'click') {
    // Handle click event
    console.log('Clicked at:', event.x, event.y);
    return true; // Return true if handled
  } else if (type === 'mousemove') {
    // Handle mouse movement
    return false; // Return false if not handled
  }
  return false;
}
```

## Plugin Actions

Actions provide buttons for users to trigger specific functionality:

```javascript
defineActions() {
  return [
    ...super.defineActions(), // Include default actions
    {
      id: 'reset-view',
      label: 'Reset View'
    },
    {
      id: 'randomize-colors',
      label: 'Randomize Colors'
    }
  ];
}

executeAction(actionId, ...args) {
  switch (actionId) {
    case 'reset-view':
      // Reset camera view
      if (this.core && this.core.renderingManager) {
        const environment = this.core.renderingManager.getCurrentEnvironment();
        if (environment && typeof environment.resetCamera === 'function') {
          environment.resetCamera();
        }
      }
      return true;
      
    case 'randomize-colors':
      // Generate a random color
      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      this.updateParameter('fillColor', randomColor, 'visualization', true);
      return true;
      
    default:
      // Let parent handle other actions
      return super.executeAction(actionId, ...args);
  }
}
```

## Core Services

The AppCore provides several services through `this.core`:

- `this.core.renderingManager`: Controls rendering and animation
- `this.core.uiManager`: Manages UI updates and user interactions
- `this.core.state`: Application state manager
- `this.core.events`: Event management system
- `this.core.colorSchemeManager`: Theme color management
- `this.core.renderModeManager`: 3D rendering style management (for 3D plugins)

## Best Practices

1. **Clean Separation**: Keep plugin parameters separate from visualization parameters
2. **State Management**: Use the `updateState()` pattern to manage visualization state
3. **Error Handling**: Implement proper error handling in `initialize()`, `update()`, and other async methods
4. **Resource Cleanup**: Always implement `dispose()` to clean up resources
5. **Performance**: Minimize object creation during rendering and animation
6. **UI Feedback**: Show loading indicators and notifications for long operations
7. **Parameter Documentation**: Use clear labels and organize parameters logically
8. **Responsive Design**: Handle canvas resizing and different screen sizes gracefully

## Advanced Features

### 3D Render Modes

For 3D visualizations, utilize the RenderModeManager for consistent styling:

```javascript
render3D(THREE, scene, parameters) {
  // Create mesh group and geometries...
  
  // Apply render mode if available
  if (this.plugin.core.renderModeManager && parameters.renderMode) {
    this.plugin.core.renderModeManager.applyRenderMode(
      scene,
      this.state.meshGroup,
      parameters.renderMode,
      {
        opacity: parameters.opacity,
        colorPalette: this.plugin.core.colorSchemeManager.getPalette(
          parameters.colorPalette || 'default'
        )
      }
    );
  }
}
```

### Color Schemes

Use the ColorSchemeManager for theme-aware colors:

```javascript
render2D(ctx, parameters) {
  // Get current color scheme
  const colorSchemeManager = this.plugin.core.colorSchemeManager;
  const scheme = colorSchemeManager.getActiveScheme();
  
  // Use colors from the scheme
  const textColor = scheme.text;
  const palette = colorSchemeManager.getPalette(parameters.colorPalette || 'default');
  
  // Use in rendering
  ctx.fillStyle = palette[0];
  ctx.strokeStyle = textColor;
}
```

### State Updates

Use the updateParameter method to update parameters and trigger UI updates:

```javascript
handleInteraction(type, event) {
  if (type === 'click') {
    // Update parameter and notify UI
    this.plugin.updateParameter('fillColor', '#ff0000', 'visualization', true);
    return true;
  }
  return false;
}
```

By following these guidelines and patterns, you can create powerful, interactive visualizations that integrate seamlessly with the Math Visualization Framework.