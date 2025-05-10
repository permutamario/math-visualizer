// src/core/PluginController.js

/**
 * Class that manages the complete lifecycle of a plugin using the manifest-based approach
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
    this.state = 'registered'; // registered, active, inactive
    this.settings = null;
    this.metadata = null;
    this.exportOptions = null;
    this.environmentType = null;
    this.resources = new Map(); // Resources created by the plugin
    this.implementation = {};
    
    // Load manifest if available
    this.manifest = plugin.manifest || {};
    
    // Initialize with default settings from manifest
    this.loadDefaultSettings();
    
    // Log creation
    console.log(`Created PluginController for plugin: ${this.id}`);
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
    if (this.manifest && this.manifest.defaultSettings) {
      this.settings = { ...this.manifest.defaultSettings };
      console.log(`Loaded default settings for plugin ${this.id}`);
    } else {
      this.settings = {};
      console.warn(`No default settings found for plugin ${this.id}`);
    }
  }
  
  /**
   * Fetch metadata from the plugin's manifest or hooks
   * @returns {Promise<Object>} Settings metadata
   */
  async fetchMetadata() {
    // First try to get metadata from the manifest
    if (this.manifest && this.manifest.settingsMetadata) {
      console.log(`Using metadata from manifest for plugin ${this.id}`);
      this.metadata = this.manifest.settingsMetadata;
      return this.metadata;
    }
    
    // If not in manifest, try to get from hooks
    return new Promise((resolve) => {
      let metadata = this.core.hooks.applyFilters('settingsMetadata', {}, this.id);
      
      if (metadata && Object.keys(metadata).length > 0) {
        console.log(`Got metadata for plugin ${this.id} via hooks`);
        this.metadata = metadata;
        resolve(metadata);
        return;
      }
      
      console.log(`No metadata found for plugin ${this.id}`);
      this.metadata = {};
      resolve({});
    });
  }
  
  /**
   * Fetch export options from the plugin's manifest or hooks
   * @returns {Promise<Array>} Export options
   */
  async fetchExportOptions() {
    // First try to get export options from manifest
    if (this.manifest && this.manifest.exportOptions) {
      console.log(`Using export options from manifest for plugin ${this.id}`);
      this.exportOptions = this.manifest.exportOptions;
      return this.exportOptions;
    }
    
    // If not in manifest, try to get from hooks
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
    this.environmentType = this.manifest?.environment?.type || '2d-camera';
    const environmentOptions = this.manifest?.environment?.options || {};
    
    console.log(`Setting up ${this.environmentType} environment for plugin ${this.id}`);
    
    // Set up the environment in canvas manager
    if (this.core.canvasManager) {
      return this.core.canvasManager.setupEnvironment(this.environmentType, environmentOptions);
    }
    
    return false;
  }
  
  /**
   * Register hooks from manifest
   */
  registerHooksFromManifest() {
    if (!this.manifest.hooks) return;
    
    // Register render hook
    if (this.manifest.hooks.render && this.implementation[this.manifest.hooks.render]) {
      this.core.hooks.addAction('render', this.id, this.implementation[this.manifest.hooks.render], 10);
    }
    
    // Register beforeRender hook
    if (this.manifest.hooks.beforeRender && this.implementation[this.manifest.hooks.beforeRender]) {
      this.core.hooks.addAction('beforeRender', this.id, this.implementation[this.manifest.hooks.beforeRender], 10);
    }
    
    // Register afterRender hook
    if (this.manifest.hooks.afterRender && this.implementation[this.manifest.hooks.afterRender]) {
      this.core.hooks.addAction('afterRender', this.id, this.implementation[this.manifest.hooks.afterRender], 10);
    }
    
    // Register settingChanged hook
    if (this.manifest.hooks.settingChanged && this.implementation[this.manifest.hooks.settingChanged]) {
      this.core.hooks.addAction('onSettingChanged', this.id, this.implementation[this.manifest.hooks.settingChanged], 10);
    }
    
    // Register mouse events if provided
    if (this.manifest.hooks.mouseEvents) {
      const mouseEvents = this.manifest.hooks.mouseEvents;
      
      if (mouseEvents.click && this.implementation[mouseEvents.click]) {
        this.core.hooks.addAction('onClick', this.id, this.implementation[mouseEvents.click], 10);
      }
      
      if (mouseEvents.mousemove && this.implementation[mouseEvents.mousemove]) {
        this.core.hooks.addAction('onMouseMove', this.id, this.implementation[mouseEvents.mousemove], 10);
      }
      
      if (mouseEvents.mousedown && this.implementation[mouseEvents.mousedown]) {
        this.core.hooks.addAction('onMouseDown', this.id, this.implementation[mouseEvents.mousedown], 10);
      }
      
      if (mouseEvents.mouseup && this.implementation[mouseEvents.mouseup]) {
        this.core.hooks.addAction('onMouseUp', this.id, this.implementation[mouseEvents.mouseup], 10);
      }
    }
    
    // Register any other hooks defined in the manifest
    const otherHooks = Object.entries(this.manifest.hooks).filter(([key]) => 
      !['render', 'beforeRender', 'afterRender', 'settingChanged', 'mouseEvents'].includes(key));
    
    otherHooks.forEach(([hookName, functionName]) => {
      if (this.implementation[functionName]) {
        this.core.hooks.addAction(hookName, this.id, this.implementation[functionName], 10);
      }
    });
  }
  
  /**
   * Activate the plugin
   * @returns {Promise<boolean>} Success status
   */
  async activate() {
    try {
      console.log(`Activating plugin: ${this.id}`);
      
      // Set activation state
      this.setState('active');
      
      // Create implementation from plugin.init if needed
      if (typeof this.plugin.init === 'function' && Object.keys(this.implementation).length === 0) {
        const core = {
          hooks: this.core.hooks,
          state: {
            getState: window.getState
          }
        };
        
        // Call the plugin's init function to get implementation
        const implementation = this.plugin.init(core);
        
        if (implementation) {
          this.implementation = implementation;
        }
      }
      
      // Register hooks from manifest if available
      this.registerHooksFromManifest();
      
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
      
      // Call onActivate from manifest if available
      if (this.manifest.hooks?.activate && this.implementation[this.manifest.hooks.activate]) {
        this.implementation[this.manifest.hooks.activate]();
      }
      
      // Notify the plugin it's being activated through hooks for backwards compatibility
      this.core.hooks.doAction('activatePlugin', { pluginId: this.id });
      
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
      this.setState('inactive');
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
      
      // Call onDeactivate from manifest if available
      if (this.manifest.hooks?.deactivate && this.implementation[this.manifest.hooks.deactivate]) {
        this.implementation[this.manifest.hooks.deactivate]();
      }
      
      // Notify the plugin it's being deactivated through hooks for backwards compatibility
      this.core.hooks.doAction('deactivatePlugin', { pluginId: this.id });
      
      // Clean up resources
      this.cleanupResources();
      
      // Update state
      this.setState('inactive');
      
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
    
    // Notify using the manifest hook if available
    if (this.manifest.hooks?.settingChanged && this.implementation[this.manifest.hooks.settingChanged]) {
      this.implementation[this.manifest.hooks.settingChanged](path, value);
    }
    
    // Notify the plugin about the setting change through hooks for backwards compatibility
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
    if (this.manifest && this.manifest.defaultSettings) {
      this.settings = { ...this.manifest.defaultSettings };
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
