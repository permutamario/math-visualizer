// src/plugins/polytope-viewer/index.js
// Main entry point for the Polytope Viewer plugin

import { loadPolytopeBuilders } from './polytope/polytopeLoader.js';
import { createPolytopeMesh, disposePolytopeMesh } from './polytope/meshBuilder.js';
import { getBaseSettingsMetadata, getPolytopeSpecificMetadata } from './settings/settingsManager.js';

/**
 * Initialize the Polytope Viewer plugin
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initPolytopeViewerPlugin(core) {
  const { hooks, state } = core;
  
  // Track state within the plugin
  let currentPolytope = null;
  let currentMesh = null;
  let lastPolytopeType = null;
  let polytopeBuilders = {};
  let isInitialized = false;
  
  console.log("Initializing Polytope Viewer plugin");
  
  // Load polytope builders asynchronously
  loadPolytopeBuilders().then(builders => {
    polytopeBuilders = builders;
    isInitialized = true;
    console.log(`Loaded ${Object.keys(builders).length} polytope builders`);
    
    // Update state with available polytopes - important for UI dropdown
    if (state.getState().activePluginId === 'polytopeViewer') {
      updateSettingsMetadata();
    }
  });
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'polytopeViewer', (visualizations) => {
    return [...visualizations, {
      id: 'polytopeViewer',
      name: 'Polytope Viewer',
      description: 'View and interact with mathematical polytopes'
    }];
  });
  
  // Register UI controls - these will be dynamically updated based on the selected polytope
  hooks.addFilter('settingsMetadata', 'polytopeViewer', (metadata) => {
    // Only return metadata for the polytope viewer when it's active
    if (state.getState().activePluginId !== 'polytopeViewer') {
      return metadata;
    }
    
    // Start with base settings
    const baseMetadata = getBaseSettingsMetadata(Object.keys(polytopeBuilders));
    
    // Get current settings to determine selected polytope type
    const settings = state.getState().settings || {};
    const currentPolytopeType = settings.polytopeType || Object.keys(polytopeBuilders)[0];
    
    // Add polytope-specific settings if a builder is available
    if (polytopeBuilders[currentPolytopeType]) {
      const builder = polytopeBuilders[currentPolytopeType];
      const specificMetadata = getPolytopeSpecificMetadata(currentPolytopeType, builder);
      return { ...baseMetadata, ...specificMetadata };
    }
    
    return baseMetadata;
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'polytopeViewer', (defaultSettings) => {
    if (state.getState().activePluginId !== 'polytopeViewer') {
      return defaultSettings;
    }
    
    // Start with base default settings
    const baseDefaults = {
      polytopeType: Object.keys(polytopeBuilders)[0] || 'cube', // Fallback to cube if none loaded yet
      wireframe: false,
      showVertices: true,
      vertexSize: 0.1,
      edgeThickness: 1,
      edgeColor: '#000000',
      faceColor: '#3498db',
      faceOpacity: 0.85,
      showFaces: true
    };
    
    // Get defaults for the current polytope type
    const currentType = baseDefaults.polytopeType;
    if (polytopeBuilders[currentType] && polytopeBuilders[currentType].defaults) {
      const builder = polytopeBuilders[currentType];
      const paramDefaults = {};
      
      // Extract defaults from the builder's parameter schema
      Object.entries(builder.defaults).forEach(([key, schema]) => {
        paramDefaults[key] = schema.default;
      });
      
      return { ...baseDefaults, ...paramDefaults };
    }
    
    return baseDefaults;
  });
  
  // Register render function
  hooks.addAction('render', 'polytopeViewer', (ctx, canvas, settings) => {
    // Only render if this is the active plugin
    if (state.getState().activePluginId !== 'polytopeViewer') {
      return false;
    }
    
    // Wait until builders are loaded
    if (!isInitialized) {
      // Draw loading message
      ctx.save();
      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Loading polytope data...', canvas.width / 2, canvas.height / 2);
      ctx.restore();
      return true;
    }
    
    // Make sure we have a polytope built
    if (!currentPolytope || lastPolytopeType !== settings.polytopeType) {
      rebuildPolytope(settings);
    }
    
    // The actual rendering will be handled by the 3D environment
    // We just need to ensure the mesh is up to date
    return true;
  });
  
  // Register activation handler
  hooks.addAction('activatePlugin', 'polytopeViewer', ({ pluginId }) => {
    if (pluginId !== 'polytopeViewer') return;
    
    console.log("Polytope Viewer plugin activated");
    
    // Switch to 3D environment
    if (window.AppInstance && window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.setupEnvironment('3d-camera');
    }
    
    // Update metadata for UI controls
    updateSettingsMetadata();
  });
  
  // Register deactivation handler
  hooks.addAction('deactivatePlugin', 'polytopeViewer', ({ pluginId }) => {
    if (pluginId !== 'polytopeViewer') return;
    
    console.log("Polytope Viewer plugin deactivated");
    
    // Clean up resources
    if (currentMesh) {
      disposePolytopeMesh(currentMesh);
      currentMesh = null;
    }
    
    currentPolytope = null;
  });
  
  // Handle setting changes
  hooks.addAction('onSettingChanged', 'polytopeViewer', ({ path, value }) => {
    if (state.getState().activePluginId !== 'polytopeViewer') return;
    
    // Handle polytope type changes
    if (path === 'settings.polytopeType') {
      // This will trigger rebuilding all UI controls for the new polytope type
      console.log(`Polytope type changed to ${value}`);
      updateSettingsMetadata();
      
      // Force regenerating the polytope
      lastPolytopeType = null;
    }
    
    // We'll rebuild the polytope on the next render
    if (currentMesh) {
      updatePolytopeMesh(state.getState().settings);
    }
  });
  
  /**
   * Update settings metadata to trigger UI rebuild
   */
  function updateSettingsMetadata() {
    // Get current settings
    const settings = state.getState().settings || {};
    
    // Start with base metadata
    const baseMetadata = getBaseSettingsMetadata(Object.keys(polytopeBuilders));
    
    // Get current polytope type
    const currentType = settings.polytopeType || Object.keys(polytopeBuilders)[0];
    
    // Add polytope-specific metadata
    if (polytopeBuilders[currentType]) {
      const builder = polytopeBuilders[currentType];
      const specificMetadata = getPolytopeSpecificMetadata(currentType, builder);
      window.changeState('settingsMetadata', { ...baseMetadata, ...specificMetadata });
    } else {
      window.changeState('settingsMetadata', baseMetadata);
    }
    
    // Trigger UI rebuild
    window.changeState('rebuildUI', true);
  }
  
  /**
   * Rebuild the current polytope based on settings
   * @param {Object} settings - Current settings
   */
  function rebuildPolytope(settings) {
    const polytopeType = settings.polytopeType;
    
    if (!polytopeType || !polytopeBuilders[polytopeType]) {
      console.warn(`Polytope type ${polytopeType} not found`);
      return;
    }
    
    console.log(`Building polytope: ${polytopeType}`);
    
    // Get the builder
    const builder = polytopeBuilders[polytopeType];
    
    // Extract parameters for this polytope type
    const params = {};
    if (builder.defaults) {
      Object.keys(builder.defaults).forEach(key => {
        params[key] = settings[key] !== undefined ? settings[key] : builder.defaults[key].default;
      });
    }
    
    try {
      // Build the polytope with parameters
      currentPolytope = builder.build(params);
      lastPolytopeType = polytopeType;
      
      // Update the mesh
      updatePolytopeMesh(settings);
    } catch (error) {
      console.error(`Error building polytope ${polytopeType}:`, error);
    }
  }
  
  /**
   * Update the polytope mesh with current settings
   * @param {Object} settings - Current settings
   */
  function updatePolytopeMesh(settings) {
    if (!currentPolytope || !window.AppInstance) return;
    
    // Get the scene from the environment
    const scene = window.AppInstance.canvasManager.currentEnvironment?.scene;
    if (!scene) {
      console.error("Cannot update polytope mesh - no scene available");
      return;
    }
    
    // Clean up previous mesh
    if (currentMesh) {
      scene.remove(currentMesh);
      disposePolytopeMesh(currentMesh);
      currentMesh = null;
    }
    
    // Create new mesh
    currentMesh = createPolytopeMesh(currentPolytope, settings);
    scene.add(currentMesh);
    
    // Request render update
    if (window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.render();
    }
  }
  
  console.log("Polytope Viewer plugin initialized");
}
