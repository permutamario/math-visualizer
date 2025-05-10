// src/ui/styles.js
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
    'src/ui/styles/plugin-selector.css' // Added new CSS file
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
      background-color: rgba(0, 0, 0, 0.8);
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
      color: #666;
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
      background-color: #f8d7da;
      color: #721c24;
      padding: 15px 20px;
      border-radius: 4px;
      z-index: 10001;
      max-width: 80%;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      border: 1px solid #f5c6cb;
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
      color: #721c24;
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
  `;
  
  document.head.appendChild(style);
}
