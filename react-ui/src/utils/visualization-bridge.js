// This file creates a bridge between React and your visualization engine

// Import your AppCore class from the parent directory
// Note: You might need to adjust the path depending on your project structure
import { AppCore } from '../../src/core/AppCore';

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
    return this.core.getAvailablePlugins();
  }

  getParameters(group) {
    if (!this.core) return { schema: [], values: {} };
    return this.core.getParameterGroup(group);
  }

  setParameter(id, value, group) {
    if (!this.core) return;
    this.core.setParameter(id, value, group);
  }

  executeAction(actionId) {
    if (!this.core) return;
    this.core.executeAction(actionId);
  }

  getActions() {
    if (!this.core) return [];
    return this.core.getActions();
  }

  // Add more methods as needed to interact with your engine
}

// Export a singleton instance
export default new VisualizationBridge();
