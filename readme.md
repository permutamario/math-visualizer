# Math Visualization Framework: Architecture Philosophy

## Core Philosophy

The Math Visualization Framework is built on a component plugin architecture that emphasizes clean separation of concerns, an intuitive scripting-like API, and clear responsibilities. This document outlines the guiding principles and rules that define how the framework and plugins interact.

## Key Architecture Principles

1. **Single Plugin Model**: Only one plugin is active at any time, simplifying concerns around dependencies and conflicts.

2. **Scripting-like API**: The framework provides simple, declarative helper methods that allow plugins to define what they need without specifying how those needs are implemented.

3. **Event-Driven Pattern**: Visualization updates happen in response to parameter changes rather than through explicit render calls.

4. **Clean Lifecycle**: Plugins have well-defined load and unload phases with automatic resource management.

5. **Flexible Rendering**: Plugins have direct access to rendering contexts and complete freedom in how they implement rendering.

6. **Single Source of Truth**: The core manages all parameter values to ensure UI consistency.

## Component Responsibilities

### Core Framework Responsibilities

1. **State Management**
   - Maintain state as single source of truth for parameters and actions
   - Notify plugins when parameters change
   - Store default values and parameter schemas
   - Provide helper methods for parameter operations

2. **User Interface Management**
   - Automatically generate UI elements based on plugin requirements
   - Handle layout and positioning of UI elements
   - Manage responsive behavior between mobile and desktop views
   - Update UI when parameters change

3. **API Provision**
   - Expose simple helper methods for parameters and actions
   - Provide direct access to rendering contexts (canvas context, THREE.js scene)
   - Initialize and maintain rendering environments (2D and 3D)

4. **Animation Management**
   - Provide animation timing through requestAnimation helper
   - Handle animation cancelation automatically during cleanup
   - Supply deltaTime values to animation callbacks

5. **Visual Theming**
   - Provide color schemes and theme management
   - Apply rendering modes for 3D visualization
   - Ensure consistent visual presentation

### Plugin Responsibilities

1. **Initialization and Cleanup**
   - Define parameters using helper methods
   - Register actions using helper methods
   - Plugin-specific resource cleanup during unload

2. **Rendering Implementation**
   - Draw directly to the provided rendering context
   - Decide when and how to render visualization elements
   - Implement rendering strategy appropriate for the visualization

3. **State Management**
   - Maintain plugin-specific state if needed
   - Update parameters through framework methods (setParameter)
   - Synchronize internal state with official parameter values

4. **User Interaction**
   - Respond to parameter changes through onParameterChanged
   - Handle user-initiated actions
   - Process interaction events through handleInteraction

## Rules for Implementation

### Rules for Core Framework

1. **Provide direct access to rendering contexts** - plugins should have immediate access to draw.

2. **Always clean up completely between plugin changes** - parameters, actions, and UI elements must reset.

3. **Provide helper methods for common operations** - parameter management, animations, and actions should have simple methods.

4. **Handle all environmental concerns** - window resizing, device compatibility, and rendering contexts are core responsibilities.

5. **Provide meaningful defaults** - color palettes, rendering modes, and control behavior should have reasonable defaults.

6. **Abstract implementation details** - plugins should not need to know how UI elements are created or positioned.

7. **Enable declarative parameter definition** - parameter registration should happen automatically when using helper methods.

8. **Support flexible rendering patterns** - allow plugins to render how and when they want.

### Rules for Plugins

1. **Must implement load and unload lifecycle methods** - with proper resource management in both.

2. **Use helper methods for parameter and action management** - instead of directly manipulating the core API.

3. **Never store state outside of the plugin instance** - all state should be contained within the plugin.

4. **Initialize all resources in the start method** - which is called after the environment is ready.

5. **Use helper methods to create parameters** - addSlider(), addColor(), etc. automatically register parameters.

6. **Update parameters through framework methods** - use setParameter() to ensure UI consistency.

7. **Call super.unload() for proper cleanup** - ensures all animations and event handlers are properly disposed.

8. **Use provided rendering contexts directly** - draw directly to the canvas or scene as needed.

## Communication Patterns

1. **Core to Plugin**:
   - Parameter change notifications
   - Animation frame updates
   - Action invocations

2. **Plugin to Core**:
   - Parameter creation through helper methods
   - Parameter updates through setParameter
   - Action registration through helper methods

3. **User to Plugin**:
   - Parameter changes (via UI)
   - Action triggers (via UI)

## Benefits of This Architecture

1. **Simplified Plugin Development**: Developers focus on visualization logic using scripting-like helper methods.

2. **Clean Separation of Concerns**: Core and plugins have clearly defined responsibilities.

3. **Rendering Flexibility**: Plugins can implement rendering in whatever way best suits their visualization.

4. **Resource Management**: Automatic resource cleanup during plugin unloading.

5. **UI Consistency**: Single source of truth for parameters ensures UI always reflects actual values.

6. **Extensibility**: New plugins can be created without modifying the core.

7. **Maintainability**: Well-defined interfaces make both core and plugin code easier to maintain.

## Implementation Example

```javascript
// Plugin relies on helper methods for common operations
async start() {
  // Add parameters with simple helper methods - automatically registers them
  this.addSlider('amplitude', 'Wave Amplitude', 1.0, { min: 0, max: 2, step: 0.1 });
  this.addColor('waveColor', 'Wave Color', '#3498db');
  
  // Register actions with a simple method
  this.addAction('reset', 'Reset View', () => {
    this.phase = 0;
    this.render(); // Explicit render call if needed
  });
  
  // Request animation with a single method call
  this.requestAnimation(this.animate.bind(this));
  
  // Initial render
  this.render();
}

// Animation update - separate from rendering
animate(deltaTime) {
  // Update animation state
  this.phase += deltaTime * this.getParameter('frequency');
  
  // Trigger a render to show the updated state
  this.render();
  
  return true; // Continue animation
}

// Rendering method - can be called any time
render() {
  // Direct access to rendering context
  const ctx = this.renderEnv.context;
  const canvas = ctx.canvas;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Apply camera transformations
  ctx = this.renderEnv.prepareRender(ctx);
  
  // Draw wave using current parameters
  ctx.beginPath();
  ctx.strokeStyle = this.getParameter('waveColor');
  ctx.lineWidth = 2;
  
  // Drawing code...
  
  // Complete rendering
  this.renderEnv.completeRender(ctx);
}

// Parameter change handler
onParameterChanged(parameterId, value, group) {
  // Update local state if needed
  if (parameterId === 'amplitude') {
    this.amplitude = value;
  }
  
  // Re-render to show changes immediately if needed
  this.render();
}

// Changing parameters (updates UI automatically)
updateFrequency(value) {
  // Use setParameter to update the parameter value
  // This will notify the UI and trigger onParameterChanged
  this.setParameter('frequency', value);
}
```

## Conclusion

The Math Visualization Framework architecture prioritizes separation of concerns, clear responsibility boundaries, and an intuitive scripting-like API. By maintaining the core as the single source of truth for parameter values while providing helper methods for common operations, the framework ensures UI consistency and creates a sustainable ecosystem where visualization plugins can be developed with maximum flexibility.