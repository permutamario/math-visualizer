// src/plugins/polytope-viewer/index.js
// Main entry point for the polytope viewer plugin (manifest-based)

import * as requiredFunctions from './requiredFunctions.js';
import * as exportActions from './exportActions.js';

/**
 * Polytope Viewer Plugin
 * @param {Object} core - Core APIs provided by the framework
 */
export default function initPolytopeViewerPlugin(core) {
  console.log("Initializing Polytope Viewer Plugin with manifest architecture");
  
  // Combine all implementations
  const implementation = {
    ...requiredFunctions,
    ...exportActions
  };
  
  // For new manifest-based plugin architecture, return the implementation
  return implementation;
}
