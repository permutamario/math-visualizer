// src/plugins/example2d-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { createParameters } from '../../ui/ParameterBuilder.js';
import { BasicVisualization } from './BasicVisualization.js';
import { AdvancedVisualization } from './AdvancedVisualization.js';
import { WaveVisualization } from './WaveVisualization.js';

export default class Example2DPlugin extends Plugin {
  static id = "example2d-plugin";
  static name = "Example 2D Plugin";
  static description = "A comprehensive example showcasing the plugin system";
  static renderingType = "2d";

  constructor(core) {
    super(core);
    
    // Define available visualization types
    this.visualizationTypes = [
      {
        id: 'basic',
        name: 'Basic Shape',
        class: BasicVisualization
      },
      {
        id: 'advanced',
        name: 'Advanced Pattern',
        class: AdvancedVisualization
      },
      {
        id: 'wave',
        name: 'Wave Animation',
        class: WaveVisualization
      }
    ];
  }

  /**
   * Define plugin-level parameters that affect all visualizations
   * @returns {Array} Array of parameter definitions
   */
  definePluginParameters() {
    // Define only global parameters that affect all visualizations
    // Note: We don't include visualizationType here as it will be automatically
    // added by the framework's giveParameters() method
    return createParameters()
      .addCheckbox('showBoundingBox', 'Show Bounding Box', false)
      .addSlider('globalScale', 'Global Scale', 1.0, { min: 0.5, max: 2.0, step: 0.1 })
      .build();
  }
  
  /**
   * Define advanced parameters
   * @returns {Array} Array of parameter definitions
   */
  defineAdvancedParameters() {
    return createParameters()
      .addDropdown('renderQuality', 'Render Quality', 'medium', [
        { value: 'low', label: 'Low (Fast)' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High (Quality)' }
      ])
      .addCheckbox('debugMode', 'Debug Mode', false)
      .addNumber('seed', 'Random Seed', 42, { min: 0, max: 1000, step: 1 })
      .build();
  }

  /**
   * Define available actions
   * @returns {Array<Action>} List of available actions
   */
  defineActions() {
    return [
      ...super.defineActions(), // Include default actions (export, reset)
      {
        id: 'reset-view',
        label: 'Reset View'
      },
      {
        id: 'toggle-animation',
        label: 'Toggle Animation'
      },
      {
        id: 'randomize-colors',
        label: 'Randomize Colors'
      }
    ];
  }

  /**
   * Load the plugin
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      console.log("Loading Example2D plugin...");
      
      // Initialize default visualization
      await this._initializeDefaultVisualization();
      
      // Mark as loaded
      this.isLoaded = true;
      
      // Give parameters to UI
      this.giveParameters(true);
      
      // Update actions
      if (this.core && this.core.uiManager) {
        const actions = this.defineActions();
        this.core.uiManager.updateActions(actions);
      }
      
      console.log("Example2D plugin loaded successfully");
      return true;
    } catch (error) {
      console.error(`Error loading Example2DPlugin:`, error);
      
      // Ensure clean state on failure
      await this.unload();
      return false;
    }
  }

  /**
   * Initialize the default visualization
   * @private
   */
  async _initializeDefaultVisualization() {
    try {
      // Create all visualization instances
      for (const vizType of this.visualizationTypes) {
        const visualization = new vizType.class(this);
        this.registerVisualization(vizType.id, visualization);
      }
      
      // Set current visualization to the first one by default
      this.currentVisualization = this.visualizations.get(this.visualizationTypes[0].id);
      
      // Initialize with all parameters
      await this.currentVisualization.initialize({
        ...this.pluginParameters,
        ...this.visualizationParameters,
        ...this.advancedParameters
      });
      
      return true;
    } catch (error) {
      console.error("Error initializing default visualization:", error);
      throw error;
    }
  }

  /**
   * Execute an action
   * @param {string} actionId - ID of the action to execute
   * @param {...any} args - Action arguments
   * @returns {boolean} Whether the action was handled
   */
  executeAction(actionId, ...args) {
    switch (actionId) {
      case 'reset-view':
        // Reset camera/view in the rendering manager
        if (this.core && this.core.renderingManager) {
          const environment = this.core.renderingManager.getCurrentEnvironment();
          if (environment) {
            // Reset camera for 2D environment
            if (typeof environment.resetCamera === 'function') {
              environment.resetCamera();
            }
          }
        }
        return true;
        
      case 'toggle-animation':
        // Toggle animation state in the current visualization
        if (this.currentVisualization) {
          const isAnimating = !this.currentVisualization.isAnimating;
          this.currentVisualization.isAnimating = isAnimating;
          
          // Show notification to user
          if (this.core && this.core.uiManager) {
            this.core.uiManager.showNotification(
              `Animation ${isAnimating ? 'enabled' : 'disabled'}`
            );
          }
        }
        return true;
        
      case 'randomize-colors':
        // Generate a random color
        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        // Update the appropriate parameter based on visualization type
        const vizId = this._getVisualizationId(this.currentVisualization);
        
        if (vizId === 'basic') {
          this.updateParameter('fillColor', randomColor, 'visualization', true);
        } else if (vizId === 'advanced') {
          this.updateParameter('primaryColor', randomColor, 'visualization', true);
        } else if (vizId === 'wave') {
          this.updateParameter('waveColor', randomColor, 'visualization', true);
        }
        
        return true;
        
      default:
        // Let parent handle other actions
        return super.executeAction(actionId, ...args);
    }
  }
}