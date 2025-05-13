import { Plugin } from '../../core/Plugin.js';

export default class PolygonPlugin extends Plugin {
  static id = 'polygon-plugin';
  static name = 'Polygon Drawer Chatgpt';
  static description = 'Draws a regular n-sided polygon centered on the canvas.';
  static renderingType = '2d';

  constructor(core) {
    super(core);
    this.polygon = null;
  }

  async start() {
    // Register parameters
    this.addNumber('sides', 'Number of Sides', 5, { min: 3, max: 12, step: 1 }, 'structural');
    this.addNumber('radius', 'Radius (px)', 100, { min: 10, max: 400, step: 5 }, 'structural');
    this.addColor('fillColor', 'Fill Color', '#00bfff', 'visual');
    this.addColor('strokeColor', 'Stroke Color', '#000000', 'visual');
    this.addNumber('strokeWidth', 'Stroke Width', 2, { min: 0, max: 10, step: 1 }, 'visual');
    this.addCheckbox('rotate', 'Auto-Rotate', false, 'advanced');
    this.addNumber('rotationSpeed', 'Rotation Speed', 30, { min: 1, max: 360, step: 1 }, 'advanced');

    // Prepare Konva objects
    const { stage, layer, konva } = this.renderEnv;
    this._createPolygon();
    layer.add(this.polygon);
    layer.batchDraw();

    // Hook animation if rotating
    this._animId = this.requestAnimation((dt) => this._animate(dt));
  }

  _createPolygon() {
    const { stage, konva } = this.renderEnv;
    const sides = this.getParameter('sides');
    const radius = this.getParameter('radius');
    const fill = this.getParameter('fillColor');
    const stroke = this.getParameter('strokeColor');
    const strokeWidth = this.getParameter('strokeWidth');

    const angleStep = (Math.PI * 2) / sides;
    const points = [];
    for (let i = 0; i < sides; i++) {
      const theta = -Math.PI / 2 + i * angleStep;
      const x = stage.width() / 2 + Math.cos(theta) * radius;
      const y = stage.height() / 2 + Math.sin(theta) * radius;
      points.push(x, y);
    }

    // If polygon exists, destroy and replace
    if (this.polygon) this.polygon.destroy();

    this.polygon = new konva.Line({
      points,
      fill,
      stroke,
      strokeWidth,
      closed: true,
    });
  }

  _animate(deltaTime) {
    if (this.getParameter('rotate')) {
      const speed = this.getParameter('rotationSpeed');
      // rotate speed degrees per second
      this.polygon.rotate((speed * deltaTime) / 1000);
      this.renderEnv.layer.batchDraw();
    }
    return true;
  }

  onParameterChanged(id, value) {
    // Redraw polygon on any relevant change
    if (['sides','radius','fillColor','strokeColor','strokeWidth'].includes(id)) {
      this._createPolygon();
      this.renderEnv.layer.batchDraw();
    }
  }

  handleInteraction(type, data) {
    // On click, increase sides by 1 (wrap at max)
    if (type === 'click') {
      let s = this.getParameter('sides');
      s = s < 12 ? s + 1 : 3;
      this.setParameter('sides', s);
    }
  }

  async unload() {
    if (this._animId) this.cancelAnimation(this._animId);
    if (this.polygon) this.polygon.destroy();
    await super.unload();
  }
}