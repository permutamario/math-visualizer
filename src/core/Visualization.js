// src/core/Visualization.js - Improved version

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
        
        // Validation
        if (this.constructor === Visualization) {
            throw new Error("Visualization is an abstract class and cannot be instantiated directly");
        }
    }
    
    /**
     * Get the parameter definition for this visualization
     * These parameters are specific to this visualization and will appear in the visualization panel
     * @returns {Array} Array of parameter definitions
     * @static
     */
    static getParameters() {
        return [];
    }

    /**
     * Get a parameter value from any group
     * @param {string} id - Parameter ID
     * @param {any} defaultValue - Default value if parameter not found
     * @returns {any} Parameter value
     */
    getParameterValue(id, defaultValue = null) {
        if (!this.plugin) return defaultValue;
        
        // Check visualization parameters first
        if (this.plugin.visualizationParameters && 
            this.plugin.visualizationParameters.hasOwnProperty(id)) {
            return this.plugin.visualizationParameters[id];
        }
        
        // Then plugin parameters
        if (this.plugin.pluginParameters && 
            this.plugin.pluginParameters.hasOwnProperty(id)) {
            return this.plugin.pluginParameters[id];
        }
        
        // Then advanced parameters
        if (this.plugin.advancedParameters && 
            this.plugin.advancedParameters.hasOwnProperty(id)) {
            return this.plugin.advancedParameters[id];
        }
        
        return defaultValue;
    }
    
    /**
     * Initialize the visualization with parameters
     * @param {Object} parameters - Parameter values
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    async initialize(parameters) {
        try {
            // Default implementation - can be overridden by subclasses
            return true;
        } catch (error) {
            console.error(`Error initializing ${this.constructor.name}:`, error);
            return false;
        }
    }
    
    /**
     * Update the visualization with new parameters
     * @param {Object} parameters - Changed parameters only
     */
    update(parameters) {
        // Default implementation - should be overridden by subclasses
    }
    
    /**
     * Clean up resources when the visualization is no longer needed
     */
    dispose() {
        try {
            // Default implementation - should be overridden by subclasses
            this.isAnimating = false;
        } catch (error) {
            console.error(`Error disposing ${this.constructor.name}:`, error);
        }
    }
    
    /**
     * Render the visualization in 2D
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     * @param {Object} parameters - Current parameters
     */
    render2D(ctx, parameters) {
        // Default implementation - should be overridden by subclasses that use 2D rendering
    }
    
    /**
     * Render the visualization in 3D
     * @param {Object} THREE - THREE.js library
     * @param {THREE.Scene} scene - THREE.js scene
     * @param {Object} parameters - Current parameters
     */
    render3D(THREE, scene, parameters) {
        // Default implementation - should be overridden by subclasses that use 3D rendering
    }
    
    /**
     * Update animation state
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     * @returns {boolean} Whether a render is needed
     */
    animate(deltaTime) {
        // Default implementation - should be overridden by subclasses that use animation
        return this.isAnimating;
    }
    
    /**
     * Handle user interaction
     * @param {string} type - Interaction type (e.g., "click", "mousemove")
     * @param {Object} event - Event data
     * @returns {boolean} Whether the interaction was handled
     */
    handleInteraction(type, event) {
        // Default implementation - should be overridden by subclasses that handle interaction
        return false;
    }
    
    /**
     * Request a parameter update
     * This is a helper method for visualizations to update their own parameters
     * @param {string} parameterId - Parameter ID
     * @param {any} value - New value
     * @param {boolean} updateUI - Whether to update the UI
     */
    requestParameterUpdate(parameterId, value, updateUI = true) {
        if (this.plugin && typeof this.plugin.updateParameter === 'function') {
            // Default to visualization group since this is called from a visualization
            this.plugin.updateParameter(parameterId, value, 'visualization', updateUI);
            return true;
        }
        return false;
    }
    
    /**
     * Request a render
     * Helper method to request a render from the rendering manager
     * @returns {boolean} Whether the request was successful
     */
    requestRender() {
        if (this.plugin && this.plugin.core && this.plugin.core.renderingManager) {
            this.plugin.core.renderingManager.requestRender();
            return true;
        }
        return false;
    }
}