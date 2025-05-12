# Math Visualization Framework: Architecture Philosophy

## Core Philosophy

The Math Visualization Framework is built on a component plugin architecture that emphasizes clean separation of concerns, an intuitive API, and clear responsibilities. This document outlines the guiding principles and rules that define how the framework and plugins interact.

## Key Architecture Principles

1. **Single Plugin Model**: Only one plugin is active at any time, simplifying concerns around dependencies and conflicts.

2. **Scripting-like API**: The core provides a simple, declarative interface that allows plugins to define what they need without specifying how those needs are implemented.

3. **Event-Driven Pattern**: Visualization updates happen in response to parameter changes rather than through explicit render calls.

4. **Clean Lifecycle**: Plugins have well-defined load and unload phases to ensure proper resource management.

5. **Rendering Abstraction**: Plugins define what to render, not how to render it, insulating them from rendering implementation details.

## Component Responsibilities

### Core Framework Responsibilities

1. **State Management**
   - Maintain state for parameters and actions
   - Notify plugins when parameters change
   - Store default values and parameter schemas

2. **User Interface Management**
   - Automatically generate UI elements based on plugin requirements
   - Handle layout and positioning of UI elements
   - Manage responsive behavior between mobile and desktop views

3. **API Provision**
   - Expose simple methods for plugins to register parameters and actions
   - Provide consistent interfaces for environmental information (canvas, context, scene, etc.)
   - Maintain rendering environments (2D and 3D)

4. **Animation and Rendering Loop**
   - Control the animation loop timing
   - Invoke plugin's animate method when appropriate
   - Manage the active rendering environment
   - Handle window resizing and other environmental changes

5. **Visual Theming**
   - Provide color schemes and theme management
   - Apply rendering modes for 3D visualization
   - Ensure consistent visual presentation

### Plugin Responsibilities

1. **Initialization and Cleanup**
   - Define parameters needed for the visualization
   - Register actions for user interaction
   - Release all resources during unload

2. **Logic Implementation**
   - Define visualization logic in response to parameters
   - Implement animation behavior as needed
   - Create and update visualization artifacts

3. **State Reaction**
   - React appropriately to parameter changes
   - Update the visualization state when parameters change
   - Handle user-initiated actions

## Rules for Implementation

### Rules for Core Framework

1. **Never request plugins to render explicitly** - rendering happens automatically through the animation loop.

2. **Always clean up completely between plugin changes** - parameters, actions, and UI elements must reset.

3. **Maintain consistent APIs** - the plugin-facing API should remain stable and predictable.

4. **Handle all environmental concerns** - window resizing, device compatibility, and rendering contexts are core responsibilities.

5. **Provide meaningful defaults** - color palettes, rendering modes, and control behavior should have reasonable defaults.

6. **Abstract implementation details** - plugins should not need to know how UI elements are created or positioned.

7. **Enable declarative parameter definition** - parameter registration should be simple and descriptive.

8. **Manage the animation loop internally** - plugins should never need to request frames or manage animation timing.

### Rules for Plugins

1. **Must implement load and unload lifecycle methods** - with proper resource management in both.

2. **Never manipulate DOM or UI directly** - use the core API for UI needs.

3. **Never store state outside of the plugin instance** - all state should be contained within the plugin or requested through core APIs.

4. **Initialize all resources in the start method** - which is called after the environment is ready.

5. **Register all parameters during initialization** - parameters define the interface between plugin and user.

6. **Respond to parameter changes, don't poll for them** - use the onParameterChanged method.

7. **Clean up ALL resources during unload** - particularly important for 3D objects, event listeners, and timers.

8. **Use provided rendering abstractions** - work with the environment provided by the core, don't create custom rendering pipelines.

## Communication Patterns

1. **Core to Plugin**:
   - Parameter change notifications
   - Animation frame updates
   - Action invocations

2. **Plugin to Core**:
   - Parameter registration
   - Action registration
   - State updates through APIs

3. **User to Plugin**:
   - Parameter changes (via UI)
   - Action triggers (via UI)

## Benefits of This Architecture

1. **Simplified Plugin Development**: Developers focus on visualization logic, not framework details.

2. **Clean Separation of Concerns**: Core and plugins have clearly defined responsibilities.

3. **Resource Management**: The single-plugin model ensures clean loading and unloading.

4. **Consistent User Experience**: UI generation and theming handled by the core creates a unified experience.

5. **Extensibility**: New plugins can be created without modifying the core.

6. **Maintainability**: Well-defined interfaces make both core and plugin code easier to maintain.

## Implementation Example

```javascript
// Core provides parameter builder API
const params = core.createVisualParameters()
  .addSlider('amplitude', 'Wave Amplitude', 1.0, { min: 0, max: 2, step: 0.1 })
  .addSlider('frequency', 'Wave Frequency', 1.0, { min: 0.1, max: 5, step: 0.1 })
  .register();

// Plugin defines what happens when parameters change
onParameterChanged(id, value) {
  if (id === 'amplitude') {
    this.amplitude = value;
  } else if (id === 'frequency') {
    this.frequency = value;
  }
  // No need to explicitly request rendering - it happens automatically
}

// Plugin provides animation logic
animate(deltaTime) {
  // Update animation state
  this.phase += deltaTime * this.frequency;
  
  // Draw using the rendering environment
  const ctx = this.renderEnv.context;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw wave using current parameters
  drawWave(ctx, this.amplitude, this.frequency, this.phase);
}
```

## Conclusion

The Math Visualization Framework architecture prioritizes separation of concerns, clear responsibility boundaries, and an intuitive API. By adhering to these principles and rules, the framework creates a sustainable ecosystem where visualization plugins can be developed, maintained, and swapped with minimal friction, while ensuring a consistent and reliable user experience.