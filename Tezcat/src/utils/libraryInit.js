// src/utils/libraryInit.js

// Import required libraries
import * as THREE from 'three';
import CameraControls from 'camera-controls';
import * as d3 from 'd3';
import * as math from 'mathjs';
// Replace quickhull3d with a custom implementation or alternative
// import qh from 'quickhull3d';
import Konva from 'konva';

// Simple quickhull stub to prevent errors
const quickhullStub = {
  compute: (points) => {
    console.warn("QuickHull implementation is a stub. Please install proper library.");
    return { vertices: points };
  }
};

/**
 * Initialize all visualization libraries and make them globally available
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
    
    // Initialize QuickHull stub
    window.QuickHull = quickhullStub;
    
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
    QuickHull: quickhullStub,
    Konva,
    mathjs: math,
    d3
  };
};

// Initialize libraries
const libraries = setupLibraries();

// Export the libraries
export default libraries;

// Export original imports directly
export { THREE };
export { CameraControls };
export { quickhullStub as QuickHull };
export { Konva };
export { math as mathjs };
export { d3 };
