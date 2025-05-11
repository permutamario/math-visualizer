// src/ui/styles.js

/**
 * Load CSS styles for the application
 */
export function loadStyles() {
  // Create link elements for each consolidated CSS file
  const cssFiles = [
    'src/ui/styles/core.css',
    'src/ui/styles/components.css',
    'src/ui/styles/layout.css'
  ];
  
  // Add CSS files to document head
  cssFiles.forEach(file => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = file;
    document.head.appendChild(link);
  });
  
  // Set initial data-theme attribute based on current setting
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    if (root.style.getPropertyValue('--background-color')) {
      const bgColor = root.style.getPropertyValue('--background-color').trim();
      const isDark = bgColor.startsWith('#1') || bgColor.startsWith('#2') || bgColor.startsWith('#3');
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  });
}

/**
 * Apply theme colors based on color scheme
 * @param {Object} colorScheme - Color scheme to apply
 */
export function applyThemeColors(colorScheme) {
  if (!colorScheme || !colorScheme.background) return;
  
  const root = document.documentElement;
  
  // Apply main theme colors
  root.style.setProperty('--background-color', colorScheme.background);
  root.style.setProperty('--text-color', colorScheme.text);
  root.style.setProperty('--accent-color', colorScheme.accent);
  
  // Apply secondary colors
  if (colorScheme.id === 'light') {
    // Light theme secondary colors
    root.style.setProperty('--background-secondary', '#ffffff');
    root.style.setProperty('--text-secondary', '#666666');
    root.style.setProperty('--border-color', '#e0e0e0');
    root.style.setProperty('--control-bg', '#ffffff');
    root.style.setProperty('--control-border', '#cccccc');
    root.style.setProperty('--control-active', '#e8f0fe');
    root.style.setProperty('--control-focus', colorScheme.accent); // Use accent color for focus
    root.style.setProperty('--error-color', '#d93025');
    root.style.setProperty('--success-color', '#0f9d58');
    root.style.setProperty('--warning-color', '#f29900');
    root.style.setProperty('--info-color', '#4285f4');
    root.style.setProperty('--overlay-bg', 'rgba(0, 0, 0, 0.7)');
    root.style.setProperty('--overlay-light', 'rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--modal-bg', 'rgba(255, 255, 255, 0.95)');
  } else {
    // Dark theme secondary colors
    root.style.setProperty('--background-secondary', '#2a2a2a');
    root.style.setProperty('--text-secondary', '#b0b0b0');
    root.style.setProperty('--border-color', '#444444');
    root.style.setProperty('--control-bg', '#333333');
    root.style.setProperty('--control-border', '#555555');
    root.style.setProperty('--control-active', '#3c4043');
    root.style.setProperty('--control-focus', colorScheme.accent); // Use accent color for focus
    root.style.setProperty('--error-color', '#f28b82');
    root.style.setProperty('--success-color', '#81c995');
    root.style.setProperty('--warning-color', '#fdd663');
    root.style.setProperty('--info-color', '#8ab4f8');
    root.style.setProperty('--overlay-bg', 'rgba(0, 0, 0, 0.8)');
    root.style.setProperty('--overlay-light', 'rgba(0, 0, 0, 0.5)');
    root.style.setProperty('--modal-bg', 'rgba(42, 42, 42, 0.95)');
  }
  
  // Update data-theme attribute immediately
  document.body.setAttribute('data-theme', colorScheme.id);
  
  // Apply colors directly to mobile UI elements for immediate effect
  applyColorsToMobileElements(colorScheme);
}

/**
 * Apply colors directly to mobile UI elements
 * @param {Object} colorScheme - Color scheme to apply
 */
function applyColorsToMobileElements(colorScheme) {
  // Get mobile header and menus
  const mobileHeader = document.querySelector('.mobile-header');
  const mobileHeaderTitle = document.querySelector('.mobile-header-title');
  const mobileOptionsMenu = document.querySelector('#mobile-visual-menu');
  const mobileExportMenu = document.querySelector('#mobile-export-menu');
  const mobilePluginMenu = document.querySelector('#mobile-plugin-menu');
  
  // Get mobile buttons
  const optionsButton = document.querySelector('#mobile-options-button');
  const exportButton = document.querySelector('#mobile-export-button');
  const pluginButton = document.querySelector('#mobile-plugin-button');
  const pluginButtonIcon = document.querySelector('#mobile-plugin-button-icon');
  
  // Get all mobile buttons
  const allButtons = document.querySelectorAll('.mobile-options-menu button');
  
  // Control background color
  const controlBg = colorScheme.id === 'light' ? '#ffffff' : '#333333';
  
  // Text color
  const textColor = colorScheme.text;
  
  // Accent color
  const accentColor = colorScheme.accent;
  
  // Apply colors to headers
  if (mobileHeader) {
    mobileHeader.style.backgroundColor = controlBg;
    mobileHeader.style.color = textColor;
  }
  
  if (mobileHeaderTitle) {
    mobileHeaderTitle.style.backgroundColor = controlBg;
    mobileHeaderTitle.style.color = textColor;
  }
  
  // Apply colors to menus
  [mobileOptionsMenu, mobileExportMenu, mobilePluginMenu].forEach(menu => {
    if (menu) {
      menu.style.backgroundColor = controlBg;
      menu.style.color = textColor;
    }
  });
  
  // Apply colors to main buttons
  [optionsButton, exportButton].forEach(button => {
    if (button) {
      button.style.backgroundColor = controlBg;
      button.style.color = textColor;
    }
  });
  
  // Apply colors to plugin button
  if (pluginButton) {
    pluginButton.style.backgroundColor = controlBg;
  }
  
  if (pluginButtonIcon) {
    pluginButtonIcon.style.backgroundColor = accentColor;
  }
  
  // Apply accent color to all buttons in menus
  allButtons.forEach(button => {
    button.style.backgroundColor = accentColor;
    button.style.color = 'white';
  });
  
  // Fix labels in the header
  const headerLabels = document.querySelectorAll('.mobile-header label');
  headerLabels.forEach(label => {
    label.style.color = textColor;
  });
}