# Math Visualization Framework: Plugin Developer Guide (Updated)

## Introduction

The Math Visualization Framework is built on a component plugin architecture that emphasizes clean separation of concerns, an intuitive API, and clear responsibilities. This guide will help you create plugins using the enhanced Plugin base class, which provides a more scripting-like experience for developers.

## Plugin Architecture Philosophy

The framework follows key principles:

1. **Single Plugin Model**: Only one plugin is active at any time
2. **Scripting-like API**: Plugins define what they need through simple, declarative helper methods
3. **Event-Driven Pattern**: Visualization updates happen in response to parameter changes
4. **Clean Lifecycle**: Plugins have well-defined load and unload phases
5. **Rendering Environment Handling**: Plugins have access to premade environments for drawing

## Enhanced Plugin Structure

Every plugin must extend the base `Plugin` class, which includes helper methods for common operations:

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
    // Initialize your plugin here using the enhanced helper methods
  }
  
  async unload() {
    // Let the base class handle cleanup
    await super.unload();
    
    // Add any plugin-specific cleanup
    this.myState = null;
  }
}
```

## Core Services

The core provides several services to plugins which are now wrapped in convenient helper methods:

1. **Parameter Management**: Add parameters with simple method calls
2. **Rendering Environment**: Access to 2D or 3D rendering contexts
3. **Action Registration**: Define UI actions with simple method calls
4. **Animation Loop**: Simplified animation lifecycle management
5. **Theme Management**: Color schemes and visual settings

## Plugin Lifecycle

### Initialization (start)

The `start` method is where you initialize your plugin:

```javascript
async start() {
  // 1. Get rendering environment - automatically done in the base class
  // this.renderEnv is already available

  // 2. Register visual parameters using helper methods
  this.addSlider('amplitude', 'Wave Amplitude', 1.0, { min: 0, max: 2, step: 0.1 });
  this.addSlider('frequency', 'Wave Frequency', 1.0, { min: 0.1, max: 5, step: 0.1 });
  
  // 3. Register structural parameters
  this.addDropdown('waveType', 'Wave Type', 'sine', ['sine', 'square', 'sawtooth'], 'structural');
  
  // 4. Register actions
  this.addAction('reset', 'Reset View', () => {
    // Reset the visualization
    this.reset();
    // Request a render refresh
    this.refresh();
  });
  
  // 5. Set up drawing objects and scene
  if (this.renderEnv.type === '2d') {
    // 2D environment setup
  } else {
    // 3D environment setup
    this.setupScene();
  }
  
  // 6. Initialize animation
  this.animationHandler = this.requestAnimation(this.animate.bind(this));
}
```

### Cleanup (unload)

Most cleanup is handled by the base class, but you can add plugin-specific cleanup:

```javascript
async unload() {
  // The base class will handle:
  // - Animation cancellation
  // - Event handler cleanup
  // - State reset
  await super.unload();
  
  // Add any plugin-specific cleanup:
  
  // Clean up any 3D objects if needed
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

The enhanced Plugin class provides direct methods for parameter management:

```javascript
// Add parameters with convenient helper methods
this.addSlider('amplitude', 'Wave Amplitude', 1.0, { min: 0, max: 2, step: 0.1 });
this.addCheckbox('showPoints', 'Show Points', true);
this.addColor('lineColor', 'Line Color', '#3498db');
this.addDropdown('style', 'Style', 'smooth', ['smooth', 'sharp', 'dotted']);
this.addNumber('iterations', 'Iterations', 10, { min: 1, max: 50, step: 1 });
this.addText('title', 'Title', 'My Visualization');

// For structural or advanced parameters, specify the group
this.addSlider('detail', 'Detail Level', 5, { min: 1, max: 10, step: 1 }, 'structural');
this.addCheckbox('debug', 'Show Debug Info', false, 'advanced');

// Get parameter values
const amplitude = this.getParameter('amplitude');
const allParams = this.getAllParameters();

// Set parameter values (updates UI automatically)
this.setParameter('amplitude', 1.5);

// Remove parameters if needed
this.removeParameter('title');

// Empty all parameters
this.emptyParameters(); // Or specify a group: this.emptyParameters('visual');
```

React to parameter changes:

```javascript
onParameterChanged(parameterId, value, group) {
  // Update local state based on parameter changes
  if (parameterId === 'amplitude') {
    this.amplitude = value;
  } else if (parameterId === 'frequency') {
    this.frequency = value;
    // Reset phase when frequency changes
    this.phase = 0;
  }
  
  // For 3D, update mesh properties if needed
  if (this.renderEnv.type === '3d' && this.meshGroup) {
    // No need to call refresh() - parameter changes trigger rendering automatically
    this.updateMeshes();
  }
}
```

## Rendering Implementation

### 2D Rendering

For 2D plugins, the rendering approach is similar:

```javascript
animate(deltaTime) {
  // Update animation state
  this.phase += deltaTime * this.frequency;
  
  // The environment is guaranteed to be 2D if renderingType is '2d'
  const ctx = this.renderEnv.context;
  const parameters = this.getAllParameters();
  
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
  const parameters = this.getAllParameters();
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
updateMeshes() {
  const parameters = this.getAllParameters();
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
```

## Animation

The enhanced Plugin class provides helper methods for animation:

```javascript
async start() {
  // Request animation with helper method
  this.animationHandler = this.requestAnimation(this.animate.bind(this));
  
  // You can have multiple animations if needed
  this.secondaryAnimation = this.requestAnimation(this.animateSecondary.bind(this));
}

animate(deltaTime) {
  // Update animation state
  this.phase += deltaTime * this.frequency;
  
  // For 2D, draw directly
  if (this.renderEnv.type === '2d') {
    const ctx = this.renderEnv.context;
    const parameters = this.getAllParameters();
    this.drawWave(ctx, parameters);
  }
  
  // For 3D, update meshes
  if (this.renderEnv.type === '3d' && this.meshGroup) {
    this.updateMeshes();
  }
  
  return true; // Continue animation
}

// You can cancel animations manually if needed
cancelMyAnimation() {
  if (this.secondaryAnimation) {
    this.cancelAnimation(this.secondaryAnimation);
    this.secondaryAnimation = null;
  }
}
```

The base `unload()` method will automatically cancel all animations, so you don't need to worry about cleanup.

## User Interaction

Handle user interaction through the `handleInteraction` method:

```javascript
handleInteraction(type, data) {
  switch (type) {
    case 'click':
      const { x, y } = data;
      // Handle click at coordinates (x, y)
      console.log(`Clicked at (${x}, ${y})`);
      break;
      
    case 'mousedown':
      // Handle mouse down
      this.isDragging = true;
      this.lastMousePos = { x: data.x, y: data.y };
      break;
      
    case 'mousemove':
      // Handle mouse move
      if (this.isDragging) {
        const dx = data.x - this.lastMousePos.x;
        const dy = data.y - this.lastMousePos.y;
        // Use dx/dy for interaction
        this.lastMousePos = { x: data.x, y: data.y };
        
        // Request a refresh to show changes
        this.refresh();
      }
      break;
      
    case 'mouseup':
      // Handle mouse up
      this.isDragging = false;
      break;
      
    case 'wheel':
      // Handle mouse wheel
      const { deltaY } = data;
      // Zoom in/out based on deltaY
      this.zoom *= (1 - deltaY * 0.001);
      
      // Request a refresh to show changes
      this.refresh();
      break;
      
    case 'touchstart':
    case 'touchmove':
    case 'touchend':
    case 'tap':
      // Handle touch events
      break;
      
    case 'keydown':
    case 'keyup':
      // Handle keyboard events
      const { key } = data;
      if (key === 'r') {
        // Reset view when 'r' is pressed
        this.reset();
        this.refresh();
      }
      break;
  }
}
```

## Key Concepts to Remember

1. **Simplified Parameter Management**: Use helper methods to add parameters
   ```javascript
   this.addSlider('amplitude', 'Amplitude', 1.0, { min: 0, max: 2, step: 0.1 });
   ```

2. **Easy Access to Parameters**: Get and set parameters directly
   ```javascript
   const amplitude = this.getParameter('amplitude');
   this.setParameter('amplitude', 1.5);
   ```

3. **Simple Animation Setup**: Request animations with a single method call
   ```javascript
   this.animationHandler = this.requestAnimation(this.animate.bind(this));
   ```

4. **Easier Rendering Refreshes**: Request refreshes directly
   ```javascript
   this.refresh();
   ```

5. **Action Registration**: Add actions with a simple method call
   ```javascript
   this.addAction('reset', 'Reset View', this.reset.bind(this));
   ```

6. **Automatic Resource Cleanup**: Base class handles most cleanup
   ```javascript
   async unload() {
     await super.unload(); // Handles animation, event, and parameter cleanup
     // Add plugin-specific cleanup
   }
   ```

## Best Practices

1. **Trust the environment type**: The framework guarantees the environment matches your plugin's `renderingType`

2. **Use the helper methods**: Take advantage of the Plugin class's helper methods

3. **Respond to parameter changes**: Implement `onParameterChanged` to react to user input

4. **Keep state in the plugin**: Don't modify global objects or DOM directly

5. **Clean up plugin-specific resources**: Call `super.unload()` and add any additional cleanup

6. **Use descriptive parameter names**: Parameters are your plugin's API

7. **Group parameters logically**: Use the group parameter to organize parameters into visual, structural, and advanced groups

## Example: Simple Wave Visualization (2D)

Here's a simple example of a 2D wave visualization plugin using the enhanced Plugin class:

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
  }
  
  async start() {
    // Add parameters using helper methods
    this.addSlider('amplitude', 'Amplitude', 1.0, { min: 0, max: 2, step: 0.1 });
    this.addSlider('frequency', 'Frequency', 1.0, { min: 0.1, max: 5, step: 0.1 });
    this.addColor('waveColor', 'Wave Color', '#3498db');
    
    // Add an action
    this.addAction('reset', 'Reset Wave', () => {
      this.phase = 0;
      this.refresh();
    });
    
    // Start animation
    this.requestAnimation(this.animate.bind(this));
  }
  
  animate(deltaTime) {
    // Update phase based on frequency
    const params = this.getAllParameters();
    this.phase += deltaTime * params.frequency;
    
    // Draw directly when animating
    const ctx = this.renderEnv.context;
    this.drawWave(ctx, params);
    
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
    // Animation will pick up parameter changes automatically
    // No need to do anything here
  }
  
  // Base class handles unload automatically including animation cancellation
}
```

## Example: 3D Visualization

For 3D visualizations, you can use the same enhanced helper methods:

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
    // Add parameters using helper methods
    this.addSlider('amplitude', 'Wave Amplitude', 0.3, { min: 0, max: 1, step: 0.05 });
    this.addSlider('speed', 'Animation Speed', 1.0, { min: 0, max: 3, step: 0.1 });
    this.addColor('sphereColor', 'Sphere Color', '#3498db');
    
    // Add an action
    this.addAction('reset', 'Reset Sphere', () => {
      this.phase = 0;
      this.refresh();
    });
    
    // Set up 3D scene
    this.setupScene();
    
    // Start animation
    this.requestAnimation(this.animate.bind(this));
  }
  
  setupScene() {
    // Create a group for our meshes
    this.meshGroup = new THREE.Group();
    
    // Get parameters
    const params = this.getAllParameters();
    
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
    const params = this.getAllParameters();
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
    
    // No need to call refresh() for 3D environments
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
    // Let base class handle animation cancellation
    await super.unload();
    
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