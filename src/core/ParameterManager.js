// src/core/ParameterManager.js

import { validateParameterSchema, ParameterType } from './ParameterSchema.js';

/**
 * Manages parameter validation and processing
 */
export class ParameterManager {
  /**
   * Create a new ParameterManager
   * @param {AppCore} core - Reference to the application core
   */
  constructor(core) {
    this.core = core;
  }
  
  /**
   * Validate a parameter value
   * @param {string} parameterId - Parameter ID
   * @param {any} value - Parameter value
   * @param {ParameterSchema} schema - Parameter schema
   * @returns {any} Validated and converted value
   */
  validateParameterValue(parameterId, value, schema) {
    // Validate schema
    validateParameterSchema(schema);
    
    // Find parameter definition
    const paramDef = this._findParameterDefinition(parameterId, schema);
    
    if (!paramDef) {
      console.error(`Parameter ${parameterId} not found in schema`);
      return value;
    }
    
    // Validate based on parameter type
    switch (paramDef.type) {
      case ParameterType.SLIDER:
      case ParameterType.NUMBER:
        return this._validateNumericValue(value, paramDef);
        
      case ParameterType.CHECKBOX:
        return !!value; // Convert to boolean
        
      case ParameterType.COLOR:
        return this._validateColorValue(value);
        
      case ParameterType.DROPDOWN:
        return this._validateDropdownValue(value, paramDef);
        
      case ParameterType.TEXT:
        return String(value); // Convert to string
        
      default:
        console.warn(`Unknown parameter type: ${paramDef.type}`);
        return value;
    }
  }
  
  /**
   * Find parameter definition in schema
   * @param {string} parameterId - Parameter ID
   * @param {ParameterSchema} schema - Parameter schema
   * @returns {ParameterDefinition|null} Parameter definition or null if not found
   * @private
   */
  _findParameterDefinition(parameterId, schema) {
    // Check structural parameters
    if (schema.structural) {
      const structParam = schema.structural.find(p => p.id === parameterId);
      if (structParam) return structParam;
    }
    
    // Check visual parameters
    if (schema.visual) {
      const visualParam = schema.visual.find(p => p.id === parameterId);
      if (visualParam) return visualParam;
    }
    
    return null;
  }
  
  /**
   * Validate numeric value
   * @param {any} value - Value to validate
   * @param {ParameterDefinition} paramDef - Parameter definition
   * @returns {number} Validated numeric value
   * @private
   */
  _validateNumericValue(value, paramDef) {
    // Convert to number
    let numValue = Number(value);
    
    // Check if valid number
    if (isNaN(numValue)) {
      console.warn(`Invalid numeric value: ${value}, using default: ${paramDef.default}`);
      return paramDef.default;
    }
    
    // Apply min/max constraints
    if (paramDef.min !== undefined && numValue < paramDef.min) {
      numValue = paramDef.min;
    }
    
    if (paramDef.max !== undefined && numValue > paramDef.max) {
      numValue = paramDef.max;
    }
    
    // Apply step constraint if specified
    if (paramDef.step !== undefined && paramDef.step > 0) {
      // Round to nearest step
      numValue = Math.round(numValue / paramDef.step) * paramDef.step;
      
      // Fix floating point precision issues
      const stepDecimals = this._countDecimals(paramDef.step);
      if (stepDecimals > 0) {
        numValue = parseFloat(numValue.toFixed(stepDecimals));
      }
    }
    
    return numValue;
  }
  
  /**
   * Validate color value
   * @param {string} value - Color value
   * @returns {string} Validated color value
   * @private
   */
  _validateColorValue(value) {
    // Simple validation for hex color
    if (typeof value === 'string' && /^#[0-9A-F]{6}$/i.test(value)) {
      return value;
    }
    
    // Try to convert to hex color
    if (typeof value === 'string') {
      try {
        // Create temporary element to convert color names to hex
        const elem = document.createElement('div');
        elem.style.color = value;
        document.body.appendChild(elem);
        
        // Get computed hex
        const computedColor = window.getComputedStyle(elem).color;
        document.body.removeChild(elem);
        
        // Convert rgb to hex if needed
        if (computedColor.startsWith('rgb')) {
          const rgb = computedColor.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const hex = `#${parseInt(rgb[0]).toString(16).padStart(2, '0')}${
              parseInt(rgb[1]).toString(16).padStart(2, '0')}${
              parseInt(rgb[2]).toString(16).padStart(2, '0')}`;
            return hex;
          }
        }
        
        // Return as is if we couldn't convert
        return value;
      } catch (e) {
        console.warn(`Invalid color value: ${value}`);
        return '#000000'; // Default to black
      }
    }
    
    console.warn(`Invalid color value: ${value}`);
    return '#000000'; // Default to black
  }
  
  /**
   * Validate dropdown value
   * @param {string} value - Selected value
   * @param {ParameterDefinition} paramDef - Parameter definition
   * @returns {string} Validated dropdown value
   * @private
   */
  _validateDropdownValue(value, paramDef) {
    if (!paramDef.options || !Array.isArray(paramDef.options) || paramDef.options.length === 0) {
      console.warn(`No options defined for dropdown parameter: ${paramDef.id}`);
      return paramDef.default;
    }
    
    // Check if value is in options
    const options = paramDef.options.map(opt => {
      if (typeof opt === 'object' && opt.value !== undefined) {
        return opt.value;
      }
      return opt;
    });
    
    if (options.includes(value)) {
      return value;
    }
    
    console.warn(`Invalid dropdown value: ${value}, using default: ${paramDef.default}`);
    return paramDef.default;
  }
  
  /**
   * Count decimal places in a number
   * @param {number} num - Number to check
   * @returns {number} Number of decimal places
   * @private
   */
  _countDecimals(num) {
    if (Math.floor(num) === num) return 0;
    return num.toString().split('.')[1].length || 0;
  }
  
  /**
   * Get default parameters from schema
   * @param {ParameterSchema} schema - Parameter schema
   * @returns {Object} Default parameter values
   */
  getDefaultParameters(schema) {
    const defaults = {};
    
    // Add structural parameters
    if (schema.structural) {
      schema.structural.forEach(param => {
        defaults[param.id] = param.default;
      });
    }
    
    // Add visual parameters
    if (schema.visual) {
      schema.visual.forEach(param => {
        defaults[param.id] = param.default;
      });
    }
    
    return defaults;
  }
}
