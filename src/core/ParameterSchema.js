// src/core/ParameterSchema.js

/**
 * @typedef {Object} ParameterDefinition
 * @property {string} id - Unique parameter identifier
 * @property {string} type - Parameter control type
 * @property {string} label - Human-readable label
 * @property {any} default - Default value
 * @property {number} [min] - Minimum value (for numeric controls)
 * @property {number} [max] - Maximum value (for numeric controls)
 * @property {number} [step] - Step value (for numeric controls)
 * @property {string[]|Object[]} [options] - Options for dropdown controls
 */

/**
 * @typedef {Object} Action
 * @property {string} id - Unique action identifier
 * @property {string} label - Human-readable label
 * @property {string} [icon] - Optional icon identifier
 * @property {string} [shortcut] - Optional keyboard shortcut
 */

/**
 * Parameter control types
 * @enum {string}
 */
export const ParameterType = {
  SLIDER: 'slider',
  CHECKBOX: 'checkbox',
  COLOR: 'color',
  DROPDOWN: 'dropdown',
  NUMBER: 'number',
  TEXT: 'text'
};

/**
 * Validate parameter definitions
 * @param {ParameterDefinition[]} parameters - Parameters to validate
 * @returns {boolean} Whether the parameters are valid
 * @throws {Error} If the parameters are invalid
 */
export function validateParameters(parameters) {
  if (!parameters) {
    throw new Error("Parameters are required");
  }
  
  if (!Array.isArray(parameters)) {
    throw new Error("Parameters must be an array");
  }
  
  // Validate individual parameters
  parameters.forEach(validateParameter);
  
  return true;
}

/**
 * Validate a single parameter definition
 * @param {ParameterDefinition} param - Parameter to validate
 * @throws {Error} If the parameter is invalid
 */
function validateParameter(param) {
  if (!param.id) throw new Error("Parameter must have an id");
  if (!param.type) throw new Error(`Parameter ${param.id} must have a type`);
  if (!param.label) throw new Error(`Parameter ${param.id} must have a label`);
  if (param.default === undefined) throw new Error(`Parameter ${param.id} must have a default value`);
  
  // Validate type-specific properties
  switch (param.type) {
    case ParameterType.SLIDER:
    case ParameterType.NUMBER:
      if (param.min === undefined) throw new Error(`Parameter ${param.id} must have a min value`);
      if (param.max === undefined) throw new Error(`Parameter ${param.id} must have a max value`);
      break;
      
    case ParameterType.DROPDOWN:
      if (!param.options || !Array.isArray(param.options) || param.options.length === 0) {
        throw new Error(`Parameter ${param.id} must have options array`);
      }
      break;
  }
}

/**
 * Get default values from parameter definitions
 * @param {ParameterDefinition[]} parameters - Parameter definitions
 * @returns {Object} Default parameter values
 */
export function getDefaultParameterValues(parameters) {
  const defaults = {};
  
  if (Array.isArray(parameters)) {
    parameters.forEach(param => {
      if (param && param.id !== undefined && param.default !== undefined) {
        defaults[param.id] = param.default;
      }
    });
  }
  
  return defaults;
}