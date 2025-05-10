// src/plugins/polytope-viewer/exportActions.js

/**
 * Export the current visualization as a PNG
 * @returns {boolean} Success status
 */
export function exportPNG() {
  console.log("Exporting polytope as PNG");
  
  // Use the canvas manager to export
  if (window.AppInstance && window.AppInstance.canvasManager) {
    window.AppInstance.canvasManager.exportAsPNG();
    return true;
  }
  
  return false;
}

/**
 * Toggle wireframe mode
 * @returns {boolean} Success status
 */
export function toggleWireframe() {
  console.log("Toggling wireframe mode");
  
  // Get current state
  const state = window.getState ? window.getState() : null;
  if (!state || !state.settings) {
    return false;
  }
  
  // Toggle wireframe setting
  const currentValue = state.settings.wireframe || false;
  window.changeState('settings.wireframe', !currentValue);
  
  return true;
}

/**
 * Reset settings to defaults
 * @returns {boolean} Success status
 */
export function resetSettings() {
  console.log("Resetting polytope settings to defaults");
  
  // Use plugin registry to reset settings if available
  if (window.AppInstance && window.AppInstance.pluginRegistry) {
    window.AppInstance.pluginRegistry.resetActiveSettings();
    return true;
  }
  
  return false;
}
