# Math Visualization Framework: Plugin Developer Guide

## Introduction

The Math Visualization Framework is built on a component plugin architecture that emphasizes clean separation of concerns, an intuitive API, and clear responsibilities. This guide will help you create plugins that integrate seamlessly with the framework.

## Plugin Architecture Philosophy

The framework follows key principles:

1. **Single Plugin Model**: Only one plugin is active at any time
2. **Scripting-like API**: Plugins define what they need without specifying how
3. **Event-Driven Pattern**: Visualization updates happen in response to parameter changes
4. **Clean Lifecycle**: Plugins have well-defined load and unload phases
5. **Rendering Environment Handling**: The plugins have access to premade environments where they can draw. No need to setup, dispose, control or setup controllers for the environment.

## Plugin Structure

Every plugin must extend the base `Plugin` class and include essential static properties:

```javascript
// src/plugins/my-visualization/index.js
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
    this.myState = {
      phase: 0
    };
  }
  
  // Lifecycle methods to implement
  async start() {
    // Initialize your plugin here
  }
  
  async unload() {
    // Clean up resources here
  }
}
```

## Core Services

The core provides several services to plugins:

1. **Parameter Management**: Register and react to parameter changes
2. **Rendering Environment**: Access to 2D or 3D rendering contexts
3. **Action Registration**: Define UI actions that users can trigger
4. **Animation Loop**: Handles timing and frame updates
5. **Theme Management**: Color schemes and visual settings

## Plugin Lifecycle

### Initialization (start)

The `start` method is where you initialize your plugin:

```javascript
async start() {
  // 1. Get rendering environment - it's guaranteed to match your plugin's renderingType
  this.renderEnv = this.core.getRenderingEnvironment();
  
  // 2. Register visual parameters (UI controls)
  this.core.createVisualParameters()
    .addSlider('amplitude', 'Wave Amplitude', 1.0, { min: 0, max: 2, step: 0.1 })
    .addSlider('frequency', 'Wave Frequency', 1.0, { min: 0.1, max: 5, step: 0.1 })
    .register();
  
  // 3. Register structural parameters (if needed)
  this.core.createStructuralParameters()
    .addDropdown('waveType', 'Wave Type', 'sine', ['sine', 'square', 'sawtooth'])
    .register();
  
  // 4. Register actions
  this.core.addAction('reset', 'Reset View', () => {
    // Reset the visualization
    this.reset();
    // Request a render refresh
    this.core.requestRenderRefresh();
  });
  
  // 5. Set up drawing objects and scene
  if (this.renderEnv.type === '2d') {
    // 2D environment is fully initialized and ready to use
    // No additional setup needed
  } else {
    // 3D environment is fully initialized and ready to use
    this.setupScene();
  }
  
  // 6. Initialize animation if needed
  this.animationHandler = this.core.animationManager.requestAnimation(
    this.animate.bind(this)
  );
}
```

### Cleanup (unload)

The `unload` method is where you clean up all resources:

```javascript
async unload() {
  // Cancel any animations
  if (this.animationHandler) {
    this.core.animationManager.cancelAnimation(this.animationHandler);
    this.animationHandler = null;
  }
  
  // Clean up any 3D objects (if using 3D)
  if (this.renderEnv && this.renderEnv.type === '3d' && this.meshGroup) {
    // Remove meshes from scene
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
  }
  
  // Reset internal state
  this.myState = null;
}
```

## Parameter Management

Parameters are registered with the core, which manages their values and creates UI controls:

```javascript
// Register parameters
this.core.createVisualParameters()
  .addSlider('amplitude', 'Wave Amplitude', 1.0, { min: 0, max: 2, step: 0.1 })
  .addCheckbox('showPoints', 'Show Points', true)
  .addColor('lineColor', 'Line Color', '#3498db')
  .addDropdown('style', 'Style', 'smooth', ['smooth', 'sharp', 'dotted'])
  .register();
```

React to parameter changes in the `onParameterChanged` method:

```javascript
onParameterChanged(parameterId, value, group) {
  // Update local state
  if (parameterId === 'amplitude') {
    this.amplitude = value;
  } else if (parameterId === 'frequency') {
    this.frequency = value;
    // Reset phase when frequency changes
    this.phase = 0;
  }
  
  // For 3D, update mesh properties if needed
  if (this.renderEnv.type === '3d' && this.meshGroup) {
    // Update mesh based on parameter changes
    this.updateMeshes(this.core.getAllParameters());
  }
  
  // Request a render refresh to show changes
  this.core.requestRenderRefresh();
}
```

To programmatically change parameters (which will update the UI):

```javascript
// Change a parameter value
this.core.changeParameter('amplitude', 1.5);
```

## Rendering Implementation

### 2D Rendering

For 2D plugins, you can immediately use the rendering context:

```javascript
animate(deltaTime) {
  // Update animation state
  this.phase += deltaTime * this.frequency;
  
  // The environment is guaranteed to be 2D if renderingType is '2d'
  const ctx = this.renderEnv.context;
  const parameters = this.core.getAllParameters();
  
  // Draw your visualization
  this.drawWave(ctx, parameters);
  
  return true; // Continue animation
}

// Custom drawing method
drawWave(ctx, parameters) {
  const { amplitude, frequency, lineColor } = parameters;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Apply camera transformations
  ctx = this.renderEnv.prepareRender(ctx);
  
  // Draw your visualization
  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  
  for (let x = 0; x < width; x++) {
    const normalizedX = x / width * 2 * Math.PI * frequency;
    const y = height/2 + Math.sin(normalizedX + this.phase) * amplitude * height/4;
    
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
  
  // Restore context state
  this.renderEnv.completeRender(ctx);
}
```

### 3D Rendering

For 3D plugins, you can directly add objects to the scene:

```javascript
// Set up scene with THREE.js objects
setupScene() {
  // The environment is guaranteed to be 3D if renderingType is '3d'
  
  // Get all parameters
  const parameters = this.core.getAllParameters();
  const { amplitude, frequency, color } = parameters;
  
  // Create a group for all meshes
  this.meshGroup = new THREE.Group();
  
  // Create a wave mesh
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const resolution = 100;
  
  for (let i = 0; i <= resolution; i++) {
    const x = (i / resolution) * 10 - 5;
    const y = Math.sin(x * frequency) * amplitude;
    const z = 0;
    vertices.push(x, y, z);
  }
  
  const positions = new Float32Array(vertices);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geometry, material);
  
  this.meshGroup.add(line);
  
  // Add to scene - no need to check if scene exists
  this.renderEnv.scene.add(this.meshGroup);
}

// Update meshes based on parameters
updateMeshes(parameters) {
  const { amplitude, frequency, color } = parameters;
  
  // Update the wave mesh
  const line = this.meshGroup.children[0];
  if (line && line.geometry) {
    const positions = line.geometry.attributes.position;
    const resolution = positions.count;
    
    for (let i = 0; i < resolution; i++) {
      const x = (i / (resolution - 1)) * 10 - 5;
      const y = Math.sin((x + this.phase) * frequency) * amplitude;
      
      positions.setY(i, y);
    }
    
    positions.needsUpdate = true;
  }
  
  // Update material color if needed
  if (line && line.material && line.material.color) {
    if (line.material.color.getHex() !== color) {
      line.material.color.set(color);
      line.material.needsUpdate = true;
    }
  }
}

animate(deltaTime) {
  // Update animation state
  this.phase += deltaTime * this.frequency;
  
  // Update 3D objects if needed
  if (this.meshGroup) {
    this.updateMeshes(this.core.getAllParameters());
  }
  
  return true; // Continue animation
}
```

## Animation

Implement the `animate` method to update your visualization over time:

```javascript
animate(deltaTime) {
  // Update animation state
  this.phase += deltaTime * this.frequency;
  
  // For 2D, draw directly
  if (this.renderEnv.type === '2d') {
    const ctx = this.renderEnv.context;
    const parameters = this.core.getAllParameters();
    this.drawWave(ctx, parameters);
  }
  
  // For 3D, update meshes
  if (this.renderEnv.type === '3d' && this.meshGroup) {
    this.updateMeshes(this.core.getAllParameters());
  }
  
  // Request a render refresh if the environment doesn't continuously render
  if (!this.renderEnv.requiresContinuousRendering) {
    this.core.requestRenderRefresh();
  }
  
  return true; // Continue animation
}
```

## User Interaction

Handle user interaction through the `handleInteraction` method:

```javascript
handleInteraction(type, data) {
  switch (type) {
    case 'click':
      const { x, y } = data;
      // Handle click at coordinates (x, y)
      break;
      
    case 'mousedown':
      // Handle mouse down
      break;
      
    case 'mousemove':
      // Handle mouse move
      break;
      
    case 'wheel':
      // Handle mouse wheel
      const { deltaY } = data;
      // Zoom in/out based on deltaY
      break;
      
    case 'touchstart':
    case 'touchmove':
    case 'touchend':
      // Handle touch events
      break;
  }
  
  // Request a render refresh if needed
  this.core.requestRenderRefresh();
}
```

## Key Concepts to Remember

1. **Static Metadata Determines Environment**: Your plugin's `renderingType` determines which rendering environment will be prepared for you
   ```javascript
   static renderingType = '2d'; // or '3d'
   ```

2. **Environment is Ready to Use**: When you access the environment, it's fully initialized and matches your plugin's requirements
   ```javascript
   this.renderEnv = this.core.getRenderingEnvironment();
   ```

3. **Direct Drawing/Rendering**: Access the environment APIs directly
   ```javascript
   // 2D - access the context directly
   const ctx = this.renderEnv.context;
   
   // 3D - add meshes directly to the scene
   this.renderEnv.scene.add(this.meshGroup);
   ```

4. **Request Refreshes**: Call `requestRenderRefresh()` after changing state
   ```javascript
   this.myState.updated = true;
   this.core.requestRenderRefresh();
   ```

5. **Parameters Source of Truth**: The core manages parameter values
   ```javascript
   // Change parameter (updates UI and triggers onParameterChanged)
   this.core.changeParameter('amplitude', 1.5);
   ```

6. **Clean Lifecycle**: Initialize in `start()`, clean up in `unload()`

## Best Practices

1. **Trust the environment type**: The framework guarantees the environment matches your plugin's `renderingType`

2. **Don't manually initialize environments**: The framework handles all initialization

3. **Use the environment API directly**: No need for defensive programming or type checking

4. **Keep state in the plugin**: Don't modify global objects or DOM directly. Only exception is changing parameters which should be done through changeParameter.

5. **Respond to parameter changes**: Don't poll for changes

6. **Clean up ALL resources**: Especially for 3D objects and event listeners

7. **Use descriptive parameter names**: Parameters are your plugin's API

## Example: Simple Wave Visualization (2D)

Here's a simple example of a 2D wave visualization plugin:

```javascript
import { Plugin } from '../../core/Plugin.js';

export default class WaveVisualization extends Plugin {
  static id = 'wave-visualization';
  static name = 'Wave Visualization';
  static description = 'A simple sine wave visualization';
  static renderingType = '2d';
  
  constructor(core) {
    super(core);
    this.phase = 0;
    this.amplitude = 1.0;
    this.frequency = 1.0;
  }
  
  async start() {
    // Get rendering environment - guaranteed to be 2D
    this.renderEnv = this.core.getRenderingEnvironment();
    
    // Register parameters
    this.core.createVisualParameters()
      .addSlider('amplitude', 'Amplitude', 1.0, { min: 0, max: 2, step: 0.1 })
      .addSlider('frequency', 'Frequency', 1.0, { min: 0.1, max: 5, step: 0.1 })
      .addColor('waveColor', 'Wave Color', '#3498db')
      .register();
    
    // Start animation
    this.animationHandler = this.core.animationManager.requestAnimation(
      this.animate.bind(this)
    );
  }
  
  animate(deltaTime) {
    // Update phase based on frequency
    const params = this.core.getAllParameters();
    this.phase += deltaTime * params.frequency;
    
    // Draw directly when animating
    const ctx = this.renderEnv.context;
    this.drawWave(ctx, params);
    
    // Request a render refresh (may not be needed if environment 
    // continuously renders)
    this.core.requestRenderRefresh();
    
    return true; // Continue animation
  }
  
  drawWave(ctx, parameters) {
    const { amplitude, frequency, waveColor } = parameters;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Start with transformations if using camera
    ctx = this.renderEnv.prepareRender(ctx);
    
    ctx.beginPath();
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 2;
    
    for (let x = 0; x < width; x++) {
      const normalizedX = x / width * 2 * Math.PI * frequency;
      const y = height/2 + Math.sin(normalizedX + this.phase) * amplitude * height/4;
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // End with transformations if using camera
    this.renderEnv.completeRender(ctx);
  }
  
  onParameterChanged(parameterId, value, group) {
    // Update local state
    if (parameterId === 'amplitude') {
      this.amplitude = value;
    } else if (parameterId === 'frequency') {
      this.frequency = value;
    }
    
    // Request a render refresh
    this.core.requestRenderRefresh();
  }
  
  async unload() {
    // Cancel animation
    if (this.animationHandler) {
      this.core.animationManager.cancelAnimation(this.animationHandler);
      this.animationHandler = null;
    }
  }
}
```

## Example: 3D Visualization

For 3D visualizations, you can directly add meshes to the scene:

```javascript
import { Plugin } from '../../core/Plugin.js';

export default class Sphere3D extends Plugin {
  static id = 'sphere-3d';
  static name = '3D Sphere';
  static description = 'A 3D sphere with dynamic surface';
  static renderingType = '3d';
  
  constructor(core) {
    super(core);
    this.phase = 0;
    this.meshGroup = null;
  }
  
  async start() {
    // Get rendering environment - guaranteed to be 3D
    this.renderEnv = this.core.getRenderingEnvironment();
    
    // Register parameters
    this.core.createVisualParameters()
      .addSlider('amplitude', 'Wave Amplitude', 0.3, { min: 0, max: 1, step: 0.05 })
      .addSlider('speed', 'Animation Speed', 1.0, { min: 0, max: 3, step: 0.1 })
      .addColor('sphereColor', 'Sphere Color', '#3498db')
      .register();
    
    // Set up 3D scene
    this.setupScene();
    
    // Start animation
    this.animationHandler = this.core.animationManager.requestAnimation(
      this.animate.bind(this)
    );
  }
  
  setupScene() {
    // Create a group for our meshes
    this.meshGroup = new THREE.Group();
    
    // Get parameters
    const params = this.core.getAllParameters();
    
    // Create a sphere geometry
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: params.sphereColor,
      roughness: 0.3,
      metalness: 0.2
    });
    
    this.sphere = new THREE.Mesh(geometry, material);
    this.meshGroup.add(this.sphere);
    
    // Add the group to the scene - guaranteed to exist
    this.renderEnv.scene.add(this.meshGroup);
  }
  
  animate(deltaTime) {
    const params = this.core.getAllParameters();
    this.phase += deltaTime * params.speed;
    
    // Update sphere vertices
    if (this.sphere && this.sphere.geometry) {
      const positions = this.sphere.geometry.attributes.position;
      const amplitude = params.amplitude;
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Calculate original position (normalized)
        const length = Math.sqrt(x*x + y*y + z*z);
        const nx = x / length;
        const ny = y / length;
        const nz = z / length;
        
        // Apply wave effect
        const wave = Math.sin(this.phase + 5 * nx + 5 * ny) * amplitude;
        const newLength = 1 + wave;
        
        // Set new position
        positions.setX(i, nx * newLength);
        positions.setY(i, ny * newLength);
        positions.setZ(i, nz * newLength);
      }
      
      positions.needsUpdate = true;
      this.sphere.geometry.computeVertexNormals();
    }
    
    // No need to call requestRenderRefresh() for 3D environments
    // as they typically render continuously
    
    return true; // Continue animation
  }
  
  onParameterChanged(parameterId, value, group) {
    // Update material color if changed
    if (parameterId === 'sphereColor' && this.sphere && this.sphere.material) {
      this.sphere.material.color.set(value);
      this.sphere.material.needsUpdate = true;
    }
    
    // Other parameter changes are picked up in the animate method
  }
  
  async unload() {
    // Cancel animation
    if (this.animationHandler) {
      this.core.animationManager.cancelAnimation(this.animationHandler);
      this.animationHandler = null;
    }
    
    // Clean up 3D resources
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

Follow this guide to create plugins that seamlessly integrate with the Math Visualization Framework, providing users with an interactive and consistent experience.