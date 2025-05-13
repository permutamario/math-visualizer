# Math Visualization Framework: Architecture Philosophy

## Core Philosophy

The Math Visualization Framework is built on a component plugin architecture that emphasizes clean separation of concerns, an intuitive scripting-like API, and clear responsibilities. This document outlines the guiding principles and rules that define how the framework and plugins interact.

## Key Architecture Principles

1. **Single Plugin Model**: Only one plugin is active at any time, simplifying concerns around dependencies and conflicts.

2. **Scripting-like API**: The framework provides simple, declarative helper methods that allow plugins to define what they need without specifying how those needs are implemented.

3. **Event-Driven Pattern**: Visualization updates happen in response to parameter changes rather than through explicit render calls.

4. **Clean Lifecycle**: Plugins have well-defined load and unload phases with automatic resource management.

5. **Modern Rendering Libraries**: Plugins use Konva for 2D visualizations and Three.js for 3D visualizations, providing powerful capabilities while maintaining rendering flexibility.

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
   - Provide direct access to rendering environments (Konva stage/layer for 2D, THREE.js scene for 3D)
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
   - Use appropriate library (Konva for 2D, Three.js for 3D) to create visualizations
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

1. **Provide direct access to rendering libraries** - plugins should have immediate access to Konva (2D) or Three.js (3D).

2. **Always clean up completely between plugin changes** - parameters, actions, and UI elements must reset.

3. **Provide helper methods for common operations** - parameter management, animations, and actions should have simple methods.

4. **Handle all environmental concerns** - window resizing, device compatibility, and rendering contexts are core responsibilities.

5. **Provide meaningful defaults** - color palettes, rendering modes, and control behavior should have reasonable defaults.

6. **Abstract implementation details** - plugins should not need to know how UI elements are created or positioned.

7. **Enable declarative parameter definition** - parameter registration should happen automatically when using helper methods.

8. **Support flexible rendering patterns** - allow plugins to render how and when they want using the provided libraries.

### Rules for Plugins

1. **Must implement load and unload lifecycle methods** - with proper resource management in both.

2. **Use helper methods for parameter and action management** - instead of directly manipulating the core API.

3. **Never store state outside of the plugin instance** - all state should be contained within the plugin.

4. **Initialize all resources in the start method** - which is called after the environment is ready.

5. **Use the appropriate rendering library** - Konva for 2D visualizations, Three.js for 3D visualizations.

6. **Update parameters through framework methods** - use setParameter() to ensure UI consistency.

7. **Call super.unload() for proper cleanup** - ensures all animations and event handlers are properly disposed.

8. **Register created resources for cleanup** - use environment-provided registration methods for proper resource management.

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
   - Direct interaction with visualization (via Konva/Three.js events)

## Benefits of This Architecture

1. **Simplified Plugin Development**: Developers focus on visualization logic using scripting-like helper methods.

2. **Clean Separation of Concerns**: Core and plugins have clearly defined responsibilities.

3. **Rendering Flexibility**: Plugins can implement rendering using powerful libraries (Konva for 2D, Three.js for 3D).

4. **Resource Management**: Automatic resource cleanup during plugin unloading.

5. **UI Consistency**: Single source of truth for parameters ensures UI always reflects actual values.

6. **Extensibility**: New plugins can be created without modifying the core.

7. **Maintainability**: Well-defined interfaces make both core and plugin code easier to maintain.

## Implementation Example (2D with Konva)

```javascript
// 2D visualization using Konva
async start() {
  // Add parameters with simple helper methods
  this.addSlider('amplitude', 'Wave Amplitude', 1.0, { min: 0, max: 2, step: 0.1 });
  this.addColor('waveColor', 'Wave Color', '#3498db');
  
  // Register actions with a simple method
  this.addAction('reset', 'Reset View', () => {
    this.phase = 0;
    this.render();
  });
  
  // Get Konva stage and layer from environment
  const stage = this.renderEnv.stage;
  const layer = this.renderEnv.layer;
  
  // Create Konva shapes
  this.waveGroup = new Konva.Group();
  this.waveShape = new Konva.Line({
    points: [],
    stroke: this.getParameter('waveColor'),
    strokeWidth: 2,
    lineCap: 'round',
    lineJoin: 'round'
  });
  
  // Add shapes to layer
  this.waveGroup.add(this.waveShape);
  layer.add(this.waveGroup);
  
  // Request animation with a single method call
  this.requestAnimation(this.animate.bind(this));
}

// Animation update
animate(deltaTime) {
  // Update animation state
  this.phase += deltaTime * this.getParameter('frequency');
  
  // Update Konva shape
  const points = [];
  const width = this.renderEnv.stage.width();
  const height = this.renderEnv.stage.height();
  const amplitude = this.getParameter('amplitude');
  
  for (let x = 0; x < width; x += 5) {
    const y = height/2 + Math.sin(x * 0.01 + this.phase) * amplitude * height/4;
    points.push(x, y);
  }
  
  this.waveShape.points(points);
  this.waveShape.stroke(this.getParameter('waveColor'));
  
  // Draw the updated layer
  this.renderEnv.layer.batchDraw();
  
  return true; // Continue animation
}

// Parameter change handler
onParameterChanged(parameterId, value, group) {
  // Update Konva properties if needed
  if (parameterId === 'waveColor' && this.waveShape) {
    this.waveShape.stroke(value);
    this.renderEnv.layer.batchDraw();
  }
}

// Cleanup resources
async unload() {
  // Let base class handle animation and event cleanup
  await super.unload();
  
  // Clean up Konva objects
  if (this.waveGroup) {
    this.waveGroup.destroy();
    this.waveGroup = null;
  }
  
  // No need to call layer.batchDraw() - the environment handles this
}
```

## Implementation Example (3D with Three.js)

```javascript
// 3D visualization using Three.js
async start() {
  // Add parameters with simple helper methods
  this.addSlider('radius', 'Sphere Radius', 1.0, { min: 0.1, max: 2, step: 0.1 });
  this.addColor('sphereColor', 'Sphere Color', '#3498db');
  
  // Get Three.js scene and other objects
  const scene = this.renderEnv.scene;
  const THREE = this.renderEnv.THREE; // Access to Three.js library
  
  // Create Three.js objects
  const geometry = new THREE.SphereGeometry(this.getParameter('radius'), 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: this.getParameter('sphereColor'),
    roughness: 0.5,
    metalness: 0.2
  });
  
  this.sphere = new THREE.Mesh(geometry, material);
  
  // Create a group for all meshes
  this.meshGroup = new THREE.Group();
  this.meshGroup.add(this.sphere);
  
  // Add to scene
  scene.add(this.meshGroup);
  
  // Start animation
  this.requestAnimation(this.animate.bind(this));
}

// Animation update
animate(deltaTime) {
  // Update animation state
  this.sphere.rotation.x += deltaTime * 0.5;
  this.sphere.rotation.y += deltaTime * 0.3;
  
  // No need to call renderer.render() - the environment handles this
  return true; // Continue animation
}

// Parameter change handler
onParameterChanged(parameterId, value, group) {
  if (parameterId === 'radius' && this.sphere) {
    // Update sphere geometry
    const oldGeometry = this.sphere.geometry;
    const newGeometry = new this.renderEnv.THREE.SphereGeometry(value, 32, 32);
    this.sphere.geometry = newGeometry;
    oldGeometry.dispose(); // Clean up old resources
  }
  else if (parameterId === 'sphereColor' && this.sphere) {
    this.sphere.material.color.set(value);
    this.sphere.material.needsUpdate = true;
  }
}

// Cleanup resources
async unload() {
  // Let base class handle animation and event cleanup
  await super.unload();
  
  // Clean up Three.js resources
  if (this.meshGroup) {
    this.renderEnv.scene.remove(this.meshGroup);
    
    // Dispose of geometries and materials
    this.meshGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    this.meshGroup = null;
    this.sphere = null;
  }
}
```

## Conclusion

The Math Visualization Framework architecture prioritizes separation of concerns, clear responsibility boundaries, and an intuitive scripting-like API. By leveraging modern rendering libraries (Konva for 2D and Three.js for 3D) while maintaining the core as the single source of truth for parameter values, the framework ensures UI consistency and creates a sustainable ecosystem where visualization plugins can be developed with maximum flexibility and power.