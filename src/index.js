// src/index.js
// Application entry point with improved UI sequencing, THREE.js integration,
// and enhanced plugin lifecycle support

import { detectPlatform, showNotification } from './core/utils.js';
import { setupDesktopUI } from './ui/desktopUI.js';
import { setupMobileUI } from './ui/mobileUI.js';
import { initializeApp } from './core/app.js';
import { loadPlugins } from './core/pluginManager.js';

// Import CameraControls for proper initialization
import CameraControlsFactory from '../vendors/cameraControls3d/camera-controls.module.js';

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
 * Show error message on screen
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
  const errorMsg = document.createElement('div');
  errorMsg.textContent = message;
  errorMsg.style.color = 'red';
  errorMsg.style.position = 'absolute';
  errorMsg.style.top = '20px';
  errorMsg.style.left = '20px';
  errorMsg.style.padding = '10px';
  errorMsg.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  errorMsg.style.borderRadius = '5px';
  errorMsg.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
  errorMsg.style.maxWidth = '80%';
  errorMsg.style.zIndex = '10000';
  document.body.appendChild(errorMsg);
}

/**
 * Update loading screen message
 * @param {string} message - New message to display
 */
function updateLoadingMessage(message) {
  const loadingText = document.querySelector('.loading-text');
  if (loadingText) {
    loadingText.textContent = message;
  }
}

/**
 * Initialize 3D environment dependencies
 */
function initializeThreeDependencies() {
  // Verify THREE.js is available
  if (typeof THREE === 'undefined') {
    console.error('THREE.js is not defined. Required for 3D visualizations.');
    throw new Error('THREE.js is not available.');
  }
  
  // Initialize CameraControls with THREE
  try {
    CameraControlsFactory.install({ THREE: THREE });
    console.log('CameraControls initialized with THREE.js successfully');
  } catch (error) {
    console.error('Failed to initialize CameraControls:', error);
    throw error;
  }
}

/**
 * Application entry point: sets up core systems, loads plugins, and initializes UI
 */
async function main() {
  try {
    console.log("Starting application...");
    updateLoadingMessage("Initializing system...");
    
    // 0. Initialize 3D dependencies
    try {
      initializeThreeDependencies();
    } catch (error) {
      console.error("Failed to initialize THREE.js:", error);
      updateLoadingMessage("Failed to initialize 3D environment. 3D plugins will not be available.");
      // Don't throw - we can still continue with 2D plugins
    }
    
    // 1. Detect platform (mobile or desktop)
    const isMobile = detectPlatform();
    console.log('Platform detected:', isMobile ? 'Mobile' : 'Desktop');
    
    // 2. Initialize app core
    updateLoadingMessage("Initializing core framework...");
    const app = await initializeApp();
    console.log('App core initialized successfully');
    
    // 3. Discover and load plugins
    updateLoadingMessage("Loading plugins...");
    const plugins = await loadPlugins();
    console.log('Loaded plugins:', plugins.map(p => p.name));
    
    // 4. Set up empty placeholder UI - this will be rebuilt when a plugin activates
    updateLoadingMessage("Setting up user interface...");
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
    
    // 6. Enable or disable debug mode - set to false to disable debug
    const enableDebugMode = false; // Set this to true to enable debug mode, false to disable it
    app.setDebugMode(enableDebugMode);
    console.log(`Debug mode is ${enableDebugMode ? 'enabled' : 'disabled'}`);
    
    // 7. Check if we have any plugins that are ready to use
    const readyPlugins = plugins.filter(p => p.lifecycleState === 'ready');
    console.log(`${readyPlugins.length} plugins are ready for activation`);
    
    // 8. Activate the default plugin - UI will be rebuilt as part of activation
    if (readyPlugins.length > 0) {
      // Prefer square plugin if available, otherwise use first ready plugin
      const squarePlugin = readyPlugins.find(p => p.id === 'square');
      const defaultPluginId = squarePlugin ? 'square' : readyPlugins[0].id;
      
      console.log('Activating default plugin:', defaultPluginId);
      
      // Allow a small delay for everything to settle
      setTimeout(() => {
        app.activatePlugin(defaultPluginId);
      }, 300);
    } else if (plugins.length > 0) {
      // If no plugins are ready but some are initializing, show message
      const initializingPlugins = plugins.filter(p => p.lifecycleState === 'initializing');
      if (initializingPlugins.length > 0) {
        console.log(`Waiting for ${initializingPlugins.length} plugins to complete initialization`);
        showNotification('Some plugins are still initializing. They will become available shortly.', 3000);
      } else {
        console.warn('No ready plugins found');
        showNotification('No plugins are ready for use.', 3000);
      }
    } else {
      console.error('No plugins found');
      showErrorMessage('No plugins could be loaded. Check the console for details.');
    }
    
    console.log('Application started successfully');
    showNotification('Math Visualization Framework loaded successfully!', 2000);
  } catch (error) {
    console.error('Application failed to start:', error);
    
    // Hide loading screen in case of error
    hideLoadingScreen();
    
    // Show error message on screen
    showErrorMessage(`Error: ${error.message}`);
  }
}

// Wait for page load before starting
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', main);
} else {
  // DOM already loaded, start immediately
  main();
}
