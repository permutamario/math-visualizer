// src/plugins/polytope-viewer/MaterialManager.js
// Manages materials for polytope visualization

/**
 * Material Manager for creating and caching THREE.js materials
 */
export class MaterialManager {
  /**
   * Create a new MaterialManager
   * @param {Object} THREE - THREE.js library
   */
  constructor(THREE) {
    this.THREE = THREE;
    this.materials = {
      faces: {},
      edges: {},
      vertices: {}
    };
  }
  
  /**
   * Create a material for faces
   * @param {Object} options - Material options
   * @param {string} options.color - Color in hex format
   * @param {number} options.opacity - Opacity value (0-1)
   * @param {boolean} options.transparent - Whether material is transparent
   * @param {boolean} options.wireframe - Whether to render as wireframe
   * @returns {THREE.Material} Material for faces
   */
  createFaceMaterial(options = {}) {
    const color = options.color || '#3498db';
    const opacity = options.opacity !== undefined ? options.opacity : 1.0;
    const transparent = options.transparent !== undefined ? options.transparent : opacity < 1;
    const wireframe = options.wireframe || false;
    
    // Generate a key for caching
    const key = `${color}_${opacity}_${transparent}_${wireframe}`;
    
    // Return cached material if available
    if (this.materials.faces[key]) {
      return this.materials.faces[key];
    }
    
    // Create new material
    const material = new this.THREE.MeshPhongMaterial({
      color: color,
      opacity: opacity,
      transparent: transparent,
      wireframe: wireframe,
      side: this.THREE.DoubleSide,
      flatShading: true
    });
    
    // Cache the material
    this.materials.faces[key] = material;
    
    return material;
  }
  
  /**
   * Create a material for edges
   * @param {Object} options - Material options
   * @param {string} options.color - Color in hex format
   * @param {number} options.linewidth - Line width
   * @returns {THREE.Material} Material for edges
   */
  createEdgeMaterial(options = {}) {
    const color = options.color || '#000000';
    const linewidth = options.linewidth || 1;
    
    // Generate a key for caching
    const key = `${color}_${linewidth}`;
    
    // Return cached material if available
    if (this.materials.edges[key]) {
      return this.materials.edges[key];
    }
    
    // Create new material
    const material = new this.THREE.LineBasicMaterial({
      color: color,
      linewidth: linewidth
    });
    
    // Cache the material
    this.materials.edges[key] = material;
    
    return material;
  }
  
  /**
   * Create a material for vertices
   * @param {Object} options - Material options
   * @param {string} options.color - Color in hex format
   * @returns {THREE.Material} Material for vertices
   */
  createVertexMaterial(options = {}) {
    const color = options.color || '#ffffff';
    
    // Generate a key for caching
    const key = `${color}`;
    
    // Return cached material if available
    if (this.materials.vertices[key]) {
      return this.materials.vertices[key];
    }
    
    // Create new material
    const material = new this.THREE.MeshBasicMaterial({
      color: color
    });
    
    // Cache the material
    this.materials.vertices[key] = material;
    
    return material;
  }
  
  /**
   * Dispose of all materials
   */
  dispose() {
    // Dispose face materials
    Object.values(this.materials.faces).forEach(material => {
      material.dispose();
    });
    
    // Dispose edge materials
    Object.values(this.materials.edges).forEach(material => {
      material.dispose();
    });
    
    // Dispose vertex materials
    Object.values(this.materials.vertices).forEach(material => {
      material.dispose();
    });
    
    // Reset materials cache
    this.materials = {
      faces: {},
      edges: {},
      vertices: {}
    };
  }
}
