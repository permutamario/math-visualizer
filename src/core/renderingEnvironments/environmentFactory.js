// src/core/renderingEnvironments/environmentFactory.js
// Factory for creating rendering environments

import { Camera2DEnvironment } from './2dCameraEnvironment.js';
import { Event2DEnvironment } from './2dEventEnvironment.js';
import { Camera3DEnvironment } from './3dCameraEnvironment.js';

// Environment registry
const ENVIRONMENT_TYPES = {
  '2d-camera': Camera2DEnvironment,
  '2d-event': Event2DEnvironment,
  '3d-camera': Camera3DEnvironment
};

/**
 * Create a rendering environment
 * @param {string} type - Environment type
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} options - Environment options
 * @returns {Object} Created environment
 */
export function createEnvironment(type, canvas, options = {}) {
  console.log(`Creating environment of type: ${type}`);
  
  // Default to 2D camera environment if not specified
  const EnvironmentClass = ENVIRONMENT_TYPES[type] || Camera2DEnvironment;
  
  return new EnvironmentClass(canvas, options);
}

/**
 * Get available environment types
 * @returns {Array} List of available environment types
 */
export function getAvailableEnvironmentTypes() {
  return Object.keys(ENVIRONMENT_TYPES);
}

/**
 * Check if an environment type is supported
 * @param {string} type - Environment type
 * @returns {boolean} Whether the environment type is supported
 */
export function isEnvironmentTypeSupported(type) {
  return type in ENVIRONMENT_TYPES;
}
