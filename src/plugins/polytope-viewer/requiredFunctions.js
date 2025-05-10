// src/plugins/polytope-viewer/requiredFunctions.js

import { PolytopeRenderer } from './PolytopeRenderer.js';
import { MaterialManager } from './MaterialManager.js';
import { getPolytopeBuilder } from './build_functions/index.js';
import { Polytope } from './Polytope.js';

// Internal state for the plugin
let scene = null;
let polytopeRenderer = null;
let materialManager = null;
let currentPolytope = null;
let polytopeGroup = null;

/**
 * Main rendering function
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 * @returns {boolean} - Whether rendering was handled
 */
export function renderVisualization(ctx, canvas, settings) {
  // For 3D, we already set up the scene when the plugin is activated
  // Rendering happens automatically by THREE.js
  return true;
}

/**
 * Handle animation and rotation
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} settings - Current settings
 */
export function handleAnimation(ctx, canvas, settings) {
  // Only run if rotation is enabled
  if (settings.rotation && polytopeGroup) {
    // Rotate the polytope
    polytopeGroup.rotation.y += 0.01 * settings.rotationSpeed;
    polytopeGroup.rotation.x += 0.005 * settings.rotationSpeed;
  }
}

/**
 * Called when the plugin is activated
 */
export async function onActivate() {
  console.log("Polytope Viewer Plugin activated");
  
  // Get the current environment
  const canvasManager = window.AppInstance.canvasManager;
  
  // If not using 3D environment, request it
  if (canvasManager.environmentType !== '3d-camera') {
    canvasManager.setupEnvironment('3d-camera');
  }
  
  // Get current settings
  const settings = window.getState().settings;
  
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
}

/**
 * Called when the plugin is deactivated
 */
export function onDeactivate() {
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
}

/**
 * Handle setting changes
 * @param {string} path - Setting path
 * @param {*} value - New value
 */
export function handleSettingChanged(path, value) {
  if (!scene || !polytopeRenderer) return;
  
  const settings = window.getState().settings;
  
  // Handle polytope type change
  if (path === 'polytopeType') {
    createPolytope(value, settings);
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
}

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
