import { Plugin } from '../../core/Plugin.js'; // Assuming Plugin class is located here

/**
 * SimplePolygonPlugin Class
 *
 * This plugin demonstrates drawing a regular polygon using Konva within the
 * Math Visualization Framework. It allows users to adjust the number of sides,
 * radius, and fill color of the polygon.
 */
export default class SimplePolygonPlugin extends Plugin {
  // --- Static Properties ---
  // These properties are required by the framework to identify and categorize the plugin.

  static id = 'simple-polygon'; // Unique identifier for the plugin
  static name = 'Simple Polygon Gemini'; // Display name for the plugin in the UI
  static description = 'Draws a regular polygon with adjustable properties.'; // Tooltip or description
  static renderingType = '2d'; // Specifies that this plugin uses the 2D (Konva) rendering environment

  // --- Constructor ---
  // Initializes the plugin instance.

  constructor(core) {
    super(core); // Call the base Plugin constructor

    // --- Instance Properties ---
    // Initialize plugin-specific properties.

    /** @type {import('konva/lib/Group').Group | null} */
    this.polygonGroup = null; // Konva group to hold the polygon shape

    /** @type {import('konva/lib/shapes/RegularPolygon').RegularPolygon | null} */
    this.polygonShape = null; // The Konva RegularPolygon shape instance
  }

  // --- Lifecycle Methods ---

  /**
   * start()
   *
   * Called by the framework when the plugin is loaded and the rendering environment is ready.
   * This is where you initialize parameters, actions, and rendering objects.
   */
  async start() {
    // --- 1. Add Parameters ---
    // Use helper methods provided by the base Plugin class to add UI controls.

    // Slider for the number of sides (e.g., triangle, square, pentagon, etc.)
    this.addSlider('sides', 'Sides', 6, { min: 3, max: 12, step: 1 }, 'visual');

    // Slider for the radius of the polygon
    this.addSlider('radius', 'Radius', 100, { min: 10, max: 200, step: 5 }, 'visual');

    // Color picker for the polygon's fill color
    this.addColor('fillColor', 'Fill Color', '#3498db', 'visual');

    // --- 2. Set up Konva Objects ---
    // Access the Konva environment provided by the framework.
    const { stage, layer, konva } = this.renderEnv; // Destructure Konva objects from renderEnv

    // Create a Konva Group to contain the polygon. Groups help organize shapes.
    this.polygonGroup = new konva.Group();

    // Create the Konva RegularPolygon shape.
    // Initial properties will be set in drawPolygon().
    this.polygonShape = new konva.RegularPolygon({
      x: stage.width() / 2, // Center horizontally initially
      y: stage.height() / 2, // Center vertically initially
      sides: this.getParameter('sides'),
      radius: this.getParameter('radius'),
      fill: this.getParameter('fillColor'),
      stroke: '#2c3e50', // Add a dark stroke for better visibility
      strokeWidth: 2,
    });

    // Add the polygon shape to the group
    this.polygonGroup.add(this.polygonShape);

    // Add the group to the main layer provided by the framework
    layer.add(this.polygonGroup);

    // --- 3. Initial Draw ---
    // Draw the polygon with the initial parameter values.
    this.drawPolygon();

    // No animation loop needed for this static example,
    // but you could start one with this.requestAnimation(this.animate.bind(this));
  }

  /**
   * drawPolygon()
   *
   * Updates the properties of the Konva RegularPolygon shape based on
   * the current parameter values and redraws the layer.
   */
  drawPolygon() {
    // Ensure the shape and environment exist before proceeding
    if (!this.polygonShape || !this.renderEnv || !this.renderEnv.stage) {
      console.warn('Polygon shape or rendering environment not ready.');
      return;
    }

    // Get current parameter values
    const sides = this.getParameter('sides');
    const radius = this.getParameter('radius');
    const fillColor = this.getParameter('fillColor');

    // Get stage dimensions for centering
    const { stage, layer } = this.renderEnv;
    const stageWidth = stage.width();
    const stageHeight = stage.height();

    // Update the polygon shape's properties
    this.polygonShape.setAttrs({
      x: stageWidth / 2, // Keep centered horizontally
      y: stageHeight / 2, // Keep centered vertically
      sides: sides,
      radius: radius,
      fill: fillColor,
      // Stroke and strokeWidth are kept constant here, but could also be parameters
    });

    // Redraw the layer to display the changes
    // batchDraw is more efficient than draw for multiple changes
    layer.batchDraw();
  }

  /**
   * onParameterChanged(parameterId, value, group)
   *
   * Called by the framework whenever a parameter's value is changed by the user via the UI.
   *
   * @param {string} parameterId - The ID of the parameter that changed.
   * @param {*} value - The new value of the parameter.
   * @param {string} group - The group the parameter belongs to ('visual', 'structural', 'advanced').
   */
  onParameterChanged(parameterId, value, group) {
    // Check if any of the relevant parameters changed
    if (parameterId === 'sides' || parameterId === 'radius' || parameterId === 'fillColor') {
      // Redraw the polygon to reflect the change
      this.drawPolygon();
    }
    // Note: No need to call layer.batchDraw() here, as drawPolygon() already does it.
  }

   /**
   * handleInteraction(type, data)
   *
   * Called by the framework on user interactions like clicks or mouse wheel events
   * on the rendering canvas.
   *
   * @param {string} type - The type of interaction (e.g., 'click', 'wheel', 'drag').
   * @param {object} data - Data associated with the event (e.g., coordinates, delta).
   */
  handleInteraction(type, data) {
    // Example: Log clicks on the canvas
    if (type === 'click') {
      console.log(`Canvas clicked at (${data.x.toFixed(2)}, ${data.y.toFixed(2)})`);
      // You could add logic here, e.g., change color on click
      // const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
      // this.setParameter('fillColor', randomColor);
    }

     // Example: Use built-in camera controls for zooming with the mouse wheel
     if (type === 'wheel' && this.renderEnv && this.renderEnv.zoomCamera) {
        const { deltaY, x, y } = data;
        const zoomFactor = deltaY > 0 ? 0.95 : 1.05; // Zoom out if deltaY > 0, zoom in otherwise
        this.renderEnv.zoomCamera(zoomFactor, x, y); // Zoom centered on the mouse pointer
     }
  }


  /**
   * unload()
   *
   * Called by the framework just before the plugin is removed or replaced.
   * This is where you should clean up any resources created by the plugin
   * (e.g., Konva objects, event listeners, timers).
   */
  async unload() {
    // --- 1. Call Base Class unload ---
    // This is crucial to ensure the framework cleans up its resources (e.g., animation loops, event listeners).
    await super.unload();

    // --- 2. Clean up Plugin-Specific Resources ---
    // Destroy the Konva group and its children (the polygon shape).
    if (this.polygonGroup) {
      this.polygonGroup.destroy(); // This removes the group and its children from the layer and cleans up memory
      this.polygonGroup = null; // Clear the reference
      this.polygonShape = null; // Clear the shape reference as it's destroyed with the group
      console.log('SimplePolygonPlugin: Konva objects destroyed.');
    }

    // No need to explicitly call layer.batchDraw() during unload,
    // as the framework will likely clear or reset the layer.
  }
}
