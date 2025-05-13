import { Plugin } from '../../core/Plugin.js';

export default class TestPlugin extends Plugin {
  static id = 'framework-test-plugin';
  static name = 'Framework Test Plugin';
  static description = 'Tests all framework capabilities';
  static renderingType = '2d';
  
  constructor(core) {
    super(core);
    this.testResults = {};
  }
  
  async start() {
    // Test parameter API
    this.addSlider('testSlider', 'Test Slider', 50, { min: 0, max: 100 });
    this.addCheckbox('testBox', 'Test Checkbox', true);
    this.addColor('testColor', 'Test Color', '#ff0000');
    this.addDropdown('testDropdown', 'Test Dropdown', 'option1', ['option1', 'option2']);
    
    // Test action API
    this.addAction('testAction', 'Run Tests', () => this.runTests());
    
    // Test rendering environment
    this.setupTestShapes();
    
    // Test animation
    this.testAnimation = this.requestAnimation(this.animate.bind(this));
    
    console.log('Test plugin initialized');
  }
  
  setupTestShapes() {
    const { stage, layer, konva } = this.renderEnv;
    
    // Create test shapes
    this.testGroup = new konva.Group();
    
    // Add various shapes to test different capabilities
    this.testRect = new konva.Rect({
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      fill: this.getParameter('testColor'),
      draggable: true
    });
    
    // Add to layer
    this.testGroup.add(this.testRect);
    layer.add(this.testGroup);
    layer.batchDraw();
  }
  
  animate(deltaTime) {
    // Test animation functionality
    const rect = this.testRect;
    if (rect) {
      rect.rotate(45 * deltaTime);
    }
    
    return true;
  }
  
  runTests() {
    // Run a series of functional tests
    this.testResults = {
      parameterGet: this.testParameterGet(),
      parameterSet: this.testParameterSet(),
      animation: !!this.testAnimation,
      rendering: !!this.testRect && !!this.testGroup,
      // Add more tests as needed
    };
    
    console.log('Test results:', this.testResults);
    return this.testResults;
  }
  
  testParameterGet() {
    return this.getParameter('testSlider') === 50;
  }
  
  testParameterSet() {
    this.setParameter('testSlider', 75);
    return this.getParameter('testSlider') === 75;
  }
}