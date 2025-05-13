// src/rendering/Canvas2DEnvironment.js

/**
 * 2D rendering environment using Konva
 * Provides both Konva-based and legacy canvas-based rendering
 */
export class Canvas2DEnvironment {
  /**
   * Create a new Canvas2DEnvironment
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {AppCore} core - Reference to the application core
   */
  constructor(canvas, core) {
    console.log("Creating Canvas2DEnvironment instance");
    
    this.canvas = canvas;
    this.core = core;
    this.initialized = false;
    this.active = false;
    
    // Konva specific
    this.stage = null;
    this.layer = null;
    this.konva = null; // Store reference to Konva library
    this.backgroundColor = '#f5f5f5';
    
    // Store original canvas for legacy support
    this.originalCanvas = canvas;
    
    // Context for legacy support
    this.ctx = null;
    
    // Camera/viewport settings
    this.cameraX = 0;
    this.cameraY = 0;
    this.cameraZoom = 1;
    
    // Animation tracking
    this.requiresContinuousRendering = true;
    
    // For tracking plugin-created resources that need cleanup
    this._pluginResources = new Map();
    
    // Bind methods to maintain context
    this.handleResize = this.handleResize.bind(this);
  }
  
  /**
   * Initialize the 2D environment
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      console.log("Initializing Canvas2DEnvironment...");
      
      // Try to get Konva from window first
      if (window.Konva && typeof window.Konva.Stage === 'function') {
        this.konva = window.Konva;
        console.log("Using Konva from window object");
      } else {
        console.warn("Konva not found on window object, trying direct import");
        try {
          const KonvaModule = await import('konva');
          this.konva = KonvaModule.default || KonvaModule;
          console.log("Konva imported directly:", this.konva);
        } catch (importError) {
          console.error("Failed to import Konva:", importError);
          throw new Error("Konva library not available. Ensure it's properly loaded.");
        }
      }
      
      // Final check to ensure Konva is usable
      if (!this.konva || typeof this.konva.Stage !== 'function') {
        console.error("Konva structure:", this.konva);
        throw new Error("Konva Stage constructor not found. Incompatible Konva version?");
      }
      
      // Get container element (parent of canvas)
      const container = this.originalCanvas.parentElement;
      if (!container) {
        throw new Error("Canvas parent element not found");
      }
      
      // Hide original canvas (Konva will create its own)
      this.originalCanvas.style.display = 'none';
      
      // Create Konva stage
      this.stage = new this.konva.Stage({
        container: container,
        width: container.clientWidth,
        height: container.clientHeight
      });
      
      // Create main layer
      this.layer = new this.konva.Layer();
      this.stage.add(this.layer);
      
      // Set background color
      this.stage.container().style.backgroundColor = this.backgroundColor;
      
      // Keep original canvas context for legacy support
      this.ctx = this.originalCanvas.getContext('2d');
      
      // Setup event forwarding
      this._setupEventForwarding();
      
      // Setup automatic camera controls
      this._setupAutomaticCameraControls();
      
      this.initialized = true;
      console.log("Canvas2DEnvironment initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Canvas2DEnvironment:", error);
      return false;
    }
  }
  
  /**
   * Activate the 2D environment
   * @returns {boolean} Whether activation was successful
   */
  activate() {
    if (this.active) return true;
    
    if (!this.initialized) {
      console.error("Cannot activate uninitialized 2D environment");
      return false;
    }
    
    try {
      console.log("Activating Canvas2DEnvironment...");
      
      // Show Konva stage
      if (this.stage) {
        this.stage.container().style.display = 'block';
      }
      
      // Hide original canvas
      this.originalCanvas.style.display = 'none';
      
      // Ensure stage is properly sized
      this.handleResize();
      
      this.active = true;
      console.log("Canvas2DEnvironment activated");
      return true;
    } catch (error) {
      console.error("Error activating Canvas2DEnvironment:", error);
      return false;
    }
  }
  
  /**
   * Deactivate the 2D environment
   * @returns {boolean} Whether deactivation was successful
   */
  deactivate() {
    if (!this.active) return true;
    
    try {
      console.log("Deactivating Canvas2DEnvironment...");
      
      // Hide Konva stage
      if (this.stage) {
        this.stage.container().style.display = 'none';
      }
      
      // Show original canvas
      this.originalCanvas.style.display = 'block';
      
      this.active = false;
      console.log("Canvas2DEnvironment deactivated");
      return true;
    } catch (error) {
      console.error("Error deactivating Canvas2DEnvironment:", error);
      return false;
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.stage) return;
    
    try {
      const container = this.stage.container();
      
      // Get parent dimensions
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      console.log(`Resizing Konva stage to ${width}x${height}`);
      
      // Resize stage
      this.stage.width(width);
      this.stage.height(height);
      
      // Also resize original canvas for legacy support
      this.originalCanvas.width = width;
      this.originalCanvas.height = height;
      
      // Force a redraw
      this.layer.batchDraw();
    } catch (error) {
      console.error("Error handling resize in Canvas2DEnvironment:", error);
    }
  }
  
  /**
   * Set up event forwarding from Konva to plugins
   * @private
   */
  _setupEventForwarding() {
    if (!this.stage) return;
    
    const events = [
      'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 
      'click', 'dblclick', 'contextmenu',
      'touchstart', 'touchend', 'touchmove',
      'wheel', 'dragstart', 'dragmove', 'dragend'
    ];
    
    events.forEach(event => {
      this.stage.on(event, (evt) => {
        // Forward to active plugin if available
        const plugin = this.core.getActivePlugin();
        if (plugin && typeof plugin.handleInteraction === 'function') {
          // Transform Konva event to framework format
          const data = {
            x: evt.evt.offsetX,
            y: evt.evt.offsetY,
            target: evt.target,
            evt: evt.evt, // Original DOM event
            // Additional properties based on event type
            ...this._getEventSpecificData(event, evt)
          };
          
          plugin.handleInteraction(event, data);
        }
      });
    });
  }
  
  /**
   * Get event-specific data for different event types
   * @param {string} type - Event type
   * @param {Konva.KonvaEventObject} evt - Konva event object
   * @returns {Object} Additional event data
   * @private
   */
  _getEventSpecificData(type, evt) {
    // Add event-specific data
    switch(type) {
      case 'wheel':
        return {
          deltaY: evt.evt.deltaY,
          deltaX: evt.evt.deltaX,
          deltaZ: evt.evt.deltaZ,
          deltaMode: evt.evt.deltaMode
        };
      case 'mousedown':
      case 'mouseup':
      case 'click':
        return {
          button: evt.evt.button,
          buttons: evt.evt.buttons
        };
      case 'dragstart':
      case 'dragmove':
      case 'dragend':
        return {
          dragTarget: evt.target
        };
      case 'touchstart':
      case 'touchmove':
      case 'touchend':
        return {
          touches: evt.evt.touches,
          changedTouches: evt.evt.changedTouches
        };
      default:
        return {};
    }
  }
  
  /**
   * Update background color
   * @param {Object} colorScheme - Color scheme to apply
   */
  updateBackgroundColor(colorScheme) {
    if (!colorScheme || !colorScheme.background) return;
    
    this.backgroundColor = colorScheme.background;
    
    if (this.stage) {
      this.stage.container().style.backgroundColor = this.backgroundColor;
    }
  }
  
  /**
   * Pan the camera
   * @param {number} deltaX - X offset
   * @param {number} deltaY - Y offset
   */
  panCamera(deltaX, deltaY) {
    if (!this.layer) return;
    
    this.cameraX += deltaX;
    this.cameraY += deltaY;
    this.layer.position({
      x: this.cameraX,
      y: this.cameraY
    });
    this.layer.batchDraw();
  }
  
  /**
   * Zoom the camera
   * @param {number} factor - Zoom factor (> 1 to zoom in, < 1 to zoom out)
   * @param {number} centerX - X coordinate of zoom center
   * @param {number} centerY - Y coordinate of zoom center
   */
  zoomCamera(factor, centerX, centerY) {
    if (!this.layer) return;
    
    // Calculate new scale
    const oldScale = this.cameraZoom;
    const newScale = oldScale * factor;
    
    // Limit zoom range if needed
    const minZoom = 0.1;
    const maxZoom = 10;
    
    if (newScale < minZoom || newScale > maxZoom) return;
    
    // Calculate new position to zoom toward pointer
    const pointer = {
      x: (centerX - this.cameraX) / oldScale,
      y: (centerY - this.cameraY) / oldScale
    };
    
    this.cameraX = centerX - pointer.x * newScale;
    this.cameraY = centerY - pointer.y * newScale;
    this.cameraZoom = newScale;
    
    // Apply transformation
    this.layer.scale({ x: newScale, y: newScale });
    this.layer.position({ x: this.cameraX, y: this.cameraY });
    this.layer.batchDraw();
  }
  
  /**
   * Reset camera to initial position
   */
  resetCamera() {
    if (!this.layer) return;
    
    this.cameraX = 0;
    this.cameraY = 0;
    this.cameraZoom = 1;
    
    this.layer.position({ x: 0, y: 0 });
    this.layer.scale({ x: 1, y: 1 });
    this.layer.batchDraw();
  }
  
  /**
   * Clear the main layer
   */
  clearLayer() {
    if (this.layer) {
      this.layer.destroyChildren();
      this.layer.batchDraw();
    }
  }

  /**
   * Setup automatic camera controls
   * @private
   */
  _setupAutomaticCameraControls() {
    if (!this.stage) return;
    
    // Flag to control whether automatic camera controls are enabled
    this.automaticCameraControls = true;
    
    // Variables for tracking drag state
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };
    
    // Handle middle mouse button or touch drag for panning
    this.stage.on('mousedown touchstart', (evt) => {
      if (!this.automaticCameraControls) return;
      
      // Only handle middle mouse button (1) or touch
      if (evt.evt.type === 'mousedown' && evt.evt.button !== 1) return;
      
      isDragging = true;
      lastPos = {
        x: evt.evt.offsetX || (evt.evt.touches && evt.evt.touches[0] ? evt.evt.touches[0].clientX : 0),
        y: evt.evt.offsetY || (evt.evt.touches && evt.evt.touches[0] ? evt.evt.touches[0].clientY : 0)
      };
    });
    
    this.stage.on('mousemove touchmove', (evt) => {
      if (!this.automaticCameraControls || !isDragging) return;
      
      const currentPos = {
        x: evt.evt.offsetX || (evt.evt.touches && evt.evt.touches[0] ? evt.evt.touches[0].clientX : lastPos.x),
        y: evt.evt.offsetY || (evt.evt.touches && evt.evt.touches[0] ? evt.evt.touches[0].clientY : lastPos.y)
      };
      
      const dx = currentPos.x - lastPos.x;
      const dy = currentPos.y - lastPos.y;
      
      this.panCamera(dx, dy);
      
      lastPos = currentPos;
    });
    
    this.stage.on('mouseup touchend', () => {
      isDragging = false;
    });
    
    // Handle mouse wheel for zoom
    this.stage.on('wheel', (evt) => {
      if (!this.automaticCameraControls) return;
      
      // Prevent wheel event from propagating if we're handling it
      evt.evt.preventDefault();
      
      const delta = evt.evt.deltaY;
      const factor = delta > 0 ? 0.9 : 1.1; // Zoom in or out
      
      this.zoomCamera(factor, evt.evt.offsetX, evt.evt.offsetY);
    });
  }
  
  /**
   * Enable or disable automatic camera controls
   * @param {boolean} enabled - Whether automatic camera controls are enabled
   */
  setAutomaticCameraControls(enabled) {
    this.automaticCameraControls = !!enabled;
  }
  
  /**
   * Legacy support: Prepare context for rendering with camera transformations
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @returns {CanvasRenderingContext2D} Transformed context
   */
  prepareRender(ctx) {
    ctx.save();
    ctx.translate(this.cameraX, this.cameraY);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    return ctx;
  }
  
  /**
   * Legacy support: Complete rendering by restoring context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  completeRender(ctx) {
    ctx.restore();
  }
  
  /**
   * Register a Konva animation for cleanup
   * @param {Object} plugin - Plugin instance
   * @param {Konva.Animation} animation - Konva animation
   */
  registerAnimation(plugin, animation) {
    if (!plugin || !animation) return;
    
    if (!this._pluginResources.has(plugin)) {
      this._pluginResources.set(plugin, {
        animations: [],
        eventHandlers: [],
        tweens: [],
        shapes: []
      });
    }
    
    const resources = this._pluginResources.get(plugin);
    resources.animations.push(animation);
  }
  
  /**
   * Register a Konva event handler for cleanup
   * @param {Object} plugin - Plugin instance
   * @param {Konva.Node} obj - Konva node
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   */
  registerEventHandler(plugin, obj, eventType, handler) {
    if (!plugin || !obj || !eventType || !handler) return;
    
    if (!this._pluginResources.has(plugin)) {
      this._pluginResources.set(plugin, {
        animations: [],
        eventHandlers: [],
        tweens: [],
        shapes: []
      });
    }
    
    const resources = this._pluginResources.get(plugin);
    resources.eventHandlers.push({ obj, eventType, handler });
  }
  
  /**
   * Register a Konva tween for cleanup
   * @param {Object} plugin - Plugin instance
   * @param {Konva.Tween} tween - Konva tween
   */
  registerTween(plugin, tween) {
    if (!plugin || !tween) return;
    
    if (!this._pluginResources.has(plugin)) {
      this._pluginResources.set(plugin, {
        animations: [],
        eventHandlers: [],
        tweens: [],
        shapes: []
      });
    }
    
    const resources = this._pluginResources.get(plugin);
    resources.tweens.push(tween);
  }
  
  /**
   * Register a Konva shape for cleanup
   * @param {Object} plugin - Plugin instance
   * @param {Konva.Node} shape - Konva shape or group
   */
  registerShape(plugin, shape) {
    if (!plugin || !shape) return;
    
    if (!this._pluginResources.has(plugin)) {
      this._pluginResources.set(plugin, {
        animations: [],
        eventHandlers: [],
        tweens: [],
        shapes: []
      });
    }
    
    const resources = this._pluginResources.get(plugin);
    resources.shapes.push(shape);
  }
  
  /**
   * Clean up all resources for a specific plugin
   * @param {Object} plugin - Plugin instance
   */
  cleanupPluginResources(plugin) {
    if (!plugin || !this._pluginResources.has(plugin)) return;
    
    const resources = this._pluginResources.get(plugin);
    
    // Clean up animations
    resources.animations.forEach(anim => {
      if (anim && typeof anim.stop === 'function') {
        anim.stop();
      }
    });
    
    // Clean up event handlers
    resources.eventHandlers.forEach(({ obj, eventType, handler }) => {
      if (obj && typeof obj.off === 'function') {
        obj.off(eventType, handler);
      }
    });
    
    // Clean up tweens
    resources.tweens.forEach(tween => {
      if (tween && typeof tween.destroy === 'function') {
        tween.destroy();
      }
    });
    
    // Clean up shapes
    resources.shapes.forEach(shape => {
      if (shape) {
        shape.destroy();
      }
    });
    
    // Remove plugin from tracking
    this._pluginResources.delete(plugin);
    
    // Force a redraw to ensure removed shapes are cleared
    if (this.layer) {
      this.layer.batchDraw();
    }
  }
  
  /**
   * Render welcome message when no plugin is active
   */
  renderWelcomeMessage() {
    // Clear any existing content
    this.clearLayer();
    
    if (!this.stage || !this.konva) return;
    
    const width = this.stage.width();
    const height = this.stage.height();
    
    // Create a text node with the welcome message
    const welcomeText = new this.konva.Text({
      x: width / 2,
      y: height / 2 - 20,
      text: 'Select a Plugin',
      fontSize: 30,
      fontFamily: 'sans-serif',
      fill: this.backgroundColor === '#f5f5f5' ? '#333333' : '#f0f0f0',
      align: 'center',
      verticalAlign: 'middle'
    });
    
    // Center the text
    welcomeText.offsetX(welcomeText.width() / 2);
    
    // Create instruction text
    const instructionText = new this.konva.Text({
      x: width / 2,
      y: height / 2 + 20,
      text: 'Click the plugin button to choose a visualization',
      fontSize: 16,
      fontFamily: 'sans-serif',
      fill: this.backgroundColor === '#f5f5f5' ? '#666666' : '#cccccc',
      align: 'center',
      verticalAlign: 'middle'
    });
    
    // Center the instruction text
    instructionText.offsetX(instructionText.width() / 2);
    
    // Add to layer
    this.layer.add(welcomeText);
    this.layer.add(instructionText);
    this.layer.batchDraw();
  }
  
  /**
   * Get the Konva stage
   * @returns {Konva.Stage} Konva stage
   */
  getStage() {
    return this.stage;
  }
  
  /**
   * Get the main Konva layer
   * @returns {Konva.Layer} Konva layer
   */
  getLayer() {
    return this.layer;
  }
  
  /**
   * Get the legacy canvas context
   * @returns {CanvasRenderingContext2D} Canvas context
   */
  getContext() {
    return this.ctx;
  }
  
  /**
   * Get the original canvas element
   * @returns {HTMLCanvasElement} Canvas element
   */
  getCanvas() {
    return this.originalCanvas;
  }
  
  /**
   * Clean up resources when the environment is no longer needed
   */
  dispose() {
    console.log("Disposing Canvas2DEnvironment...");
    
    // Clean up all plugin resources
    this._pluginResources.forEach((resources, plugin) => {
      this.cleanupPluginResources(plugin);
    });
    this._pluginResources.clear();
    
    // Clean up Konva stage
    if (this.stage) {
      this.stage.destroy();
      this.stage = null;
    }
    
    // Show original canvas again
    if (this.originalCanvas) {
      this.originalCanvas.style.display = 'block';
    }
    
    this.layer = null;
    this.initialized = false;
    this.active = false;
    
    console.log("Canvas2DEnvironment disposed");
  }
}