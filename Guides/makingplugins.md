# Creating Plugins: ASEP Example Guide

This guide provides a comprehensive walkthrough for creating a plugin for the Math Visualization Framework, using the Asymmetric Simple Exclusion Process (ASEP) plugin as a detailed example.

## Overview of the ASEP Plugin

The ASEP plugin (`src/plugins/asep-plugin/`) simulates a stochastic process where particles move along a lattice with asymmetric jumping rates. It demonstrates:

1. Multiple visualization variants (linear, open boundaries, circular)
2. Complex animation and interaction handling
3. Parameter-dependent behavior
4. Object-oriented visualization design

## Plugin Structure

The ASEP plugin is organized as follows:

```
src/plugins/asep-plugin/
├── index.js                        # Main plugin class
├── BaseASEPVisualization.js        # Shared base visualization class
├── ClosedASEPVisualization.js      # Closed linear ASEP variant
├── OpenASEPVisualization.js        # Open boundary ASEP variant
└── CircularASEPVisualization.js    # Circular ASEP variant
```

## Step 1: Create the Plugin Main Class

The main plugin class is defined in `index.js`:

```javascript
// src/plugins/asep-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { ClosedASEPVisualization } from './ClosedASEPVisualization.js';
import { OpenASEPVisualization } from './OpenASEPVisualization.js';
import { CircularASEPVisualization } from './CircularASEPVisualization.js';

export default class ASEPPlugin extends Plugin {
  static id = "asep-plugin";
  static name = "ASEP Simulation";
  static description = "Asymmetric Simple Exclusion Process simulation";
  static renderingType = "2d";

  // Initialize plugin-specific state
  constructor(core) {
    super(core);
    this.visualizations = new Map();
  }

  // Set up the default visualization
  async _initializeDefaultVisualization() {
    // Create all visualization types
    const closedViz = new ClosedASEPVisualization(this);
    const openViz = new OpenASEPVisualization(this);
    const circularViz = new CircularASEPVisualization(this);
    
    // Register visualizations
    this.registerVisualization('closed', closedViz);
    this.registerVisualization('open', openViz);
    this.registerVisualization('circular', circularViz);
    
    // Set initial visualization based on parameters
    const modelType = this.parameters.modelType || 'closed';
    
    // Activate the selected visualization type
    switch (modelType) {
      case 'open':
        this.currentVisualization = openViz;
        break;
      case 'circular':
        this.currentVisualization = circularViz;
        break;
      case 'closed':
      default:
        this.currentVisualization = closedViz;
        break;
    }
    
    // Initialize the visualization
    await this.currentVisualization.initialize(this.parameters);
  }

  // Define UI parameters
  getParameterSchema() {
    // Define common parameters
    const commonParams = [
      {
        id: 'modelType',
        type: 'dropdown',
        label: 'Model Type',
        options: [
          { value: 'closed', label: 'Closed Linear' },
          { value: 'open', label: 'Open Boundary' },
          { value: 'circular', label: 'Circular' }
        ],
        default: 'closed'
      },
      // Additional common parameters...
    ];
    
    // Add model-specific parameters based on current selection
    let specificParams = [];
    switch (this.parameters.modelType) {
      case 'open':
        specificParams = [
          {
            id: 'entryRate',
            type: 'slider',
            label: 'Entry Rate (Open)',
            min: 0,
            max: 5,
            step: 0.1,
            default: 0.5
          },
          // Additional open model parameters...
        ];
        break;
    }
    
    // Combine all parameters
    return {
      structural: [...commonParams, ...specificParams],
      visual: [
        // Visual appearance parameters...
      ]
    };
  }

  // Handle parameter changes
  onParameterChanged(parameterId, value) {
    // Update parameter value
    this.parameters[parameterId] = value;
    
    // Special handling for model type changes
    if (parameterId === 'modelType') {
      // Switch visualization
      const newViz = this.visualizations.get(value);
      
      if (newViz && newViz !== this.currentVisualization) {
        // Deactivate current visualization
        if (this.currentVisualization) {
          this.currentVisualization.dispose();
        }
        
        // Set and initialize the new visualization
        this.currentVisualization = newViz;
        this.currentVisualization.initialize(this.parameters);
        
        // Update parameter schema to reflect the new model type
        if (this.core && this.core.uiManager) {
          const paramSchema = this.getParameterSchema();
          this.core.uiManager.buildControlsFromSchema(paramSchema, this.parameters);
        }
      }
    } 
    // Handle structural changes that require reinitializing
    else if (['numBoxes', 'numParticles'].includes(parameterId)) {
      this.currentVisualization.initialize(this.parameters);
    } 
    // Handle other parameter updates
    else if (this.currentVisualization) {
      this.currentVisualization.update(this.parameters);
    }
  }
  
  // Define custom actions
  getActions() {
    return [
      ...super.getActions(),
      {
        id: 'toggle-simulation',
        label: 'Play/Pause Simulation'
      },
      {
        id: 'restart-simulation',
        label: 'Restart Simulation'
      }
    ];
  }
  
  // Handle action execution
  executeAction(actionId, ...args) {
    switch (actionId) {
      case 'toggle-simulation':
        // Toggle simulation state
        this.parameters.isPaused = !this.parameters.isPaused;
        this.currentVisualization.update({ isPaused: this.parameters.isPaused });
        
        // Update UI to reflect new state
        if (this.core && this.core.uiManager) {
          this.core.uiManager.updateControls(this.parameters);
        }
        return true;
        
      case 'restart-simulation':
        // Reinitialize the visualization
        if (this.currentVisualization) {
          this.currentVisualization.initialize(this.parameters);
        }
        return true;
        
      default:
        // Let parent handle standard actions
        return super.executeAction(actionId, ...args);
    }
  }
}
```

## Step 2: Create a Base Visualization Class

Create a shared base class for common functionality:

```javascript
// src/plugins/asep-plugin/BaseASEPVisualization.js
import { Visualization } from '../../core/Visualization.js';

export class BaseASEPVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Set the direct isAnimating property for the rendering manager
    this.isAnimating = true;
    
    // Store simulation state
    this.state = {
      isAnimating: true,
      isPaused: false,
      boxes: [],
      particles: [],
      jumpEvents: [],
      timeScale: 1.0,
      boxSize: 40,
      particleRadius: 14
    };
  }

  // Common methods shared across all ASEP visualizations
  
  // Clear simulation state
  clearSimulation() {
    // Clear existing timeouts
    this.state.jumpEvents.forEach(event => {
      if (event.timeoutId) {
        clearTimeout(event.timeoutId);
      }
    });
    
    // Reset state
    this.state.boxes = [];
    this.state.particles = [];
    this.state.jumpEvents = [];
  }
  
  // Animation handling
  animate(deltaTime) {
    // Update speed from parameters
    this.state.timeScale = this.plugin.parameters.animationSpeed || 1.0;
    
    // Request continuous rendering
    this.isAnimating = true;
    
    // Update particle positions
    const particlesToRemove = [];
    this.state.particles.forEach(particle => {
      if (particle.isJumping) {
        // Update jump progress
        particle.jumpProgress += deltaTime * particle.jumpSpeed * this.state.timeScale;
        
        // Update jump states
        // ...
        
        // Check for completed jumps
        if (particle.jumpProgress >= 1) {
          this.completeJump(particle, particlesToRemove);
        }
      }
    });
    
    // Remove particles if needed
    if (particlesToRemove.length > 0) {
      this.state.particles = this.state.particles.filter(p => !particlesToRemove.includes(p));
    }
    
    // Allow subclasses to add custom animation behavior
    this.customAnimate(deltaTime);
    
    // Always continue animation
    return true;
  }
  
  // Helper methods for particle drawing, color calculation, etc.
  // ...
  
  // Clean up when visualization is no longer needed
  dispose() {
    // Clear all timeouts
    this.state.jumpEvents.forEach(event => {
      if (event.timeoutId) {
        clearTimeout(event.timeoutId);
      }
    });
    
    // Reset state
    this.state.jumpEvents = [];
    this.state.particles = [];
    this.state.boxes = [];
    this.state.isAnimating = false;
    this.isAnimating = false;
  }
}
```

## Step 3: Create Specific Visualization Variants

Create specialized visualizations that extend the base class:

```javascript
// src/plugins/asep-plugin/ClosedASEPVisualization.js
import { BaseASEPVisualization } from './BaseASEPVisualization.js';

export class ClosedASEPVisualization extends BaseASEPVisualization {
  async initialize(parameters) {
    // Clear any existing state
    this.clearSimulation();
    
    // Create boxes
    this.createBoxes(parameters);
    
    // Create initial particles
    this.createParticles(parameters);
    
    // Schedule initial jumps
    this.scheduleInitialJumps();
    
    // Set animation flag
    this.state.isAnimating = true;
    this.isAnimating = true;
    this.state.isPaused = parameters.isPaused || false;
    
    // Set timeScale
    this.state.timeScale = parameters.animationSpeed || 1.0;
    
    return true;
  }
  
  // Specific implementations for closed model
  createBoxes(parameters) {
    // Create linear arrangement of boxes
    // ...
  }
  
  scheduleNextJump(particle) {
    if (this.state.isPaused) return;
    
    // Calculate jump probability based on rates
    const rightRate = this.plugin.parameters.rightJumpRate;
    const leftRate = this.plugin.parameters.leftJumpRate;
    
    // Schedule jump with timeout
    // ...
  }
  
  // Rendering method
  render2D(ctx, parameters) {
    // Draw boxes
    this.drawBoxes(ctx, parameters);
    
    // Draw particles
    this.drawParticles(ctx, parameters);
  }
  
  // User interaction handling
  handleInteraction(type, event) {
    if (type === 'click') {
      // Handle box clicks to add/remove particles
      // ...
    }
    
    return false;
  }
}
```

Implement other variants like `OpenASEPVisualization` and `CircularASEPVisualization` similarly, with their specialized behaviors.

## Step 4: Register the Plugin

Register the plugin in `src/plugins/plugin_list.json`:

```json
[
  "circle-plugin",
  "platonic-solids",
  "asep-plugin",
  "polytope-viewer"
]
```

## Key Techniques Demonstrated

### 1. Using a Base Class for Shared Functionality

The `BaseASEPVisualization` class demonstrates how to create a shared foundation:

```javascript
// Base class provides common methods
export class BaseASEPVisualization extends Visualization {
  // Shared functionality
}

// Specific implementations extend the base
export class ClosedASEPVisualization extends BaseASEPVisualization {
  // Specialized functionality
}
```

### 2. Switching Between Visualization Types

The plugin demonstrates how to handle different visualization variants:

```javascript
// Register multiple visualizations
this.registerVisualization('closed', closedViz);
this.registerVisualization('open', openViz);
this.registerVisualization('circular', circularViz);

// Switch based on parameter value
if (parameterId === 'modelType') {
  const newViz = this.visualizations.get(value);
  
  if (newViz && newViz !== this.currentVisualization) {
    // Clean up current
    this.currentVisualization.dispose();
    
    // Initialize new
    this.currentVisualization = newViz;
    this.currentVisualization.initialize(this.parameters);
    
    // Update UI
    // ...
  }
}
```

### 3. Dynamic Parameter Schema

The plugin shows how to change parameter options based on the selected model:

```javascript
getParameterSchema() {
  const commonParams = [
    // Common parameters
  ];
  
  // Add model-specific parameters
  let specificParams = [];
  switch (this.parameters.modelType) {
    case 'open':
      specificParams = [
        // Parameters only for open model
      ];
      break;
  }
  
  return {
    structural: [...commonParams, ...specificParams],
    visual: [
      // Visual parameters
    ]
  };
}
```

### 4. Animation and Event Scheduling

The ASEP plugin demonstrates complex animation with JavaScript timeouts:

```javascript
scheduleNextJump(particle) {
  // Calculate waiting time
  const waitTime = -Math.log(Math.random()) / totalRate;
  const scaledWaitTime = waitTime / this.state.timeScale;
  
  // Schedule event
  const jumpEvent = {
    particleId: particle.id,
    timeoutId: setTimeout(() => {
      // Perform jump
      // ...
    }, scaledWaitTime * 1000)
  };
  
  // Track event for cleanup
  this.state.jumpEvents.push(jumpEvent);
}
```

### 5. User Interaction Handling

The plugin shows how to handle user interaction events:

```javascript
handleInteraction(type, event) {
  if (type === 'click') {
    // Check if clicking on a box
    for (let i = 0; i < this.state.boxes.length; i++) {
      const box = this.state.boxes[i];
      const dx = event.x - box.x;
      const dy = event.y - box.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If clicked inside box
      if (distance <= this.state.boxSize / 2) {
        // Add or remove particles
        // ...
        return true;
      }
    }
  }
  
  return false;
}
```

### 6. State Cleanup

The plugin demonstrates proper resource cleanup:

```javascript
dispose() {
  // Clear all timeouts
  this.state.jumpEvents.forEach(event => {
    if (event.timeoutId) {
      clearTimeout(event.timeoutId);
    }
  });
  
  // Reset state
  this.state.jumpEvents = [];
  this.state.particles = [];
  this.state.boxes = [];
  this.state.isAnimating = false;
  this.isAnimating = false;
}
```

## Creating Your Own Plugin

To create your own plugin:

1. **Create a directory**: Make a new folder in `src/plugins/your-plugin-name/`

2. **Create main file**: Create `index.js` with your plugin class:
   ```javascript
   import { Plugin } from '../../core/Plugin.js';
   import { YourVisualization } from './YourVisualization.js';
   
   export default class YourPlugin extends Plugin {
     static id = "your-plugin-name";
     static name = "Your Plugin";
     static description = "Description";
     static renderingType = "2d"; // or "3d"
     
     async _initializeDefaultVisualization() {
       const viz = new YourVisualization(this);
       this.registerVisualization('default', viz);
       this.currentVisualization = viz;
       await viz.initialize(this.parameters);
     }
     
     getParameterSchema() {
       return {
         structural: [
           // Structural parameters
         ],
         visual: [
           // Visual parameters
         ]
       };
     }
   }
   ```

3. **Create visualization**: Create your visualization class:
   ```javascript
   import { Visualization } from '../../core/Visualization.js';
   
   export class YourVisualization extends Visualization {
     constructor(plugin) {
       super(plugin);
       this.state = { /* your state */ };
     }
     
     async initialize(parameters) {
       // Initialize your visualization
       return true;
     }
     
     render2D(ctx, parameters) {
       // Render in 2D
     }
     
     // Or for 3D:
     render3D(THREE, scene, parameters) {
       // Render in 3D
     }
     
     animate(deltaTime) {
       // Update animation
       return true; // Request continuous rendering
     }
   }
   ```

4. **Register your plugin**: Add your plugin name to `src/plugins/plugin_list.json`

5. **Test your plugin**: Start the application and select your plugin from the visualization selector

## Best Practices from the ASEP Example

1. **Separation of concerns**: Use a base class for shared functionality and specialized classes for variants
2. **State management**: Keep rendering state in the visualization class
3. **Clean initialization**: Always reset state during initialization
4. **Proper cleanup**: Dispose of resources and cancel timeouts when deactivated
5. **Dynamic parameters**: Adjust parameter options based on current selection
6. **Effective animation**: Use `animate()` method with `deltaTime` for smooth animation
7. **Interactive elements**: Handle user interaction with clear hit detection
8. **Consistent rendering**: Maintain visual consistency across different parameters
9. **Useful actions**: Provide relevant actions like play/pause and reset
10. **Visual feedback**: Update UI to reflect simulation state

By following these practices and the ASEP example, you can create sophisticated, interactive visualizations that take full advantage of the Math Visualization Framework.