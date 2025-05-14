// src/core/Plugin2D.js
import { BasePlugin } from './BasePlugin.js';

/**
 * Specialized plugin class for 2D visualizations using Konva
 * Provides enhanced APIs for managing Konva objects
 */
export class Plugin2D extends BasePlugin {
  /**
   * Create a new 2D plugin instance
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    super(core);
    
    // Ensure this is a 2D plugin
    if (this.renderingType !== '2d') {
      console.warn(`Plugin ${this.id} should have renderingType='2d'`);
      this.renderingType = '2d';
    }
    
    // Resource tracking for cleanup
    this._shapes = new Map();   // Map of shape ID to shape object
    this._groups = new Map();   // Map of group ID to group object
    this._eventBindings = [];   // List of event bindings
    
    // Layer quick access cache
    this._layers = {
      background: null,
      grid: null,
      main: null,
      overlay: null,
      animation: null
    };
    
    // Unique ID generator for shapes
    this._nextShapeId = 1;
  }
  
  /**
   * Get a layer by name
   * @param {string} name - Layer name ('background', 'grid', 'main', 'overlay', 'animation')
   * @returns {Object} Konva layer
   */
  getLayer(name) {
    // Check if we already have this layer cached
    if (this._layers[name]) return this._layers[name];
    
    // Check if the layer exists in the rendering environment
    if (!this.renderEnv || !this.renderEnv.stage) {
      console.error('Rendering environment not initialized');
      return null;
    }
    
    // Try to find the layer by name in the stage
    const layers = this.renderEnv.stage.getLayers();
    const existingLayer = layers.find(layer => layer.name() === name);
    
    if (existingLayer) {
      // Cache the layer for future use
      this._layers[name] = existingLayer;
      return existingLayer;
    }
    
    // Layer doesn't exist, create it
    const konva = this.renderEnv.konva;
    if (!konva) {
      console.error('Konva not available in rendering environment');
      return null;
    }
    
    // Create new layer
    const newLayer = new konva.Layer({ name });
    
    // Add to stage at the appropriate position
    const insertionOrder = ['background', 'grid', 'main', 'overlay', 'animation'];
    const insertionIndex = insertionOrder.indexOf(name);
    
    if (insertionIndex === -1) {
      // Not a standard layer, add at the top
      this.renderEnv.stage.add(newLayer);
    } else {
      // Insert at the correct position based on the standard order
      const existingLayers = this.renderEnv.stage.getLayers();
      
      // Try to insert in proper z-order
      let inserted = false;
      for (let i = insertionIndex + 1; i < insertionOrder.length; i++) {
        const higherLayerName = insertionOrder[i];
        const higherLayer = existingLayers.find(l => l.name() === higherLayerName);
        
        if (higherLayer) {
          // Insert before this higher layer
          newLayer.moveToTop();
          higherLayer.moveToTop();
          inserted = true;
          break;
        }
      }
      
      if (!inserted) {
        // No higher layers found, add to the top
        this.renderEnv.stage.add(newLayer);
      }
    }
    
    // Cache the layer
    this._layers[name] = newLayer;
    return newLayer;
  }
  
  /**
   * Create a unique ID for tracking shapes
   * @returns {string} Unique shape ID
   * @private
   */
  _createUniqueId() {
    return `shape_${this.id}_${this._nextShapeId++}`;
  }
  
  /**
   * Register a shape or group for tracking
   * @param {Object} shape - Konva shape or group
   * @param {string} layerName - Layer name
   * @returns {Object} The registered shape
   * @private
   */
  _registerShape(shape, layerName) {
    // Generate a unique ID if the shape doesn't have one
    if (!shape.id() || shape.id() === '') {
      shape.id(this._createUniqueId());
    }
    
    // Store shape for cleanup
    this._shapes.set(shape.id(), {
      shape,
      layerName
    });
    
    return shape;
  }
  
  /**
   * Add an existing shape to a layer
   * @param {Object} shape - Konva shape
   * @param {string} layerName - Layer name
   * @returns {Object} The added shape
   */
  addShape(shape, layerName = 'main') {
    // Get the target layer
    const layer = this.getLayer(layerName);
    if (!layer) return null;
    
    // Add shape to layer
    layer.add(shape);
    
    // Register shape for tracking
    return this._registerShape(shape, layerName);
  }
  
  /**
   * Add an existing group to a layer
   * @param {Object} group - Konva group
   * @param {string} layerName - Layer name
   * @returns {Object} The added group
   */
  addGroup(group, layerName = 'main') {
    // Get the target layer
    const layer = this.getLayer(layerName);
    if (!layer) return null;
    
    // Add group to layer
    layer.add(group);
    
    // Register group for tracking
    this._groups.set(group.id() || this._createUniqueId(), {
      group,
      layerName
    });
    
    return group;
  }
  
  /**
   * Create and add a shape to a layer
   * @param {string} type - Shape type (rect, circle, line, etc.)
   * @param {Object} config - Shape configuration
   * @param {string} layerName - Layer name
   * @returns {Object} The created shape
   * @private
   */
  _createShape(type, config, layerName = 'main') {
    if (!this.renderEnv || !this.renderEnv.konva) {
      console.error('Konva not available in rendering environment');
      return null;
    }
    
    const konva = this.renderEnv.konva;
    
    // Create shape based on type
    let shape;
    
    switch (type.toLowerCase()) {
      case 'rect':
        shape = new konva.Rect(config);
        break;
      case 'circle':
        shape = new konva.Circle(config);
        break;
      case 'ellipse':
        shape = new konva.Ellipse(config);
        break;
      case 'line':
        shape = new konva.Line(config);
        break;
      case 'path':
        shape = new konva.Path(config);
        break;
      case 'text':
        shape = new konva.Text(config);
        break;
      case 'regularpolygon':
        shape = new konva.RegularPolygon(config);
        break;
      case 'star':
        shape = new konva.Star(config);
        break;
      case 'image':
        shape = new konva.Image(config);
        break;
      case 'polygon':
        shape = new konva.Line({
          ...config,
          closed: true
        });
        break;
      case 'group':
        return this.createGroup(layerName);
      default:
        console.error(`Unknown shape type: ${type}`);
        return null;
    }
    
    // Add shape to layer
    return this.addShape(shape, layerName);
  }
  
  /**
   * Create and add a rectangle shape
   * @param {Object} config - Rectangle configuration
   * @param {string} layerName - Layer name
   * @returns {Object} The created rectangle
   */
  createRect(config, layerName = 'main') {
    return this._createShape('rect', config, layerName);
  }
  
  /**
   * Create and add a circle shape
   * @param {Object} config - Circle configuration
   * @param {string} layerName - Layer name
   * @returns {Object} The created circle
   */
  createCircle(config, layerName = 'main') {
    return this._createShape('circle', config, layerName);
  }
  
  /**
   * Create and add a line shape
   * @param {Object} config - Line configuration
   * @param {string} layerName - Layer name
   * @returns {Object} The created line
   */
  createLine(config, layerName = 'main') {
    return this._createShape('line', config, layerName);
  }
  
  /**
   * Create and add a polygon shape
   * @param {Object} config - Polygon configuration
   * @param {string} layerName - Layer name
   * @returns {Object} The created polygon
   */
  createPolygon(config, layerName = 'main') {
    return this._createShape('polygon', config, layerName);
  }
  
  /**
   * Create and add a text shape
   * @param {Object} config - Text configuration
   * @param {string} layerName - Layer name
   * @returns {Object} The created text
   */
  createText(config, layerName = 'main') {
    return this._createShape('text', config, layerName);
  }
  
  /**
   * Create and add a path shape
   * @param {Object} config - Path configuration
   * @param {string} layerName - Layer name
   * @returns {Object} The created path
   */
  createPath(config, layerName = 'main') {
    return this._createShape('path', config, layerName);
  }
  
  /**
   * Create and add an image shape
   * @param {Object} config - Image configuration
   * @param {string} layerName - Layer name
   * @returns {Object} The created image
   */
  createImage(config, layerName = 'main') {
    return this._createShape('image', config, layerName);
  }
  
  /**
   * Create and add a group
   * @param {string} layerName - Layer name
   * @returns {Object} The created group
   */
  createGroup(layerName = 'main') {
    const konva = this.renderEnv.konva;
    if (!konva) {
      console.error('Konva not available in rendering environment');
      return null;
    }
    
    // Create group
    const group = new konva.Group({
      id: this._createUniqueId()
    });
    
    // Add to layer
    return this.addGroup(group, layerName);
  }
  
  /**
   * Redraw a specific layer
   * @param {string} layerName - Layer name
   */
  redrawLayer(layerName) {
    const layer = this.getLayer(layerName);
    if (layer && typeof layer.batchDraw === 'function') {
      layer.batchDraw();
    }
  }
  
  /**
   * Redraw all layers
   */
  redrawAllLayers() {
    for (const layerName in this._layers) {
      if (this._layers[layerName]) {
        this.redrawLayer(layerName);
      }
    }
  }
  
  /**
   * Add an event handler to a shape
   * @param {Object} shape - Konva shape or group
   * @param {string} eventType - Event type (e.g., 'click', 'mouseover')
   * @param {Function} handler - Event handler function
   * @returns {boolean} Whether the handler was added successfully
   */
  addEventHandler(shape, eventType, handler) {
    if (!shape || typeof shape.on !== 'function') {
      console.error('Invalid shape for event handler');
      return false;
    }
    
    // Add event handler to shape
    shape.on(eventType, handler);
    
    // Store binding for cleanup
    this._eventBindings.push({
      shape,
      eventType,
      handler
    });
    
    return true;
  }
  
  /**
   * Remove an event handler
   * @param {Object} shape - Konva shape or group
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler function
   * @returns {boolean} Whether the handler was removed successfully
   */
  removeEventHandler(shape, eventType, handler) {
    if (!shape || typeof shape.off !== 'function') {
      return false;
    }
    
    // Remove event handler from shape
    shape.off(eventType, handler);
    
    // Remove from tracking
    const index = this._eventBindings.findIndex(
      binding => binding.shape === shape && 
                 binding.eventType === eventType && 
                 binding.handler === handler
    );
    
    if (index !== -1) {
      this._eventBindings.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  /**
   * Implementation of the refresh method for 2D visualization
   * @override
   */
  refresh() {
    // Redraw all layers
    this.redrawAllLayers();
  }
  
  /**
   * Extended unload method for 2D plugins
   * @override
   */
  async unload() {
    try {
      // Clean up all tracked shapes
      this._shapes.forEach(({ shape, layerName }) => {
        if (shape && typeof shape.destroy === 'function') {
          shape.destroy();
        }
      });
      this._shapes.clear();
      
      // Clean up all tracked groups
      this._groups.forEach(({ group, layerName }) => {
        if (group && typeof group.destroy === 'function') {
          group.destroy();
        }
      });
      this._groups.clear();
      
      // Clean up all event bindings
      this._eventBindings.forEach(binding => {
        if (binding.shape && typeof binding.shape.off === 'function') {
          binding.shape.off(binding.eventType, binding.handler);
        }
      });
      this._eventBindings = [];
      
      // Clear layer cache
      this._layers = {
        background: null,
        grid: null,
        main: null,
        overlay: null,
        animation: null
      };
      
      // Call the base class unload
      return await super.unload();
    } catch (error) {
      console.error(`Error unloading 2D plugin ${this.id}:`, error);
      return false;
    }
  }
}
