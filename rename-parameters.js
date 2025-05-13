// rename-parameters.js
const fs = require('fs');
const path = require('path');

// Define the directory where your source code is located
const sourceDir = path.join(__dirname, 'src');

// Files to process (relative to sourceDir)
const filesToProcess = [
  'ui/UIManager.js',
  'core/AppCore.js',
  'ui/DesktopLayout.js',
  'ui/MobileLayout.js',
  'ui/styles/layout.css',
  'core/Plugin.js',
  // Add other files as needed
];

// Define the replacements to make
const replacements = [
  // Method names
  { from: /updateVisualParameterGroups/g, to: 'updateParameterGroups' },
  
  // Parameter group names
  { from: /structrualParameters/g, to: 'structuralParameters' }, // Fix typo
  { from: /visualizationParameters/g, to: 'structural' },
  { from: /pluginParameters/g, to: 'visual' },
  
  // CSS selectors and DOM IDs
  { from: /#plugin-panel/g, to: '#visual-panel' },
  { from: /#visualization-panel/g, to: '#structural-panel' },
  { from: /#export-panel/g, to: '#actions-panel' },
  
  // Variable and property names
  { from: /_pluginParameters/g, to: '_visualParameters' },
  { from: /_visualizationParameters/g, to: '_structuralParameters' },
  
  // UI strings and labels (be careful with these)
  { from: /'Plugin Parameters'/g, to: "'Visual Parameters'" },
  { from: /'Visualization Parameters'/g, to: "'Structural Parameters'" },
  { from: /'Export'/g, to: "'Actions'" },
  
  // Panel creation in layouts
  { from: /createPanel\('plugin-panel'/g, to: "createPanel('visual-panel'" },
  { from: /createPanel\('visualization-panel'/g, to: "createPanel('structural-panel'" },
  { from: /createPanel\('export-panel'/g, to: "createPanel('actions-panel'" },
];

// Process each file
filesToProcess.forEach(relativeFilePath => {
  const filePath = path.join(sourceDir, relativeFilePath);
  
  console.log(`Processing ${filePath}...`);
  
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply replacements
    replacements.forEach(replacement => {
      content = content.replace(replacement.from, replacement.to);
    });
    
    // Write modified content back to file
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`✓ Processed ${relativeFilePath}`);
  } catch (error) {
    console.error(`Error processing ${relativeFilePath}:`, error);
  }
});

console.log('Done!');
