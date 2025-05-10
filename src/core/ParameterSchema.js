// src/core/ParameterSchema.js

/**
 * @typedef {Object} ParameterSchema
 * @property {ParameterDefinition[]} structural - Structural parameters
 * @property {ParameterDefinition[]} visual - Visual parameters
 */

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
 * Validate parameter schema
 * @param {ParameterSchema} schema - Schema to validate
 * @returns {boolean} Whether the schema is valid
 * @throws {Error} If the schema is invalid
 */
export function validateParameterSchema(schema) {
  if (!schema) {
    throw new Error("Parameter schema is required");
  }
  
  if (!schema.structural && !schema.visual) {
    throw new Error("Parameter schema must have at least one of: structural, visual");
  }
  
  // Validate structural parameters
  if (schema.structural && !Array.isArray(schema.structural)) {
    throw new Error("Structural parameters must be an array");
  }
  
  // Validate visual parameters
  if (schema.visual && !Array.isArray(schema.visual)) {
    throw new Error("Visual parameters must be an array");
  }
  
  // Validate individual parameters
  const validateParam = (param) => {
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
  };
  
  // Check all parameters
  if (schema.structural) {
    schema.structural.forEach(validateParam);
  }
  
  if (schema.visual) {
    schema.visual.forEach(validateParam);
  }
  
  return true;
}

/**
 * Get default values from parameter schema
 * @param {ParameterSchema} schema - Parameter schema
 * @returns {Object} Default parameter values
 */
export function getDefaultParameterValues(schema) {
  const defaults = {};
  
  if (schema.structural) {
    schema.structural.forEach(param => {
      defaults[param.id] = param.default;
    });
  }
  
  if (schema.visual) {
    schema.visual.forEach(param => {
      defaults[param.id] = param.default;
    });
  }
  
  return defaults;
}