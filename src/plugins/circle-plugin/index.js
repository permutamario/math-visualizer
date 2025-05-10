// src/plugins/circle-plugin/index.js
import { Plugin } from '../../core/Plugin.js';
import { CircleVisualization } from './CircleVisualization.js';

export default class CirclePlugin extends Plugin {
  static id = "circle-plugin";
  static name = "Circle Test";
  static description = "A simple circle visualization";
  static renderingType = "2d";

  async _initializeDefaultVisualization() {
    const visualization = new CircleVisualization(this);
    this.registerVisualization('default', visualization);
    this.currentVisualization = visualization;
    await visualization.initialize(this.parameters);
  }

  getParameterSchema() {
    return {
      structural: [
        {
          id: 'radius',
          type: 'slider',
          label: 'Radius',
          min: 10,
          max: 200,
          step: 5,
          default: 100
        }
      ],
      visual: [
        {
          id: 'fillColor',
          type: 'color',
          label: 'Fill Color',
          default: '#3498db'
        },
        {
          id: 'stroke',
          type: 'checkbox',
          label: 'Show Outline',
          default: true
        },
        {
          id: 'strokeColor',
          type: 'color',
          label: 'Outline Color',
          default: '#000000'
        }
      ]
    };
  }
}
