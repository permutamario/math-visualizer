# Math Visualization Framework: Updated Plugin Developer Guide

## Introduction

The Math Visualization Framework is built on a component plugin architecture that emphasizes clean separation of concerns and an intuitive API. This updated guide will help you create plugins using the enhanced Plugin base class with the framework's modern rendering approach using **Konva for 2D** and **Three.js for 3D** visualizations.

## Key Framework Architecture Updates

The framework now leverages Konva for 2D visualizations, providing a powerful and efficient rendering library that offers:

1. Object-oriented shape manipulation
2. Event handling
3. Animations and tweening
4. Layer-based rendering
5. Transformations (scale, rotate, etc.)
6. Built-in camera/viewport controls

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
    this.myState = {
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
    this.myState = null;
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

// For 2D with Konva
setupKonvaObjects() {
  // Get Konva stage and layer
  const { stage, layer } = this.renderEnv;
  
  // Create Konva objects
  this.waveGroup = new this.renderEnv.konva.Group();
  this.waveLine = new this.renderEnv.konva.Line({
    points: [],
    stroke: this.getParameter('lineColor'),
    strokeWidth: 2,
    lineCap: 'round',
    lineJoin: 'round'
  });
  
  // Add to layer
  this.waveGroup.add(this.waveLine);
  layer.add(this.waveGroup);
}
```

### 2. Animation and Updates

```javascript
animate(deltaTime) {
  // Update animation state
  this.phase += deltaTime * this.getParameter('frequency');
  
  if (this.renderEnv.type === '2d') {
    this.updateKonvaObjects();
  } else {
    this.updateThreeJsObjects();
  }
  
  return true; // Continue animation
}

// For 2D with Konva
updateKonvaObjects() {
  const { width, height } = this.renderEnv.stage.size();
  const amplitude = this.getParameter('amplitude');
  
  // Calculate wave points
  const points = [];
  for (let x = 0; x < width; x += 5) {
    const y = height/2 + Math.sin(x * 0.01 + this.phase) * amplitude * height/4;
    points.push(x, y);
  }
  
  // Update Konva shape
  this.waveLine.points(points);
  this.waveLine.stroke(this.getParameter('lineColor'));
  
  // Trigger a redraw
  this.renderEnv.layer.batchDraw();
}
```

### 3. Responding to Parameter Changes

```javascript
onParameterChanged(parameterId, value, group) {
  // Update visualization based on parameter changes
  if (parameterId === 'lineColor') {
    this.waveLine.stroke(value);
    this.renderEnv.layer.batchDraw();
  } else if (parameterId === 'amplitude') {
    // Parameter updates are automatically handled during animation
    // No action needed here unless you want immediate updates
  }
}
```

### 4. Handling User Interaction

```javascript
handleInteraction(type, data) {
  switch (type) {
    case 'click':
      // Handle click at coordinates (data.x, data.y)
      console.log(`Clicked at (${data.x}, ${data.y})`);
      break;
      
    case 'wheel':
      // You can use built-in camera control or custom handling
      // For custom handling:
      const { deltaY } = data;
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      this.renderEnv.zoomCamera(zoomFactor, data.x, data.y);
      break;
  }
}
```

### 5. Cleanup (unload)

```javascript
async unload() {
  // The base class will handle animation cancellation and event cleanup
  await super.unload();
  
  // Clean up Konva objects
  if (this.renderEnv.type === '2d' && this.waveGroup) {
    this.waveGroup.destroy();
    this.waveGroup = null;
  }
  
  // Clean up THREE.js objects
  if (this.renderEnv.type === '3d' && this.meshGroup) {
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
}
```

## Complete List of Plugin Helper Methods

### Parameter Management

```javascript
// Adding parameters
this.addSlider('id', 'Label', defaultValue, { min: 0, max: 100, step: 1 }, 'visual|structural|advanced');
this.addCheckbox('id', 'Label', defaultValue, 'visual|structural|advanced');
this.addColor('id', 'Label', '#hexcolor', 'visual|structural|advanced');
this.addDropdown('id', 'Label', defaultValue, ['option1', 'option2'], 'visual|structural|advanced');
this.addNumber('id', 'Label', defaultValue, { min: 0, max: 100, step: 1 }, 'visual|structural|advanced');
this.addText('id', 'Label', defaultValue, 'visual|structural|advanced');

// Getting and setting parameters
const value = this.getParameter('id');
this.setParameter('id', newValue);
const allParams = this.getAllParameters();

// Removing parameters
this.removeParameter('id', 'visual|structural|advanced');
this.emptyParameters('visual|structural|advanced'); // or null for all
```

### Action Management

```javascript
// Adding actions
this.addAction('id', 'Label', () => { /* callback */ }, { /* options */ });

// Removing actions
this.removeAction('id');
```

### Animation Management

```javascript
// Starting animations
this.animationHandler = this.requestAnimation(this.animate.bind(this));

// Stopping animations
this.cancelAnimation(this.animationHandler);
```

### Rendering Environment (2D - Konva)

```javascript
// Access to Konva objects
const stage = this.renderEnv.stage;
const layer = this.renderEnv.layer;
const Konva = this.renderEnv.konva;

// Camera controls
this.renderEnv.panCamera(dx, dy);
this.renderEnv.zoomCamera(factor, centerX, centerY);
this.renderEnv.resetCamera();
this.renderEnv.setAutomaticCameraControls(enabled);
```

### Rendering Environment (3D - THREE.js)

```javascript
// Access to THREE.js objects
const scene = this.renderEnv.scene;
const camera = this.renderEnv.camera;
const renderer = this.renderEnv.renderer;
const controls = this.renderEnv.controls;
const THREE = this.renderEnv.THREE;

// Camera reset
this.renderEnv.resetCamera();
```

## Example: 2D Visualization with Konva

Here's a complete example of a 2D visualization using Konva:

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
    
    // Add an action for reset
    this.addAction('reset', 'Reset Wave', () => {
      this.phase = 0;
    });
    
    // Set up Konva objects
    this.setupKonvaObjects();
    
    // Start animation
    this.requestAnimation(this.animate.bind(this));
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
    // Update phase based on frequency
    const frequency = this.getParameter('frequency');
    this.phase += deltaTime * frequency;
    
    // Update Konva objects
    this.updateWave();
    
    return true; // Continue animation
  }
  
  updateWave() {
    // Get parameters and dimensions
    const amplitude = this.getParameter('amplitude');
    const { width, height } = this.renderEnv.stage.size();
    
    // Calculate wave points
    const points = [];
    for (let x = 0; x < width; x += 5) {
      const y = height/2 + Math.sin(x * 0.01 + this.phase) * amplitude * height/4;
      points.push(x, y);
    }
    
    // Update wave line
    this.waveLine.points(points);
    this.waveLine.stroke(this.getParameter('waveColor'));
    
    // Redraw the layer
    this.renderEnv.layer.batchDraw();
  }
  
  onParameterChanged(parameterId, value, group) {
    // For immediate visual updates without waiting for animation frame
    if (parameterId === 'waveColor' && this.waveLine) {
      this.waveLine.stroke(value);
      this.renderEnv.layer.batchDraw();
    }
  }
  
  handleInteraction(type, data) {
    if (type === 'click') {
      // For example, toggle animation on click
      this.setParameter('frequency', this.getParameter('frequency') > 0 ? 0 : 1.0);
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

## Example: 3D Visualization with THREE.js

```javascript
import { Plugin } from '../../core/Plugin.js';

export default class SphereVisualization extends Plugin {
  static id = 'sphere-visualization';
  static name = '3D Sphere Visualization';
  static description = 'A 3D sphere with dynamic surface';
  static renderingType = '3d';
  
  constructor(core) {
    super(core);
    this.phase = 0;
  }
  
  async start() {
    // Add parameters
    this.addSlider('radius', 'Radius', 1.0, { min: 0.5, max: 2.0, step: 0.1 });
    this.addSlider('detail', 'Detail', 32, { min: 8, max: 64, step: 8 });
    this.addColor('sphereColor', 'Sphere Color', '#3498db');
    
    // Set up THREE.js objects
    this.setupThreeJsObjects();
    
    // Start animation
    this.requestAnimation(this.animate.bind(this));
  }
  
  setupThreeJsObjects() {
    // Get THREE.js objects
    const { scene, THREE } = this.renderEnv;
    
    // Create a group for all meshes
    this.meshGroup = new THREE.Group();
    
    // Create a sphere
    const radius = this.getParameter('radius');
    const detail = this.getParameter('detail');
    const color = this.getParameter('sphereColor');
    
    const geometry = new THREE.SphereGeometry(radius, detail, detail);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.2
    });
    
    this.sphere = new THREE.Mesh(geometry, material);
    this.meshGroup.add(this.sphere);
    
    // Add to scene
    scene.add(this.meshGroup);
  }
  
  animate(deltaTime) {
    // Rotate sphere
    if (this.sphere) {
      this.sphere.rotation.x += deltaTime * 0.2;
      this.sphere.rotation.y += deltaTime * 0.5;
    }
    
    return true; // Continue animation
  }
  
  onParameterChanged(parameterId, value, group) {
    if (!this.sphere) return;
    
    if (parameterId === 'sphereColor') {
      this.sphere.material.color.set(value);
      this.sphere.material.needsUpdate = true;
    } else if (parameterId === 'radius' || parameterId === 'detail') {
      // Recreate geometry with new parameters
      const radius = this.getParameter('radius');
      const detail = this.getParameter('detail');
      
      const oldGeometry = this.sphere.geometry;
      this.sphere.geometry = new this.renderEnv.THREE.SphereGeometry(radius, detail, detail);
      oldGeometry.dispose();
    }
  }
  
  async unload() {
    // Let base class handle animation and event cleanup
    await super.unload();
    
    // Clean up THREE.js objects
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

## Best Practices

1. **Use Konva for all 2D rendering** - The framework now prefers Konva over direct canvas operations for 2D visualizations.

2. **Use helper methods** - Take advantage of the Plugin class's helper methods for parameters, actions, etc.

3. **Handle proper cleanup** - Always call `super.unload()` and properly dispose of all created resources.

4. **React to parameter changes** - Implement `onParameterChanged` to update your visualization when parameters change.

5. **Use appropriate groups for parameters** - Organize parameters into 'visual', 'structural', and 'advanced' groups.

6. **Use Konva layers correctly** - Add objects to the provided layer rather than creating new ones.

7. **Implement interaction handling** - Use the `handleInteraction` method to respond to user interaction events.

8. **Utilize camera controls** - Use the provided camera controls for panning and zooming.

By following these guidelines and using the enhanced Plugin base class, you can create powerful, interactive visualizations within the Math Visualization Framework.