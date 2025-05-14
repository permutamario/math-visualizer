// src/core/EventEmitter.js

/**
 * Simple event emitter for the framework's event system
 */
export class EventEmitter {
  /**
   * Create a new EventEmitter
   */
  constructor() {
    this.events = {};
  }
  
  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event callback function
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(listener);
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event callback function to remove
   */
  off(event, listener) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(l => l !== listener);
    
    // Clean up empty event arrays
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   * @returns {boolean} Whether any listeners were called
   */
  emit(event, ...args) {
    if (!this.events[event]) return false;
    
    this.events[event].forEach(listener => {
      listener(...args);
    });
    
    return true;
  }
  
  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event callback function
   */
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    
    this.on(event, onceWrapper);
  }
  
  /**
   * Remove all listeners for an event
   * @param {string} event - Event name (optional, removes all events if not specified)
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}
