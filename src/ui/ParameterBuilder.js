/**
 * Builder class for creating parameter definitions with a fluent interface
 */
export class ParameterBuilder {
  /**
   * Create a new ParameterBuilder
   */
  constructor() {
    this.parameters = [];
  }

  /**
   * Add a slider parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {number} defaultValue - Default value
   * @param {Object} options - Options like min, max, step
   * @returns {ParameterBuilder} This builder for chaining
   */
  addSlider(id, label, defaultValue, options = {}) {
    const param = {
      id,
      type: 'slider',
      label,
      default: defaultValue,
      min: options.min !== undefined ? options.min : 0,
      max: options.max !== undefined ? options.max : 100,
      step: options.step !== undefined ? options.step : 1
    };

    this.parameters.push(param);
    return this;
  }

  /**
   * Add a checkbox parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {boolean} defaultValue - Default value
   * @returns {ParameterBuilder} This builder for chaining
   */
  addCheckbox(id, label, defaultValue) {
    const param = {
      id,
      type: 'checkbox',
      label,
      default: defaultValue
    };

    this.parameters.push(param);
    return this;
  }

  /**
   * Add a color picker parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {string} defaultValue - Default color value
   * @returns {ParameterBuilder} This builder for chaining
   */
  addColor(id, label, defaultValue) {
    const param = {
      id,
      type: 'color',
      label,
      default: defaultValue
    };

    this.parameters.push(param);
    return this;
  }

  /**
   * Add a dropdown parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {string} defaultValue - Default selected value
   * @param {Array} options - Array of options (strings or {value, label} objects)
   * @returns {ParameterBuilder} This builder for chaining
   */
  addDropdown(id, label, defaultValue, options) {
    const param = {
      id,
      type: 'dropdown',
      label,
      default: defaultValue,
      options
    };

    this.parameters.push(param);
    return this;
  }

  /**
   * Add a number input parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {number} defaultValue - Default value
   * @param {Object} options - Options like min, max, step
   * @returns {ParameterBuilder} This builder for chaining
   */
  addNumber(id, label, defaultValue, options = {}) {
    const param = {
      id,
      type: 'number',
      label,
      default: defaultValue
    };

    if (options.min !== undefined) param.min = options.min;
    if (options.max !== undefined) param.max = options.max;
    if (options.step !== undefined) param.step = options.step;

    this.parameters.push(param);
    return this;
  }

  /**
   * Add a text input parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {string} defaultValue - Default value
   * @returns {ParameterBuilder} This builder for chaining
   */
  addText(id, label, defaultValue) {
    const param = {
      id,
      type: 'text',
      label,
      default: defaultValue
    };

    this.parameters.push(param);
    return this;
  }

  /**
   * Build the parameter array
   * @returns {Array} Array of parameter definitions
   */
  build() {
    return this.parameters;
  }
}

/**
 * Create a new parameter builder
 * @returns {ParameterBuilder} New parameter builder instance
 */
export function createParameters() {
  return new ParameterBuilder();
}