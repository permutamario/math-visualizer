// src/utils/libraryInit.js
// Enhanced version that properly initializes libraries for both global and module usage

// Import required libraries
import * as THREE from 'three';
import CameraControls from 'camera-controls';
import * as d3 from 'd3';
import * as math from 'mathjs';
import Konva from 'konva';

// Simple QuickHull implementation
const QuickHull = (points, options = {}) => {
  // For simplicity, this is a very basic implementation
  // In a real implementation, you would use a proper quickhull algorithm
  
  console.log("Using simple QuickHull implementation");
  
  // If no points or too few, return empty array
  if (!points || points.length < 4) {
    console.warn("Not enough points for 3D convex hull");
    return [];
  }
  
  // For now, just return a simple shape as a placeholder
  if (options.skipTriangulation) {
    // Return quad faces
    return [
      [0, 1, 2, 3],
      [0, 3, 5, 4],
      [1, 0, 4, 5],
      [2, 1, 5, 3],
      [3, 2, 0, 1]
    ];
  } else {
    // Return triangulated faces
    return [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 1],
      [1, 3, 2]
    ];
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
    
    // Initialize QuickHull
    window.QuickHull = QuickHull;
    
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
    QuickHull,
    Konva,
    mathjs: math,
    d3
  };
};

// Initialize libraries
const libraries = setupLibraries();

// Export the libraries for direct module imports
export { THREE };
export { CameraControls };
export { QuickHull };
export { Konva };
export { math as mathjs };
export { d3 };

// Export the entire library object as default
export default libraries;
