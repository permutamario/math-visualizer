// src/core/PluginController.js

/**
 * Class that manages the complete lifecycle of a plugin
 */
export class PluginController {
  /**
   * Create a new PluginController
   * @param {Object} plugin - Plugin definition object
   * @param {Object} core - Core framework APIs
   */
  constructor(plugin, core) {
    this.plugin = plugin;
    this.core = core;
    this.id = plugin.id;
    this.state = plugin.lifecycleState || 'registered'; // registered, initializing, ready, active, error
    this.settings = null;
    this.metadata = null;
    this.exportOptions = null;
    this.environmentType = null;
    this.resources = new Map(); // Resources created by the plugin
    this.isInitialized = false;
    
    // Log creation
    console.log(`Created PluginController for plugin: ${this.id}`);
  }

  /**
   * Initialize the plugin if not already initialized
   * @returns {Promise<PluginController>} This controller after initialization
   */
  async initialize() {
    if (this.isInitialized) {
      console.log(`Plugin ${this.id} already initialized`);
      return this;
    }
    
    try {
      console.log(`Initializing plugin: ${this.id}`);
      this.setState('initializing');
      
      // Create initialization context
      const core = {
        hooks: this.core.hooks,
        state: {
          getState: window.getState
        },
        lifecycle: {
          setPluginState: (state) => this.setState(state)
        }
      };
      
      // Call the plugin's init function
      const initResult = this.plugin.init(core);
      
      // If init returns a promise, wait for it
      if (initResult instanceof Promise) {
        await initResult;
      }
      
      // Wait for hooks to be registered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load default settings from manifest
      this.loadDefaultSettings();
      
      this.isInitialized = true;
      this.setState('ready');
      console.log(`Plugin ${this.id} initialized successfully`);
      return this;
    } catch (error) {
      console.error(`Error initializing plugin ${this.id}:`, error);
      this.setState('error');
      throw error;
    }
  }
  
  /**
   * Set the plugin state
   * @param {string} state - New state
   */
  setState(state) {
    if (this.state === state) return;
    
    console.log(`Changing plugin ${this.id} state: ${this.state} -> ${state}`);
    this.state = state;
    window.changeState(`plugins.${this.id}.lifecycleState`, state);
  }
  
  /**
   * Load default settings from plugin manifest
   */
  loadDefaultSettings() {
    if (this.plugin.manifest && this.plugin.manifest.defaultSettings) {
      this.settings = { ...this.plugin.manifest.defaultSettings };
      console.log(`Loaded default settings for plugin ${this.id}`);
    } else {
      this.settings = {};
      console.warn(`No default settings found for plugin ${this.id}`);
    }
  }
  
  /**
   * Fetch metadata from the plugin's hooks
   * @returns {Promise<Object>} Settings metadata
   */
  async fetchMetadata() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return new Promise((resolve) => {
      // First attempt to get metadata
      let metadata = this.core.hooks.applyFilters('settingsMetadata', {}, this.id);
      
      if (metadata && Object.keys(metadata).length > 0) {
        console.log(`Got metadata for plugin ${this.id} on first attempt`);
        this.metadata = metadata;
        resolve(metadata);
        return;
      }
      
      console.log(`Polling for metadata for plugin ${this.id}`);
      
      // If no metadata yet, poll a few times
      let attempts = 0;
      const maxAttempts = 5;
      const interval = setInterval(() => {
        attempts++;
        metadata = this.core.hooks.applyFilters('settingsMetadata', {}, this.id);
        
        if (metadata && Object.keys(metadata).length > 0) {
          clearInterval(interval);
          console.log(`Got metadata for plugin ${this.id} after ${attempts} attempts`);
          this.metadata = metadata;
          resolve(metadata);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          console.warn(`No metadata found for plugin ${this.id} after ${maxAttempts} attempts`);
          this.metadata = {};
          resolve({});
        }
      }, 100);
    });
  }
  
  /**
   * Fetch export options from the plugin's hooks
   * @returns {Promise<Array>} Export options
   */
  async fetchExportOptions() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const exportOptions = this.core.hooks.applyFilters('exportOptions', [], this.id);
    this.exportOptions = exportOptions;
    console.log(`Fetched ${exportOptions.length} export options for plugin ${this.id}`);
    return exportOptions;
  }
  
  /**
   * Setup the appropriate environment for the plugin
   * @returns {Promise<boolean>} Success status
   */
  async setupEnvironment() {
    // Get environment requirements from plugin manifest
    this.environmentType = this.plugin.manifest?.environment?.type || '2d-camera';
    const environmentOptions = this.plugin.manifest?.environment?.options || {};
    
    console.log(`Setting up ${this.environmentType} environment for plugin ${this.id}`);
    
    // Set up the environment in canvas manager
    if (this.core.canvasManager) {
      return this.core.canvasManager.setupEnvironment(this.environmentType, environmentOptions);
    }
    
    return false;
  }
  
  /**
   * Activate the plugin
   * @returns {Promise<boolean>} Success status
   */
  async activate() {
    try {
      console.log(`Activating plugin: ${this.id}`);
      
      // Ensure plugin is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Fetch metadata and export options in parallel
      const [metadata, exportOptions] = await Promise.all([
        this.fetchMetadata(),
        this.fetchExportOptions()
      ]);
      
      // Setup environment for plugin
      await this.setupEnvironment();
      
      // Apply state changes
      console.log(`Applying state changes for plugin ${this.id}`);
      window.changeState('settings', this.settings);
      window.changeState('settingsMetadata', metadata);
      window.changeState('exportOptions', exportOptions);
      window.changeState('activePluginId', this.id);
      
      // Notify the plugin it's being activated
      this.core.hooks.doAction('activatePlugin', { pluginId: this.id });
      
      // Update state
      this.setState('active');
      
      // Trigger plugin activation event
      window.changeState('pluginActivated', { pluginId: this.id });
      
      // Request render with a small delay to allow UI to update
      setTimeout(() => {
        if (this.core.canvasManager) {
          this.core.canvasManager.render();
        }
      }, 50);
      
      console.log(`Plugin ${this.id} activated successfully`);
      return true;
    } catch (error) {
      console.error(`Error activating plugin ${this.id}:`, error);
      this.setState('error');
      return false;
    }
  }
  
  /**
   * Deactivate the plugin
   * @returns {Promise<boolean>} Success status
   */
  async deactivate() {
    try {
      console.log(`Deactivating plugin: ${this.id}`);
      
      // Notify the plugin it's being deactivated
      this.core.hooks.doAction('deactivatePlugin', { pluginId: this.id });
      
      // Clean up resources
      this.cleanupResources();
      
      // Update state
      this.setState('ready');
      
      console.log(`Plugin ${this.id} deactivated successfully`);
      return true;
    } catch (error) {
      console.error(`Error deactivating plugin ${this.id}:`, error);
      return false;
    }
  }
  
  /**
   * Clean up resources created by the plugin
   */
  cleanupResources() {
    // Clean up any resources stored in the resources map
    this.resources.forEach((resource, id) => {
      console.log(`Cleaning up resource: ${id}`);
      if (resource && typeof resource.dispose === 'function') {
        resource.dispose();
      }
    });
    
    this.resources.clear();
  }
  
  /**
   * Update a plugin setting
   * @param {string} path - Setting path
   * @param {*} value - New value
   */
  updateSetting(path, value) {
    // Update the local settings object
    const keys = path.split('.');
    let current = this.settings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    // Notify the plugin about the setting change
    this.core.hooks.doAction('onSettingChanged', { 
      path, 
      value, 
      pluginId: this.id 
    });
  }
  
  /**
   * Reset plugin settings to defaults
   */
  resetSettings() {
    if (this.plugin.manifest && this.plugin.manifest.defaultSettings) {
      this.settings = { ...this.plugin.manifest.defaultSettings };
      window.changeState('settings', this.settings);
      window.changeState('settingsReset', { pluginId: this.id });
    }
  }
  
  /**
   * Register a resource created by the plugin for later cleanup
   * @param {string} id - Resource identifier
   * @param {Object} resource - Resource object
   */
  registerResource(id, resource) {
    this.resources.set(id, resource);
  }
}
