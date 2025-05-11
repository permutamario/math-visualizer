// src/core/color-schemes.js

export default {
  schemes: {
    "light": {
      "id": "light",
      "name": "Light Theme",
      "background": "#f5f5f5",
      "text": "#333333",
      "accent": "#1a73e8",
      "palettes": {
        "default": ["#4285f4", "#ea4335", "#fbbc04", "#34a853", "#673ab7", "#ff6d00"],
        "pastel": ["#8ab4f8", "#f28b82", "#fdd663", "#81c995", "#b39ddb", "#ffa726"],
        "blues": ["#0d47a1", "#1565c0", "#1976d2", "#1e88e5", "#2196f3", "#42a5f5", "#64b5f6", "#90caf9"],
        "greens": ["#1b5e20", "#2e7d32", "#388e3c", "#43a047", "#4caf50", "#66bb6a", "#81c784", "#a5d6a7"],
        "reds": ["#b71c1c", "#c62828", "#d32f2f", "#e53935", "#f44336", "#ef5350", "#e57373", "#ef9a9a"],
        "rainbow": ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"],
        "sequential": ["#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"],
        "diverging": ["#2166ac", "#67a9cf", "#d1e5f0", "#f7f7f7", "#fddbc7", "#ef8a62", "#b2182b"]
      }
    },
    "dark": {
      "id": "dark",
      "name": "Dark Theme",
      "background": "#1a1a1a",
      "text": "#f0f0f0",
      "accent": "#8ab4f8", 
      "palettes": {
        "default": ["#8ab4f8", "#f08080", "#ffe082", "#a5d6a7", "#ce93d8", "#ffab91"],
        "pastel": ["#4285f4", "#ea4335", "#fbbc04", "#34a853", "#673ab7", "#ff6d00"],
        "blues": ["#90caf9", "#64b5f6", "#42a5f5", "#2196f3", "#1e88e5", "#1976d2", "#1565c0", "#0d47a1"],
        "greens": ["#a5d6a7", "#81c784", "#66bb6a", "#4caf50", "#43a047", "#388e3c", "#2e7d32", "#1b5e20"],
        "reds": ["#ef9a9a", "#e57373", "#ef5350", "#f44336", "#e53935", "#d32f2f", "#c62828", "#b71c1c"],
        "rainbow": ["#ff5252", "#ff7b25", "#ffd740", "#9ccc65", "#4fc3f7", "#7e57c2", "#ec407a"],
        "sequential": ["#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef"],
        "diverging": ["#b2182b", "#ef8a62", "#fddbc7", "#f7f7f7", "#d1e5f0", "#67a9cf", "#2166ac"]
      }
    }
  }
};
