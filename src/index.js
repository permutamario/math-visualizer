// src/index.js

import { AppCore } from './core/AppCore.js';
import { loadStyles } from './ui/styles.js';

/**
 * Initialize the application
 */
export async function main() {
  try {
    console.log("Initializing Math Visualization Framework...");
    
    // Load CSS styles
    loadStyles();
    
    // Show loading screen
    showLoadingScreen();
    
    // Create and initialize application core
    const app = new AppCore();
    await app.initialize();
    
    // Start the application
    await app.start();
    
    // Hide loading screen
    await new Promise(resolve => setTimeout(resolve, 2000));	//Show it off a little
    hideLoadingScreen();
    
    console.log("Math Visualization Framework initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Math Visualization Framework:", error);
    showErrorMessage(`Failed to initialize: ${error.message}`);
  }
}

/**
 * Show the loading screen
 */
function showLoadingScreen() {
  // Look for existing loading screen
  let loadingScreen = document.getElementById('loading-screen');
  
  if (!loadingScreen) {
    // Create loading screen
    loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    
    // Add title
    const title = document.createElement('h1');
    title.className = 'loading-title';
    title.textContent = 'Math Visualization Framework';
    loadingScreen.appendChild(title);
    
    // Add spinner
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    loadingScreen.appendChild(spinner);
    
    // Add loading text
    const loadingText = document.createElement('p');
    loadingText.className = 'loading-text';
    loadingText.textContent = 'Loading plugins...';
    loadingScreen.appendChild(loadingText);
    
    document.body.appendChild(loadingScreen);
  }
}

/**
 * Hide the loading screen
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
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
  // Hide loading screen
  hideLoadingScreen();
  
  // Create error message
  const errorElement = document.createElement('div');
  
  // Set styles
  Object.assign(errorElement.style, {
    position: 'fixed',
    top: '20px',
    left: '20px',
    padding: '15px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    zIndex: '10000',
    maxWidth: '80%',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
  });
  
  errorElement.textContent = message;
  document.body.appendChild(errorElement);
}

// Wait for DOM ready or start immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
