// src/ui/styles.js

/**
 * Load CSS styles for the application
 */
export function loadStyles() {
  // Create link elements for each CSS file
  const cssFiles = [
    'src/ui/styles/base.css',
    'src/ui/styles/desktop.css',
    'src/ui/styles/mobile.css',
    'src/ui/styles/loading.css',
    'src/ui/styles/plugin-selector.css'
  ];
  
  // Add media queries for responsive design
  const mediaQueries = {
    'desktop.css': '(min-width: 600px)',
    'mobile.css': '(max-width: 599px)',
    'plugin-selector.css': '(min-width: 600px)' // Only load on desktop
  };
  
  // Add CSS files to document head
  cssFiles.forEach(file => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = file;
    
    // Add media query if applicable
    for (const [cssFile, mediaQuery] of Object.entries(mediaQueries)) {
      if (file.endsWith(cssFile)) {
        link.media = mediaQuery;
        break;
      }
    }
    
    document.head.appendChild(link);
  });
  
  // Add special styles for notification and loading
  addSpecialStyles();
}

/**
 * Add special styles that aren't in the CSS files
 */
function addSpecialStyles() {
  // Create a style element
  const style = document.createElement('style');
  
  // Add spinner animation and existing styles
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .notification {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--overlay-bg);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 10000;
      transition: opacity 0.3s ease;
      font-family: sans-serif;
    }
    
    /* Value display for sliders */
    .value-display {
      min-width: 30px;
      text-align: right;
      padding-left: 10px;
      color: var(--text-secondary);
    }
    
    /* Input container for slider layout */
    .input-container {
      display: flex;
      align-items: center;
    }
    
    /* Error Box Styles */
    .error-box {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--error-color);
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      z-index: 10001;
      max-width: 80%;
      box-shadow: 0 2px 10px var(--overlay-light);
      border: 1px solid var(--border-color);
      font-family: sans-serif;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      transition: opacity 0.3s ease;
    }
    
    .error-box button {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      margin-left: 10px;
      width: 25px;
      height: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }
    
    .error-box button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    /* Theme toggle button */
    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 70px;
      width: 40px;
      height: 40px;
      background-color: var(--overlay-light);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1002;
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .theme-toggle:hover {
      background-color: var(--overlay-bg);
    }
    
    .theme-toggle:active {
      transform: scale(0.95);
    }
    
    /* Mobile theme toggle */
    .mobile-theme-toggle {
      position: fixed;
      top: 0px;
      right: 40px;
      width: 40px;
      height: 40px;
      background-color: transparent;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1002;
    }
    
    /* Enhanced Dropdown Styling */
    select {
      color: var(--text-color);
      background-color: var(--control-bg);
      border: 1px solid var(--control-border);
      border-radius: 4px;
      padding: 8px;
      padding-right: 30px;
      font-size: 14px;
      cursor: pointer;
      
      /* Custom dropdown arrow */
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 12px;
    }
    
    /* Style the arrow for different themes */
    select {
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    }
    
    body[data-theme="dark"] select {
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    }
    
    /* Fix for dropdown options */
    select option {
      color: var(--text-color);
      background-color: var(--control-bg);
      padding: 8px;
    }
    
    /* Firefox specific fixes */
    @-moz-document url-prefix() {
      select {
        color: var(--text-color);
        background-color: var(--control-bg);
        text-indent: 0.01px;
        text-overflow: '';
      }
      
      body[data-theme="dark"] select option {
        background-color: #333333;
        color: #f0f0f0;
      }
    }
    
    /* Chrome/Safari specific fixes */
    @media screen and (-webkit-min-device-pixel-ratio:0) {
      body[data-theme="dark"] select option {
        background-color: #333333;
        color: #f0f0f0;
      }
    }
    
    /* Force dark theme colors with direct values as fallback */
    body[data-theme="dark"] select,
    body[data-theme="dark"] select option {
      color: #f0f0f0 !important;
    }
    
    body[data-theme="dark"] .control-panel select option,
    body[data-theme="dark"] .mobile-header select option,
    body[data-theme="dark"] .mobile-options-menu select option {
      background-color: #333333 !important;
      color: #f0f0f0 !important;
    }
    
    /* Specific styling for different UI areas */
    .control-panel select,
    .mobile-header select,
    .mobile-options-menu select {
      color: var(--text-color);
      background-color: var(--control-bg);
    }
    
    .control-panel select option,
    .mobile-header select option,
    .mobile-options-menu select option {
      color: var(--text-color);
      background-color: var(--control-bg);
    }
    
    /* Support for Windows High Contrast Mode */
    @media (forced-colors: active) {
      select, 
      select option,
      .theme-toggle,
      .mobile-theme-toggle,
      input[type="range"],
      input[type="checkbox"] {
        forced-color-adjust: none;
      }
    }
    
    /* Modern browsers select specific styling */
    select:focus {
      outline: 2px solid var(--control-focus);
      outline-offset: 1px;
    }
    
    /* Hover effect */
    select:hover {
      border-color: var(--accent-color);
    }
  `;
  
  document.head.appendChild(style);
  
  // Add data-theme attribute to body when theme changes
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' && 
            root.style.getPropertyValue('--background-color')) {
          // Check if we're in dark mode based on background color
          const bgColor = root.style.getPropertyValue('--background-color').trim();
          const isDark = bgColor.startsWith('#1') || bgColor.startsWith('#2') || bgColor.startsWith('#3');
          document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }
      });
    });
    
    observer.observe(root, { attributes: true });
    
    // Set initial data-theme attribute
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
