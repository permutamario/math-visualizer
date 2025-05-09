// src/plugins/polytope-viewer/settings/settingsManager.js
// Manages dynamic settings for polytopes

/**
 * Get the base settings metadata for the polytope viewer
 * @param {string[]} availablePolytopes - List of available polytope types
 * @returns {Object} Base settings metadata
 */
export function getBaseSettingsMetadata(availablePolytopes = []) {
  // Process polytopes to group by category
  const categorizedPolytopes = {};
  availablePolytopes.forEach(type => {
    // Add category prefix if we have one
    const parts = type.split('_');
    if (parts.length > 1) {
      const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const name = parts.slice(1).join(' ');
      if (!categorizedPolytopes[category]) {
        categorizedPolytopes[category] = [];
      }
      categorizedPolytopes[category].push({
        value: type,
        label: formatName(name)
      });
    } else {
      if (!categorizedPolytopes['Other']) {
        categorizedPolytopes['Other'] = [];
      }
      categorizedPolytopes['Other'].push({
        value: type,
        label: formatName(type)
      });
    }
  });
  
  // Format options for dropdown based on categories
  let polytopeOptions = [];
  Object.entries(categorizedPolytopes).forEach(([category, items]) => {
    // Add category header
    polytopeOptions.push({ value: '', label: `--- ${category} ---`, disabled: true });
    // Add items in category
    polytopeOptions = polytopeOptions.concat(items);
  });
  
  if (polytopeOptions.length === 0) {
    polytopeOptions = availablePolytopes;
  }
  
  return {
    // Structural settings
    polytopeType: {
      type: 'structural',
      label: 'Polytope Type',
      control: 'dropdown',
      options: polytopeOptions.length > 0 ? polytopeOptions : ['cube'],
      default: availablePolytopes[0] || 'cube'
    },
    
    // Visual settings
    wireframe: {
      type: 'visual',
      label: 'Wireframe Mode',
      control: 'checkbox',
      default: false
    },
    showFaces: {
      type: 'visual',
      label: 'Show Faces',
      control: 'checkbox',
      default: true
    },
    faceColor: {
      type: 'visual',
      label: 'Face Color',
      control: 'color',
      default: '#3498db'
    },
    faceOpacity: {
      type: 'visual',
      label: 'Face Opacity',
      control: 'slider',
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.85
    },
    showVertices: {
      type: 'visual',
      label: 'Show Vertices',
      control: 'checkbox',
      default: true
    },
    vertexSize: {
      type: 'visual',
      label: 'Vertex Size',
      control: 'slider',
      min: 0.01,
      max: 0.5,
      step: 0.01,
      default: 0.1
    },
    edgeThickness: {
      type: 'visual',
      label: 'Edge Thickness',
      control: 'slider',
      min: 0.1,
      max: 5,
      step: 0.1,
      default: 1
    },
    edgeColor: {
      type: 'visual',
      label: 'Edge Color',
      control: 'color',
      default: '#000000'
    },
    animation: {
      type: 'visual',
      label: 'Auto-Rotate',
      control: 'checkbox',
      default: false
    }
  };
}

/**
 * Get polytope-specific settings metadata
 * @param {string} polytopeType - Type of polytope
 * @param {Object} builder - Builder object with defaults
 * @returns {Object} Polytope-specific settings metadata
 */
export function getPolytopeSpecificMetadata(polytopeType, builder) {
  if (!builder || !builder.defaults) {
    return {};
  }
  
  const metadata = {};
  
  // Process each parameter from the builder's defaults
  Object.entries(builder.defaults).forEach(([key, schema]) => {
    // Skip the type parameter if it's already handled by the polytopeType setting
    if (key === 'type') return;
    
    // Map the parameter schema to settings metadata
    metadata[key] = {
      type: 'structural',
      label: schema.name || formatName(key),
      control: schema.type || 'slider',
      default: schema.default,
      // Copy other properties as needed
      min: schema.min,
      max: schema.max,
      step: schema.step,
      options: schema.options
    };
    
    // Add description if available
    if (schema.description) {
      metadata[key].description = schema.description;
    }
  });
  
  return metadata;
}

/**
 * Format a parameter name for display
 * @param {string} name - Parameter name
 * @returns {string} Formatted name
 */
function formatName(name) {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
