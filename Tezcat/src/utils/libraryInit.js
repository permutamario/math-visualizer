import * as THREE from '../vendors/three/three.module.js';
import CameraControls from '../vendors/camera-controls/camera-controls.module.js';
import { ConvexGeometry } from '../vendors/three/examples/jsm/geometries/ConvexGeometry.js';
import qh from '../vendors/quickhull3d/node_modules/quickhull3d/dist/QuickHull.js';
import Konva from '../vendors/konva/node_modules/konva/konva.min.js';

// Initialize camera-controls with THREE
CameraControls.install({ THREE });

// If your existing code really requires global access, expose libraries globally
// Note: This is not ideal React practice, but helps with migration
window.THREE = THREE;
window.CameraControls = CameraControls;
window.ConvexGeometry = ConvexGeometry;
window.QuickHull = qh;
window.Konva = require('konva');

console.log("Libraries initialized:", { 
  THREE: !!window.THREE,
  CameraControls: !!window.CameraControls,
  Konva: !!window.Konva
});

export { THREE, CameraControls, ConvexGeometry, qh as QuickHull };
