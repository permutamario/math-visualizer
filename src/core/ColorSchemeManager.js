// src/core/ColorSchemeManager.js

import colorSchemesData from './color-schemes.js';

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
    
    // Load schemes from JS data
    this.schemes = colorSchemesData.schemes;
    
    // Keep track of event listeners for cleanup
    this.eventListeners = [];
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
        } else {
          // Store default in state manager
          this.core.state.set('colorScheme', this.activeScheme);
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
      
      // Register window/media query listeners for system color scheme changes
      this._setupSystemThemeListener();
      
      console.log(`ColorSchemeManager initialized with scheme: ${this.activeScheme}`);
      return true;
    } catch (error) {
      console.error("Failed to initialize ColorSchemeManager:", error);
      return false;
    }
  }
  
  /**
   * Set up listener for system color scheme changes
   * @private
   */
  _setupSystemThemeListener() {
    // Check if browser supports color scheme media queries
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Define the handler function
      const handleSystemThemeChange = (e) => {
        // Only change if user hasn't explicitly set a preference
        const userPreference = localStorage.getItem('activeColorScheme');
        if (!userPreference) {
          const newScheme = e.matches ? 'dark' : 'light';
          if (this.schemes[newScheme] && this.activeScheme !== newScheme) {
            console.log(`System theme changed to ${newScheme}, updating color scheme`);
            this.setActiveScheme(newScheme);
          }
        }
      };
      
      // Check initial value
      if (darkModeMediaQuery.matches && this.activeScheme === 'light' && 
          !localStorage.getItem('activeColorScheme')) {
        this.setActiveScheme('dark');
      }
      
      // Add listener for changes
      if (typeof darkModeMediaQuery.addEventListener === 'function') {
        darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
        // Store for cleanup
        this.eventListeners.push({
          target: darkModeMediaQuery,
          type: 'change',
          handler: handleSystemThemeChange
        });
      } else if (typeof darkModeMediaQuery.addListener === 'function') {
        // Older browsers
        darkModeMediaQuery.addListener(handleSystemThemeChange);
        // Store for cleanup
        this.eventListeners.push({
          target: darkModeMediaQuery,
          type: 'addListener',
          handler: handleSystemThemeChange
        });
      }
    }
  }
  
  /**
   * Get all available color schemes
   * @returns {Array<Object>} Array of scheme metadata objects
   */
  getSchemes() {
    return Object.values(this.schemes).map(scheme => ({
      id: scheme.id,
      name: scheme.name
    }));
  }
  
  /**
   * Get the active scheme
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
   * Get the palette names from the active scheme
   * @returns {Array<string>} Array of palette names
   */
  getPaletteNames() {
    return Object.keys(this.schemes[this.activeScheme].palettes);
  }
  
  /**
   * Get a palette from the active scheme
   * @param {string} paletteName - Palette name (default: 'default')
   * @returns {Array<string>} Color palette
   */
  getPalette(paletteName = 'default') {
    const palettes = this.schemes[this.activeScheme].palettes;
    return palettes[paletteName] || palettes.default;
  }
  
  /**
   * Get a color from a palette
   * @param {string} paletteName - Palette name (default: 'default')
   * @param {number} index - Color index
   * @returns {string} Color value
   */
  getColorFromPalette(paletteName = 'default', index = 0) {
    const palette = this.getPalette(paletteName);
    return palette[index % palette.length];
  }
  
  /**
   * Set the active scheme
   * @param {string} schemeId - Scheme ID
   * @returns {boolean} Whether the change was successful
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
   * Get an interpolated palette with the specified length
   * @param {string} paletteName - Palette name (default: 'default')
   * @param {number} length - Number of colors
   * @returns {Array<string>} Interpolated color palette
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
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
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
  
  /**
   * Clean up resources and event listeners
   */
  cleanup() {
    // Remove all event listeners
    this.eventListeners.forEach(listener => {
      if (listener.type === 'addListener') {
        // Old browser API
        if (listener.target && typeof listener.target.removeListener === 'function') {
          listener.target.removeListener(listener.handler);
        }
      } else {
        // Standard API
        if (listener.target && typeof listener.target.removeEventListener === 'function') {
          listener.target.removeEventListener(listener.type, listener.handler);
        }
      }
    });
    
    // Clear the event listeners array
    this.eventListeners = [];
    
    console.log("ColorSchemeManager cleaned up");
  }
}
