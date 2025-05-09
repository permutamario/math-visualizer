// src/core/stateManager.js
// Handles state storage and retrieval, with global accessibility

import { EventEmitter } from './utils.js';

// Internal event emitter for change notifications
const emitter = new EventEmitter();

// Application state object
let state = {};

/**
 * Get the current state object.
 * @returns {Object} Current application state
 */
function getState() {
    return state;
}

/**
 * Get a value from the state using dot notation
 * @param {string} path - Path to the value (e.g., 'settings.animation')
 * @returns {*} The value at the specified path
 */
function getStateValue(path) {
    if (!path) return state;
    
    const parts = path.split('.');
    let current = state;
    
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
    }
    
    return current;
}

/**
 * Update state at the specified path
 * @param {string} path - Path to update (e.g., 'settings.animation')
 * @param {*} value - New value to set
 */
function changeState(path, value) {
    // Handle simple top-level case
    if (!path.includes('.')) {
        if (state[path] === value) return;
        state[path] = value;
        emitter.emit('stateChanged', { path, value });
        return;
    }
    
    // Handle nested paths
    const parts = path.split('.');
    const topLevelKey = parts[0];
    const currentValue = getStateValue(path);
    
    // Skip if value hasn't changed
    if (currentValue === value) return;
    
    // Clone the top-level object to maintain immutability
    const newTopLevel = { ...state[topLevelKey] };
    let current = newTopLevel;
    
    // Navigate to the parent of the target property
    for (let i = 1; i < parts.length - 1; i++) {
        const part = parts[i];
        current[part] = current[part] ? { ...current[part] } : {};
        current = current[part];
    }
    
    // Set the value on the last part
    current[parts[parts.length - 1]] = value;
    
    // Update state
    state[topLevelKey] = newTopLevel;
    
    // Emit events
    emitter.emit('stateChanged', { path, value, parent: topLevelKey });
    emitter.emit(`change:${path}`, value);
}

/**
 * Subscribe to state change events
 * @param {string} event - Event name or path to subscribe to
 * @param {Function} callback - Function to call when event occurs
 */
function subscribe(event, callback) {
    emitter.on(event, callback);
}

/**
 * Unsubscribe from state change events
 * @param {string} event - Event name or path to unsubscribe from
 * @param {Function} callback - Function to remove from listeners
 */
function unsubscribe(event, callback) {
    emitter.off(event, callback);
}

/**
 * Initialize the state with an initial object
 * @param {Object} initialState - Initial state to set
 */
function initState(initialState) {
    state = { ...initialState };
}

// Expose functions globally on the window object
if (typeof window !== 'undefined') {
    // Create a namespace for your app to avoid polluting the global scope
    window.AppState = {
        getState,
        getStateValue,
        changeState,
        subscribe,
        unsubscribe,
        initState
    };
    window.subscribe = subscribe;
    window.getState = getState;
    window.changeState = changeState;
    window.unsubscribe = unsubscribe;
}

// Still export for modules that prefer imports
export {
    getState,
    getStateValue,
    changeState,
    subscribe,
    unsubscribe,
    initState
};
