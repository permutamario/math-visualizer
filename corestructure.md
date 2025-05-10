# Math Visualization Framework - Core Architecture

The Math Visualization Framework provides a modular system for creating interactive mathematical visualizations. This document describes the core architecture and components.

## System Overview

The framework uses a modular architecture with clear separation of concerns:

- **Core**: Central application controller and state management
- **Rendering**: Multiple rendering environments (2D and 3D)
- **UI**: Responsive interface with desktop and mobile layouts
- **Plugins**: Extensible plugin system for visualizations

## Core Components

### AppCore (`src/core/AppCore.js`)

The central controller that coordinates all other components:

- Initializes the application
- Manages plugin activation/deactivation
- Handles parameter changes
- Passes user actions to plugins
- Coordinates between UI, rendering, and plugin components

```javascript
// Example of AppCore initialization
const app = new AppCore();
await app.initialize();
await app.start();
```

### StateManager (`src/core/StateManager.js`)

Provides centralized state management with subscription capabilities:

- Stores application state
- Supports nested state access with dot notation
- Notifies listeners of state changes
- Allows batch state updates

### EventEmitter (`src/core/EventEmitter.js`)

Simple event system for component communication:

- Supports event registration via `on(event, listener)`
- One-time events via `once(event, listener)`
- Event unregistration via `off(event, listener)`
- Event broadcasting via `emit(event, ...args)`

### ParameterManager (`src/core/ParameterManager.js`)

Manages validation and processing of visualization parameters:

- Validates parameter values against schema definitions
- Converts values to appropriate types
- Enforces constraints (min/max, options, etc.)
- Provides default parameter values from schema

## Rendering System

### RenderingManager (`src/rendering/RenderingManager.js`)

Coordinates the rendering process:

- Manages rendering environments (2D and 3D)
- Controls animation loop
- Handles resizing and export functionality
- Switches between environments based on plugin requirements

```javascript
// Setting the appropriate rendering environment
renderingManager.setEnvironment('2d'); // or '3d'
```

### Canvas2DEnvironment (`src/rendering/Canvas2DEnvironment.js`)

Provides 2D rendering capabilities:

- Manages HTML5 Canvas context
- Handles camera transformations (pan, zoom, rotate)
- Processes mouse/keyboard interaction
- Coordinates with visualizations' `render2D` methods

### ThreeJSEnvironment (`src/rendering/ThreeJSEnvironment.js`)

Provides 3D rendering capabilities using THREE.js:

- Sets up THREE.js scene, camera, and renderer
- Manages lighting and controls
- Coordinates with visualizations' `render3D` methods
- Handles camera controls and animation

## UI System

### UIManager (`src/ui/UIManager.js`)

Manages UI creation and event handling:

- Determines appropriate layout (desktop/mobile)
- Creates UI controls from parameter schemas
- Routes UI events to visualization components
- Handles notifications and error messages

### DesktopLayout (`src/ui/DesktopLayout.js`)

Desktop-specific UI with floating panels:

- Structural parameters panel
- Visual parameters panel
- Export options panel
- Plugin selector dropdown

### MobileLayout (`src/ui/MobileLayout.js`)

Mobile-specific UI with sliding panels and bottom controls:

- Header with structural controls
- Bottom bar with action buttons
- Sliding menus for visual parameters and export options
- Fullscreen mode support

### UIBuilder (`src/ui/UIBuilder.js`)

Constructs UI controls from parameter definitions:

- Creates sliders, checkboxes, color pickers, dropdowns, etc.
- Handles UI event binding
- Creates notifications and error messages
- Provides consistent styling

## Startup Process

1. The `main()` function in `src/index.js` initializes the application
2. `AppCore` initializes all core components
3. `PluginRegistry` discovers available plugins
4. `UIManager` creates the appropriate layout
5. Default plugin is activated
6. Rendering loop starts
7. Loading screen is hidden

## Event Flow

1. User interacts with UI controls
2. `UIManager` captures events and notifies `AppCore`
3. `AppCore` validates and forwards parameter changes to active plugin
4. Plugin updates its visualization state
5. `RenderingManager` requests a render
6. Visualization is rendered via appropriate environment

## File Structure

```
src/
├── core/                   # Core application components
│   ├── AppCore.js          # Application controller
│   ├── EventEmitter.js     # Event system
│   ├── ParameterManager.js # Parameter validation
│   ├── ParameterSchema.js  # Parameter definitions
│   ├── Plugin.js           # Base plugin class
│   ├── PluginRegistry.js   # Plugin discovery
│   ├── StateManager.js     # State management
│   └── Visualization.js    # Base visualization class
│
├── rendering/              # Rendering systems
│   ├── Canvas2DEnvironment.js  # 2D rendering
│   ├── RenderingManager.js     # Render coordination
│   └── ThreeJSEnvironment.js   # 3D rendering
│
├── ui/                     # User interface components
│   ├── DesktopLayout.js    # Desktop UI layout
│   ├── MobileLayout.js     # Mobile UI layout
│   ├── UIBuilder.js        # UI control creator
│   ├── UIManager.js        # UI coordination
│   └── styles/             # CSS stylesheets
│
├── plugins/                # Visualization plugins
│   ├── circle-plugin/      # Simple circle example
│   ├── platonic-solids/    # 3D platonic solids
│   ├── polytope-viewer/    # Advanced polytopes
│   ├── asep-plugin/        # ASEP simulation
│   └── plugin_list.json    # Plugin registry
│
└── index.js                # Application entry point
```

## Responsive Design

The framework automatically adapts between desktop and mobile layouts:

- Desktop: Floating panels with side controls
- Mobile: Header with bottom action bar and sliding menus
- Layout transitions on window resize
- Touch controls for mobile interaction

## Visualization Rendering

Visualizations are rendered through a standardized interface:

- 2D visualizations implement `render2D(ctx, parameters)`
- 3D visualizations implement `render3D(THREE, scene, parameters)`
- Animation is controlled via `animate(deltaTime)`
- User interaction via `handleInteraction(type, event)`

The appropriate rendering method is called based on the plugin's declared rendering type.