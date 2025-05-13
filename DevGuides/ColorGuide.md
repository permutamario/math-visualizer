# Math Visualization Framework Color Guide

This guide explains the standardized color system used across all plugins in the Math Visualization Framework. Understanding these color categories will help you create visualizations that are consistent, accessible, and integrate seamlessly with the framework's theming capabilities.

## Color System Overview

The framework uses three distinct color systems, each serving different purposes:

1. **Structural Colors**: For interface and layout elements
2. **Main Colors**: For primary visualization elements
3. **Functional Colors**: For elements with specific meaning or semantics

**IMPORTANT**: A key principle of this framework is that plugins should NEVER choose their own colors. Always use colors from the provided palette through the helper methods. This ensures consistency across visualizations, proper adaptation to light/dark themes, and accessibility for all users.

## 1. Structural Colors

Structural colors are used for UI framework elements that provide structure and context to visualizations.

| Color Name | Purpose | Example Usage |
|------------|---------|---------------|
| `grid`     | For grid lines, minor markings, faint background elements | Grid lines, tick marks, background grid |
| `weak`     | For subtle structural elements that shouldn't be emphasized | Minor dividers, subtle guides, inactive elements |
| `strong`   | For emphasized structural elements | Axes, key grid lines, borders |
| `guide`    | For guiding elements that aid in reading/interpretation | Crosshairs, guide lines, helper marks |
| `highlight`| For structural highlights and construction points | Reference points, handles, construction elements |

### When to use Structural Colors

- **Grid lines**: `this.getStructuralColor('grid')`
- **Coordinate axes**: `this.getStructuralColor('strong')`
- **Tick marks**: `this.getStructuralColor('grid')` or `this.getStructuralColor('guide')`
- **Construction points**: `this.getStructuralColor('highlight')`
- **Background elements**: `this.getStructuralColor('weak')`
- **Bounding boxes**: `this.getStructuralColor('guide')`

### Example implementation

```javascript
// Define parameters using structural colors
this.addColor('gridLineColor', 'Grid Line Color', this.getStructuralColor('grid'));
this.addColor('axisColor', 'Axis Color', this.getStructuralColor('strong'));
this.addColor('tickColor', 'Tick Mark Color', this.getStructuralColor('guide'));
this.addColor('constructionPointColor', 'Construction Point', this.getStructuralColor('highlight'));

// Apply them in rendering - ALWAYS use the parameters, never hardcoded colors
gridRenderer.renderGrid(grid, gridGroup, {
  gridLineColor: this.getParameter('gridLineColor'),
  axisColor: this.getParameter('axisColor'),
  tickColor: this.getParameter('tickColor')
});
```

## 2. Main Colors

Main colors are used for the primary elements in your visualizations. These are typically the colors used for curves, shapes, data points, and other content elements that form the core of the visualization.

### Characteristics of Main Colors

- Available as an ordered array: `this.getMainColors()`
- First few colors are most visually distinct
- Cycling through these colors ensures good contrast between elements
- Automatically adapts to light/dark themes
- Available in various palette styles (default, pastel, blues, etc.)

### When to use Main Colors

- **Multiple curves**: Assign each curve a different main color by index
- **Data series**: Each data series gets a different main color
- **Visual categories**: Different categories of elements
- **Vertices/edges/faces**: Different structural components in geometric visualizations
- **Sequential elements**: Elements that form a sequence or progression

### Example implementation

```javascript
// For a single main color (primary element)
this.addColor('curveColor', 'Curve Color', this.getMainColor(0));

// For multiple curves or elements - use the main colors array directly
const colorScheme = this.getMainColors();
curves.forEach((curve, index) => {
  // Apply color based on index (cycles through colors)
  const color = colorScheme[index % colorScheme.length];
  // Render with this color
});

// For adding a color palette selector
const paletteNames = this.getPaletteInfo();
this.addDropdown('colorPalette', 'Color Palette', this.getCurrentPaletteName(),
  paletteNames.map(p => ({ value: p.id, label: p.name })), 'visual');
```

## 3. Functional Colors

Functional colors convey specific semantic meaning regardless of the active color scheme. They should be used consistently to maintain intuitive user experience.

| Color Name | Purpose | Example Usage |
|------------|---------|---------------|
| `positive` | Success, correctness, positive values | Correct solutions, valid input, positive numbers |
| `negative` | Errors, warnings, negative values | Error messages, invalid regions, negative numbers |
| `neutral`  | Neutral state, caution | Informational elements, neutral values, caution areas |
| `selected` | Selected elements | Currently selected points, active elements |
| `interactive` | Interactive elements | Buttons, controls, interactive handles |

### When to use Functional Colors

- **Validation results**: `this.getFunctionalColor('positive')` or `this.getFunctionalColor('negative')`
- **Selected elements**: `this.getFunctionalColor('selected')`
- **Interactive controls**: `this.getFunctionalColor('interactive')`
- **Warning indicators**: `this.getFunctionalColor('neutral')` or `this.getFunctionalColor('negative')`
- **Positive/negative regions**: `this.getFunctionalColor('positive')` and `this.getFunctionalColor('negative')`

### Example implementation

```javascript
// Define parameters using functional colors
this.addColor('selectedItemColor', 'Selected Item', this.getFunctionalColor('selected'));
this.addColor('positiveValueColor', 'Positive Values', this.getFunctionalColor('positive'));
this.addColor('negativeValueColor', 'Negative Values', this.getFunctionalColor('negative'));

// Apply in rendering
if (point.isSelected) {
  pointColor = this.getParameter('selectedItemColor');
} else if (point.value > 0) {
  pointColor = this.getParameter('positiveValueColor');
} else if (point.value < 0) {
  pointColor = this.getParameter('negativeValueColor');
}
```

## Color Palette Handling

The color system adapts to the current theme (light/dark) and supports different palette styles. Plugins should:

1. **Use color helper methods** rather than hardcoded colors
2. **Provide palette selection** to let users choose preferred color schemes
3. **Update when palette changes** to respond to user preference changes

### Listening for Palette Changes

```javascript
// Register for palette change notifications
this.onPaletteChanged(() => {
  // Update all color parameters when palette changes
  this.setParameter('gridLineColor', this.getStructuralColor('grid'));
  this.setParameter('axisColor', this.getStructuralColor('strong'));
  this.setParameter('curveColor', this.getMainColor(0));
  this.setParameter('selectedItemColor', this.getFunctionalColor('selected'));
  
  // Mark for redraw
  this.isDirtyGrid = true;
  this.isDirtyCurves = true;
});
```

## Best Practices

1. **Never define custom colors**: Always use the color helper methods provided by the framework - never define your own colors

2. **Map parameters to framework colors**: Create parameters that map directly to the color system helpers, never to arbitrary color values

3. **Use color roles correctly**: Apply structural, main, and functional colors according to their intended purposes

4. **Always refresh on palette changes**: Update all colors when the palette changes to maintain consistency

5. **Document color usage**: In your plugin documentation, explain which framework colors you're using for each element

By adhering strictly to these guidelines and never choosing your own colors, plugins will maintain visual consistency while adapting to the user's preferred theme and palette settings, ensuring a cohesive experience across the entire framework.
