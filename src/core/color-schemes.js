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
        "default": {
          "name": "Default",
          "structural": {
            "grid": "#cccccc",
            "weak": "#dddddd",
            "strong": "#333333",
            "guide": "#999999",
            "highlight": "#ff0000"
          },
          "main": [
            "#4285f4", "#ea4335", "#fbbc04", "#34a853", "#673ab7", "#ff6d00"
          ],
          "functional": {
            "positive": "#34a853",
            "negative": "#ea4335",
            "neutral": "#fbbc04",
            "selected": "#4285f4",
            "interactive": "#1a73e8"
          }
        },
        "pastel": {
          "name": "Pastel",
          "structural": {
            "grid": "#dddddd",
            "weak": "#eeeeee",
            "strong": "#999999",
            "guide": "#bbbbbb",
            "highlight": "#ff9999"
          },
          "main": [
            "#8ab4f8", "#f28b82", "#fdd663", "#81c995", "#b39ddb", "#ffa726"
          ],
          "functional": {
            "positive": "#81c995",
            "negative": "#f28b82",
            "neutral": "#fdd663",
            "selected": "#8ab4f8",
            "interactive": "#b39ddb"
          }
        },
        "blues": {
          "name": "Blues",
          "structural": {
            "grid": "#d0d0d0",
            "weak": "#e0e0e0",
            "strong": "#707070",
            "guide": "#a0a0a0",
            "highlight": "#ff4444"
          },
          "main": [
            "#0d47a1", "#1565c0", "#1976d2", "#1e88e5", "#2196f3", "#42a5f5", "#64b5f6", "#90caf9"
          ],
          "functional": {
            "positive": "#64b5f6",
            "negative": "#0d47a1",
            "neutral": "#1976d2",
            "selected": "#42a5f5",
            "interactive": "#1e88e5"
          }
        },
        "greens": {
          "name": "Greens",
          "structural": {
            "grid": "#d0d0d0",
            "weak": "#e0e0e0",
            "strong": "#707070",
            "guide": "#a0a0a0",
            "highlight": "#ff4444"
          },
          "main": [
            "#1b5e20", "#2e7d32", "#388e3c", "#43a047", "#4caf50", "#66bb6a", "#81c784", "#a5d6a7"
          ],
          "functional": {
            "positive": "#81c784",
            "negative": "#1b5e20",
            "neutral": "#388e3c",
            "selected": "#4caf50",
            "interactive": "#43a047"
          }
        },
        "reds": {
          "name": "Reds",
          "structural": {
            "grid": "#d0d0d0",
            "weak": "#e0e0e0",
            "strong": "#707070",
            "guide": "#a0a0a0",
            "highlight": "#0044ff"
          },
          "main": [
            "#b71c1c", "#c62828", "#d32f2f", "#e53935", "#f44336", "#ef5350", "#e57373", "#ef9a9a"
          ],
          "functional": {
            "positive": "#ef9a9a",
            "negative": "#b71c1c",
            "neutral": "#d32f2f",
            "selected": "#f44336",
            "interactive": "#e53935"
          }
        },
        "rainbow": {
          "name": "Rainbow",
          "structural": {
            "grid": "#cccccc",
            "weak": "#dddddd",
            "strong": "#333333",
            "guide": "#999999",
            "highlight": "#ff0000"
          },
          "main": [
            "#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"
          ],
          "functional": {
            "positive": "#00ff00",
            "negative": "#ff0000",
            "neutral": "#ffff00",
            "selected": "#0000ff",
            "interactive": "#9400d3"
          }
        },
        "sequential": {
          "name": "Sequential",
          "structural": {
            "grid": "#cccccc",
            "weak": "#dddddd",
            "strong": "#333333",
            "guide": "#999999",
            "highlight": "#ff0000"
          },
          "main": [
            "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594"
          ],
          "functional": {
            "positive": "#9ecae1",
            "negative": "#084594",
            "neutral": "#6baed6",
            "selected": "#4292c6",
            "interactive": "#2171b5"
          }
        },
        "diverging": {
          "name": "Diverging",
          "structural": {
            "grid": "#cccccc",
            "weak": "#dddddd",
            "strong": "#333333",
            "guide": "#999999",
            "highlight": "#ff0000"
          },
          "main": [
            "#2166ac", "#67a9cf", "#d1e5f0", "#f7f7f7", "#fddbc7", "#ef8a62", "#b2182b"
          ],
          "functional": {
            "positive": "#2166ac",
            "negative": "#b2182b",
            "neutral": "#f7f7f7",
            "selected": "#67a9cf",
            "interactive": "#ef8a62"
          }
        }
      }
    },
    "dark": {
      "id": "dark",
      "name": "Dark Theme",
      "background": "#1a1a1a",
      "text": "#f0f0f0",
      "accent": "#8ab4f8", 
      "palettes": {
        "default": {
          "name": "Default",
          "structural": {
            "grid": "#444444",
            "weak": "#333333",
            "strong": "#bbbbbb",
            "guide": "#777777",
            "highlight": "#ff5555"
          },
          "main": [
            "#8ab4f8", "#f08080", "#ffe082", "#a5d6a7", "#ce93d8", "#ffab91"
          ],
          "functional": {
            "positive": "#a5d6a7",
            "negative": "#f08080",
            "neutral": "#ffe082",
            "selected": "#8ab4f8",
            "interactive": "#ce93d8"
          }
        },
        "pastel": {
          "name": "Pastel",
          "structural": {
            "grid": "#333333",
            "weak": "#222222",
            "strong": "#aaaaaa",
            "guide": "#666666",
            "highlight": "#ff9999"
          },
          "main": [
            "#4285f4", "#ea4335", "#fbbc04", "#34a853", "#673ab7", "#ff6d00"
          ],
          "functional": {
            "positive": "#34a853",
            "negative": "#ea4335",
            "neutral": "#fbbc04",
            "selected": "#4285f4",
            "interactive": "#673ab7"
          }
        },
        "blues": {
          "name": "Blues",
          "structural": {
            "grid": "#444444",
            "weak": "#333333",
            "strong": "#aaaaaa",
            "guide": "#777777",
            "highlight": "#ff5555"
          },
          "main": [
            "#90caf9", "#64b5f6", "#42a5f5", "#2196f3", "#1e88e5", "#1976d2", "#1565c0", "#0d47a1"
          ],
          "functional": {
            "positive": "#64b5f6",
            "negative": "#0d47a1",
            "neutral": "#1976d2",
            "selected": "#42a5f5",
            "interactive": "#1e88e5"
          }
        },
        "greens": {
          "name": "Greens",
          "structural": {
            "grid": "#444444",
            "weak": "#333333",
            "strong": "#aaaaaa",
            "guide": "#777777",
            "highlight": "#ff5555"
          },
          "main": [
            "#a5d6a7", "#81c784", "#66bb6a", "#4caf50", "#43a047", "#388e3c", "#2e7d32", "#1b5e20"
          ],
          "functional": {
            "positive": "#81c784",
            "negative": "#1b5e20",
            "neutral": "#388e3c",
            "selected": "#4caf50",
            "interactive": "#43a047"
          }
        },
        "reds": {
          "name": "Reds",
          "structural": {
            "grid": "#444444",
            "weak": "#333333",
            "strong": "#aaaaaa",
            "guide": "#777777",
            "highlight": "#5555ff"
          },
          "main": [
            "#ef9a9a", "#e57373", "#ef5350", "#f44336", "#e53935", "#d32f2f", "#c62828", "#b71c1c"
          ],
          "functional": {
            "positive": "#ef9a9a",
            "negative": "#b71c1c",
            "neutral": "#d32f2f",
            "selected": "#f44336",
            "interactive": "#e53935"
          }
        },
        "rainbow": {
          "name": "Rainbow",
          "structural": {
            "grid": "#444444",
            "weak": "#333333",
            "strong": "#bbbbbb",
            "guide": "#777777",
            "highlight": "#ff5555"
          },
          "main": [
            "#ff5252", "#ff7b25", "#ffd740", "#9ccc65", "#4fc3f7", "#7e57c2", "#ec407a"
          ],
          "functional": {
            "positive": "#9ccc65",
            "negative": "#ff5252",
            "neutral": "#ffd740",
            "selected": "#4fc3f7",
            "interactive": "#7e57c2"
          }
        },
        "sequential": {
          "name": "Sequential",
          "structural": {
            "grid": "#444444",
            "weak": "#333333",
            "strong": "#bbbbbb",
            "guide": "#777777",
            "highlight": "#ff5555"
          },
          "main": [
            "#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef"
          ],
          "functional": {
            "positive": "#9ecae1",
            "negative": "#084594",
            "neutral": "#6baed6",
            "selected": "#4292c6",
            "interactive": "#2171b5"
          }
        },
        "diverging": {
          "name": "Diverging",
          "structural": {
            "grid": "#444444",
            "weak": "#333333",
            "strong": "#bbbbbb",
            "guide": "#777777",
            "highlight": "#ff5555"
          },
          "main": [
            "#b2182b", "#ef8a62", "#fddbc7", "#f7f7f7", "#d1e5f0", "#67a9cf", "#2166ac"
          ],
          "functional": {
            "positive": "#2166ac",
            "negative": "#b2182b",
            "neutral": "#f7f7f7",
            "selected": "#67a9cf",
            "interactive": "#ef8a62"
          }
        }
      }
    }
  }
};
