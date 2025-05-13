# Math Visualization Framework: Plugin Developer Guide

## Introduction

The Math Visualization Framework is built on a component plugin architecture that emphasizes clean separation of concerns, an intuitive API, and clear responsibilities. This guide will help you create plugins using the enhanced Plugin base class with the framework's rendering approach using **Konva for 2D** and **Three.js for 3D** visualizations.

## Key Framework Architecture

The framework follows these core principles:

1. **Single Plugin Model**: Only one plugin is active at any time, simplifying concerns around dependencies and conflicts.
2. **Scripting-like API**: Helper methods allow plugins to define parameters, actions, and animations without specifying implementation details.
3. **Event-Driven Pattern**: Visualization updates happen in response to parameter changes rather than explicit render calls.
4. **Clean Lifecycle**: Plugins have well-defined load and unload phases with automatic resource management.
5. **Modern Rendering Libraries**: Konva for 2D visualizations and Three.js for 3D visualizations provide powerful capabilities with a consistent API.
6. **Single Source of Truth**: The core maintains all parameter values to ensure UI consistency.

## Creating a Plugin

Every plugin must extend the base `Plugin` class and define required static properties:

```javascript
import { Plugin } from '../../core/Plugin.js';

export default class MyVisualization extends Plugin {
  // Required static properties
  static id = 'my-visualization';
  static name = 'My Visualization';
  static description = 'A simple demonstration visualization';
  static renderingType = '2d'; // or '3d'
  
  constructor(core) {
    super(core);
    // Initialize local state here
    this.state = {
      phase: 0
    };
  }
  
  // Lifecycle methods
  async start() {
    // Initialize your plugin here using the helper methods
    // Set up parameters, actions, and rendering objects
  }
  
  async unload() {
    // Let the base class handle general cleanup
    await super.unload();
    
    // Add any plugin-specific cleanup
    this.state = null;
  }
}
```

## Plugin Lifecycle

### 1. Initialization (start)

The `start` method is where you initialize your plugin:

```javascript
async start() {
  // 1. Register parameters using helper methods
  this.addSlider('amplitude', 'Wave Amplitude', 1.0, { min: 0, max: 2, step: 0.1 });
  this.addColor('lineColor', 'Line Color', '#3498db');
  
  // 2. Register structural parameters (for UI organization)
  this.addDropdown('waveType', 'Wave Type', 'sine', ['sine', 'square', 'sawtooth'], 'structural');
  
  // 3. Register actions
  this.addAction('reset', 'Reset View', () => {
    // Reset the visualization
    this.resetView();
  });
  
  // 4. Set up Konva objects for 2D or THREE.js objects for 3D
  if (this.renderEnv.type === '2d') {
    this.setupKonvaObjects();
  } else {
    this.setupThreeJsObjects();
  }
  
  // 5. Initialize animation
  this.animationHandler = this.requestAnimation(this.animate.bind(this));
}
```

### 2. Parameter Management

The framework organizes parameters into three groups: visual, structural, and advanced. Each group affects a different part of the UI:

- **Visual**: Primary visualization parameters (appearance, style)
- **Structural**: Fundamental structure parameters (data, model)
- **Advanced**: Less commonly used parameters (technical details)

Parameter helper methods automatically register parameters with the core:

```javascript
// Add visual parameters (default group)
this.addSlider('radius', 'Circle Radius', 100, { min: 10, max: 200, step: 1 });
this.addColor('fillColor', 'Fill Color', '#3498db');
this.addCheckbox('showOutline', 'Show Outline', true);

// Add structural parameters
this.addDropdown('dataSource', 'Data Source', 'random', ['random', 'sequential', 'gaussian'], 'structural');
this.addNumber('pointCount', 'Number of Points', 100, { min: 10, max: 1000 }, 'structural');

// Add advanced parameters
this.addText('customEquation', 'Custom Equation', 'x^2 + y^2', 'advanced');
```

### 3. Action Management

Actions appear as buttons in the UI:

```javascript
// Add an action
this.addAction('reset', 'Reset View', () => {
  // Reset the visualization
  this.setParameter('radius', 100);
  this.setParameter('fillColor', '#3498db');
});

// Add an action with options
this.addAction('randomize', 'Randomize Colors', () => {
  this.setParameter('fillColor', this.getRandomColor());
}, { icon: 'refresh' });
```

### 4. Animation Management

The framework provides a central animation system:

```javascript
// Request animation (returns a handler for cancellation)
this.animationHandler = this.requestAnimation(this.animate.bind(this));

// Animation callback function
animate(deltaTime) {
  // deltaTime is in seconds
  this.phase += deltaTime * this.getParameter('frequency');
  
  // Update visualization
  if (this.renderEnv.type === '2d') {
    this.updateKonvaObjects();
  } else {
    this.updateThreeJsObjects();
  }
  
  return true; // Continue animation
}

// Cancel animation
this.cancelAnimation(this.animationHandler);
```

### 5. Rendering Environment

The framework provides either a Konva (2D) or Three.js (3D) environment depending on the plugin's `renderingType`:

#### 2D with Konva

```javascript
// Set up Konva objects in start()
setupKonvaObjects() {
  const { stage, layer, konva } = this.renderEnv;
  
  // Create a group for all shapes
  this.shapeGroup = new konva.Group();
  
  // Create shapes
  this.circle = new konva.Circle({
    x: stage.width() / 2,
    y: stage.height() / 2,
    radius: this.getParameter('radius'),
    fill: this.getParameter('fillColor'),
    stroke: 'black',
    strokeWidth: 2
  });
  
  // Add to group and layer
  this.shapeGroup.add(this.circle);
  layer.add(this.shapeGroup);
}

// Update Konva objects in animate()
updateKonvaObjects() {
  if (!this.circle) return;
  
  // Update circle properties
  this.circle.radius(this.getParameter('radius') * (Math.sin(this.phase) * 0.2 + 0.8));
  
  // Let the framework handle refreshing (no explicit batchDraw needed)
}
```

#### 3D with Three.js

```javascript
// Set up Three.js objects in start()
setupThreeJsObjects() {
  const { scene, THREE } = this.renderEnv;
  
  // Create a group for all meshes
  this.meshGroup = new THREE.Group();
  
  // Create geometry and material
  const geometry = new THREE.SphereGeometry(
    this.getParameter('radius'), 
    32, 
    32
  );
  
  const material = new THREE.MeshStandardMaterial({
    color: this.getParameter('fillColor'),
    roughness: 0.5,
    metalness: 0.2
  });
  
  // Create mesh
  this.sphere = new THREE.Mesh(geometry, material);
  this.meshGroup.add(this.sphere);
  
  // Add to scene
  scene.add(this.meshGroup);
}

// Update Three.js objects in animate()
updateThreeJsObjects() {
  if (!this.sphere) return;
  
  // Update sphere properties
  this.sphere.rotation.x += 0.01;
  this.sphere.rotation.y += 0.01;
  
  // The framework handles rendering automatically
}
```

### 6. Handling Parameter Changes

The framework notifies your plugin when parameters change:

```javascript
onParameterChanged(parameterId, value, group) {
  // Respond to parameter changes
  if (parameterId === 'radius' && this.renderEnv.type === '2d') {
    if (this.circle) {
      this.circle.radius(value);
    }
  } else if (parameterId === 'fillColor') {
    if (this.renderEnv.type === '2d' && this.circle) {
      this.circle.fill(value);
    } else if (this.renderEnv.type === '3d' && this.sphere) {
      this.sphere.material.color.set(value);
      this.sphere.material.needsUpdate = true;
    }
  }
  
  // The framework handles refreshing automatically
}
```

### 7. Handling User Interaction

The framework forwards user interaction events to your plugin:

```javascript
handleInteraction(type, data) {
  // type: 'click', 'mousemove', 'mousedown', 'mouseup', 'wheel', etc.
  // data: Contains event-specific information
  
  if (type === 'click') {
    console.log(`Clicked at (${data.x}, ${data.y})`);
    
    // Check if clicked on an object
    if (data.target && this.renderEnv.type === '2d') {
      // Konva object clicked
      if (data.target === this.circle) {
        this.setParameter('fillColor', this.getRandomColor());
      }
    }
  } else if (type === 'wheel') {
    // Handle zoom with mouse wheel
    const zoomFactor = data.deltaY > 0 ? 0.9 : 1.1;
    
    if (this.renderEnv.type === '2d') {
      this.renderEnv.zoomCamera(zoomFactor, data.x, data.y);
    }
  }
}
```

### 8. Cleanup (unload)

The `unload` method is where you clean up resources:

```javascript
async unload() {
  // Cancel animations first
  if (this.animationHandler) {
    this.cancelAnimation(this.animationHandler);
  }
  
  // Let base class handle animation and event cleanup
  await super.unload();
  
  // Clean up rendering objects
  if (this.renderEnv.type === '2d') {
    if (this.shapeGroup) {
      this.shapeGroup.destroy();
      this.shapeGroup = null;
    }
  } else if (this.renderEnv.type === '3d') {
    if (this.meshGroup) {
      // Remove from scene
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
}
```

## Complete Examples

### 2D Visualization with Konva

```javascript
import { Plugin } from '../../core/Plugin.js';

export default class KonvaWaveVisualization extends Plugin {
  static id = 'konva-wave-visualization';
  static name = 'Konva Wave Visualization';
  static description = 'A sine wave visualization using Konva';
  static renderingType = '2d';
  
  constructor(core) {
    super(core);
    this.phase = 0;
  }
  
  async start() {
    // Add parameters
    this.addSlider('amplitude', 'Amplitude', 1.0, { min: 0, max: 2, step: 0.1 });
    this.addSlider('frequency', 'Frequency', 1.0, { min: 0.1, max: 5, step: 0.1 });
    this.addColor('waveColor', 'Wave Color', '#3498db');
    
    // Add structural parameters
    this.addCheckbox('animate', 'Enable Animation', true, 'structural');
    
    // Add an action for reset
    this.addAction('reset', 'Reset Wave', () => {
      this.phase = 0;
      this.setParameter('amplitude', 1.0);
      this.setParameter('frequency', 1.0);
      this.setParameter('waveColor', '#3498db');
    });
    
    // Set up Konva objects
    this.setupKonvaObjects();
    
    // Start animation
    this.animationHandler = this.requestAnimation(this.animate.bind(this));
  }
  
  setupKonvaObjects() {
    // Get Konva stage and layer
    const { stage, layer, konva } = this.renderEnv;
    
    // Create a group for all wave objects
    this.waveGroup = new konva.Group();
    
    // Create the wave line
    this.waveLine = new konva.Line({
      points: [],
      stroke: this.getParameter('waveColor'),
      strokeWidth: 2,
      lineCap: 'round',
      lineJoin: 'round'
    });
    
    // Add to group and layer
    this.waveGroup.add(this.waveLine);
    layer.add(this.waveGroup);
  }
  
  animate(deltaTime) {
    // Skip animation if disabled
    if (!this.getParameter('animate')) {
      return true; // Keep the animation loop active
    }
    
    // Update phase based on frequency
    const frequency = this.getParameter('frequency');
    this.phase += deltaTime * frequency;
    
    // Update wave points
    this.updateWave();
    
    return true; // Continue animation
  }
  
  updateWave() {
    // Get stage dimensions and amplitude
    const { stage } = this.renderEnv;
    const width = stage.width();
    const height = stage.height();
    const amplitude = this.getParameter('amplitude');
    
    // Calculate wave points
    const points = [];
    for (let x = 0; x < width; x += 5) {
      const y = height/2 + Math.sin(x * 0.01 + this.phase) * amplitude * height/4;
      points.push(x, y);
    }
    
    // Update wave line
    this.waveLine.points(points);
    this.waveLine.stroke(this.getParameter('waveColor'));
    
    // No explicit batchDraw needed - framework handles it
  }
  
  onParameterChanged(parameterId, value, group) {
    // Immediate visual updates without waiting for animation frame
    if (parameterId === 'waveColor' && this.waveLine) {
      this.waveLine.stroke(value);
    }
    // Other parameter changes will be picked up in the animation loop
  }
  
  handleInteraction(type, data) {
    if (type === 'click') {
      // Get click coordinates relative to stage
      const { x, y } = data;
      
      // Toggle animation on click
      const currentAnimState = this.getParameter('animate');
      this.setParameter('animate', !currentAnimState);
    }
  }
  
  async unload() {
    // Let base class handle animation and event cleanup
    await super.unload();
    
    // Clean up Konva objects
    if (this.waveGroup) {
      this.waveGroup.destroy();
      this.waveGroup = null;
    }
  }
}
```

### 3D Visualization with Three.js

```javascript
import { Plugin } from '../../core/Plugin.js';

export default class SphereVisualization extends Plugin {
  static id = 'sphere-visualization';
  static name = '3D Sphere Visualization';
  static description = 'A 3D sphere with dynamic surface';
  static renderingType = '3d';
  
  constructor(core) {
    super(core);
    this.time = 0;
  }
  
  async start() {
    // Add visual parameters
    this.addSlider('radius', 'Radius', 1.0, { min: 0.5, max: 2.0, step: 0.1 });
    this.addSlider('segments', 'Segments', 32, { min: 8, max: 64, step: 4 });
    this.addColor('sphereColor', 'Sphere Color', '#3498db');
    
    // Add structural parameters
    this.addDropdown('renderMode', 'Render Mode', 'standard', 
                    ['standard', 'metallic', 'glass', 'toon'], 'structural');
    
    // Add an action for reset
    this.addAction('reset', 'Reset Sphere', () => {
      this.time = 0;
      this.setParameter('radius', 1.0);
      this.setParameter('segments', 32);
      this.setParameter('sphereColor', '#3498db');
      this.setParameter('renderMode', 'standard');
    });
    
    // Set up Three.js objects
    this.setupThreeJsObjects();
    
    // Start animation
    this.animationHandler = this.requestAnimation(this.animate.bind(this));
  }
  
  setupThreeJsObjects() {
    // Get Three.js scene and THREE library
    const { scene, THREE } = this.renderEnv;
    
    // Create a group for all meshes
    this.meshGroup = new THREE.Group();
    
    // Create geometry and material
    const radius = this.getParameter('radius');
    const segments = this.getParameter('segments');
    const color = this.getParameter('sphereColor');
    
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.2
    });
    
    // Create sphere mesh
    this.sphere = new THREE.Mesh(geometry, material);
    this.meshGroup.add(this.sphere);
    
    // Add to scene
    scene.add(this.meshGroup);
  }
  
  animate(deltaTime) {
    // Update time
    this.time += deltaTime;
    
    // Update sphere
    if (this.sphere) {
      // Rotate sphere
      this.sphere.rotation.x = this.time * 0.3;
      this.sphere.rotation.y = this.time * 0.5;
      
      // Small oscillation in size
      const pulseFactor = Math.sin(this.time) * 0.1 + 1.0;
      this.sphere.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }
    
    return true; // Continue animation
  }
  
  onParameterChanged(parameterId, value, group) {
    if (!this.sphere) return;
    
    if (parameterId === 'sphereColor') {
      this.sphere.material.color.set(value);
      this.sphere.material.needsUpdate = true;
    } 
    else if (parameterId === 'radius' || parameterId === 'segments') {
      // Recreate geometry with new parameters
      const radius = this.getParameter('radius');
      const segments = this.getParameter('segments');
      
      const oldGeometry = this.sphere.geometry;
      this.sphere.geometry = new this.renderEnv.THREE.SphereGeometry(
        radius, segments, segments
      );
      
      // Dispose of old geometry
      oldGeometry.dispose();
    }
    else if (parameterId === 'renderMode') {
      // Use the render mode manager if available
      if (this.core && this.core.renderModeManager && this.meshGroup) {
        this.core.renderModeManager.applyRenderMode(
          this.renderEnv.scene,
          this.meshGroup,
          value,
          {
            opacity: 1.0,
            baseColor: new this.renderEnv.THREE.Color(this.getParameter('sphereColor'))
          }
        );
      }
    }
  }
  
  handleInteraction(type, data) {
    if (type === 'click') {
      // Toggle through render modes on click
      const modes = ['standard', 'metallic', 'glass', 'toon'];
      const currentMode = this.getParameter('renderMode');
      const currentIndex = modes.indexOf(currentMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      
      this.setParameter('renderMode', modes[nextIndex]);
    }
  }
  
  async unload() {
    // Cancel animations
    this.cancelAnimation(this.animationHandler);
    
    // Let base class handle event cleanup
    await super.unload();
    
    // Clean up Three.js objects
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
}
```

## Helper Methods Reference

### Parameter Management

```javascript
// Add parameters (with optional group: 'visual', 'structural', 'advanced')
this.addSlider(id, label, defaultValue, options, group);
this.addCheckbox(id, label, defaultValue, group);
this.addColor(id, label, defaultValue, group);
this.addDropdown(id, label, defaultValue, options, group);
this.addNumber(id, label, defaultValue, options, group);
this.addText(id, label, defaultValue, group);

// Get and set parameters
const value = this.getParameter(id);
this.setParameter(id, newValue);
const allParams = this.getAllParameters();

// Remove parameters
this.removeParameter(id, group);
this.emptyParameters(group);
```

### Action Management

```javascript
// Add an action
this.addAction(id, label, callback, options);

// Remove an action
this.removeAction(id);
```

### Animation Management

```javascript
// Request animation (returns a handler for cancellation)
const handler = this.requestAnimation(callback);

// Cancel animation
this.cancelAnimation(handler);
```

### Rendering Environment (2D - Konva)

```javascript
// Access Konva objects
const { stage, layer, konva } = this.renderEnv;

// Camera controls
this.renderEnv.panCamera(dx, dy);
this.renderEnv.zoomCamera(factor, centerX, centerY);
this.renderEnv.resetCamera();
this.renderEnv.setAutomaticCameraControls(enabled);
```

### Rendering Environment (3D - Three.js)

```javascript
// Access Three.js objects
const { scene, camera, renderer, controls, THREE } = this.renderEnv;

// Camera reset
this.renderEnv.resetCamera();
```

## Best Practices

1. **Use the helper methods**: The framework provides helper methods for parameters, actions, and animations that automatically integrate with the core.

2. **Don't call layer.batchDraw() or renderer.render() directly**: The framework handles rendering automatically.

3. **Clean up all resources in unload()**: Always call `super.unload()` and properly dispose of all created resources.

4. **Organize parameters by group**: Use 'visual' for appearance, 'structural' for fundamental structure, and 'advanced' for technical details.

5. **Keep animations efficient**: The animation loop runs continuously, so keep your animation code lightweight.

6. **Use the appropriate rendering library**: Use Konva for 2D and THREE.js for 3D, as specified by your plugin's `renderingType`.

7. **Don't modify the DOM directly**: Use the framework's UI management system through parameters and actions.

8. **Store plugin state in the instance**: Keep all state within your plugin instance, not in global variables.

9. **Clear all references in unload()**: Set all object references to null after disposal to aid garbage collection.

10. **Use properties getters and setters**: When setting properties that need UI updates, use the parameter system rather than direct property access.

By following these guidelines and using the enhanced Plugin base class, you can create powerful, interactive visualizations that integrate seamlessly with the Math Visualization Framework.