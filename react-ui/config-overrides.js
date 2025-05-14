const path = require('path');

module.exports = function override(config) {
  // Add resolve aliases
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      '@core': path.resolve(__dirname, '../src/core'),
      '@ui': path.resolve(__dirname, '../src/ui'),
      '@plugins': path.resolve(__dirname, '../src/plugins')
    }
  };
  
  return config;
};

