// src/core/Visualization.js

/**
 * Base class for all visualizations
 * Visualizations handle the rendering and interaction for a specific visualization
 */
export class Visualization {
  /**
   * Visualization instance constructor
   * @param {Plugin} plugin - Reference to the parent plugin
   */
  constructor(plugin) {
    this.plugin = plugin;
    
    // Flag for animation state
    this.isAnimating = false;
    
    // Validate that this is not instantiated directly
    if (this.constructor === Visualization) {
      throw new Error("Visualization is an abstract class and cannot be instantiated directly");
    }
  }
  
  /**
   * Get the parameter definition for this visualization
   * This should be implemented by subclasses to define their specific parameters
   * @returns {Object} Parameter schema with structural and visual parameters
   * @static
   */
  static getParameters() {
    return {
      structural: [],
      visual: []
    };
  }
  
  /**
   * Initialize the visualization with parameters
   * @param {Object} parameters - Parameter values
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(parameters) {
    // Default implementation does nothing
    // Should be overridden by subclasses
    return true;
  }
  
  /**
   * Update the visualization with new parameters
   * @param {Object} parameters - New parameter values
   */
  update(parameters) {
    // Default implementation does nothing
    // Should be overridden by subclasses
  }
  
  /**
   * Clean up resources when the visualization is no longer needed
   */
  dispose() {
    // Default implementation does nothing
    // Should be overridden by subclasses
  }
  
  /**
   * Render the visualization in 2D
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {Object} parameters - Current parameters
   */
  render2D(ctx, parameters) {
    // Default implementation does nothing
    // Should be overridden by subclasses that use 2D rendering
  }
  
  /**
   * Render the visualization in 3D
   * @param {Object} THREE - THREE.js library
   * @param {THREE.Scene} scene - THREE.js scene
   * @param {Object} parameters - Current parameters
   */
  render3D(THREE, scene, parameters) {
    // Default implementation does nothing
    // Should be overridden by subclasses that use 3D rendering
  }
  
  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last frame in seconds
   * @returns {boolean} Whether a render is needed on the next frame
   */
  animate(deltaTime) {
    // Default implementation does nothing
    // Should be overridden by subclasses that use animation
    return this.isAnimating;
  }
  
  /**
   * Handle user interaction
   * @param {string} type - Interaction type (e.g., "click", "mousemove")
   * @param {Object} event - Event data
   * @returns {boolean} Whether the interaction was handled
   */
  handleInteraction(type, event) {
    // Default implementation does nothing
    // Should be overridden by subclasses that handle interaction
    return false;
  }
}