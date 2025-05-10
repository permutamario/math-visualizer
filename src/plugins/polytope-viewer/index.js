// src/plugins/polytope-viewer/index.js
// Main entry point for the polytope viewer plugin

import { PolytopeRenderer } from './PolytopeRenderer.js';
import { MaterialManager } from './MaterialManager.js';
import { getPolytopeBuilder } from './build_functions/index.js';
import { Polytope } from './Polytope.js';

/**
 * Polytope Viewer Plugin
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initPolytopeViewerPlugin(core) {
  const { hooks, state } = core;
  
  console.log("Initializing Polytope Viewer Plugin");
  
  // Internal state
  let polytopeRenderer = null;
  let materialManager = null;
  let currentPolytope = null;
  let polytopeGroup = null;
  let scene = null;
  
  // Define settings metadata
  const polytopeSettingsMetadata = {
    // Structural settings
    polytopeType: { 
      type: 'structural', 
      label: 'Polytope Type', 
      control: 'dropdown', 
      options: ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'],
      default: 'cube'
    },
    scale: { 
      type: 'structural', 
      label: 'Scale', 
      control: 'slider', 
      min: 0.1, 
      max: 3.0, 
      step: 0.1, 
      default: 1.0 
    },
    rotation: { 
      type: 'structural', 
      label: 'Auto-rotate', 
      control: 'checkbox', 
      default: false 
    },
    rotationSpeed: { 
      type: 'structural', 
      label: 'Rotation Speed', 
      control: 'slider', 
      min: 0.1, 
      max: 5.0, 
      step: 0.1, 
      default: 0.5 
    },
    
    // Visual settings - Vertices
    showVertices: { 
      type: 'visual', 
      label: 'Show Vertices', 
      control: 'checkbox', 
      default: true 
    },
    vertexSize: { 
      type: 'visual', 
      label: 'Vertex Size', 
      control: 'slider', 
      min: 0.01, 
      max: 0.2, 
      step: 0.01, 
      default: 0.05 
    },
    vertexColor: { 
      type: 'visual', 
      label: 'Vertex Color', 
      control: 'color', 
      default: '#ffffff' 
    },
    
    // Visual settings - Edges
    showEdges: { 
      type: 'visual', 
      label: 'Show Edges', 
      control: 'checkbox', 
      default: true 
    },
    edgeThickness: { 
      type: 'visual', 
      label: 'Edge Thickness', 
      control: 'slider', 
      min: 0.5, 
      max: 5, 
      step: 0.5, 
      default: 1 
    },
    edgeColor: { 
      type: 'visual', 
      label: 'Edge Color', 
      control: 'color', 
      default: '#000000' 
    },
    
    // Visual settings - Faces
    showFaces: { 
      type: 'visual', 
      label: 'Show Faces', 
      control: 'checkbox', 
      default: true 
    },
    wireframe: { 
      type: 'visual', 
      label: 'Wireframe Mode', 
      control: 'checkbox', 
      default: false 
    },
    faceOpacity: { 
      type: 'visual', 
      label: 'Face Opacity', 
      control: 'slider', 
      min: 0, 
      max: 1, 
      step: 0.05, 
      default: 0.85 
    },
    faceColorMode: { 
      type: 'visual', 
      label: 'Face Color Mode', 
      control: 'dropdown', 
      options: ['uniform', 'by_face', 'by_face_size', 'by_face_angle'],
      default: 'uniform' 
    },
    faceColor: { 
      type: 'visual', 
      label: 'Base Face Color', 
      control: 'color', 
      default: '#3498db' 
    },
    
    // Visual settings - Environment
    backgroundColor: { 
      type: 'visual', 
      label: 'Background Color', 
      control: 'color', 
      default: '#f5f5f5' 
    }
  };
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'polytopeViewer', (visualizations) => {
    return [...visualizations, {
      id: 'polytopeViewer',
      name: 'Polytope Viewer',
      description: 'Interactive 3D polytope visualization'
    }];
  });
  
  // Register environment requirements
  hooks.addFilter('environmentRequirements', 'polytopeViewer', () => {
    return {
      type: '3d-camera',
      options: {
        cameraPosition: [0, 0, 5],
        lookAt: [0, 0, 0]
      }
    };
  });
  
  // Register settings metadata
  hooks.addFilter('settingsMetadata', 'polytopeViewer', (metadata) => {
    return polytopeSettingsMetadata;
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'polytopeViewer', (settings) => {
    return {
      polytopeType: 'cube',
      scale: 1.0,
      rotation: false,
      rotationSpeed: 0.5,
      wireframe: false,
      showVertices: true,
      vertexSize: 0.05,
      vertexColor: '#ffffff',
      showEdges: true,
      edgeThickness: 1,
      edgeColor: '#000000',
      showFaces: true,
      faceOpacity: 0.85,
      faceColorMode: 'uniform',
      faceColor: '#3498db',
      backgroundColor: '#f5f5f5'
    };
  });
  
  // Register render function - for 3D, we set up the scene when the plugin is activated
  hooks.addAction('render', 'polytopeViewer', (ctx, canvas, settings) => {
    // Only render if this is the active plugin
    if (state.getState().activePluginId !== 'polytopeViewer') {
      return false;
    }
    
    // Scene is set up in activatePlugin
    return true;
  });
  
  // Register activation handler - create the 3D scene
  hooks.addAction('activatePlugin', 'polytopeViewer', async ({ pluginId }) => {
    if (pluginId !== 'polytopeViewer') return;
    
    console.log("Polytope Viewer Plugin activated");
    
    // Get the current environment
    const canvasManager = window.AppInstance.canvasManager;
    
    // If not using 3D environment, request it
    if (canvasManager.environmentType !== '3d-camera') {
      canvasManager.setupEnvironment('3d-camera');
    }
    
    // Get current settings
    const settings = state.getState().settings;
    
    // Access the THREE.js scene
    if (canvasManager.currentEnvironment && 
        canvasManager.currentEnvironment.scene) {
      
      scene = canvasManager.currentEnvironment.scene;
      const THREE = window.THREE; // Access the global THREE object
      
      // Initialize material manager
      materialManager = new MaterialManager(THREE);
      
      // Initialize renderer
      polytopeRenderer = new PolytopeRenderer(THREE, materialManager);
      
      // Create polytope based on current settings
      await createPolytope(settings.polytopeType, settings);
      
      // Set background color
      if (canvasManager.currentEnvironment.renderer) {
        canvasManager.currentEnvironment.renderer.setClearColor(
          settings.backgroundColor || '#f5f5f5'
        );
      }
    } else {
      console.error('THREE.js scene not available for Polytope Viewer plugin');
    }
  });
  
  // Register animation function
  hooks.addAction('beforeRender', 'polytopeViewer', (ctx, canvas, settings) => {
    // Only run if plugin is active and rotation is enabled
    if (state.getState().activePluginId === 'polytopeViewer' && 
        settings.rotation && 
        polytopeGroup) {
      
      // Rotate the polytope
      polytopeGroup.rotation.y += 0.01 * settings.rotationSpeed;
      polytopeGroup.rotation.x += 0.005 * settings.rotationSpeed;
    }
  });
  
  // Register deactivation handler - clean up the 3D scene
  hooks.addAction('deactivatePlugin', 'polytopeViewer', ({ pluginId }) => {
    if (pluginId !== 'polytopeViewer') return;
    
    console.log("Polytope Viewer Plugin deactivated");
    
    // Clean up the scene
    if (scene && polytopeGroup) {
      scene.remove(polytopeGroup);
      
      // Clean up resources
      if (polytopeRenderer) {
        polytopeRenderer.dispose();
      }
      
      polytopeGroup = null;
      currentPolytope = null;
      polytopeRenderer = null;
      materialManager = null;
    }
  });
  
  // Handle setting changes
  hooks.addAction('onSettingChanged', 'polytopeViewer', async ({ path, value }) => {
    if (state.getState().activePluginId !== 'polytopeViewer') return;
    if (!scene || !polytopeRenderer) return;
    
    const settings = state.getState().settings;
    
    // Handle polytope type change
    if (path === 'polytopeType') {
      await createPolytope(value, settings);
      return;
    }
    
    // Handle scale change
    if (path === 'scale' && polytopeGroup) {
      polytopeGroup.scale.set(value, value, value);
      return;
    }
    
    // Handle visual property changes
    if (polytopeRenderer && currentPolytope) {
      if (path.startsWith('vertex') || path.startsWith('edge') || 
          path.startsWith('face') || path === 'wireframe' || 
          path.startsWith('show')) {
        
        // Update the visual properties
        polytopeRenderer.updateVisualProperties(polytopeGroup, settings);
      }
    }
    
    // Handle background color change
    if (path === 'backgroundColor') {
      const canvasManager = window.AppInstance.canvasManager;
      if (canvasManager.currentEnvironment && 
          canvasManager.currentEnvironment.renderer) {
        canvasManager.currentEnvironment.renderer.setClearColor(value);
      }
    }
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'polytopeViewer', (options) => {
    return [
      {
        id: 'export-png',
        label: 'Export PNG',
        type: 'export'
      },
      {
        id: 'toggle-wireframe',
        label: 'Toggle Wireframe',
        type: 'action'
      },
      {
        id: 'reset-settings',
        label: 'Reset Settings',
        type: 'export'
      }
    ];
  });
  
  // Handle export actions
  hooks.addAction('exportAction', 'polytopeViewer', (actionId) => {
    if (actionId === 'toggle-wireframe') {
      const currentSettings = state.getState().settings;
      const newValue = !currentSettings.wireframe;
      window.changeState('settings.wireframe', newValue);
      return true;
    }
    return false;
  });
  
  /**
   * Create and display a polytope
   * @param {string} type - Type of polytope to create
   * @param {Object} settings - Current settings
   */
  async function createPolytope(type, settings) {
    if (!scene || !polytopeRenderer) return;
    
    try {
      // Remove existing polytope if any
      if (polytopeGroup) {
        scene.remove(polytopeGroup);
        polytopeGroup = null;
      }
      
      // Get the polytope builder function
      const builder = getPolytopeBuilder(type);
      if (!builder) {
        console.error(`No builder found for polytope type: ${type}`);
        return;
      }
      
      // Build the polytope
      const vertices = await builder();
      
      // Create Polytope instance
      currentPolytope = new Polytope(vertices, { name: type });
      
      // Render the polytope
      polytopeGroup = polytopeRenderer.createFromPolytope(currentPolytope, settings);
      
      // Set scale
      const scale = settings.scale || 1.0;
      polytopeGroup.scale.set(scale, scale, scale);
      
      // Add to scene
      scene.add(polytopeGroup);
      
    } catch (error) {
      console.error(`Error creating polytope: ${error.message}`);
    }
  }
  
  console.log("Polytope Viewer Plugin initialized");
}
