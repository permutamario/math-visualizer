// src/core/hooks.js
// Updated hook system to support lifecycle management and plugin cleanup

// Map to store registered hooks
const HOOKS = {
  filters: {}, // Store functions that modify and return data
  actions: {}  // Store functions that perform operations
};

/**
 * Initialize hooks system
 * @returns {Object} Hook system object
 */
export function initializeHooks() {
  console.log('Initializing hooks system with lifecycle support');
  
  return {
    addFilter,
    addAction,
    applyFilters,
    doAction,
    removeAction,  // Add this method for cleanup
    removeFilter,  // Add this method for cleanup
    listRegisteredHooks
  };
}

/**
 * Register a filter hook
 * @param {string} hookName - Name of the hook
 * @param {string} pluginId - Plugin identifier
 * @param {Function} callback - Function to call
 * @param {number} priority - Priority (lower runs first)
 */
function addFilter(hookName, pluginId, callback, priority = 10) {
  registerHook('filters', hookName, pluginId, callback, priority);
}

/**
 * Register an action hook
 * @param {string} hookName - Name of the hook
 * @param {string} pluginId - Plugin identifier
 * @param {Function} callback - Function to call
 * @param {number} priority - Priority (lower runs first)
 */
function addAction(hookName, pluginId, callback, priority = 10) {
  registerHook('actions', hookName, pluginId, callback, priority);
}

/**
 * Remove a filter hook
 * @param {string} hookName - Name of the hook
 * @param {string} pluginId - Plugin identifier
 */
function removeFilter(hookName, pluginId) {
  removeHook('filters', hookName, pluginId);
}

/**
 * Remove an action hook
 * @param {string} hookName - Name of the hook
 * @param {string} pluginId - Plugin identifier
 */
function removeAction(hookName, pluginId) {
  removeHook('actions', hookName, pluginId);
}

/**
 * Register a hook
 * @param {string} type - Type of hook (filters or actions)
 * @param {string} hookName - Name of the hook
 * @param {string} pluginId - Plugin identifier
 * @param {Function} callback - Function to call
 * @param {number} priority - Priority (lower runs first)
 */
function registerHook(type, hookName, pluginId, callback, priority) {
  // Create hooks collection if it doesn't exist
  if (!HOOKS[type][hookName]) {
    HOOKS[type][hookName] = [];
  }
  
  // Add the hook
  HOOKS[type][hookName].push({
    pluginId,
    callback,
    priority
  });
  
  // Sort by priority
  HOOKS[type][hookName].sort((a, b) => a.priority - b.priority);
  
  console.log(`Registered ${type} hook: ${hookName} for plugin ${pluginId}`);
}

/**
 * Remove a hook
 * @param {string} type - Type of hook (filters or actions)
 * @param {string} hookName - Name of the hook
 * @param {string} pluginId - Plugin identifier
 */
function removeHook(type, hookName, pluginId) {
  if (!HOOKS[type][hookName]) return;
  
  // Filter out hooks from this plugin
  HOOKS[type][hookName] = HOOKS[type][hookName].filter(
    hook => hook.pluginId !== pluginId
  );
  
  console.log(`Removed ${type} hook: ${hookName} for plugin ${pluginId}`);
  
  // Remove the hook collection if empty
  if (HOOKS[type][hookName].length === 0) {
    delete HOOKS[type][hookName];
  }
}

/**
 * Apply registered filters to modify a value
 * @param {string} hookName - Name of the hook
 * @param {*} value - Initial value to filter
 * @param {string} [targetPluginId] - Only apply filters from this plugin
 * @param {...*} args - Additional arguments to pass to callbacks
 * @returns {*} Modified value
 */
function applyFilters(hookName, value, targetPluginId, ...args) {
  if (!HOOKS.filters[hookName]) {
    return value;
  }
  
  // Get all relevant hooks
  const hooks = HOOKS.filters[hookName];
  
  // If targetPluginId provided, only use hooks from that plugin
  const relevantHooks = targetPluginId 
    ? hooks.filter(hook => hook.pluginId === targetPluginId)
    : hooks;
  
  // Apply each filter in order
  return relevantHooks.reduce((result, { callback }) => {
    try {
      return callback(result, ...args);
    } catch (error) {
      console.error(`Error in filter "${hookName}":`, error);
      return result; // Return unmodified result on error
    }
  }, value);
}

/**
 * Run all registered actions
 * @param {string} hookName - Name of the hook
 * @param {...*} args - Arguments to pass to callbacks
 * @returns {boolean} True if any callbacks were run
 */
function doAction(hookName, ...args) {
  if (!HOOKS.actions[hookName]) {
    return false;
  }
  
  const hooks = HOOKS.actions[hookName];
  let handled = false;
  
  // Special handling for 'render' hook - only the active plugin should render
  if (hookName === 'render') {
    const activePluginId = window.getState ? window.getState().activePluginId : null;
    
    // Find the active plugin's render hook
    const activePluginHook = hooks.find(hook => hook.pluginId === activePluginId);
    
    if (activePluginHook) {
      try {
        // Only call the active plugin's render function
        const result = activePluginHook.callback(...args);
        return result === true; // Return the result
      } catch (error) {
        console.error(`Error in render hook for plugin "${activePluginId}":`, error);
        return false;
      }
    }
    
    return false; // No active plugin found
  }
  
  // For all other hooks, run all registered callbacks
  for (const { pluginId, callback } of hooks) {
    try {
      const result = callback(...args);
      if (result === true) {
        handled = true;
      }
    } catch (error) {
      console.error(`Error in action "${hookName}" for plugin "${pluginId}":`, error);
    }
  }
  
  return handled;
}

/**
 * Debug function to list all registered hooks
 */
function listRegisteredHooks() {
  console.log("--- Registered Hooks ---");
  
  console.log("Filters:");
  Object.keys(HOOKS.filters).forEach(hookName => {
    console.log(`  ${hookName}: ${HOOKS.filters[hookName].length} callbacks`);
    HOOKS.filters[hookName].forEach(({ pluginId, priority }) => {
      console.log(`    - ${pluginId} (priority: ${priority})`);
    });
  });
  
  console.log("Actions:");
  Object.keys(HOOKS.actions).forEach(hookName => {
    console.log(`  ${hookName}: ${HOOKS.actions[hookName].length} callbacks`);
    HOOKS.actions[hookName].forEach(({ pluginId, priority }) => {
      console.log(`    - ${pluginId} (priority: ${priority})`);
    });
  });
  
  console.log("----------------------");
}
