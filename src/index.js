// src/index.js
// Application entry point with improved UI sequencing

import { detectPlatform, showNotification } from './core/utils.js';
import { setupDesktopUI } from './ui/desktopUI.js';
import { setupMobileUI } from './ui/mobileUI.js';
import { initializeApp } from './core/app.js';
import { loadPlugins } from './core/pluginManager.js';

/**
 * Hide the loading screen with a fade-out animation
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      if (loadingScreen.parentNode) {
        loadingScreen.parentNode.removeChild(loadingScreen);
      }
    }, 500);
  } else {
    console.warn('Loading screen element not found');
  }
}

/**
 * Application entry point: sets up core systems, loads plugins, and initializes UI
 */
async function main() {
  try {
    console.log("Starting application...");
    
    // 1. Detect platform (mobile or desktop)
    const isMobile = detectPlatform();
    console.log('Platform detected:', isMobile ? 'Mobile' : 'Desktop');
    
    // 2. Initialize app core
    const app = await initializeApp();
    console.log('App core initialized successfully');
    
    // 3. Discover and load plugins (but don't activate any yet)
    const plugins = await loadPlugins();
    console.log('Loaded plugins:', plugins.map(p => p.name));
    
    // 4. Set up empty placeholder UI - this will be rebuilt when a plugin activates
    if (isMobile) {
      setupMobileUI(app.canvasManager);
      console.log('Initial mobile UI placeholder set up');
    } else {
      setupDesktopUI(app.canvasManager);
      console.log('Initial desktop UI placeholder set up');
    }
    
    // Hide loading screen now that initial UI is set up
    hideLoadingScreen();
    
    // 5. Start the render loop
    app.canvasManager.startRenderLoop();
    
    // 6. Enable debug mode if needed (optional)
    app.setDebugMode(true);
    
    // 7. Now activate the default plugin - UI will be rebuilt as part of activation
    if (plugins.length > 0) {
      const defaultPluginId = 'square'; // Default to square plugin for testing
      console.log('Activating default plugin:', defaultPluginId);
      
      // Allow a small delay for everything to settle
      setTimeout(() => {
        app.activatePlugin(defaultPluginId);
      }, 300);
    }
    
    console.log('Application started successfully');
    showNotification('Math Visualization Framework loaded successfully!', 2000);
  } catch (error) {
    console.error('Application failed to start:', error);
    
    // Hide loading screen in case of error
    hideLoadingScreen();
    
    // Show error message
    const errorMsg = document.createElement('div');
    errorMsg.textContent = `Error: ${error.message}`;
    errorMsg.style.color = 'red';
    errorMsg.style.position = 'absolute';
    errorMsg.style.top = '20px';
    errorMsg.style.left = '20px';
    errorMsg.style.padding = '10px';
    errorMsg.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    document.body.appendChild(errorMsg);
  }
}

// Start the application after page is loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log("DOM content loaded, starting application");
  main();
});
