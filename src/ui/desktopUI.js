// src/ui/desktopUI.js
// Sets up the UI for desktop view with improved rebuild handling

import {
  createSlider,
  createCheckbox,
  createColorPicker,
  createDropdown,
  createButton,
  createNumberInput
} from './baseControls.js';
import { showNotification } from '../core/utils.js';
import { getState, getStateValue, changeState, subscribe } from '../core/stateManager.js';

/**
 * Assemble and mount desktop sidebar controls
 * @param {Object} canvasManager - Canvas manager instance
 */
export function setupDesktopUI(canvasManager) {
  // Access state directly from the state manager
  const state = getState();
  
  // Log the current state to debug UI setup
  console.log("Setting up Desktop UI with state:", {
    activePluginId: state.activePluginId,
    settingsCount: Object.keys(state.settings || {}).length,
    metadataCount: Object.keys(state.settingsMetadata || {}).length,
    exportOptionsCount: (state.exportOptions || []).length
  });
  
  // Clean up existing panels
  removeExistingPanels();

  // Create plugin selector panel
  createPluginSelector();
  
  // Create structural panel (right below plugin selector)
  createStructuralPanel();
  
  // Create panels for visual controls and export options
  createVisualPanel();
  createExportPanel(canvasManager);
  
  // Create debug panel if debug mode is enabled
  if (state.debugMode) {
    createDebugPanel();
  }
  
  // Listen for UI rebuild events
  subscribe('rebuildUI', () => {
    console.log("Rebuilding Desktop UI due to rebuildUI event");
    setupDesktopUI(canvasManager);
  });
}

/**
 * Remove existing panel elements
 */
function removeExistingPanels() {
  const panelIds = [
    'plugin-selector-panel',
    'visual-panel', 
    'export-panel', 
    'structural-panel', 
    'debug-panel'
  ];
  
  panelIds.forEach(id => {
    const panel = document.getElementById(id);
    if (panel) panel.remove();
  });
}

/**
 * Create plugin selector panel
 */
function createPluginSelector() {
  const state = getState();
  const plugins = state.availablePlugins || [];
  
  console.log("Creating plugin selector with available plugins:", plugins);
  
  // Skip if no plugins available
  if (plugins.length <= 1) {
    console.log("Not creating plugin selector - not enough plugins");
    return;
  }
  
  const panel = document.createElement('div');
  panel.id = 'plugin-selector-panel';
  panel.className = 'plugin-selector-panel';
  
  // Apply styles
  Object.assign(panel.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '300px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    padding: '15px',
    zIndex: '1000'
  });
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'Visualization Type';
  title.style.marginTop = '0';
  title.style.marginBottom = '15px';
  panel.appendChild(title);
  
  // Create plugin selector dropdown
  const pluginOptions = plugins.map(plugin => plugin.id);
  const activePluginId = state.activePluginId || '';
  
  console.log("Plugin options:", pluginOptions, "Active plugin:", activePluginId);
  
  const pluginSelect = createDropdown({
    id: 'plugin-select',
    label: 'Visualization Type',
    options: pluginOptions,
    value: activePluginId,
    onChange: (pluginId) => {
      // Get app instance and activate the plugin
      if (window.AppInstance) {
        //console.log("Activating plugin from dropdown:", pluginId);
        window.AppInstance.activatePlugin(pluginId);
      } else {
        console.error("AppInstance not found when trying to activate plugin");
      }
    }
  });
  panel.appendChild(pluginSelect);
  
  document.body.appendChild(panel);
}

/**
 * Create visual parameters panel
 */
function createVisualPanel() {
  const state = getState();
  const panel = document.createElement('div');
  panel.id = 'visual-panel';
  panel.className = 'control-panel';
  
  // Apply styles
  Object.assign(panel.style, {
    position: 'fixed',
    top: '100px',
    left: '20px',
    width: '300px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    padding: '15px',
    zIndex: '1000',
    maxHeight: 'calc(50vh - 110px)',
    overflowY: 'auto'
  });
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Visual Parameters';
  title.style.marginTop = '0';
  title.style.marginBottom = '15px';
  panel.appendChild(title);
  
  // Get visual parameters from state
  const visualSettings = getSettingsByCategory('visual');
  const activePluginId = state.activePluginId;
  
  console.log(`Getting visual settings for plugin ${activePluginId}:`, visualSettings);
    
  if (visualSettings.length === 0) {
    const message = document.createElement('p');
    message.textContent = activePluginId ? 
      `No visual parameters available for ${activePluginId}.` : 
      'No visualization selected.';
    message.style.fontStyle = 'italic';
    message.style.color = '#666';
    panel.appendChild(message);
  } else {
    // Create controls for each visual setting
    visualSettings.forEach(setting => {
      //console.log(`Creating control for visual setting: ${setting.key}`);
      const control = createControlFromSetting(setting, value => {
        changeState(`settings.${setting.key}`, value);
      });
      panel.appendChild(control);
    });
  }
  
  document.body.appendChild(panel);
}

/**
 * Create export options panel
 * @param {Object} canvasManager - Canvas manager
 */
function createExportPanel(canvasManager) {
  const state = getState();
  const panel = document.createElement('div');
  panel.id = 'export-panel';
  panel.className = 'control-panel';
  
  // Apply styles
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    width: '300px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    padding: '15px',
    zIndex: '1000'
  });
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Export Options';
  title.style.marginTop = '0';
  title.style.marginBottom = '15px';
  panel.appendChild(title);
  
  // Get export options from state
  const exportOptions = state.exportOptions || [];
  const activePluginId = state.activePluginId;
  
  console.log(`Export options for plugin ${activePluginId}:`, exportOptions);
  
  if (exportOptions.length === 0) {
    const message = document.createElement('p');
    message.textContent = activePluginId ? 
      `No export options available for ${activePluginId}.` : 
      'No visualization selected.';
    message.style.fontStyle = 'italic';
    message.style.color = '#666';
    panel.appendChild(message);
  } else {
    // Create buttons for each export option
    exportOptions.forEach(option => {
      let onClick;
      
      // Handle built-in actions
      switch (option.id) {
        case 'export-png':
          onClick = () => {
            canvasManager.exportAsPNG();
            showNotification('PNG exported successfully!');
          };
          break;
        case 'export-svg':
          onClick = () => {
            showNotification('SVG export not implemented yet');
          };
          break;
        case 'reset-settings':
          onClick = () => {
            resetAllSettings();
            showNotification('Settings reset to defaults');
          };
          break;
        default:
          // For custom actions - use hooks if available
          onClick = () => {
            if (window.AppInstance && window.AppInstance.hooks) {
              const handled = window.AppInstance.hooks.doAction('exportAction', option.id);
              if (!handled) {
                showNotification(`Action "${option.label}" not implemented`);
              }
            } else {
              showNotification(`Action "${option.label}" not implemented`);
            }
          };
      }
      
      const button = createButton({
        id: option.id,
        label: option.label,
        onClick
      });
      
      panel.appendChild(button);
    });
  }
  
  document.body.appendChild(panel);
}

/**
 * Create structural parameters panel
 */
function createStructuralPanel() {
  const state = getState();
  const panel = document.createElement('div');
  panel.id = 'structural-panel';
  panel.className = 'control-panel';
  
  // Apply styles
  Object.assign(panel.style, {
    position: 'fixed',
    top: '300px',
    right: '20px',
    width: '300px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    padding: '15px',
    zIndex: '1000',
    maxHeight: 'calc(100vh - 300px)',
    overflowY: 'auto'
  });
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Structural Parameters';
  title.style.marginTop = '0';
  title.style.marginBottom = '15px';
  panel.appendChild(title);
  
  // Get structural parameters from state
  const structuralSettings = getSettingsByCategory('structural');
  const activePluginId = state.activePluginId;
  
  console.log(`Getting structural settings for plugin ${activePluginId}:`, structuralSettings);
  
  if (structuralSettings.length === 0) {
    const message = document.createElement('p');
    message.textContent = activePluginId ? 
      `No structural parameters available for ${activePluginId}.` : 
      'No visualization selected.';
    message.style.fontStyle = 'italic';
    message.style.color = '#666';
    panel.appendChild(message);
  } else {
    // Create controls for each structural setting
    structuralSettings.forEach(setting => {
      //console.log(`Creating control for structural setting: ${setting.key}`);
      const control = createControlFromSetting(setting, value => {
        changeState(`settings.${setting.key}`, value);
      });
      panel.appendChild(control);
    });
  }
  
  document.body.appendChild(panel);
}

/**
 * Create debug panel
 */
function createDebugPanel() {
  const state = getState();
  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.className = 'control-panel';
  
  // Apply styles
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '300px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
    padding: '15px',
    zIndex: '1000'
  });
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Debug Options';
  title.style.marginTop = '0';
  title.style.marginBottom = '15px';
  title.style.color = '#856404';
  panel.appendChild(title);
  
  // Add debug state information
  const stateInfo = document.createElement('div');
  stateInfo.style.marginBottom = '15px';
  stateInfo.style.fontSize = '12px';
  
  const activePlugin = document.createElement('p');
  activePlugin.textContent = `Active Plugin: ${state.activePluginId || 'None'}`;
  stateInfo.appendChild(activePlugin);
  
  const settingsCount = document.createElement('p');
  settingsCount.textContent = `Settings Count: ${Object.keys(state.settings || {}).length}`;
  stateInfo.appendChild(settingsCount);
  
  const metadataCount = document.createElement('p');
  metadataCount.textContent = `Metadata Count: ${Object.keys(state.settingsMetadata || {}).length}`;
  stateInfo.appendChild(metadataCount);
  
  panel.appendChild(stateInfo);
  
  // Add a button to log state to console
  const logStateBtn = createButton({
    id: 'log-state',
    label: 'Log State to Console',
    onClick: () => {
      console.log("Current State:", state);
      showNotification('State logged to console');
    }
  });
  panel.appendChild(logStateBtn);
  
  // Add a button to force UI rebuild
  const rebuildUIBtn = createButton({
    id: 'rebuild-ui',
    label: 'Force UI Rebuild',
    onClick: () => {
      if (window.AppInstance) {
        window.AppInstance.rebuildUI();
        showNotification('UI rebuilt');
      } else {
        changeState('rebuildUI', true);
        showNotification('UI rebuild requested');
      }
    }
  });
  panel.appendChild(rebuildUIBtn);
  
  // Get debug options from state
  const debugOptions = state.debugOptions || [];
  
  if (debugOptions.length > 0) {
    // Create controls for each debug option
    debugOptions.forEach(option => {
      const control = createCheckbox({
        id: option.id,
        label: option.label,
        checked: state.settings?.[option.setting] || false,
        onChange: value => {
          changeState(`settings.${option.setting}`, value);
        }
      });
      panel.appendChild(control);
    });
  }
  
  // Add a debug log section
  const logSection = document.createElement('div');
  logSection.style.marginTop = '15px';
  
  const logTitle = document.createElement('h4');
  logTitle.textContent = 'Debug Log';
  logTitle.style.marginBottom = '5px';
  logSection.appendChild(logTitle);
  
  const logDisplay = document.createElement('pre');
  logDisplay.id = 'debug-log-display';
  logDisplay.style.backgroundColor = '#fff';
  logDisplay.style.border = '1px solid #ddd';
  logDisplay.style.padding = '5px';
  logDisplay.style.fontSize = '11px';
  logDisplay.style.maxHeight = '150px';
  logDisplay.style.overflowY = 'auto';
  logDisplay.textContent = 'Debug log initialized';
  logSection.appendChild(logDisplay);
  
  // Add button to clear log
  const clearButton = createButton({
    id: 'clear-debug-log',
    label: 'Clear Log',
    onClick: () => {
      logDisplay.textContent = '';
    }
  });
  logSection.appendChild(clearButton);
  
  panel.appendChild(logSection);
  
  // Add log listener for state events
  if (state.settings && state.settings.logEvents) {
    subscribe('stateChanged', payload => {
      appendToDebugLog(`State changed: ${payload.path} = ${JSON.stringify(payload.value)}`);
    });
  }
  
  document.body.appendChild(panel);
}

/**
 * Append message to debug log
 * @param {string} message - Message to append
 */
function appendToDebugLog(message) {
  const logDisplay = document.getElementById('debug-log-display');
  if (logDisplay) {
    const timestamp = new Date().toLocaleTimeString();
    logDisplay.textContent += `\n${timestamp}: ${message}`;
    logDisplay.scrollTop = logDisplay.scrollHeight;
  }
}

/**
 * Get settings filtered by category
 * @param {string} category - Category to filter by
 * @returns {Array} Array of settings in the category
 */
function getSettingsByCategory(category) {
  const state = getState();
  const metadata = state.settingsMetadata || {};
  const settings = state.settings || {};
  const result = [];
  
  console.log(`Getting ${category} settings with metadata:`, metadata);
  
  Object.keys(metadata).forEach(key => {
    if (metadata[key].type === category) {
      result.push({
        key,
        value: settings[key],
        ...metadata[key]
      });
    }
  });
  
  return result;
}

/**
 * Reset all settings to their default values
 */
function resetAllSettings() {
  const state = getState();
  const metadata = state.settingsMetadata || {};
  
  Object.entries(metadata).forEach(([key, data]) => {
    if ('default' in data) {
      changeState(`settings.${key}`, data.default);
    }
  });
  
  changeState('settingsReset', true);
}

/**
 * Create a control based on a setting's metadata
 * @param {Object} setting - Setting metadata
 * @param {Function} onChange - Change handler
 * @returns {HTMLElement} Control element
 */
function createControlFromSetting(setting, onChange) {
  const { key, control, label, value } = setting;
  
  //console.log(`Creating control for setting: ${key}, type: ${control}, value: ${value}`);
  
  switch (control) {
    case 'slider':
      return createSlider({
        id: key,
        label,
        min: setting.min || 0,
        max: setting.max || 100,
        step: setting.step || 1,
        value: value !== undefined ? value : setting.default,
        onChange
      });
      
    case 'checkbox':
      return createCheckbox({
        id: key,
        label,
        checked: value !== undefined ? value : setting.default,
        onChange
      });
      
    case 'color':
      return createColorPicker({
        id: key,
        label,
        value: value !== undefined ? value : setting.default,
        onChange
      });
      
    case 'number':
      return createNumberInput({
        id: key,
        label,
        value: value !== undefined ? value : setting.default,
        min: setting.min,
        max: setting.max,
        step: setting.step,
        onChange
      });
      
    case 'dropdown':
      return createDropdown({
        id: key,
        label,
        options: setting.options || [],
        value: value !== undefined ? value : setting.default,
        onChange
      });
      
    default:
      // Fallback for unknown control types
      const container = document.createElement('div');
      container.className = 'control';
      container.innerHTML = `<label>${label}</label><p>Unsupported control type: ${control}</p>`;
      return container;
  }
}
