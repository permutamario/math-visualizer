// src/ui/UIManager.js - Improved version

import { EventEmitter } from '../core/EventEmitter.js';
import { UIBuilder } from './UIBuilder.js';
import { DesktopLayout } from './DesktopLayout.js';
import { MobileLayout } from './MobileLayout.js';
import { applyThemeColors } from './styles.js';

/**
 * Manages UI creation and event handling
 */
export class UIManager extends EventEmitter {
  /**
   * Create a new UIManager
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    super();
    this.core = core;
    this.uiBuilder = new UIBuilder();
    this.layout = null;
    this.parameterGroups = {
      plugin: { schema: [], values: {} },
      visualization: { schema: [], values: {} },
      advanced: { schema: [], values: {} }
    };
    this.initialized = false;
    
    // Determine if using mobile layout
    this.isMobile = this._detectMobile();
    
    // References to theme toggle buttons
    this.themeToggleButton = null;
    this.mobileThemeToggleButton = null;
    
    // Bind methods
    this.updateTheme = this.updateTheme.bind(this);
    this._handleResize = this._handleResize.bind(this);
  }
  
 // Add this method to handle action events from the layout
/**
 * Initialize the UIManager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async initialize() {
  if (this.initialized) return true;
  
  try {
    // Create appropriate layout
    if (this.isMobile) {
      this.layout = new MobileLayout(this);
    } else {
      this.layout = new DesktopLayout(this);
    }
    
    // Initialize the layout
    await this.layout.initialize();
    
    // Register layout event handlers
    this._registerLayoutEvents();
    
    // Listen for window resize
    window.addEventListener('resize', this._handleResize);
    
    // Set up theme handling if ColorSchemeManager is available
    if (this.core && this.core.colorSchemeManager) {
      // Apply initial theme
      this.updateTheme(this.core.colorSchemeManager.getActiveScheme());
      
      // Listen for theme changes
      this.core.events.on('colorSchemeChanged', this.updateTheme);
      
      // Subscribe to action changes
      this.core.events.on('actionsChanged', this.updateActions.bind(this));
      
      // Create theme toggle buttons
      this.createThemeToggleButtons();
    }
    
    this.initialized = true;
    console.log(`UI manager initialized with ${this.isMobile ? 'mobile' : 'desktop'} layout`);
    return true;
  } catch (error) {
    console.error("Failed to initialize UI manager:", error);
    return false;
  }
}
  
  /**
   * Update UI with parameter groups
   * @param {Object} parameterData - Parameter group data
   * @param {Object} parameterData.pluginParameters - Plugin parameters
   * @param {Object} parameterData.visualizationParameters - Visualization parameters 
   * @param {Object} parameterData.advancedParameters - Advanced parameters
   * @param {boolean} rebuild - Whether to rebuild the entire UI
   */
  updatePluginParameterGroups(parameterData, rebuild = false) {
    try {
      // Validate parameter data
      if (!parameterData) {
        console.warn("Invalid parameter data provided to updatePluginParameterGroups");
        return;
      }
      
      // Store parameter groups
      if (parameterData.pluginParameters) {
        this.parameterGroups.plugin = parameterData.pluginParameters;
      }
      
      if (parameterData.visualizationParameters) {
        this.parameterGroups.visualization = parameterData.visualizationParameters;
      }
      
      if (parameterData.advancedParameters) {
        this.parameterGroups.advanced = parameterData.advancedParameters;
      }
      
      // Update the layout with parameter groups
      if (this.layout && typeof this.layout.updateParameterGroups === 'function') {
        this.layout.updateParameterGroups(this.parameterGroups, rebuild);
      }
    } catch (error) {
      console.error("Failed to update parameter groups:", error);
    }
  }
  
  /**
   * Update a single parameter value without rebuilding UI
   * @param {string} parameterId - Parameter ID
   * @param {any} value - Parameter value
   * @param {string} group - Parameter group ('plugin', 'visualization', or 'advanced')
   */
  updateParameterValue(parameterId, value, group) {
    try {
      // Find which group this parameter belongs to if not specified
      if (!group) {
        if (this.parameterGroups.plugin.values.hasOwnProperty(parameterId)) {
          group = 'plugin';
        } else if (this.parameterGroups.visualization.values.hasOwnProperty(parameterId)) {
          group = 'visualization';
        } else if (this.parameterGroups.advanced.values.hasOwnProperty(parameterId)) {
          group = 'advanced';
        }
      }
      
      // Update the parameter value
      if (group && this.parameterGroups[group]) {
        this.parameterGroups[group].values[parameterId] = value;
        
        // Update the control in the layout
        if (this.layout && typeof this.layout.updateParameterValue === 'function') {
          this.layout.updateParameterValue(parameterId, value, group);
        }
      }
    } catch (error) {
      console.error(`Failed to update parameter value for ${parameterId}:`, error);
    }
  }
  
  
  
  /**
   * Update available actions
   * @param {Array<Action>} actions - Available actions
   */
  /**
 * Update available actions
 * @param {Array<Object>} actions - Available actions
 */
updateActions(actions) {
  try {
    if (!this.layout || typeof this.layout.updateActions !== 'function') {
      return;
    }

    // Pass the actions directly to the layout
    this.layout.updateActions(actions || []);
  } catch (error) {
    console.error("Failed to update actions:", error);
  }
}
  
  /**
   * Update available plugins
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePlugins(plugins, activePluginId) {
    if (this.layout && typeof this.layout.updatePlugins === 'function') {
      this.layout.updatePlugins(plugins || [], activePluginId);
    }
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    if (this.layout && typeof this.layout.showError === 'function') {
      this.layout.showError(message);
    } else {
      console.error("UI Error:", message);
    }
  }
  
  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  showNotification(message, duration = 3000) {
    if (this.layout && typeof this.layout.showNotification === 'function') {
      this.layout.showNotification(message, duration);
    } else {
      console.log("UI Notification:", message);
    }
  }
  
  /**
   * Show loading indicator
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    if (this.layout && typeof this.layout.showLoading === 'function') {
      this.layout.showLoading(message);
    }
  }
  
  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.layout && typeof this.layout.hideLoading === 'function') {
      this.layout.hideLoading();
    }
  }
  
  /**
   * Detect if using mobile device
   * @returns {boolean} Whether using mobile device
   * @private
   */
  _detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth < 768;
  }
  
  /**
   * Handle window resize
   * @private
   */
  _handleResize() {
    // Check if layout should change
    const isMobileNow = this._detectMobile();
    
    if (isMobileNow !== this.isMobile) {
      console.log(`Layout changing from ${this.isMobile ? 'mobile' : 'desktop'} to ${isMobileNow ? 'mobile' : 'desktop'}`);
      
      // Clean up any global elements before changing layout
      this._cleanupUI();
      
      // Update flag
      this.isMobile = isMobileNow;
      
      // Clean up old layout
      if (this.layout) {
        this.layout.dispose();
      }
      
      // Create new layout
      if (this.isMobile) {
        this.layout = new MobileLayout(this);
      } else {
        this.layout = new DesktopLayout(this);
      }
      
      // Initialize new layout
      this.layout.initialize().then(() => {
        // Register layout event handlers
        this._registerLayoutEvents();
        
        // Rebuild controls with stored parameter groups
        if (this.layout && typeof this.layout.updateParameterGroups === 'function') {
          this.layout.updateParameterGroups(this.parameterGroups, true);
        }
        
        console.log(`Layout changed to ${this.isMobile ? 'mobile' : 'desktop'}`);
      }).catch(error => {
        console.error("Failed to initialize new layout:", error);
      });
      
    } else {
      // Just notify layout of resize
      if (this.layout && typeof this.layout.handleResize === 'function') {
        this.layout.handleResize();
      }
    }
  }

  
  /**
 * Register event handlers for the layout
 * @private
 *//**
 * Register event handlers for the layout
 * @private
 */
_registerLayoutEvents() {
  if (!this.layout) return;
  
  // Remove all existing listeners first
  this.layout.removeAllListeners();
  
  // Register standard events
  this.layout.on('parameterChange', (parameterId, value, group) => {
    this.emit('parameterChange', parameterId, value, group);
  });
  
  // Updated action handling to use core.executeAction
  this.layout.on('action', (actionId, ...args) => {
    if (this.core && typeof this.core.executeAction === 'function') {
      this.core.executeAction(actionId, ...args);
    } else {
      this.emit('action', actionId, ...args); // Fallback to emitting event
    }
  });
  
  // Add handler for plugin selection events
  this.layout.on('pluginSelect', (pluginId) => {
    // Forward to the AppCore to load the plugin
    if (this.core && typeof this.core.loadPlugin === 'function') {
      this.core.loadPlugin(pluginId);
    } else {
      this.emit('pluginSelect', pluginId); // Fallback to emitting event
    }
  });
}

  /**
   * Clean up UI elements that might cause duplicates
   * @private
   */
  _cleanupUI() {
    // Remove theme toggle buttons
    const existingDesktopButtons = document.querySelectorAll('.theme-toggle');
    existingDesktopButtons.forEach(button => {
      if (button.parentNode) button.parentNode.removeChild(button);
    });
    
    const existingMobileButtons = document.querySelectorAll('.mobile-theme-toggle');
    existingMobileButtons.forEach(button => {
      if (button.parentNode) button.parentNode.removeChild(button);
    });
    
    // Remove any fullscreen buttons
    const desktopFullscreenBtn = document.getElementById('desktop-fullscreen-button');
    if (desktopFullscreenBtn && desktopFullscreenBtn.parentNode) {
      desktopFullscreenBtn.parentNode.removeChild(desktopFullscreenBtn);
    }
    
    const mobileFullscreenBtn = document.getElementById('mobile-fullscreen-button');
    if (mobileFullscreenBtn && mobileFullscreenBtn.parentNode) {
      mobileFullscreenBtn.parentNode.removeChild(mobileFullscreenBtn);
    }
  }
  
  /**
   * Update the UI theme based on the color scheme
   * @param {Object} colorScheme - Color scheme to apply
   */
  updateTheme(colorScheme) {
    if (!colorScheme) return;
    
    // Apply theme colors using the utility function
    if (typeof applyThemeColors === 'function') {
      applyThemeColors(colorScheme);
    } else {
      // Fallback implementation if the utility function is not available
      const root = document.documentElement;
      
      root.style.setProperty('--background-color', colorScheme.background);
      root.style.setProperty('--text-color', colorScheme.text);
      root.style.setProperty('--accent-color', colorScheme.accent);
      
      // Set other properties based on the theme
      const isDark = colorScheme.id === 'dark';
      root.style.setProperty('--background-secondary', isDark ? '#2a2a2a' : '#ffffff');
      root.style.setProperty('--text-secondary', isDark ? '#b0b0b0' : '#666666');
      root.style.setProperty('--border-color', isDark ? '#444444' : '#e0e0e0');
      root.style.setProperty('--control-bg', isDark ? '#333333' : '#ffffff');
      root.style.setProperty('--control-border', isDark ? '#555555' : '#cccccc');
      root.style.setProperty('--control-active', isDark ? '#3c4043' : '#e8f0fe');
      root.style.setProperty('--control-focus', colorScheme.accent);
      root.style.setProperty('--error-color', isDark ? '#f28b82' : '#d93025');
      root.style.setProperty('--success-color', isDark ? '#81c995' : '#0f9d58');
      root.style.setProperty('--warning-color', isDark ? '#fdd663' : '#f29900');
      root.style.setProperty('--info-color', isDark ? '#8ab4f8' : '#4285f4');
      root.style.setProperty('--overlay-bg', isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)');
      root.style.setProperty('--overlay-light', isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--modal-bg', isDark ? 'rgba(42, 42, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)');
    }
    
    // Update the theme toggle button text if it exists
    this.updateThemeToggleButton(colorScheme.id);
    
    // Update data-theme attribute on body
    document.body.setAttribute('data-theme', colorScheme.id);
  }

  /**
   * Create theme toggle buttons
   */
  createThemeToggleButtons() {
    // Only create if we have a ColorSchemeManager
    if (!this.core || !this.core.colorSchemeManager) {
      return;
    }
    
    // Clean up existing buttons first
    if (this.themeToggleButton && this.themeToggleButton.parentNode) {
      this.themeToggleButton.parentNode.removeChild(this.themeToggleButton);
      this.themeToggleButton = null;
    }
    
    if (this.mobileThemeToggleButton && this.mobileThemeToggleButton.parentNode) {
      this.mobileThemeToggleButton.parentNode.removeChild(this.mobileThemeToggleButton);
      this.mobileThemeToggleButton = null;
    }
    
    // Ensure no stray buttons exist
    this._cleanupThemeButtons();
    
    // Get the current scheme
    const currentScheme = this.core.colorSchemeManager.getActiveScheme();
    if (!currentScheme) return;
    
    // Create appropriate button based on layout type
    if (this.isMobile) {
      // Create mobile theme toggle only
      const mobileToggle = document.createElement('button');
      mobileToggle.className = 'mobile-theme-toggle';
      mobileToggle.setAttribute('aria-label', 'Toggle color scheme');
      mobileToggle.textContent = currentScheme.id === 'light' ? '🌙' : '☀️';
      
      // Add click handler
      mobileToggle.addEventListener('click', () => {
        this.emit('action', 'toggle-theme');
      });
      
      // Add to document
      document.body.appendChild(mobileToggle);
      this.mobileThemeToggleButton = mobileToggle;
    } else {
      // Create desktop theme toggle only
      const desktopToggle = document.createElement('button');
      desktopToggle.className = 'theme-toggle';
      desktopToggle.setAttribute('aria-label', 'Toggle color scheme');
      desktopToggle.textContent = currentScheme.id === 'light' ? '🌙' : '☀️';
      
      // Add click handler
      desktopToggle.addEventListener('click', () => {
        this.emit('action', 'toggle-theme');
      });
      
      // Add to document
      document.body.appendChild(desktopToggle);
      this.themeToggleButton = desktopToggle;
    }
  }

  /**
   * Clean up existing theme buttons
   * @private
   */
  _cleanupThemeButtons() {
    const existingDesktopButtons = document.querySelectorAll('.theme-toggle');
    existingDesktopButtons.forEach(button => {
      if (button.parentNode) button.parentNode.removeChild(button);
    });
    
    const existingMobileButtons = document.querySelectorAll('.mobile-theme-toggle');
    existingMobileButtons.forEach(button => {
      if (button.parentNode) button.parentNode.removeChild(button);
    });
  }

  /**
   * Update theme toggle button text
   * @param {string} schemeId - Current color scheme ID
   */
  updateThemeToggleButton(schemeId) {
    if (this.themeToggleButton) {
      this.themeToggleButton.textContent = schemeId === 'light' ? '🌙' : '☀️';
    }
    
    if (this.mobileThemeToggleButton) {
      this.mobileThemeToggleButton.textContent = schemeId === 'light' ? '🌙' : '☀️';
    }
  }
  
  /**
   * Clean up resources when the UI manager is no longer needed
   */
  cleanup() {
    // Clean up UI elements that might cause duplicates
    this._cleanupUI();
    
    // Remove event listeners
    window.removeEventListener('resize', this._handleResize);
    
    if (this.core && this.core.events) {
      this.core.events.off('colorSchemeChanged', this.updateTheme);
    }
    
    // Clean up layout
    if (this.layout) {
      this.layout.dispose();
      this.layout = null;
    }
    
    // Reset state
    this.parameterGroups = {
      plugin: { schema: [], values: {} },
      visualization: { schema: [], values: {} },
      advanced: { schema: [], values: {} }
    };
    this.initialized = false;
    this.themeToggleButton = null;
    this.mobileThemeToggleButton = null;
    
    console.log("UI manager cleaned up");
  }
}