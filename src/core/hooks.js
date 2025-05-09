// src/core/hooks.js
// Updating the hook system to support the event hooks for plugins

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
  console.log('Initializing hooks system');
  
  return {
    addFilter,
    addAction,
    applyFilters,
    doAction,
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
  
  //console.log(`Registered ${type} hook: ${hookName} for plugin ${pluginId}`);
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
    return callback(result, ...args);
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
      // Only call the active plugin's render function
      const result = activePluginHook.callback(...args);
      return result === true; // Return the result
    }
    
    return false; // No active plugin found
  }
  
  // For all other hooks, run all registered callbacks
  for (const { callback } of hooks) {
    const result = callback(...args);
    if (result === true) {
      handled = true;
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
