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
    'src/ui/styles/loading.css'
  ];
  
  // Add media queries for responsive design
  const mediaQueries = {
    'desktop.css': '(min-width: 600px)',
    'mobile.css': '(max-width: 599px)'
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
  
  // Add spinner animation
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
  `;
  
  document.head.appendChild(style);
}
