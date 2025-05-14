# Math Visualization Framework: Key Rules and Best Practices

## Core Principles

The Math Visualization Framework is built on four foundational principles that guide all development:

1. **Single Plugin Model**: Only one plugin is active at any time, simplifying concerns around dependencies and conflicts.

2. **Scripting-like API**: The framework provides declarative helper methods that allow plugins to define what they need without specifying how those needs are implemented.

3. **Event-Driven Pattern**: Visualization updates happen in response to parameter changes rather than through explicit render calls.

4. **Clean Lifecycle**: Plugins have well-defined load and unload phases with automatic resource management.

## Essential Rules

### 1. Use Helper Methods, Not Direct Library Access

- **DO NOT** directly interact with Konva or Three.js objects without using the framework's helper methods.
- **DO** use the environment objects provided by the framework (`this.renderEnv`).
- **DO** register created resources with the appropriate registration methods for proper cleanup.

```javascript
// INCORRECT - Direct manipulation
const circle = new Konva.Circle({ x: 100, y: 100, radius: 50 });
layer.add(circle);

// CORRECT - Using framework environment
const { konva, layer } = this.renderEnv;
const circle = new konva.Circle({ x: 100, y: 100, radius: 50 });
layer.add(circle);
```

### 2. Parameters Are the Single Source of Truth

- **DO** use helper methods (`addSlider`, `addCheckbox`, etc.) to define parameters.
- **DO NOT** store duplicate parameter values as local state.
- **DO** use `getParameter()` to access current values when needed.
- **DO** use `setParameter()` to update values, never modify them directly.

```javascript
// INCORRECT - Storing duplicate state
this.radius = 50; // Local copy
this.addSlider('radius', 'Circle Radius', 50);

// CORRECT - Single source of truth
this.addSlider('radius', 'Circle Radius', 50);
// Later, to use the value:
const radius = this.getParameter('radius');
```

### 3. Use the Framework's Color System

- **NEVER** define custom colors directly - always use the color system helpers.
- **DO** use structural colors for UI elements (`getStructuralColor()`).
- **DO** use main colors for primary visualization elements (`getMainColor()`).
- **DO** use functional colors for elements with specific meaning (`getFunctionalColor()`).
- **DO** register for palette changes using `onPaletteChanged()`.

```javascript
// INCORRECT - Hardcoded colors
circle.fill('#ff0000');

// CORRECT - Using color system
circle.fill(this.getMainColor(0)); // Primary element
gridLines.stroke(this.getStructuralColor('grid')); // Grid lines
errorMark.fill(this.getFunctionalColor('negative')); // Error indicator
```

### 4. Respect the Plugin Lifecycle

- **DO** implement the `start()` method for initialization.
- **DO** call `super.unload()` in your `unload()` method.
- **DO** clean up all created resources during unload.
- **DO NOT** store state outside the plugin instance.

```javascript
async start() {
  // Initialize parameters and rendering objects
}

async unload() {
  // Clean up plugin-specific resources
  if (this.meshGroup) {
    this.meshGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.meshGroup = null;
  }
  
  // Let the base class handle animations and events
  await super.unload();
}
```

### 5. Let the Framework Handle Rendering

- **DO NOT** call `renderer.render()` or `layer.batchDraw()` directly in most cases.
- **DO** use the framework's animation system (`requestAnimation()`).
- **DO** call `this.refresh()` after parameter changes that require a visual update.
- **DO** cancel animations in `unload()` or use `super.unload()` to handle this automatically.

## Best Practices

### Organize Parameters Properly

- Group parameters appropriately:
  - **Visual**: Appearance and style (colors, sizes, visibility)
  - **Structural**: Core behavior and data structure (algorithm parameters, data sources)
  - **Advanced**: Technical details (performance options, debug settings)

```javascript
// Visual parameters (primary UI controls)
this.addSlider('radius', 'Circle Radius', 50, { min: 10, max: 100 });
this.addColorPalette(); // Use the color system

// Structural parameters (change how the visualization works)
this.addDropdown('algorithm', 'Algorithm', 'fast', ['fast', 'precise'], 'structural');

// Advanced parameters (technical details, rarely changed)
this.addCheckbox('useCache', 'Use Caching', true, 'advanced');
```

### Implement Parameter Change Handlers

- Respond to parameter changes in `onParameterChanged()` method.
- Avoid expensive calculations in the handler; schedule them if needed.
- Call `this.refresh()` after visual updates.

```javascript
onParameterChanged(parameterId, value, group) {
  if (parameterId === 'radius') {
    // Update radius directly on the object
    if (this.circle) {
      this.circle.radius(value);
    }
  } else if (parameterId === 'algorithm') {
    // More expensive change - recalculate data
    this.recalculateData();
  }
  
  // Refresh will update the visualization
  this.refresh();
}
```

### Use the Animation System Correctly

- Use `requestAnimation()` for continuous animations.
- Handle `deltaTime` to ensure consistent speed across devices.
- Return `false` from the animation callback to stop it, or `true` to continue.

```javascript
start() {
  // Start animation
  this.animationHandler = this.requestAnimation(this.animate.bind(this));
}

animate(deltaTime) {
  // Update based on elapsed time, not frame count
  this.rotation += deltaTime * this.getParameter('speed');
  
  // Update objects
  if (this.shape) {
    this.shape.rotation(this.rotation);
  }
  
  return true; // Continue animation
}
```

### Handle User Interaction Properly

- Implement `handleInteraction()` to respond to user events.
- Update parameters through `setParameter()` to maintain consistency.
- Use event data to determine interaction context.

```javascript
handleInteraction(type, data) {
  if (type === 'click') {
    // Check if the user clicked on a specific object
    if (data.target === this.controlPoint) {
      // Update parameter rather than object directly
      this.setParameter('controlPointActive', true);
    }
  }
}
```

### Optimize Rendering

- Use dirty flags to avoid unnecessary redraws.
- Batch related changes together.
- Use appropriate level of detail based on viewport size.
- Consider using object pools for frequently created/destroyed objects.

```javascript
// Track what needs updating
this.isDirtyGrid = true;
this.isDirtyCurves = false;

// In animation loop
animate(deltaTime) {
  // Only update what's needed
  if (this.isDirtyGrid) {
    this.updateGrid();
    this.isDirtyGrid = false;
  }
  
  if (this.isDirtyCurves) {
    this.updateCurves();
    this.isDirtyCurves = false;
  }
  
  return true;
}
```

### Follow the Color System Principles

- Never define your own colors; always use the framework's color system.
- Map structural elements to appropriate structural colors.
- Use main colors for primary visualization elements.
- Use functional colors for elements with specific meaning.
- Register for palette changes to update colors when the theme changes.

```javascript
// Register for palette changes
this.onPaletteChanged(() => {
  // Update colors when palette changes
  this.grid.stroke(this.getStructuralColor('grid'));
  this.dataSeries.forEach((series, i) => {
    series.stroke(this.getMainColor(i));
  });
  this.errorIndicator.fill(this.getFunctionalColor('negative'));
  
  // Mark for update
  this.isDirtyColors = true;
});
```

By following these rules and best practices, plugins will maintain consistency with the framework's philosophy and provide users with a seamless experience across visualizations.