// src/ui/UIManager.js

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
    this.controls = {};
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
      this.layout.on('parameterChange', (parameterId, value) => {
        this.emit('parameterChange', parameterId, value);
      });
      
      this.layout.on('action', (actionId, ...args) => {
        this.emit('action', actionId, ...args);
      });
      
      this.layout.on('pluginSelect', (pluginId) => {
        this.emit('pluginSelect', pluginId);
      });
      
      // Listen for window resize
      window.addEventListener('resize', this._handleResize);
      
      // Set up theme handling if ColorSchemeManager is available
      if (this.core && this.core.colorSchemeManager) {
        // Apply initial theme
        this.updateTheme(this.core.colorSchemeManager.getActiveScheme());
        
        // Listen for theme changes
        this.core.events.on('colorSchemeChanged', this.updateTheme);
        
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
 * Build UI controls from parameter schema
 * @param {ParameterSchema} schema - Parameter schema
 * @param {Object} values - Current parameter values
 */
buildControlsFromSchema(schema, values) {
  try {
    // Build controls in the layout
    this.layout.buildControls(schema, values);
    
    // Only store schema reference, not values
    this.controls = { schema };
    
    console.log("UI controls built from schema");
  } catch (error) {
    console.error("Failed to build controls from schema:", error);
  }
}
  
/**
 * Update control values
 * @param {Object} values - New parameter values
 */
updateControls(values) {
  // Just update the layout controls without storing values
  if (this.layout) {
    this.layout.updateControls(values);
  }
}
  
  /**
   * Update available actions
   * @param {Array<Action>} actions - Available actions
   */
  updateActions(actions) {
    this.layout.updateActions(actions);
  }
  
  /**
   * Update available plugins
   * @param {Array<Object>} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  updatePlugins(plugins, activePluginId) {
    this.layout.updatePlugins(plugins, activePluginId);
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.layout.showError(message);
  }
  
  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  showNotification(message, duration = 3000) {
    this.layout.showNotification(message, duration);
  }
  
  /**
   * Show loading indicator
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    this.layout.showLoading(message);
  }
  
  /**
   * Hide loading indicator
   */
  hideLoading() {
    this.layout.hideLoading();
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
      
      // Clean up theme toggle buttons and fullscreen buttons before changing layout
      this._cleanupUI();
      
      // Layout needs to change
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
      this.layout.initialize();
      
      // Register layout event handlers
      this.layout.on('parameterChange', (parameterId, value) => {
        this.emit('parameterChange', parameterId, value);
      });
      
      this.layout.on('action', (actionId, ...args) => {
        this.emit('action', actionId, ...args);
      });
      
      this.layout.on('pluginSelect', (pluginId) => {
        this.emit('pluginSelect', pluginId);
      });
      
      // Rebuild controls
      if (this.controls.schema) {
        this.layout.buildControls(this.controls.schema, this.controls.values);
      }
      
      // Re-create theme toggle buttons after layout change
      this.createThemeToggleButtons();
      
      console.log(`Layout changed to ${this.isMobile ? 'mobile' : 'desktop'}`);
    } else {
      // Just notify layout of resize
      this.layout.handleResize();
    }
  }
  
  /**
   * Clean up UI elements that might cause duplicates
   * @private
   */
  _cleanupUI() {
    // Remove theme toggle buttons
    if (this.themeToggleButton && this.themeToggleButton.parentNode) {
      this.themeToggleButton.parentNode.removeChild(this.themeToggleButton);
      this.themeToggleButton = null;
    }
    
    if (this.mobileThemeToggleButton && this.mobileThemeToggleButton.parentNode) {
      this.mobileThemeToggleButton.parentNode.removeChild(this.mobileThemeToggleButton);
      this.mobileThemeToggleButton = null;
    }
    
    // Remove any fullscreen buttons
    const desktopFullscreenBtn = document.getElementById('desktop-fullscreen-button');
    if (desktopFullscreenBtn) {
      desktopFullscreenBtn.parentNode.removeChild(desktopFullscreenBtn);
    }
    
    const mobileFullscreenBtn = document.getElementById('mobile-fullscreen-button');
    if (mobileFullscreenBtn) {
      mobileFullscreenBtn.parentNode.removeChild(mobileFullscreenBtn);
    }
    
    // Remove any stray theme toggle buttons
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
   * Update the UI theme based on the color scheme
   * @param {Object} colorScheme - Color scheme to apply
   */
  updateTheme(colorScheme) {
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
      root.style.setProperty('--control-focus', isDark ? '#8ab4f8' : '#3367d6');
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
    const existingDesktopButtons = document.querySelectorAll('.theme-toggle');
    existingDesktopButtons.forEach(button => {
      if (button.parentNode) button.parentNode.removeChild(button);
    });
    
    const existingMobileButtons = document.querySelectorAll('.mobile-theme-toggle');
    existingMobileButtons.forEach(button => {
      if (button.parentNode) button.parentNode.removeChild(button);
    });
    
    // Get the current scheme
    const currentScheme = this.core.colorSchemeManager.getActiveScheme();
    
    // Create appropriate button based on layout type
    if (this.isMobile) {
      // Create mobile theme toggle only
      const mobileToggle = document.createElement('button');
      mobileToggle.className = 'mobile-theme-toggle';
      mobileToggle.setAttribute('aria-label', 'Toggle color scheme');
      mobileToggle.textContent = currentScheme.id === 'light' ? '🌙' : '☀️';
      
      // Add click handler
      mobileToggle.addEventListener('click', () => {
        const currentScheme = this.core.colorSchemeManager.getActiveScheme();
        const newScheme = currentScheme.id === 'light' ? 'dark' : 'light';
        this.core.colorSchemeManager.setActiveScheme(newScheme);
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
        const currentScheme = this.core.colorSchemeManager.getActiveScheme();
        const newScheme = currentScheme.id === 'light' ? 'dark' : 'light';
        this.core.colorSchemeManager.setActiveScheme(newScheme);
      });
      
      // Add to document
      document.body.appendChild(desktopToggle);
      this.themeToggleButton = desktopToggle;
    }
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
    this.controls = {};
    this.initialized = false;
    
    console.log("UI manager cleaned up");
  }
}