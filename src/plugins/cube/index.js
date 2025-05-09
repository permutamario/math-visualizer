// src/plugins/cube/index.js
/**
 * Cube visualization plugin
 * Demonstrates 3D rendering with three.js
 */
export default function initCubePlugin(core) {
  const { hooks, state } = core;
  
  console.log("Initializing Cube Plugin");
  
  // Define cube settings metadata
  const cubeSettingsMetadata = {
    // Structural settings
    cubeSize: { 
      type: 'structural', 
      label: 'Cube Size', 
      control: 'slider', 
      min: 10, 
      max: 300, 
      step: 1, 
      default: 100 
    },
    wireframe: { 
      type: 'structural', 
      label: 'Wireframe', 
      control: 'checkbox', 
      default: true 
    },
    rotation: { 
      type: 'structural', 
      label: 'Auto-rotate', 
      control: 'checkbox', 
      default: true 
    },
    
    // Visual settings
    cubeColor: { 
      type: 'visual', 
      label: 'Cube Color', 
      control: 'color', 
      default: '#3498db' 
    },
    wireframeColor: { 
      type: 'visual', 
      label: 'Wireframe Color', 
      control: 'color', 
      default: '#000000' 
    },
    opacity: { 
      type: 'visual', 
      label: 'Opacity', 
      control: 'slider', 
      min: 0, 
      max: 1, 
      step: 0.01, 
      default: 1.0 
    },
    backgroundColor: { 
      type: 'visual', 
      label: 'Background Color', 
      control: 'color', 
      default: '#f5f5f5' 
    }
  };
  
  // Store the cube object reference for animation
  let cube = null;
  let scene = null;
  
  // Register with visualization system
  hooks.addFilter('availableVisualizations', 'cube', (visualizations) => {
    return [...visualizations, {
      id: 'cube',
      name: 'Cube (3D)',
      description: 'A 3D cube visualization'
    }];
  });
  
  // Register environment requirements
  hooks.addFilter('environmentRequirements', 'cube', () => {
    return {
      type: '3d-camera',
      options: {
        cameraPosition: [0, 0, 5],
        lookAt: [0, 0, 0]
      }
    };
  });
  
  // Register settings metadata
  hooks.addFilter('settingsMetadata', 'cube', (metadata) => {
    // Only return metadata for the cube plugin
    if (state.getState().activePluginId === 'cube') {
      return cubeSettingsMetadata;
    }
    return metadata;
  });
  
  // Register default settings
  hooks.addFilter('defaultSettings', 'cube', (settings) => {
    // Only return defaults for the cube plugin
    if (state.getState().activePluginId === 'cube') {
      return {
        cubeSize: 100,
        cubeColor: '#3498db',
        opacity: 1.0,
        wireframe: true,
        wireframeColor: '#000000',
        rotation: true,
        backgroundColor: '#f5f5f5'
      };
    }
    return settings;
  });
  
  // Register render function for 3D
  hooks.addAction('render', 'cube', (ctx, canvas, settings) => {
    // Only render if this is the active plugin
    if (state.getState().activePluginId !== 'cube') {
      return false;
    }
    
    // For 3D, we set up the scene when the plugin is activated
    // The actual rendering happens in the environment's animation loop
    
    return true; // We handled the rendering setup
  });
  
  // Register activation handler - create the 3D scene
  hooks.addAction('activatePlugin', 'cube', ({ pluginId }) => {
    if (pluginId !== 'cube') return;
    
    console.log("Cube Plugin activated");
    
    // Get the current environment
    const canvasManager = window.AppInstance.canvasManager;
    
    // If not using 3D environment, request it
    if (canvasManager.environmentType !== '3d-camera') {
      canvasManager.setupEnvironment('3d-camera');
    }
    
    // Get current settings
    const settings = state.getState().settings;
    
    // Access the THREE.js scene from the environment
    if (canvasManager.currentEnvironment && 
        canvasManager.currentEnvironment.scene && 
        window.THREE) {
      
      scene = canvasManager.currentEnvironment.scene;
      const THREE = window.THREE; // Access the global THREE object
      
      // Create a cube mesh
      const size = settings.cubeSize / 100; // Scale down to reasonable THREE.js units
      const geometry = new THREE.BoxGeometry(size, size, size);
      
      // Create material based on settings
      const material = new THREE.MeshStandardMaterial({
        color: settings.cubeColor,
        opacity: settings.opacity,
        transparent: settings.opacity < 1,
        wireframe: settings.wireframe,
        wireframeLinewidth: 2
      });
      
      // Create the cube and add to scene
      cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      
      // Set background color if available
      if (canvasManager.currentEnvironment.renderer) {
        canvasManager.currentEnvironment.renderer.setClearColor(
          settings.backgroundColor || '#f5f5f5'
        );
      }
      
      // Add before render hook for animation
      hooks.addAction('beforeRender', 'cubeAnimation', (ctx, canvas, settings) => {
        if (state.getState().activePluginId !== 'cube') return;
        
        // Animate the cube if rotation is enabled
        if (cube && settings.rotation) {
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
        }
      });
    } else {
      console.warn('THREE.js environment not available for cube plugin');
    }
  });
  
  // Register deactivation handler - clean up the 3D scene
  hooks.addAction('deactivatePlugin', 'cube', ({ pluginId }) => {
    if (pluginId !== 'cube') return;
    
    console.log("Cube Plugin deactivated");
    
    // Clean up the cube from the scene
    if (scene && cube) {
      scene.remove(cube);
      cube.geometry.dispose();
      cube.material.dispose();
      cube = null;
    }
    
    // Remove animation hook
    hooks.removeAction('beforeRender', 'cubeAnimation');
  });
  
  // Handle setting changes
  hooks.addAction('onSettingChanged', 'cube', ({ path, value }) => {
    if (state.getState().activePluginId !== 'cube' || !cube) return;
    
    // Update the cube based on setting changes
    if (path === 'cubeSize') {
      const size = value / 100; // Scale down to reasonable THREE.js units
      cube.scale.set(size, size, size);
    } 
    else if (path === 'cubeColor' && cube.material) {
      cube.material.color.set(value);
    }
    else if (path === 'opacity' && cube.material) {
      cube.material.opacity = value;
      cube.material.transparent = value < 1;
    }
    else if (path === 'wireframe' && cube.material) {
      cube.material.wireframe = value;
    }
    else if (path === 'backgroundColor') {
      // Get environment and update background
      const canvasManager = window.AppInstance.canvasManager;
      if (canvasManager.currentEnvironment && 
          canvasManager.currentEnvironment.renderer) {
        canvasManager.currentEnvironment.renderer.setClearColor(value);
      }
    }
  });
  
  // Register export options
  hooks.addFilter('exportOptions', 'cube', (options) => {
    if (state.getState().activePluginId !== 'cube') return options;
    
    return [
      {
        id: 'export-png',
        label: 'Export PNG',
        type: 'export'
      },
      {
        id: 'reset-settings',
        label: 'Reset Settings',
        type: 'export'
      }
    ];
  });
  
  console.log("Cube Plugin initialized");
}
