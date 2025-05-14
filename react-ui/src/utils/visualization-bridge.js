// react-ui/src/utils/visualization-bridge.js

// Change from:
import { AppCore } from '../../src/core/AppCore.js';

// To:
//import { AppCore } from '@core/AppCore';

class VisualizationBridge {
  constructor() {
    this.core = null;
    this.initialized = false;
  }

  initialize(containerElement) {
    if (this.initialized) return Promise.resolve(this.core);

    this.core = new AppCore();
    return this.core.initialize(containerElement)
      .then(() => {
        this.initialized = true;
        return this.core;
      });
  }

  loadPlugin(pluginId) {
    if (!this.core) return Promise.reject(new Error('Core not initialized'));
    return this.core.loadPlugin(pluginId);
  }

  getPlugins() {
    if (!this.core) return [];
    return this.core.availablePlugins || [];
  }

  getParameters(group) {
    if (!this.core) return { schema: [], values: {} };
    
    // Return the requested parameter group
    switch(group) {
      case 'visual':
        return this.core.visualParameters || { schema: [], values: {} };
      case 'structural':
        return this.core.structuralParameters || { schema: [], values: {} };
      case 'advanced':
        return this.core.advancedParameters || { schema: [], values: {} };
      default:
        return { schema: [], values: {} };
    }
  }

  setParameter(id, value, group) {
    if (!this.core) return false;
    return this.core.changeParameter(id, value, group);
  }

  executeAction(actionId) {
    if (!this.core) return false;
    return this.core.executeAction(actionId);
  }

  getActions() {
    if (!this.core) return [];
    return this.core.getActions();
  }
}

// Export a singleton instance
export default new VisualizationBridge();
