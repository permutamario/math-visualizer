// src/core/renderingEnvironments/baseEnvironment.js
// Abstract base class for rendering environments

/**
 * Base environment class that all specific environments will extend
 */
export class BaseEnvironment {
  /**
   * Create a new environment
   * @param {Object} canvas - Canvas element
   * @param {Object} options - Environment options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = options;
    this.initialized = false;
    this.active = false;
  }
  
  /**
   * Initialize the environment
   * Must be implemented by subclasses
   * @returns {boolean} - Whether initialization was successful
   */
  initialize() {
    this.initialized = true;
    console.log('Base environment initialized');
    return true;
  }
  
  /**
   * Activate this environment
   * @returns {boolean} - Whether activation was successful
   */
  activate() {
    if (!this.initialized) {
      this.initialize();
    }
    this.active = true;
    console.log('Environment activated');
    return true;
  }
  
  /**
   * Deactivate this environment
   */
  deactivate() {
    this.active = false;
    console.log('Environment deactivated');
  }
  
  /**
   * Prepare for rendering
   * @param {Object} ctx - Canvas context
   * @returns {Object} - The context for rendering
   */
  prepareRender(ctx) {
    // Default implementation is a no-op
    return ctx;
  }
  
  /**
   * Complete rendering
   * @param {Object} ctx - Canvas context
   */
  completeRender(ctx) {
    // Default implementation is a no-op
  }
  
  /**
   * Get the current context
   * @returns {Object} Canvas context
   */
  getContext() {
    return this.canvas.getContext('2d');
  }
  
  /**
   * Handle mouse/touch/keyboard events
   * @param {Event} event - DOM event
   */
  handleEvent(event) {
    // Base implementation does nothing
    // Subclasses should override this
  }
  
  /**
   * Handle window resize
   * Base implementation - subclasses should override as needed
   */
  handleResize() {
    // Base implementation just logs that resize was handled
    console.log('Window resize handled by base environment');
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clean up event handlers, etc.
    this.deactivate();
  }
}
