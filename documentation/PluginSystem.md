
# Math Visualization Framework - Plugin Developer Guide

## Core API for Plugin Developers

The Math Visualization Framework provides a robust API for developing visualization plugins. This guide outlines the core services and interfaces available to plugin developers.

## Plugin Lifecycle

Plugins in the Math Visualization Framework follow a well-defined lifecycle:

1. **Discovery**: The framework scans for available plugins at startup
2. **Instantiation**: When selected, the plugin is instantiated and receives a reference to the Core API
3. **Loading**: The `load()` method is called, where you define parameters and initialize visualizations
4. **Interaction**: The plugin responds to parameter changes and user actions
5. **Unloading**: When another plugin is selected, `unload()` is called to clean up resources

## Parameter System Architecture

The parameter system is designed around a hierarchical structure:

### Parameter Groups

Parameters in the framework are organized into three distinct groups:

1. **Plugin Parameters**: Global parameters that affect all visualizations within the plugin
2. **Visualization Parameters**: Specific to the currently active visualization
3. **Advanced Parameters**: Optional parameters typically hidden by default or shown in a separate section

### Visualization Selection

A key plugin parameter is the `visualizationType`, which determines which visualization is currently active:

```javascript
// Sample plugin parameters with visualization selector
definePluginParameters() {
  return [
    {
      id: 'visualizationType',
      type: 'dropdown',
      label: 'Visualization Type',
      options: [
        { value: 'basic', label: 'Basic View' },
        { value: 'advanced', label: 'Advanced View' }
      ],
      default: 'basic'
    }
    // Other plugin-wide parameters
  ];
}
```

When this parameter changes, the plugin switches between different visualization implementations.

### Parameter Flow

1. **Definition**: Parameters are defined in three places:
   - Plugin parameters in `definePluginParameters()`
   - Visualization parameters in `Visualization.getParameters()` (static method)
   - Advanced parameters in `defineAdvancedParameters()`

2. **Collection**: The Core collects all parameters into groups and manages them separately

3. **UI Display**: Parameters are displayed in separate sections of the UI based on their group

4. **Changes**: When parameters change:
   - The Core calls `onParameterChanged(parameterId, value, group)`
   - The plugin updates its internal state
   - The plugin passes relevant parameters to the current visualization

5. **Visualization Switching**: When visualization type changes:
   - The plugin preserves global plugin parameters
   - Visualization-specific parameters are reset to defaults for the new visualization
   - The new visualization is initialized with the merged parameters

## Defining Parameters

### Plugin Parameters

Plugin parameters affect all visualizations and provide global configuration:

```javascript
// Plugin-level parameters
definePluginParameters() {
  return [
    {
      id: 'visualizationType',
      type: 'dropdown',
      label: 'Visualization Type', 
      options: this.visualizationTypes.map(vt => ({
        value: vt.id, 
        label: vt.name
      })),
      default: this.visualizationTypes[0]?.id || ''
    },
    {
      id: 'globalScale',
      type: 'slider',
      label: 'Global Scale',
      min: 0.5,
      max: 2.0,
      step: 0.1,
      default: 1.0
    }
    // Other plugin-wide parameters
  ];
}
```

### Visualization Parameters

Each visualization defines its specific parameters via a static method:

```javascript
// In your Visualization class
static getParameters() {
  return {
    structural: [
      {
        id: 'density',
        type: 'slider',
        label: 'Point Density',
        min: 10,
        max: 100,
        step: 5,
        default: 50
      }
    ],
    visual: [
      {
        id: 'pointColor',
        type: 'color',
        label: 'Point Color',
        default: '#3498db'
      }
    ]
  };
}
```

### Advanced Parameters

Advanced parameters are typically more complex or less frequently used:

```javascript
// Advanced parameters
defineAdvancedParameters() {
  return [
    {
      id: 'seedValue',
      type: 'number',
      label: 'Random Seed',
      min: 0,
      max: 1000,
      step: 1,
      default: 42
    },
    {
      id: 'optimizationLevel',
      type: 'dropdown',
      label: 'Optimization',
      options: [
        { value: 'low', label: 'Low (Faster)' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High (Better Quality)' }
      ],
      default: 'medium'
    }
  ];
}
```

## Parameter Handling in Plugins

The plugin acts as a coordinator for parameters between the Core and visualizations:

```javascript
// Handle parameter changes
onParameterChanged(parameterId, value, parameterGroup = null) {
  // Determine which group this parameter belongs to if not specified
  if (!parameterGroup) {
    if (this.pluginParameters.hasOwnProperty(parameterId)) {
      parameterGroup = 'plugin';
    } else if (this.visualizationParameters.hasOwnProperty(parameterId)) {
      parameterGroup = 'visualization';
    } else if (this.advancedParameters.hasOwnProperty(parameterId)) {
      parameterGroup = 'advanced';
    }
  }
  
  // Update the appropriate parameter collection
  switch (parameterGroup) {
    case 'plugin':
      this.pluginParameters[parameterId] = value;
      
      // Handle special case: visualization selection parameter
      if (parameterId === 'visualizationType' && this.visualizations.has(value)) {
        this.setVisualization(value);
        return; // Don't continue with normal parameter updates
      }
      
      // Update all visualizations with this parameter
      if (this.currentVisualization) {
        this.currentVisualization.update({ [parameterId]: value });
      }
      break;
      
    case 'visualization':
      this.visualizationParameters[parameterId] = value;
      
      // Update only the current visualization
      if (this.currentVisualization) {
        this.currentVisualization.update({ [parameterId]: value });
      }
      break;
      
    case 'advanced':
      this.advancedParameters[parameterId] = value;
      
      // Update current visualization with advanced parameters
      if (this.currentVisualization) {
        this.currentVisualization.update({ [parameterId]: value });
      }
      break;
  }
  
  // Request render update
  if (this.core && this.core.renderingManager) {
    this.core.renderingManager.requestRender();
  }
}
```

## Switching Visualizations

When the visualization type changes, the plugin handles the transition:

```javascript
async setVisualization(visualizationId) {
  // Check if the visualization exists
  if (!this.visualizations.has(visualizationId)) {
    console.error(`Visualization ${visualizationId} not found`);
    return false;
  }
  
  try {
    // Update plugin parameters if needed
    if (this.pluginParameters.visualizationType !== visualizationId) {
      this.pluginParameters.visualizationType = visualizationId;
    }
    
    // Clean up current visualization if any
    if (this.currentVisualization) {
      this.currentVisualization.dispose();
    }
    
    // Set new visualization
    this.currentVisualization = this.visualizations.get(visualizationId);
    
    // Reset visualization parameters to defaults from the new visualization
    const vizSchema = this.getVisualizationParameters();
    this.visualizationParameters = this._getDefaultValuesFromSchema(vizSchema);
    
    // Initialize the new visualization with all parameters
    await this.currentVisualization.initialize({
      ...this.pluginParameters,
      ...this.visualizationParameters,
      ...this.advancedParameters
    });
    
    // Update UI to reflect visualization-specific parameters
    this.giveParameters(true);
    
    return true;
  } catch (error) {
    console.error(`Error setting visualization ${visualizationId}:`, error);
    return false;
  }
}
```

## Registering Visualizations

Plugins can register multiple visualizations, each targeting different aspects of the same data or concept:

```javascript
class MyPlugin extends Plugin {
  constructor(core) {
    super(core);
    
    // Define available visualizations
    this.visualizationTypes = [
      {
        id: 'standard',
        name: 'Standard View',
        class: StandardVisualization
      },
      {
        id: 'detailed',
        name: 'Detailed View',
        class: DetailedVisualization
      },
      {
        id: 'comparison',
        name: 'Comparison View',
        class: ComparisonVisualization
      }
    ];
  }
  
  async _initializeDefaultVisualization() {
    // Create all visualization instances
    for (const vizType of this.visualizationTypes) {
      const visualization = new vizType.class(this);
      this.registerVisualization(vizType.id, visualization);
    }
    
    // Set current visualization to the first one
    this.currentVisualization = this.visualizations.get(this.visualizationTypes[0].id);
    
    // Initialize with current parameters
    if (this.currentVisualization) {
      await this.currentVisualization.initialize(this.parameters);
    }
  }
}
```

## Sending Parameters to UI

The plugin sends parameters to the UI using the following method:

```javascript
giveParameters(rebuild = false) {
  if (!this.core) return;
  
  // Get parameter schemas
  const pluginSchema = this.definePluginParameters();
  const visualizationSchema = this.getVisualizationParameters();
  const advancedSchema = this.defineAdvancedParameters();
  
  // Format parameters for UI manager
  const parameterData = {
    pluginParameters: {
      schema: pluginSchema,
      values: this.pluginParameters
    },
    visualizationParameters: {
      schema: visualizationSchema,
      values: this.visualizationParameters
    },
    advancedParameters: {
      schema: advancedSchema,
      values: this.advancedParameters
    }
  };
  
  // Send to UI manager
  this.core.uiManager.updatePluginParameterGroups(parameterData, rebuild);
}
```

## Parameter Updates in Visualizations

Visualizations receive parameter updates that are relevant to them:

```javascript
// In Visualization class
update(parameters) {
  // Only the changed parameters are passed
  if (parameters.density !== undefined) {
    this.updateDensity(parameters.density);
  }
  
  if (parameters.pointColor !== undefined) {
    this.updateColors(parameters.pointColor);
  }
  
  // Plugin parameters might also be passed
  if (parameters.globalScale !== undefined) {
    this.applyGlobalScale(parameters.globalScale);
  }
}
```

## Best Practices for Parameter Management

1. **Parameter Isolation**: Keep plugin parameters separate from visualization parameters

2. **Default Values**: Always provide sensible defaults for all parameters

3. **Parameter Validation**: Validate parameter values before applying them

4. **Minimal Updates**: Only pass changed parameters to visualizations, not the entire state

5. **Preserve Settings**: When switching visualizations, preserve plugin-level parameters

6. **Reset Visualization Parameters**: Reset visualization-specific parameters when switching visualizations to avoid state contamination

7. **Clear Parameter Groups**: Use descriptive names and consistent organization for parameters to make the UI intuitive

8. **Cache Parameter Schema**: Generate parameter schemas once and reuse them when possible

By following these guidelines, your plugin will maintain a clean separation between global configuration and visualization-specific settings, providing a more maintainable and user-friendly experience.