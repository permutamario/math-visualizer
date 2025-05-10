// src/ui/mobileUI.js
// Sets up the UI for mobile view - using plugin-based architecture

import {
  createSlider,
  createCheckbox,
  createColorPicker,
  createDropdown,
  createButton,
  createNumberInput,
  createMessage
} from './baseControls.js';
import { showNotification } from '../core/utils.js';
import { getState, getStateValue, changeState, subscribe } from '../core/stateManager.js';

/**
 * Set up mobile UI controls
 * @param {Object} canvasManager - Canvas manager instance
 */
export function setupMobileUI(canvasManager) {
  // Mark body as mobile
  document.body.classList.add('mobile-device');
  
  // Clean up existing UI elements
  removeExistingElements();
  
  // Create header with structural controls
  const header = createMobileHeader();
  document.body.appendChild(header);
  
  // Create options button
  const optionsBtn = createButton({
    id: 'mobile-options-button',
    label: 'Visual Options',
    onClick: () => {
      const menu = document.getElementById('mobile-visual-menu');
      if (menu) {
        menu.classList.toggle('hidden');
        // Hide export menu if open
        const exportMenu = document.getElementById('mobile-export-menu');
        if (exportMenu && !exportMenu.classList.contains('hidden')) {
          exportMenu.classList.add('hidden');
        }
      }
    }
  });
  
  // Style and position the options button
  Object.assign(optionsBtn.style, {
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    padding: '12px 24px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    zIndex: '1000',
    boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
  });
  document.body.appendChild(optionsBtn);
  
  // Create visual options menu
  const visualMenu = createVisualMenu();
  document.body.appendChild(visualMenu);
  
  // Create export button
  const exportBtn = createButton({
    id: 'mobile-export-button',
    label: 'Export',
    onClick: () => {
      const menu = document.getElementById('mobile-export-menu');
      if (menu) {
        menu.classList.toggle('hidden');
        // Hide visual menu if open
        const visualMenu = document.getElementById('mobile-visual-menu');
        if (visualMenu && !visualMenu.classList.contains('hidden')) {
          visualMenu.classList.add('hidden');
        }
      }
    }
  });
  // Style and position the export button
  Object.assign(exportBtn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 24px',
    backgroundColor: '#1a2433',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    zIndex: '1000',
    boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
  });
  document.body.appendChild(exportBtn);
  
  // Create export menu
  const exportMenu = createExportMenu(canvasManager);
  document.body.appendChild(exportMenu);
  
  // Close menus when clicking outside
  document.addEventListener('click', (event) => {
    const visualMenu = document.getElementById('mobile-visual-menu');
    const exportMenu = document.getElementById('mobile-export-menu');
    const optionsBtn = document.getElementById('mobile-options-button');
    const exportBtn = document.getElementById('mobile-export-button');
    
    // Handle visual menu clicks
    if (visualMenu && !visualMenu.classList.contains('hidden')) {
      const isClickInsideMenu = visualMenu.contains(event.target);
      const isClickOnButton = optionsBtn && optionsBtn.contains(event.target);
      if (!isClickInsideMenu && !isClickOnButton) {
        visualMenu.classList.add('hidden');
      }
    }
    
    // Handle export menu clicks
    if (exportMenu && !exportMenu.classList.contains('hidden')) {
      const isClickInsideMenu = exportMenu.contains(event.target);
      const isClickOnButton = exportBtn && exportBtn.contains(event.target);
      if (!isClickInsideMenu && !isClickOnButton) {
        exportMenu.classList.add('hidden');
      }
    }
  });
  
  // Listen for UI rebuild events
  subscribe('rebuildUI', () => {
    setupMobileUI(canvasManager);
  });
}

/**
 * Remove existing UI elements
 */
function removeExistingElements() {
  const elements = [
    '.mobile-header',
    '#mobile-options-button',
    '#mobile-visual-menu',
    '#mobile-export-button',
    '#mobile-export-menu'
  ];
  
  elements.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
}

/**
 * Create the mobile header with structural controls
 * @returns {HTMLElement} Header element
 */
function createMobileHeader() {
  const state = getState();
  const header = document.createElement('div');
  header.className = 'mobile-header';
  
  // Add plugin selector if multiple plugins available
  const plugins = state.availablePlugins || [];
  if (plugins.length > 1) {
    const pluginOptions = plugins.map(plugin => plugin.id);
    const activePluginId = state.activePluginId || '';
    
    const pluginDropdown = createDropdown({
      id: 'plugin-select-mobile',
      label: 'Visualization',
      options: pluginOptions,
      value: activePluginId,
      onChange: (pluginId) => {
        // Get app instance and activate the plugin
        if (window.AppInstance) {
          window.AppInstance.activatePlugin(pluginId);
        } else {
          changeState('activePluginId', pluginId);
        }
      }
    });
    header.appendChild(pluginDropdown);
  }
  
  // Add all structural parameters
  const structuralSettings = getSettingsByCategory('structural');
  
  if (structuralSettings.length === 0) {
    const message = document.createElement('p');
    message.textContent = 'No structural parameters available.';
    message.style.fontStyle = 'italic';
    message.style.color = '#fff';
    message.style.padding = '8px';
    message.style.textAlign = 'center';
    header.appendChild(message);
  } else {
    structuralSettings.forEach(setting => {
      const control = createControlFromSetting(setting, value => {
        changeState(`settings.${setting.key}`, value);
      });
      header.appendChild(control);
    });
  }
  
  return header;
}

/**
 * Create the visual options menu
 * @returns {HTMLElement} Menu element
 */
function createVisualMenu() {
  const menu = document.createElement('div');
  menu.id = 'mobile-visual-menu';
  menu.className = 'mobile-options-menu hidden';
  
  // Create title
  const title = document.createElement('h3');
  title.textContent = 'Visual Options';
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '16px';
  menu.appendChild(title);
  
  // Add all visual parameters
  const visualSettings = getSettingsByCategory('visual');
  
  if (visualSettings.length === 0) {
    const message = document.createElement('p');
    message.textContent = 'No visual parameters available.';
    message.style.fontStyle = 'italic';
    message.style.color = '#666';
    menu.appendChild(message);
  } else {
    visualSettings.forEach(setting => {
      const control = createControlFromSetting(setting, value => {
        changeState(`settings.${setting.key}`, value);
      });
      menu.appendChild(control);
    });
  }
  
  return menu;
}

/**
 * Create the export menu
 * @param {Object} canvasManager - Canvas manager
 * @returns {HTMLElement} Menu element
 */
function createExportMenu(canvasManager) {
  const state = getState();
  const menu = document.createElement('div');
  menu.id = 'mobile-export-menu';
  menu.className = 'mobile-options-menu hidden';
  
  // Apply custom position
  menu.style.right = '20px';
  menu.style.left = 'auto';
  menu.style.width = '200px';
  
  // Create title
  const title = document.createElement('h3');
  title.textContent = 'Export Options';
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '16px';
  menu.appendChild(title);
  
  // Get export options
  const exportOptions = state.exportOptions || [];
  
  if (exportOptions.length === 0) {
    const message = document.createElement('p');
    message.textContent = 'No export options available.';
    message.style.fontStyle = 'italic';
    message.style.color = '#666';
    menu.appendChild(message);
  } else {
    // Create export buttons container
    const btnContainer = document.createElement('div');
    btnContainer.className = 'export-buttons';
    
    // Create buttons for each export option
    exportOptions.forEach(option => {
      let onClick;
      
      // Handle built-in actions
      switch (option.id) {
        case 'export-png':
          onClick = () => {
            canvasManager.exportAsPNG();
            menu.classList.add('hidden');
            showNotification('PNG exported successfully!');
          };
          break;
        case 'export-svg':
          onClick = () => {
            menu.classList.add('hidden');
            showNotification('SVG export not implemented yet');
          };
          break;
        case 'reset-settings':
          onClick = () => {
            resetAllSettings();
            menu.classList.add('hidden');
            showNotification('Settings reset to defaults');
          };
          break;
        default:
          // For custom actions - use hooks if available
          onClick = () => {
            menu.classList.add('hidden');
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
        id: `${option.id}-mobile`,
        label: option.label,
        onClick
      });
      
      btnContainer.appendChild(button);
    });
    
    menu.appendChild(btnContainer);
  }
  
  return menu;
}

/**
 * Get settings filtered by category
 * @param {string} category - Category to filter by
 * @returns {Array} Array of settings in the category
 */
function getSettingsByCategory(category) {
  const state = getState();
  const result = [];
  
  // Handle the new manifest structure
  const metadata = state.settingsMetadata || {};
  
  // First try the new format (nested arrays under categories)
  if (metadata[category] && Array.isArray(metadata[category])) {
    console.log(`Found settings in the new manifest format for category: ${category}`);
    
    // Map from the new format to the expected format
    metadata[category].forEach(setting => {
      if (setting.key) {
        result.push({
          key: setting.key,
          value: state.settings?.[setting.key],
          type: category,
          label: setting.label,
          control: setting.control,
          min: setting.min,
          max: setting.max,
          step: setting.step,
          default: setting.default,
          options: setting.options
        });
      }
    });
    
    return result;
  }
  
  // Fall back to the old format (type property on each setting)
  console.log(`Falling back to old format for category: ${category}`);
  Object.keys(metadata).forEach(key => {
    if (metadata[key]?.type === category) {
      result.push({
        key,
        value: state.settings?.[key],
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
  
  // Handle both metadata formats
  if (metadata.visual && Array.isArray(metadata.visual)) {
    // New format
    ['visual', 'structural'].forEach(category => {
      if (metadata[category] && Array.isArray(metadata[category])) {
        metadata[category].forEach(setting => {
          if (setting.key && 'default' in setting) {
            changeState(`settings.${setting.key}`, setting.default);
          }
        });
      }
    });
  } else {
    // Old format
    Object.entries(metadata).forEach(([key, data]) => {
      if ('default' in data) {
        changeState(`settings.${key}`, data.default);
      }
    });
  }
  
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
  
  switch (control) {
    case 'message':
      return createMessage({
        id: key,
        label,
        text: setting.text || ''
      });
    case 'slider':
      return createSlider({
        id: `${key}-mobile`,
        label,
        min: setting.min || 0,
        max: setting.max || 100,
        step: setting.step || 1,
        value: value !== undefined ? value : setting.default,
        onChange
      });
      
    case 'checkbox':
      return createCheckbox({
        id: `${key}-mobile`,
        label,
        checked: value !== undefined ? value : setting.default,
        onChange
      });
      
    case 'color':
      return createColorPicker({
        id: `${key}-mobile`,
        label,
        value: value !== undefined ? value : setting.default,
        onChange
      });
      
    case 'number':
      return createNumberInput({
        id: `${key}-mobile`,
        label,
        value: value !== undefined ? value : setting.default,
        min: setting.min,
        max: setting.max,
        step: setting.step,
        onChange
      });
      
    case 'dropdown':
      return createDropdown({
        id: `${key}-mobile`,
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
