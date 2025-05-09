// src/core/renderingEnvironments/2dEventEnvironment.js
// 2D environment that passes events to plugins

import { BaseEnvironment } from './baseEnvironment.js';
import { getState } from '../stateManager.js';

/**
 * 2D environment that passes events to plugins
 */
export class Event2DEnvironment extends BaseEnvironment {
  /**
   * Create a new Event2D environment
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Object} options - Environment options
   */
  constructor(canvas, options = {}) {
    super(canvas, options);
    
    // Bound event handlers
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleWheel = this.handleWheel.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  }
  
  /**
   * Initialize the environment
   */
  initialize() {
    if (this.initialized) return;
    super.initialize();
    console.log('Event2D environment initialized');
  }
  
  /**
   * Activate this environment
   */
  activate() {
    if (this.active) return;
    super.activate();
    
    // Attach event listeners
    this.canvas.addEventListener('mousedown', this.boundHandleMouseDown);
    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.addEventListener('mouseup', this.boundHandleMouseUp);
    this.canvas.addEventListener('click', this.boundHandleClick);
    this.canvas.addEventListener('wheel', this.boundHandleWheel);
    document.addEventListener('keydown', this.boundHandleKeyDown);
    document.addEventListener('keyup', this.boundHandleKeyUp);
    
    console.log('Event2D environment activated');
  }
  
  /**
   * Deactivate this environment
   */
  deactivate() {
    if (!this.active) return;
    
    // Remove event listeners
    this.canvas.removeEventListener('mousedown', this.boundHandleMouseDown);
    this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.removeEventListener('mouseup', this.boundHandleMouseUp);
    this.canvas.removeEventListener('click', this.boundHandleClick);
    this.canvas.removeEventListener('wheel', this.boundHandleWheel);
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    document.removeEventListener('keyup', this.boundHandleKeyUp);
    
    super.deactivate();
    console.log('Event2D environment deactivated');
  }
  
  /**
   * Get app hooks
   * @returns {Object} Hooks system
   */
  getHooks() {
    if (window.AppInstance && window.AppInstance.hooks) {
      return window.AppInstance.hooks;
    }
    return null;
  }
  
  /**
   * Convert event coordinates to canvas coordinates
   * @param {MouseEvent} event - Mouse event
   * @returns {Object} Coordinates in canvas space
   */
  getCanvasCoordinates(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  
  /**
   * Handle mouse down events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseDown(event) {
    const hooks = this.getHooks();
    if (!hooks) return;
    
    const coords = this.getCanvasCoordinates(event);
    const state = getState();
    
    hooks.doAction('onMouseDown', {
      x: coords.x,
      y: coords.y,
      button: event.button,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      canvas: this.canvas
    });
  }
  
  /**
   * Handle mouse move events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    const hooks = this.getHooks();
    if (!hooks) return;
    
    const coords = this.getCanvasCoordinates(event);
    
    hooks.doAction('onMouseMove', {
      x: coords.x,
      y: coords.y,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      canvas: this.canvas
    });
  }
  
  /**
   * Handle mouse up events
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseUp(event) {
    const hooks = this.getHooks();
    if (!hooks) return;
    
    const coords = this.getCanvasCoordinates(event);
    
    hooks.doAction('onMouseUp', {
      x: coords.x,
      y: coords.y,
      button: event.button,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      canvas: this.canvas
    });
  }
  
  /**
   * Handle click events
   * @param {MouseEvent} event - Mouse event
   */
  handleClick(event) {
    const hooks = this.getHooks();
    if (!hooks) return;
    
    const coords = this.getCanvasCoordinates(event);
    
    hooks.doAction('onClick', {
      x: coords.x,
      y: coords.y,
      button: event.button,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      canvas: this.canvas
    });
  }
  
  /**
   * Handle wheel events
   * @param {WheelEvent} event - Wheel event
   */
  handleWheel(event) {
    const hooks = this.getHooks();
    if (!hooks) return;
    
    const coords = this.getCanvasCoordinates(event);
    
    const handled = hooks.doAction('onWheel', {
      x: coords.x,
      y: coords.y,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      canvas: this.canvas
    });
    
    // If the plugin handled the event, prevent default behavior
    if (handled) {
      event.preventDefault();
    }
  }
  
  /**
   * Handle key down events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    const hooks = this.getHooks();
    if (!hooks) return;
    
    hooks.doAction('onKeyDown', {
      key: event.key,
      code: event.code,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      canvas: this.canvas
    });
  }
  
  /**
   * Handle key up events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyUp(event) {
    const hooks = this.getHooks();
    if (!hooks) return;
    
    hooks.doAction('onKeyUp', {
      key: event.key,
      code: event.code,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      canvas: this.canvas
    });
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this.deactivate();
    super.dispose();
  }
}
