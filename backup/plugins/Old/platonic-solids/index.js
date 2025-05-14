// src/plugins/platonic-solids/index.js
import { Plugin } from '../../core/Plugin.js';
import { PlatonicSolidsVisualization } from './PlatonicSolidsVisualization.js';

export default class PlatonicSolidsPlugin extends Plugin {
  static id = "platonic-solids";
  static name = "Platonic Solids";
  static description = "Interactive 3D platonic solids visualization";
  static renderingType = "3d"; // Using THREE.js for 3D rendering

  async _initializeDefaultVisualization() {
    const visualization = new PlatonicSolidsVisualization(this);
    this.registerVisualization('default', visualization);
    this.currentVisualization = visualization;
    await visualization.initialize(this.parameters);
  }

  getParameterSchema() {
    return {
      structural: [
        {
          id: 'solidType',
          type: 'dropdown',
          label: 'Solid Type',
          options: [
            { value: 'tetrahedron', label: 'Tetrahedron (4 faces)' },
            { value: 'cube', label: 'Cube (6 faces)' },
            { value: 'octahedron', label: 'Octahedron (8 faces)' },
            { value: 'dodecahedron', label: 'Dodecahedron (12 faces)' },
            { value: 'icosahedron', label: 'Icosahedron (20 faces)' }
          ],
          default: 'tetrahedron'
        },
        {
          id: 'size',
          type: 'slider',
          label: 'Size',
          min: 0.5,
          max: 3,
          step: 0.1,
          default: 1
        },
        {
          id: 'rotation',
          type: 'checkbox',
          label: 'Auto-rotate',
          default: true
        }
      ],
      visual: [
        {
          id: 'wireframe',
          type: 'checkbox',
          label: 'Wireframe',
          default: false
        },
        {
          id: 'color',
          type: 'color',
          label: 'Color',
          default: '#3498db'
        },
        {
          id: 'opacity',
          type: 'slider',
          label: 'Opacity',
          min: 0.1,
          max: 1,
          step: 0.1,
          default: 1
        }
      ]
    };
  }
}
