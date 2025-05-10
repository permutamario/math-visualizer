I've examined the code repository in detail, and I'll create a comprehensive guide for building plugins for the Math Visualization Framework. Based on the structure and patterns in the code, here's how to create and integrate your own visualization plugins:

# Guide to Creating Plugins for Math Visualization Framework

## Plugin Structure Overview

The framework uses a plugin system where each plugin:
1. Defines parameters that users can manipulate
2. Contains one or more visualizations to render
3. Handles parameter changes and user interactions

## Step-by-Step Plugin Creation

### 1. Create Plugin Directory

Create a new directory under `src/plugins/` with your plugin name:
```
src/plugins/my-plugin/
```

### 2. Create Plugin Main Class

Create an `index.js` file in your plugin directory that exports your plugin class:

```javascript
// src/plugins/my-plugin/index.js

import { Plugin } from '../../core/Plugin.js';
import { MyVisualization } from './MyVisualization.js';

export default class MyPlugin extends Plugin {
  // Plugin metadata
  static id = "my-plugin";
  static name = "My Plugin";
  static description = "Description of my plugin";
  static renderingType = "2d"; // Use "2d" or "3d"

  /**
   * Initialize default visualization
   * @private
   */
  async _initializeDefaultVisualization() {
    // Create visualization instance
    const visualization = new MyVisualization(this);
    
    // Register visualization
    this.registerVisualization('default', visualization);
    
    // Set as current visualization
    this.currentVisualization = visualization;
    
    // Initialize with current parameters
    await visualization.initialize(this.parameters);
  }

  /**
   * Define parameter schema
   * @returns {ParameterSchema} Schema defining parameters and UI controls
   */
  getParameterSchema() {
    return {
      structural: [
        {
          id: 'paramName',
          type: 'slider',
          label: 'Parameter Label',
          min: 0,
          max: 100,
          step: 1,
          default: 50
        }
        // Add more structural parameters
      ],
      visual: [
        {
          id: 'color',
          type: 'color',
          label: 'Color',
          default: '#3498db'
        }
        // Add more visual parameters
      ]
    };
  }

  /**
   * Custom action handling (optional)
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    // Handle custom actions
    if (actionId === 'my-custom-action') {
      // Implement custom action
      return true;
    }
    
    // Let parent handle standard actions like export
    return super.executeAction(actionId, ...args);
  }

  /**
   * Define available actions (optional)
   * @returns {Action[]} List of available actions
   */
  getActions() {
    return [
      ...super.getActions(), // Include default actions
      {
        id: 'my-custom-action',
        label: 'My Custom Action'
      }
    ];
  }
}
```

### 3. Create Visualization Class

Create a visualization class that will render your content:

```javascript
// src/plugins/my-plugin/MyVisualization.js

import { Visualization } from '../../core/Visualization.js';

export class MyVisualization extends Visualization {
  /**
   * Create a new visualization
   * @param {Plugin} plugin - Reference to the parent plugin
   */
  constructor(plugin) {
    super(plugin);
    
    // Initialize visualization state
    this.state = {
      // Your visualization state properties
    };
  }

  /**
   * Initialize the visualization with parameters
   * @param {Object} parameters - Parameter values
   */
  async initialize(parameters) {
    // Set up visualization with initial parameters
    this.update(parameters);
    return true;
  }

  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - New parameter values
   */
  update(parameters) {
    // Update visualization based on new parameters
    
    // For example:
    // this.state.paramName = parameters.paramName;
  }

  /**
   * Render the visualization in 2D
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} parameters - Current parameters
   */
  render2D(ctx, parameters) {
    // Implement 2D rendering
    // Example:
    ctx.fillStyle = parameters.color;
    ctx.beginPath();
    ctx.arc(0, 0, parameters.paramName, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render the visualization in 3D (if using 3D rendering)
   * @param {Object} THREE - THREE.js library
   * @param {THREE.Scene} scene - THREE.js scene
   * @param {Object} parameters - Current parameters
   */
  render3D(THREE, scene, parameters) {
    // Implement 3D rendering
    // Example:
    // const geometry = new THREE.SphereGeometry(parameters.paramName, 32, 32);
    // const material = new THREE.MeshStandardMaterial({ color: parameters.color });
    // const sphere = new THREE.Mesh(geometry, material);
    // scene.add(sphere);
  }

  /**
   * Handle animation updates
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   */
  animate(deltaTime) {
    // Update animation state
    // Return true if animation is active to keep rendering
    return false; // Set to true for continuous animation
  }

  /**
   * Handle user interaction
   * @param {string} type - Interaction type (e.g., "click", "mousemove")
   * @param {Object} event - Event data
   * @returns {boolean} Whether the interaction was handled
   */
  handleInteraction(type, event) {
    // Handle user interactions
    switch (type) {
      case 'click':
        console.log('Visualization clicked at', event.x, event.y);
        return true;
        
      case 'mousemove':
        // Handle mouse movement
        return true;
    }
    
    return false;
  }

  /**
   * Clean up resources when visualization is no longer needed
   */
  dispose() {
    // Clean up any resources
  }
}
```

### 4. Register Your Plugin

Update the plugin list file to include your plugin:

```
// Location: src/plugins/plugin_list.json

[
  "existing-plugin-1",
  "existing-plugin-2",
  "my-plugin"
]
```

## Available Parameter Types

You can use these parameter types in your plugin's schema:

1. `slider` - A range slider
   ```javascript
   {
     id: 'mySlider',
     type: 'slider',
     label: 'My Slider',
     min: 0,
     max: 100,
     step: 1,
     default: 50
   }
   ```

2. `checkbox` - A boolean checkbox
   ```javascript
   {
     id: 'myCheckbox',
     type: 'checkbox',
     label: 'My Checkbox',
     default: true
   }
   ```

3. `color` - A color picker
   ```javascript
   {
     id: 'myColor',
     type: 'color',
     label: 'My Color',
     default: '#3498db'
   }
   ```

4. `dropdown` - A selection dropdown
   ```javascript
   {
     id: 'myDropdown',
     type: 'dropdown',
     label: 'My Dropdown',
     options: ['Option 1', 'Option 2', 'Option 3'],
     default: 'Option 1'
   }
   ```

5. `number` - A numeric input field
   ```javascript
   {
     id: 'myNumber',
     type: 'number',
     label: 'My Number',
     min: 0,
     max: 100,
     step: 1,
     default: 50
   }
   ```

6. `text` - A text input field
   ```javascript
   {
     id: 'myText',
     type: 'text',
     label: 'My Text',
     default: 'Default text'
   }
   ```

## Parameter Organization

Parameters are organized into two categories:
- `structural`: Core parameters that define the fundamental structure of the visualization (e.g., number of sides in a polygon)
- `visual`: Parameters that affect the visual appearance (e.g., colors, borders, etc.)

On desktop, these appear in separate panels. On mobile, structural parameters appear in the header while visual parameters appear in a menu.

## Rendering Types

Your plugin must specify a rendering type:
- `2d`: For Canvas 2D context rendering
- `3d`: For THREE.js 3D rendering

Based on this, the appropriate rendering environment will be activated when your plugin is selected.

## Handling Interactions

The framework provides these interaction events:
- `click`
- `mousedown`
- `mouseup`
- `mousemove`
- `wheel`
- `keydown`
- `keyup`

## Testing Your Plugin

Use the test.html page to test your plugin during development. You can also check your plugin by running the main application and selecting it from the plugin dropdown.

## Example: Simple Circle Plugin

Here's a complete example of a simple plugin that draws a circle:

```javascript
// src/plugins/circle-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { CircleVisualization } from './CircleVisualization.js';

export default class CirclePlugin extends Plugin {
  static id = "circle-plugin";
  static name = "Circle Visualization";
  static description = "A simple circle visualization";
  static renderingType = "2d";

  async _initializeDefaultVisualization() {
    const visualization = new CircleVisualization(this);
    this.registerVisualization('default', visualization);
    this.currentVisualization = visualization;
    await visualization.initialize(this.parameters);
  }

  getParameterSchema() {
    return {
      structural: [
        {
          id: 'radius',
          type: 'slider',
          label: 'Radius',
          min: 10,
          max: 200,
          step: 5,
          default: 100
        }
      ],
      visual: [
        {
          id: 'fillColor',
          type: 'color',
          label: 'Fill Color',
          default: '#3498db'
        },
        {
          id: 'stroke',
          type: 'checkbox',
          label: 'Show Outline',
          default: true
        },
        {
          id: 'strokeColor',
          type: 'color',
          label: 'Outline Color',
          default: '#000000'
        }
      ]
    };
  }
}

// src/plugins/circle-plugin/CircleVisualization.js
import { Visualization } from '../../core/Visualization.js';

export class CircleVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
  }

  async initialize(parameters) {
    return true;
  }

  render2D(ctx, parameters) {
    // Draw a circle
    ctx.fillStyle = parameters.fillColor;
    ctx.beginPath();
    ctx.arc(0, 0, parameters.radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (parameters.stroke) {
      ctx.strokeStyle = parameters.strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
```

This guide should help you create your own plugins for the Math Visualization Framework. The structure is designed to be modular and extensible, allowing you to focus on your visualization logic while the framework handles UI, parameter management, and rendering environments.