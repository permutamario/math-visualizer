```
src/
├── core/
│   ├── AppCore.js             # Application controller
│   ├── PluginRegistry.js      # Plugin management
│   ├── UIManager.js           # UI generation and management
│   ├── ParameterManager.js    # Parameter validation
│   ├── StateManager.js        # Application state
│   ├── Plugin.js              # Base plugin class
│   └── Visualization.js       # Base visualization class
│
├── rendering/
│   ├── RenderingManager.js    # Coordinates rendering
│   ├── Canvas2DEnvironment.js # 2D rendering environment
│   └── ThreeJSEnvironment.js  # 3D rendering environment
│
├── ui/
│   ├── UIBuilder.js           # Builds UI from schemas
│   ├── DesktopLayout.js       # Desktop-specific layout
│   ├── MobileLayout.js        # Mobile-specific layout
│   └── controls/              # UI control components
│
├── plugins/
│   ├── polytope-viewer/
│   │   ├── PolytopePlugin.js
│   │   └── visualizations/
│   │       ├── Tetrahedron.js
│   │       ├── Cube.js
│   │       └── Icosahedron.js
│   │
│   ├── positroid/
│   │   ├── PositroidPlugin.js
│   │   └── visualizations/
│   │       ├── PlabicGraph.js
│   │       └── DecoratedPermutation.js
│   │
│   └── mirror-curves/
│       ├── MirrorCurvesPlugin.js
│       └── visualizations/
│           ├── Traditional.js
│           └── Modern.js
│
└── index.js                   # Application entry point
```

## 5. Application Flow

1. **Initialization**
   - AppCore loads and initializes
   - PluginRegistry discovers available plugins
   - Default plugin is activated

2. **Plugin Activation**
   - Plugin's `activate()` method is called
   - Plugin provides parameter schema
   - UIManager builds UI controls
   - Initial visualization is created and rendered

3. **User Interaction**
   - User changes parameter via UI
   - UIManager captures change
   - ParameterManager validates change
   - Plugin's `onParameterChanged()` method is called
   - Plugin updates visualization
   - RenderingManager triggers re-render

4. **Plugin Switching**
   - User selects new plugin from dropdown
   - Current plugin is deactivated
   - New plugin is activated
   - UI rebuilds for new plugin
   - New visualization renders

## 6. Rendering Process

1. **2D Rendering**
   - Plugin provides 2D visualization implementation
   - RenderingManager sets up canvas context
   - Animation loop calls visualization's `render2D()` method
   - Canvas is updated with visualization

2. **3D Rendering**
   - Plugin provides 3D visualization implementation
   - RenderingManager initializes THREE.js
   - Animation loop calls visualization's `render3D()` method
   - THREE.js renders the scene

## 7. Plugin Implementation Example

```
// Simplified example of implementation pattern
class PolygonPlugin extends Plugin {
  static id = "polygon"
  static name = "Regular Polygon"
  static description = "Interactive regular polygon visualization"
  
  getParameterSchema() {
    return {
      structural: [
        {
          id: "sides",
          type: "slider",
          label: "Number of Sides",
          min: 3,
          max: 20,
          step: 1,
          default: 5
        }
      ],
      visual: [
        {
          id: "color",
          type: "color",
          label: "Fill Color",
          default: "#3498db"
        }
      ]
    }
  }
  
  onParameterChanged(id, value) {
    // Update visualization parameters
    this.parameters[id] = value
    // Update mathematical model if needed
    if (id === "sides") {
      this.updatePolygonGeometry()
    }
  }
  
  render2D(ctx, parameters) {
    // Render the polygon
  }
}
```

## 8. Requirements

- All plugins must extend the Plugin base class
- Visualizations must implement the Visualization interface
- UI is generated solely from parameter schemas
- No direct DOM manipulation in plugins
- Clean separation between math/visualization logic and UI
- Support for both 2D and 3D visualizations
- Responsive design for desktop and mobile devices

This specification provides a clean, maintainable architecture that separates concerns appropriately while allowing for powerful mathematical visualizations.
