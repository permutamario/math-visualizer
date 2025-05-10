// src/index.js
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
    console.log('CameraControls initialized with THREE.js');
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
    console.log("Starting application with Plugin Controller Registry");
    updateLoadingMessage("Initializing system...");
    
    // 0. Initialize 3D dependencies
    try {
      initializeThreeDependencies();
    } catch (error) {
      console.error("Failed to initialize THREE.js:", error);
      updateLoadingMessage("Failed to initialize 3D environment. 3D plugins will not be available.");
    }
    
    // 1. Detect platform (mobile or desktop)
    const isMobile = detectPlatform();
    
    // 2. Initialize app core
    updateLoadingMessage("Initializing core framework...");
    const app = await initializeApp();
    
    // 3. Discover and register all available plugins with the registry
    updateLoadingMessage("Registering plugins with registry...");
    const plugins = await loadPlugins();
    
    // 4. Set up empty placeholder UI - this will be rebuilt when a plugin activates
    updateLoadingMessage("Setting up user interface...");
    if (isMobile) {
      setupMobileUI(app.canvasManager);
    } else {
      setupDesktopUI(app.canvasManager);
    }
    
    // 5. Start the render loop
    app.canvasManager.startRenderLoop();
    
    // 6. Enable or disable debug mode
    const enableDebugMode = false;
    app.setDebugMode(enableDebugMode);
    
    // 7. Initialize and activate the default plugin
    const defaultPluginId = 'square';
    
    updateLoadingMessage(`Activating default plugin: ${defaultPluginId}...`);
    
    // Hide loading screen now that plugin is initialized
    hideLoadingScreen();
    
    // Activate the default plugin through the registry
    setTimeout(async () => {
      await app.activatePlugin(defaultPluginId);
      showNotification('Math Visualization Framework loaded successfully!', 2000);
    }, 100);
    
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
