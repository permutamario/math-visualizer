// src/ui/ParameterBuilder.js

/**
 * Builder class for creating parameter schemas with a fluent interface
 */
export class ParameterBuilder {
  /**
   * Create a new ParameterBuilder
   */
  constructor() {
    this.structural = [];
    this.visual = [];
  }

  /**
   * Add a slider parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {number} defaultValue - Default value
   * @param {Object} options - Options like min, max, step
   * @param {string} [category='structural'] - 'structural' or 'visual'
   * @returns {ParameterBuilder} This builder for chaining
   */
  addSlider(id, label, defaultValue, options = {}, category = 'structural') {
    const param = {
      id,
      type: 'slider',
      label,
      default: defaultValue,
      min: options.min !== undefined ? options.min : 0,
      max: options.max !== undefined ? options.max : 100,
      step: options.step !== undefined ? options.step : 1
    };

    if (category === 'visual') {
      this.visual.push(param);
    } else {
      this.structural.push(param);
    }

    return this;
  }

  /**
   * Add a checkbox parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {boolean} defaultValue - Default value
   * @param {string} [category='visual'] - 'structural' or 'visual'
   * @returns {ParameterBuilder} This builder for chaining
   */
  addCheckbox(id, label, defaultValue, category = 'visual') {
    const param = {
      id,
      type: 'checkbox',
      label,
      default: defaultValue
    };

    if (category === 'structural') {
      this.structural.push(param);
    } else {
      this.visual.push(param);
    }

    return this;
  }

  /**
   * Add a color picker parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {string} defaultValue - Default color value
   * @param {string} [category='visual'] - 'structural' or 'visual'
   * @returns {ParameterBuilder} This builder for chaining
   */
  addColor(id, label, defaultValue, category = 'visual') {
    const param = {
      id,
      type: 'color',
      label,
      default: defaultValue
    };

    if (category === 'structural') {
      this.structural.push(param);
    } else {
      this.visual.push(param);
    }

    return this;
  }

  /**
   * Add a dropdown parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {string} defaultValue - Default selected value
   * @param {Array} options - Array of options (strings or {value, label} objects)
   * @param {string} [category='structural'] - 'structural' or 'visual'
   * @returns {ParameterBuilder} This builder for chaining
   */
  addDropdown(id, label, defaultValue, options, category = 'structural') {
    const param = {
      id,
      type: 'dropdown',
      label,
      default: defaultValue,
      options
    };

    if (category === 'visual') {
      this.visual.push(param);
    } else {
      this.structural.push(param);
    }

    return this;
  }

  /**
   * Add a number input parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {number} defaultValue - Default value
   * @param {Object} options - Options like min, max, step
   * @param {string} [category='structural'] - 'structural' or 'visual'
   * @returns {ParameterBuilder} This builder for chaining
   */
  addNumber(id, label, defaultValue, options = {}, category = 'structural') {
    const param = {
      id,
      type: 'number',
      label,
      default: defaultValue
    };

    if (options.min !== undefined) param.min = options.min;
    if (options.max !== undefined) param.max = options.max;
    if (options.step !== undefined) param.step = options.step;

    if (category === 'visual') {
      this.visual.push(param);
    } else {
      this.structural.push(param);
    }

    return this;
  }

  /**
   * Add a text input parameter
   * @param {string} id - Parameter ID
   * @param {string} label - Display label
   * @param {string} defaultValue - Default value
   * @param {string} [category='structural'] - 'structural' or 'visual'
   * @returns {ParameterBuilder} This builder for chaining
   */
  addText(id, label, defaultValue, category = 'structural') {
    const param = {
      id,
      type: 'text',
      label,
      default: defaultValue
    };

    if (category === 'visual') {
      this.visual.push(param);
    } else {
      this.structural.push(param);
    }

    return this;
  }

  /**
   * Build the parameter schema
   * @returns {Object} Parameter schema with structural and visual sections
   */
  build() {
    return {
      structural: this.structural,
      visual: this.visual
    };
  }
}

/**
 * Create a new parameter builder
 * @returns {ParameterBuilder} New parameter builder instance
 */
export function createParameters() {
  return new ParameterBuilder();
}