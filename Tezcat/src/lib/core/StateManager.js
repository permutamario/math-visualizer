// src/core/StateManager.js

/**
 * Manages application state
 */
export class StateManager {
  /**
   * Create a new StateManager
   * @param {Object} initialState - Initial state values
   */
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = [];
  }
  
  /**
   * Get a state value
   * @param {string} key - State key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} State value
   */
  get(key, defaultValue = null) {
    // Support nested keys using dot notation
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = this.state;
      
      for (const part of parts) {
        if (current === undefined || current === null) {
          return defaultValue;
        }
        current = current[part];
      }
      
      return current !== undefined ? current : defaultValue;
    }
    
    return this.state[key] !== undefined ? this.state[key] : defaultValue;
  }
  
  /**
   * Set a state value
   * @param {string} key - State key
   * @param {any} value - New value
   */
  set(key, value) {
    // Support nested keys using dot notation
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = this.state;
      
      // Navigate to the parent of the target property
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        
        current = current[part];
      }
      
      // Set the value
      const lastPart = parts[parts.length - 1];
      const oldValue = current[lastPart];
      current[lastPart] = value;
      
      // Notify listeners if value changed
      if (oldValue !== value) {
        this._notifyListeners(key, value, oldValue);
      }
      
      return;
    }
    
    // Simple key
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Notify listeners if value changed
    if (oldValue !== value) {
      this._notifyListeners(key, value, oldValue);
    }
  }
  
  /**
   * Add a state change listener
   * @param {Function} listener - Callback function(key, newValue, oldValue)
   */
  addListener(listener) {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a state change listener
   * @param {Function} listener - Listener to remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Get the entire state object
   * @returns {Object} Current state
   */
  getAll() {
    return { ...this.state };
  }
  
  /**
   * Set multiple state values at once
   * @param {Object} values - Key-value pairs to set
   */
  setMultiple(values) {
    Object.entries(values).forEach(([key, value]) => {
      this.set(key, value);
    });
  }
  
  /**
   * Reset state to initial values
   * @param {Object} initialState - New initial state (optional)
   */
  reset(initialState = {}) {
    this.state = { ...initialState };
    this._notifyListeners('*', this.state, null);
  }
  
  /**
   * Notify all listeners of a state change
   * @param {string} key - Changed key
   * @param {any} newValue - New value
   * @param {any} oldValue - Old value
   * @private
   */
  _notifyListeners(key, newValue, oldValue) {
    this.listeners.forEach(listener => {
      try {
        listener(key, newValue, oldValue);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }
}
