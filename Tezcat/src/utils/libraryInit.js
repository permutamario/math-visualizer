// src/utils/libraryInit.js

// Import required libraries
import * as THREE from 'three';
import CameraControls from 'camera-controls';
import * as d3 from 'd3';
import * as math from 'mathjs';
import qh from 'quickhull3d';
import Konva from 'konva';

/**
 * Initialize all visualization libraries and make them globally available
 * This helps maintain compatibility between React components and the core visualization engine
 */
const setupLibraries = () => {
  console.log("Setting up visualization libraries...");
  
  // Make libraries available globally for legacy code and easier debugging
  if (typeof window !== 'undefined') {
    // Initialize THREE.js
    window.THREE = THREE;
    
    // Initialize CameraControls with THREE
    CameraControls.install({ THREE });
    window.CameraControls = CameraControls;
    
    // Initialize QuickHull
    window.QuickHull = qh;
    
    // Initialize Konva
    window.Konva = Konva;
    
    // Initialize Math.js
    window.mathjs = math;
    
    // Initialize D3
    window.d3 = d3;
    
    console.log("Libraries initialized successfully");
  } else {
    console.warn("Window object not available, libraries not initialized globally");
  }
  
  return {
    THREE,
    CameraControls,
    QuickHull: qh,
    Konva,
    mathjs: math,
    d3
  };
};

// Initialize libraries
const libraries = setupLibraries();

// Export both the initialization function and library references
export default libraries;

// Also export individual libraries for clean imports
export const {
  THREE,
  CameraControls,
  QuickHull,
  Konva,
  mathjs,
  d3
} = libraries;
