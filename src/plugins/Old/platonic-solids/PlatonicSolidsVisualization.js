// src/plugins/platonic-solids/PlatonicSolidsVisualization.js
import { Visualization } from '../../core/Visualization.js';

export class PlatonicSolidsVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
    
    // Store state
    this.state = {
      solid: null,
      meshGroup: null,
      isAnimating: false,
      rotationSpeed: 0.5,
    };
  }

  async initialize(parameters) {
    // Just need to set isAnimating based on rotation parameter
    this.state.isAnimating = parameters.rotation;
    return true;
  }

  update(parameters, prevParameters = null) {
    // Update animation state
    this.state.isAnimating = parameters.rotation;
    
    // If the type of solid or size has changed, we'll need to rebuild the mesh
    // when render3D is called next
    const needsRebuild = !prevParameters || 
                         parameters.solidType !== prevParameters.solidType ||
                         parameters.size !== prevParameters.size;
                         
    if (needsRebuild) {
      // Mark the current solid for removal
      this.state.solid = null;
    }
  }

  render3D(THREE, scene, parameters) {
    // Remove existing mesh if present
    if (this.state.meshGroup) {
      scene.remove(this.state.meshGroup);
      this.state.meshGroup = null;
    }
    
    // Create mesh group for the solid
    this.state.meshGroup = new THREE.Group();
    scene.add(this.state.meshGroup);
    
    // Create new solid if needed
    if (!this.state.solid) {
      this.state.solid = this._createSolid(THREE, parameters);
      this.state.meshGroup.add(this.state.solid);
    } else {
      // Update existing solid with new parameters
      this._updateSolid(THREE, parameters);
      this.state.meshGroup.add(this.state.solid);
    }
  }

  _createSolid(THREE, parameters) {
    // Create geometry based on selected solid type
    let geometry;
    
    switch (parameters.solidType) {
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(parameters.size, 0);
        break;
      case 'cube':
        geometry = new THREE.BoxGeometry(
          parameters.size, parameters.size, parameters.size
        );
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(parameters.size, 0);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(parameters.size, 0);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(parameters.size, 0);
        break;
      default:
        geometry = new THREE.TetrahedronGeometry(parameters.size, 0);
    }
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(parameters.color),
      wireframe: parameters.wireframe,
      transparent: parameters.opacity < 1,
      opacity: parameters.opacity,
      side: THREE.DoubleSide
    });
    
    // Create mesh
    return new THREE.Mesh(geometry, material);
  }

  _updateSolid(THREE, parameters) {
    // Update material properties
    if (this.state.solid.material) {
      this.state.solid.material.color.set(parameters.color);
      this.state.solid.material.wireframe = parameters.wireframe;
      this.state.solid.material.transparent = parameters.opacity < 1;
      this.state.solid.material.opacity = parameters.opacity;
    }
  }

  animate(deltaTime) {
    // Rotate the solid if animation is enabled
    if (this.state.isAnimating && this.state.meshGroup) {
      this.state.meshGroup.rotation.y += this.state.rotationSpeed * deltaTime;
      this.state.meshGroup.rotation.x += this.state.rotationSpeed * 0.5 * deltaTime;
      return true; // Request render on next frame
    }
    
    return false;
  }

  dispose() {
    // Clean up resources
    if (this.state.solid) {
      if (this.state.solid.geometry) {
        this.state.solid.geometry.dispose();
      }
      
      if (this.state.solid.material) {
        this.state.solid.material.dispose();
      }
    }
  }
}
