// src/plugins/circle-plugin/CircleVisualization.js
import { Visualization } from '../../core/Visualization.js';

export class CircleVisualization extends Visualization {
  constructor(plugin) {
    super(plugin);
  }

  async initialize(parameters) {
    return true;
  }

  render2D(ctx, parameters) {
    // Draw a circle
    ctx.fillStyle = parameters.fillColor;
    ctx.beginPath();
    ctx.arc(0, 0, parameters.radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (parameters.stroke) {
      ctx.strokeStyle = parameters.strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
