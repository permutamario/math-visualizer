// src/core/hooks.js
// Plugin hook system for extensibility with strict plugin separation

/**
 * Hook system to allow plugins to extend core functionality
 */
class Hooks {
  constructor() {
    this.actions = {};
    this.filters = {};
  }

  /**
   * Add an action hook
   * @param {string} name - Action name
   * @param {string} pluginId - Plugin identifier
   * @param {Function} callback - Function to call when action is triggered
   * @param {number} priority - Priority (lower runs first)
   */
  addAction(name, pluginId, callback, priority = 10) {
    if (!this.actions[name]) {
      this.actions[name] = [];
    }
    
    this.actions[name].push({
      pluginId,
      callback,
      priority
    });
    
    // Sort by priority
    this.actions[name].sort((a, b) => a.priority - b.priority);
    
    console.log(`Action '${name}' registered by plugin '${pluginId}'`);
  }

  /**
   * Remove an action hook
   * @param {string} name - Action name
   * @param {string} pluginId - Plugin identifier
   */
  removeAction(name, pluginId) {
    if (!this.actions[name]) return;
    
    this.actions[name] = this.actions[name].filter(
      action => action.pluginId !== pluginId
    );
  }

  /**
   * Execute an action
   * @param {string} name - Action name
   * @param {...any} args - Arguments to pass to action callbacks
   * @returns {boolean} Whether the action was handled
   */
  doAction(name, ...args) {
    if (!this.actions[name] || this.actions[name].length === 0) {
      console.log(`No actions registered for '${name}'`);
      return false;
    }
    
    let handled = false;
    
    // Get current active plugin ID if available
    const state = window.AppState ? window.AppState.getState() : null;
    const activePluginId = state ? state.activePluginId : null;
    
    if (name === 'render') {
      //console.log(`Executing render action for active plugin: ${activePluginId}`);
      
      if (activePluginId) {
        // For render, only call the active plugin's render function
        const activePluginAction = this.actions[name].find(
          action => action.pluginId === activePluginId
        );
        
        if (activePluginAction) {
          try {
            //console.log(`Calling render for plugin: ${activePluginId}`);
            activePluginAction.callback(...args);
            handled = true;
          } catch (error) {
            console.error(`Error in render action from plugin '${activePluginId}':`, error);
          }
        } else {
          console.warn(`No render action found for active plugin: ${activePluginId}`);
        }
      } else {
        console.warn('No active plugin for render action');
      }
      
      return handled;
    }
    
    // For all other actions, call all registered callbacks
    for (const action of this.actions[name]) {
      try {
        // Special case for plugin-specific actions
        if ((name === 'activatePlugin' || name === 'deactivatePlugin') && 
            args[0] && args[0].pluginId && args[0].pluginId !== action.pluginId) {
          // Skip this action if it's for a different plugin
          continue;
        }
        
        action.callback(...args);
        handled = true;
      } catch (error) {
        console.error(`Error in action '${name}' from plugin '${action.pluginId}':`, error);
      }
    }
    
    return handled;
  }

  /**
   * Add a filter hook
   * @param {string} name - Filter name
   * @param {string} pluginId - Plugin identifier
   * @param {Function} callback - Function to filter the value
   * @param {number} priority - Priority (lower runs first)
   */
  addFilter(name, pluginId, callback, priority = 10) {
    if (!this.filters[name]) {
      this.filters[name] = [];
    }
    
    this.filters[name].push({
      pluginId,
      callback,
      priority
    });
    
    // Sort by priority
    this.filters[name].sort((a, b) => a.priority - b.priority);
    
    console.log(`Filter '${name}' registered by plugin '${pluginId}'`);
  }

  /**
   * Remove a filter hook
   * @param {string} name - Filter name
   * @param {string} pluginId - Plugin identifier
   */
  removeFilter(name, pluginId) {
    if (!this.filters[name]) return;
    
    this.filters[name] = this.filters[name].filter(
      filter => filter.pluginId !== pluginId
    );
  }

  /**
   * Apply filters to a value
   * @param {string} name - Filter name
   * @param {any} value - Initial value to filter
   * @param {...any} args - Additional arguments to pass to filter callbacks
   * @returns {any} Filtered value
   */
  applyFilters(name, value, ...args) {
    if (!this.filters[name] || this.filters[name].length === 0) {
      console.log(`No filters registered for '${name}'`);
      return value;
    }
    
    let result = value;
    
    // Get active plugin ID if available
    const state = window.AppState ? window.AppState.getState() : null;
    const targetPluginId = args.length > 0 ? args[0] : null;
    const activePluginId = state ? state.activePluginId : null;
    
    // For settings-related filters, we only want hooks from the target plugin
    const pluginSpecificFilters = ['settingsMetadata', 'defaultSettings', 'exportOptions'];
    
    // Handle special case for settings-related filters
    if (pluginSpecificFilters.includes(name) && targetPluginId) {
      // Find the filter for the target plugin
      const targetFilter = this.filters[name].find(filter => filter.pluginId === targetPluginId);
      
      if (targetFilter) {
        try {
          console.log(`Applying filter '${name}' from plugin '${targetFilter.pluginId}' specifically`);
          // Apply just this one filter and return
          return targetFilter.callback(result, ...args);
        } catch (error) {
          console.error(`Error in filter '${name}' from plugin '${targetFilter.pluginId}':`, error);
          return result; 
        }
      }
      
      return result; // If no matching filter found, return unchanged
    }
    
    // For other filters, apply all filters as normal
    for (const filter of this.filters[name]) {
      try {
        result = filter.callback(result, ...args);
      } catch (error) {
        console.error(`Error in filter '${name}' from plugin '${filter.pluginId}':`, error);
      }
    }
    
    return result;
  }

  /**
   * Remove all hooks from a plugin
   * @param {string} pluginId - Plugin identifier
   */
  removePluginHooks(pluginId) {
    // Remove actions
    Object.keys(this.actions).forEach(name => {
      this.removeAction(name, pluginId);
    });
    
    // Remove filters
    Object.keys(this.filters).forEach(name => {
      this.removeFilter(name, pluginId);
    });
    
    console.log(`Removed all hooks for plugin '${pluginId}'`);
  }
  
  /**
   * List all registered hooks for debugging
   */
  listRegisteredHooks() {
    console.log("=== REGISTERED ACTIONS ===");
    Object.keys(this.actions).forEach(name => {
      console.log(`${name}:`, this.actions[name].map(a => a.pluginId));
    });
    
    console.log("=== REGISTERED FILTERS ===");
    Object.keys(this.filters).forEach(name => {
      console.log(`${name}:`, this.filters[name].map(f => f.pluginId));
    });
  }
}

// Singleton instance
let hooksInstance = null;

/**
 * Initialize the hooks system
 * @returns {Hooks} Hooks instance
 */
export function initializeHooks() {
  if (!hooksInstance) {
    hooksInstance = new Hooks();
    console.log("Hooks system initialized");
  }
  return hooksInstance;
}

// For global access
if (typeof window !== 'undefined') {
  window.HooksSystem = {
    initialize: initializeHooks,
    getInstance: () => hooksInstance
  };
}
