# 1. Parameter and UI Guide

## Parameter System Overview

The Math Visualization Framework uses a structured parameter system that serves as the single source of truth for all visualization settings. Parameters are automatically connected to the user interface, enabling seamless updates and consistent state management.

### Parameter Groups

Parameters are organized into three functional groups:

1. **Visual Parameters**: Control appearance and style (default group)
   - Colors, sizes, opacity, visibility toggles
   - Directly affect the visual output without changing the underlying structure

2. **Structural Parameters**: Define the visualization's fundamental structure
   - Data sources, algorithms, computational methods
   - Changes typically require rebuilding the visualization

3. **Advanced Parameters**: Technical settings for fine-tuning
   - Performance options, debug toggles, specialized behaviors
   - Typically hidden by default in the UI

## Adding Parameters

### Helper Methods

The plugin base class provides helper methods for adding various parameter types:

```javascript
// Visual parameters (default group)
this.addSlider('amplitude', 'Wave Amplitude', 1.0, { min: 0, max: 2, step: 0.1 });
this.addCheckbox('showGrid', 'Show Grid', true);
this.addColorPalette(); // Add color palette selection (recommended over direct color selection)

// Structural parameters
this.addDropdown('dataSource', 'Data Source', 'random', ['random', 'sequential'], 'structural');
this.addNumber('pointCount', 'Point Count', 100, { min: 10, max: 1000 }, 'structural');

// Advanced parameters
this.addText('customEquation', 'Custom Equation', 'x^2 + y^2', 'advanced');
```

### Available Parameter Types

| Method | Purpose | Options |
|--------|---------|---------|
| `addSlider()` | Numeric range with visual slider | min, max, step |
| `addCheckbox()` | Boolean toggle | none |
| `addDropdown()` | Selection from a list of options | options array |
| `addNumber()` | Direct numeric entry | min, max, step |
| `addText()` | Text input | none |
| `addColorPalette()` | Color scheme selection | none (uses system palettes) |

## Parameter Management

### Getting and Setting Parameter Values

Always use the framework methods to access and update parameters:

```javascript
// Get current value
const amplitude = this.getParameter('amplitude');

// Set new value (triggers UI update and onParameterChanged)
this.setParameter('amplitude', 1.5);

// Get all parameter values
const allParams = this.getAllParameters();
```

### Handling Parameter Changes

Implement the `onParameterChanged` method to respond to parameter updates:

```javascript
onParameterChanged(parameterId, value, group) {
  // Respond to parameter changes
  if (parameterId === 'amplitude') {
    // Update the amplitude-related visuals
    this.updateWaveAmplitude(value);
  } else if (parameterId === 'dataSource' && group === 'structural') {
    // Handle structural parameter change (rebuild visualization)
    this.loadDataFromSource(value);
  }
  
  // Call refresh() after parameter changes to update the visualization
  this.refresh();
}
```

## Action Management

Actions appear as buttons in the UI and trigger behavior when clicked.

### Adding Actions

```javascript
// Basic action
this.addAction('reset', 'Reset View', () => {
  // Reset visualization state
  this.resetVisualization();
});

// Action with options
this.addAction('randomize', 'Randomize Data', () => {
  this.generateRandomData();
}, { icon: 'shuffle' });
```

### Action Callbacks

Action callbacks should:
1. Perform the operation
2. Update parameters if needed (via `setParameter()`)
3. Return boolean indicating success/failure

```javascript
this.addAction('findPatterns', 'Find Patterns', () => {
  try {
    const patterns = this.analyzeData();
    if (patterns.length === 0) {
      // Show message if no patterns found
      return false;
    }
    
    // Update parameters based on discovered patterns
    this.setParameter('patternCount', patterns.length);
    this.highlightPatterns(patterns);
    return true;
  } catch (error) {
    console.error('Pattern analysis failed:', error);
    return false;
  }
});
```

## Color Management

The framework enforces a consistent color system across all visualizations.

### Color Categories

1. **Structural Colors**: For interface and layout elements
   - `grid`, `weak`, `strong`, `guide`, `highlight`

2. **Main Colors**: For primary visualization elements
   - Array of colors accessible by index

3. **Functional Colors**: For elements with specific meaning
   - `positive`, `negative`, `neutral`, `selected`, `interactive`

### Using the Color System

```javascript
// Get structural colors for UI elements
const gridColor = this.getStructuralColor('grid');
const axisColor = this.getStructuralColor('strong');

// Get main colors for visualization elements
const primaryColor = this.getMainColor(0);
const secondaryColor = this.getMainColor(1);
// Or get the full array
const allColors = this.getMainColors();

// Get functional colors for semantic elements
const errorColor = this.getFunctionalColor('negative');
const selectedColor = this.getFunctionalColor('selected');
```

### Color Palette Selection

Add a color palette selector to allow users to choose their preferred color scheme:

```javascript
// Add a color palette dropdown
this.addColorPalette();

// Listen for palette changes
this.onPaletteChanged(() => {
  // Update all colored elements
  this.updateColors();
  // Mark for refresh
  this.isDirtyVisuals = true;
});
```

Always use the color system methods rather than hardcoding colors to ensure proper theme integration and accessibility.

# 2. 2D Visualization with Konva

## Konva Environment Overview

The Math Visualization Framework provides a structured 2D rendering environment using the Konva library. All Konva objects are managed through the framework to ensure proper lifecycle management and event handling.

### Accessing the Konva Environment

```javascript
// In the start() method:
const { stage, layer, konva } = this.renderEnv;

// Create and add objects
const rect = new konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  fill: this.getMainColor(0),
  stroke: this.getStructuralColor('strong'),
  strokeWidth: 2
});

// Add to layer
layer.add(rect);
```

### Environment Structure

- `stage`: Main Konva.Stage container
- `layer`: Primary Konva.Layer for drawing
- `konva`: Reference to the Konva library

## Creating 2D Visualizations

### Basic Objects and Groups

```javascript
// Create a group to organize related shapes
this.waveGroup = new this.renderEnv.konva.Group();

// Create shapes
this.waveShape = new this.renderEnv.konva.Line({
  points: [],
  stroke: this.getMainColor(0),
  strokeWidth: 2,
  lineCap: 'round',
  lineJoin: 'round'
});

// Add shapes to the group
this.waveGroup.add(this.waveShape);

// Add group to the layer
this.renderEnv.layer.add(this.waveGroup);
```

### Using Multiple Layers

For complex visualizations, create additional layers for better organization:

```javascript
// Create custom layers
this.backgroundLayer = new this.renderEnv.konva.Layer();
this.dataLayer = new this.renderEnv.konva.Layer();
this.uiLayer = new this.renderEnv.konva.Layer();

// Add layers to stage in drawing order (bottom to top)
this.renderEnv.stage.add(this.backgroundLayer);
this.renderEnv.stage.add(this.dataLayer);
this.renderEnv.stage.add(this.uiLayer);
```

### Updating Visualizations

Update visualization elements in response to parameter changes or animation frames:

```javascript
// Update a line shape with new points
updateWave() {
  const points = [];
  const width = this.renderEnv.stage.width();
  const height = this.renderEnv.stage.height();
  const amplitude = this.getParameter('amplitude');
  
  for (let x = 0; x < width; x += 5) {
    const y = height/2 + Math.sin(x * 0.01 + this.phase) * amplitude * height/4;
    points.push(x, y);
  }
  
  // Update the shape
  this.waveShape.points(points);
  
  // Use refresh() to trigger redraw
  this.refresh();
}
```

## Animation in 2D

### Requesting Animation

Use the framework's animation system rather than direct `requestAnimationFrame`:

```javascript
start() {
  // Other initialization code...
  
  // Start animation
  this.animationHandler = this.requestAnimation(this.animate.bind(this));
}

// Animation callback
animate(deltaTime) {
  // deltaTime is in seconds
  
  // Update phase based on time and frequency
  this.phase += deltaTime * this.getParameter('frequency');
  
  // Update visualization
  this.updateWave();
  
  return true; // Continue animation
}
```

### Canceling Animation

```javascript
// Cancel a specific animation
this.cancelAnimation(this.animationHandler);

// Animations are automatically canceled during unload()
async unload() {
  // Let base class handle animation cleanup
  await super.unload();
  
  // Additional cleanup...
}
```

## Camera Controls in 2D

The framework provides built-in camera controls for 2D visualizations:

```javascript
// Pan the camera
this.renderEnv.panCamera(deltaX, deltaY);

// Zoom the camera
this.renderEnv.zoomCamera(factor, centerX, centerY);

// Reset camera to default position
this.renderEnv.resetCamera();

// Enable/disable automatic camera controls (mouse/touch)
this.renderEnv.setAutomaticCameraControls(enabled);
```

### Custom Camera Management

For advanced use cases, directly control camera transforms:

```javascript
// Apply transformations to a group
this.visualizationGroup.scale({ x: scale, y: scale });
this.visualizationGroup.position({ x: posX, y: posY });

// Refresh the layer
this.refresh();
```

## Handling Interaction

Implement the `handleInteraction` method to respond to user events:

```javascript
handleInteraction(type, data) {
  if (type === 'click') {
    // Get coordinates relative to the stage
    const { x, y } = data;
    
    // Check if clicking on a specific object
    if (data.target === this.waveShape) {
      // Handle click on wave
      this.toggleWaveSelection();
    } else {
      // Handle background click
      this.deselectAll();
    }
  } else if (type === 'wheel') {
    // Handle zoom with mouse wheel if automatic controls are disabled
    if (!this.getParameter('automaticZoom')) {
      const zoomFactor = data.deltaY > 0 ? 0.9 : 1.1;
      this.renderEnv.zoomCamera(zoomFactor, data.x, data.y);
    }
  }
}
```

## Resource Management

Register resources for proper cleanup:

```javascript
async unload() {
  // Clean up Konva objects
  if (this.waveGroup) {
    this.waveGroup.destroy();
    this.waveGroup = null;
  }
  
  // Let base class handle animation and event cleanup
  await super.unload();
}
```

# 3. 3D Visualization with Three.js

## Three.js Environment Overview

The Math Visualization Framework provides a structured 3D rendering environment using Three.js. Access the environment through the `renderEnv` property to create and manage 3D visualizations.

### Accessing the Three.js Environment

```javascript
// In the start() method:
const { scene, camera, renderer, controls, THREE } = this.renderEnv;

// Create a mesh group to organize objects
this.meshGroup = new THREE.Group();

// Add to scene
scene.add(this.meshGroup);
```

### Environment Structure

- `scene`: THREE.Scene containing all objects
- `camera`: Main camera (typically PerspectiveCamera)
- `renderer`: WebGLRenderer instance
- `controls`: Camera controls for orbit, pan, zoom
- `THREE`: Reference to the Three.js library

## Creating 3D Visualizations

### Basic Objects and Materials

```javascript
// Create geometry
const geometry = new this.renderEnv.THREE.SphereGeometry(
  this.getParameter('radius'),
  32,  // widthSegments
  32   // heightSegments
);

// Create material
const material = new this.renderEnv.THREE.MeshStandardMaterial({
  color: this.getMainColor(0),
  roughness: 0.5,
  metalness: 0.2
});

// Create mesh
this.sphere = new this.renderEnv.THREE.Mesh(geometry, material);

// Add to group
this.meshGroup.add(this.sphere);
```

### Organizing the Scene

Use groups to organize related objects for easier management:

```javascript
// Create groups for different components
this.meshGroup = new this.renderEnv.THREE.Group();
this.lightsGroup = new this.renderEnv.THREE.Group();
this.helpersGroup = new this.renderEnv.THREE.Group();

// Add groups to scene
this.renderEnv.scene.add(this.meshGroup);
this.renderEnv.scene.add(this.lightsGroup);
this.renderEnv.scene.add(this.helpersGroup);
```

## Using Render Modes

The framework provides pre-configured render modes that combine materials and lighting for consistent visual styles:

```javascript
// Apply a render mode to the mesh group
if (this.core && this.core.renderModeManager) {
  const renderMode = this.getParameter('renderMode');
  this.core.renderModeManager.applyRenderMode(
    this.renderEnv.scene,
    this.meshGroup,
    renderMode,
    {
      opacity: this.getParameter('opacity'),
      baseColor: new this.renderEnv.THREE.Color(this.getMainColor(0))
    }
  );
}
```

### Available Render Modes

- `standard`: Balanced lighting with standard materials
- `metallic`: Metallic surfaces with dramatic lighting
- `glass`: Transparent glass-like materials
- `toon`: Cel-shaded cartoon style
- And more...

### Custom Lighting

While render modes handle lighting automatically, you can add custom lights if needed:

```javascript
// Add a custom spotlight
const spotlight = new this.renderEnv.THREE.SpotLight(0xffffff, 1);
spotlight.position.set(10, 10, 10);
spotlight.angle = Math.PI / 6;
spotlight.penumbra = 0.2;
spotlight.decay = 2;

this.lightsGroup.add(spotlight);
```

## Animation in 3D

Use the framework's animation system to update your 3D scene:

```javascript
start() {
  // Other initialization...
  
  // Request animation
  this.animationHandler = this.requestAnimation(this.animate.bind(this));
}

animate(deltaTime) {
  // Update rotation based on time
  if (this.sphere) {
    this.sphere.rotation.x += deltaTime * 0.5;
    this.sphere.rotation.y += deltaTime * 0.3;
  }
  
  // Framework handles rendering
  return true; // Continue animation
}
```

## Camera and Controls

The framework provides built-in camera controls for 3D visualizations:

```javascript
// Reset camera to default position
this.renderEnv.resetCamera();

// The camera controls are automatically created and configured
// Access them for custom adjustments:
const controls = this.renderEnv.controls;

// Example: Adjust control limits
if (controls) {
  controls.minDistance = 2;
  controls.maxDistance = 10;
}
```

## Handling Interaction

Implement the `handleInteraction` method to respond to user events:

```javascript
handleInteraction(type, data) {
  if (type === 'click') {
    // Cast a ray to find intersected objects
    const raycaster = new this.renderEnv.THREE.Raycaster();
    const mouse = new this.renderEnv.THREE.Vector2();
    
    // Calculate normalized device coordinates
    mouse.x = (data.x / this.renderEnv.renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(data.y / this.renderEnv.renderer.domElement.clientHeight) * 2 + 1;
    
    // Set up raycaster
    raycaster.setFromCamera(mouse, this.renderEnv.camera);
    
    // Find intersections with objects in the mesh group
    const intersects = raycaster.intersectObjects(this.meshGroup.children, true);
    
    if (intersects.length > 0) {
      // Handle intersection
      this.handleObjectClick(intersects[0].object);
    }
  }
}
```

## Resource Management

Properly clean up Three.js resources to prevent memory leaks:

```javascript
async unload() {
  // Clean up Three.js objects
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
  }
  
  // Let base class handle animation and event cleanup
  await super.unload();
}
```

### Advanced Resource Management

For complex visualizations with many objects:

```javascript
// Track resources for disposal
this.resources = {
  geometries: [],
  materials: [],
  textures: []
};

// When creating resources, track them
const geometry = new this.renderEnv.THREE.BoxGeometry(1, 1, 1);
this.resources.geometries.push(geometry);

const texture = new this.renderEnv.THREE.TextureLoader().load('texture.jpg');
this.resources.textures.push(texture);

const material = new this.renderEnv.THREE.MeshStandardMaterial({ map: texture });
this.resources.materials.push(material);

// During unload, dispose all tracked resources
async unload() {
  // Dispose geometry resources
  this.resources.geometries.forEach(geometry => {
    if (geometry) geometry.dispose();
  });
  
  // Dispose material resources
  this.resources.materials.forEach(material => {
    if (material) material.dispose();
  });
  
  // Dispose texture resources
  this.resources.textures.forEach(texture => {
    if (texture) texture.dispose();
  });
  
  // Clear resource references
  this.resources = null;
  
  await super.unload();
}
```

By following these guidelines, your 3D visualizations will integrate seamlessly with the Math Visualization Framework while maintaining consistent performance and visual style.