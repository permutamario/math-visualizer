// src/core/ColorSchemeManager.js

import colorSchemesData from './color-schemes.json';

/**
 * Manages color schemes for the application
 * Provides standardized color palettes
 */
export class ColorSchemeManager {
  /**
   * Create a new ColorSchemeManager
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    this.core = core;
    
    // Default active scheme
    this.activeScheme = 'light';
    
    // Load schemes from JSON data
    this.schemes = colorSchemesData.schemes;
  }
  
  /**
   * Initialize the ColorSchemeManager
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      // Try to get the active scheme from the StateManager
      if (this.core && this.core.state) {
        const stateScheme = this.core.state.get('colorScheme');
        if (stateScheme && this.schemes[stateScheme]) {
          this.activeScheme = stateScheme;
          console.log(`Using color scheme from state: ${this.activeScheme}`);
          return true;
        }
      }
      
      // If not in state, try to load from localStorage
      try {
        const savedScheme = localStorage.getItem('activeColorScheme');
        if (savedScheme && this.schemes[savedScheme]) {
          this.activeScheme = savedScheme;
          
          // Store in state manager if available
          if (this.core && this.core.state) {
            this.core.state.set('colorScheme', this.activeScheme);
          }
          
          console.log(`Using color scheme from localStorage: ${this.activeScheme}`);
        }
      } catch (storageError) {
        // Ignore localStorage errors
        console.warn("Could not access localStorage for color scheme:", storageError);
      }
      
      // Store default in state manager if available
      if (this.core && this.core.state) {
        this.core.state.set('colorScheme', this.activeScheme);
      }
      
      console.log(`ColorSchemeManager initialized with scheme: ${this.activeScheme}`);
      return true;
    } catch (error) {
      console.error("Failed to initialize ColorSchemeManager:", error);
      return false;
    }
  }
  
  /**
   * Get all available color schemes
   * @returns {Array<Object>} Array of scheme metadata
   */
  getSchemes() {
    return Object.values(this.schemes).map(scheme => ({
      id: scheme.id,
      name: scheme.name
    }));
  }
  
  /**
   * Get the active color scheme
   * @returns {Object} Active color scheme
   */
  getActiveScheme() {
    return this.schemes[this.activeScheme];
  }
  
  /**
   * Get the background color from the active scheme
   * @returns {string} Background color
   */
  getBackgroundColor() {
    return this.schemes[this.activeScheme].background;
  }
  
  /**
   * Get the text color from the active scheme
   * @returns {string} Text color
   */
  getTextColor() {
    return this.schemes[this.activeScheme].text;
  }
  
  /**
   * Get the accent color from the active scheme
   * @returns {string} Accent color
   */
  getAccentColor() {
    return this.schemes[this.activeScheme].accent;
  }
  
  /**
   * Get all palette names from the active scheme
   * @returns {Array<string>} Array of palette names
   */
  getPaletteNames() {
    return Object.keys(this.schemes[this.activeScheme].palettes);
  }
  
  /**
   * Get a palette by name from the active scheme
   * @param {string} paletteName - Name of the palette (e.g., 'default', 'rainbow')
   * @returns {Array<string>} Color palette
   */
  getPalette(paletteName = 'default') {
    const palettes = this.schemes[this.activeScheme].palettes;
    return palettes[paletteName] || palettes.default;
  }
  
  /**
   * Get a color from a named palette
   * @param {string} paletteName - Name of the palette
   * @param {number} index - Index in the palette
   * @returns {string} Color from palette
   */
  getColorFromPalette(paletteName = 'default', index = 0) {
    const palette = this.getPalette(paletteName);
    return palette[index % palette.length];
  }
  
  /**
   * Set the active color scheme
   * @param {string} schemeId - ID of the scheme to activate
   * @returns {boolean} Whether the scheme was successfully activated
   */
  setActiveScheme(schemeId) {
    if (!this.schemes[schemeId]) {
      console.error(`Color scheme '${schemeId}' not found`);
      return false;
    }
    
    this.activeScheme = schemeId;
    
    // Save to state manager
    if (this.core && this.core.state) {
      this.core.state.set('colorScheme', schemeId);
    }
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('activeColorScheme', schemeId);
    } catch (error) {
      console.warn("Could not save color scheme preference to localStorage:", error);
    }
    
    // Emit event via core if available
    if (this.core && this.core.events && typeof this.core.events.emit === 'function') {
      this.core.events.emit('colorSchemeChanged', this.schemes[schemeId]);
    }
    
    console.log(`Active color scheme changed to: ${schemeId}`);
    return true;
  }
  
  /**
   * Get a sequential palette of a given length by interpolating between colors
   * @param {string} paletteName - Name of the base palette to interpolate
   * @param {number} length - Number of colors needed
   * @returns {Array<string>} Array of interpolated colors
   */
  getInterpolatedPalette(paletteName = 'default', length = 10) {
    const basePalette = this.getPalette(paletteName);
    
    if (length <= basePalette.length) {
      // If we need fewer colors than the palette has, just return a subset
      return basePalette.slice(0, length);
    }
    
    // Create an interpolated palette
    const result = [];
    const segmentSize = (basePalette.length - 1) / (length - 1);
    
    for (let i = 0; i < length; i++) {
      const segmentIndex = i * segmentSize;
      const lowerIndex = Math.floor(segmentIndex);
      const upperIndex = Math.min(Math.ceil(segmentIndex), basePalette.length - 1);
      
      if (lowerIndex === upperIndex) {
        result.push(basePalette[lowerIndex]);
      } else {
        const t = segmentIndex - lowerIndex;
        result.push(this.interpolateColor(
          basePalette[lowerIndex],
          basePalette[upperIndex],
          t
        ));
      }
    }
    
    return result;
  }
  
  /**
   * Interpolate between two colors
   * @param {string} color1 - First color (hex or rgb)
   * @param {string} color2 - Second color (hex or rgb)
   * @param {number} t - Interpolation factor (0-1)
   * @returns {string} Interpolated color
   */
  interpolateColor(color1, color2, t) {
    // Helper to parse a color string to RGB components
    const parseColor = (color) => {
      // Handle hex colors
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return { r, g, b };
      }
      
      // Handle rgb colors
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3])
        };
      }
      
      // Default to black if parse fails
      return { r: 0, g: 0, b: 0 };
    };
    
    // Parse colors to RGB
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);
    
    // Interpolate RGB components
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${
      g.toString(16).padStart(2, '0')}${
      b.toString(16).padStart(2, '0')}`;
  }
}
