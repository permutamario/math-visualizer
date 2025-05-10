// src/plugins/polygon/exportActions.js

/**
 * Export the visualization as PNG
 * @returns {boolean} Success status
 */
export function exportPNG() {
  console.log("Exporting polygon as PNG");
  
  // Use the canvas manager to export
  if (window.AppInstance && window.AppInstance.canvasManager) {
    window.AppInstance.canvasManager.exportAsPNG();
    return true;
  }
  
  return false;
}

/**
 * Toggle animation state
 * @returns {boolean} Success status
 */
export function toggleAnimation() {
  console.log("Toggling polygon animation");
  
  // Get current state
  const state = window.getState ? window.getState() : null;
  if (!state || !state.settings) {
    return false;
  }
  
  // Toggle animation setting
  const currentValue = state.settings.animation || false;
  window.changeState('settings.animation', !currentValue);
  
  return true;
}

/**
 * Reset settings to defaults
 * @returns {boolean} Success status
 */
export function resetSettings() {
  console.log("Resetting polygon settings to defaults");
  
  // Use plugin registry to reset settings if available
  if (window.AppInstance && window.AppInstance.pluginRegistry) {
    window.AppInstance.pluginRegistry.resetActiveSettings();
    return true;
  }
  
  return false;
}
