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
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
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
  `;
  
  document.head.appendChild(style);
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
    root.style.setProperty('--control-focus', '#3367d6');
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
    root.style.setProperty('--control-focus', '#8ab4f8');
    root.style.setProperty('--error-color', '#f28b82');
    root.style.setProperty('--success-color', '#81c995');
    root.style.setProperty('--warning-color', '#fdd663');
    root.style.setProperty('--info-color', '#8ab4f8');
    root.style.setProperty('--overlay-bg', 'rgba(0, 0, 0, 0.8)');
    root.style.setProperty('--overlay-light', 'rgba(0, 0, 0, 0.5)');
    root.style.setProperty('--modal-bg', 'rgba(42, 42, 42, 0.95)');
  }
}
