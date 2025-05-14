#!/bin/bash
# Reorganization script for math-visualizer

# Create backup of current structure
echo "Creating backup..."
mkdir -p backup
cp -r src backup/
cp -r plugins backup/
cp -r vendors backup/
cp index.html backup/ 2>/dev/null || true

# Create new directories in React project
echo "Creating directory structure..."
mkdir -p react-ui/src/lib/core
mkdir -p react-ui/src/lib/rendering
mkdir -p react-ui/src/lib/ui
mkdir -p react-ui/src/lib/plugins
mkdir -p react-ui/public/vendors

# Copy core files to their new locations
echo "Copying core files to React structure..."
cp -r src/core/* react-ui/src/lib/core/
cp -r src/rendering/* react-ui/src/lib/rendering/
cp -r src/ui/* react-ui/src/lib/ui/
cp -r plugins/* react-ui/src/lib/plugins/

# Copy vendor files to public
echo "Copying vendor files..."
cp -r vendors/* react-ui/public/vendors/

# Copy documentation and other important files
echo "Copying documentation and other files..."
cp -r Documentation react-ui/public/ 2>/dev/null || true
cp -r DevGuides react-ui/public/ 2>/dev/null || true
cp readme.md react-ui/public/ 2>/dev/null || true
cp planned_features.md react-ui/public/ 2>/dev/null || true

# Move all React files to root level
echo "Moving React files to root..."
# First create a temporary list of files to move
find react-ui -maxdepth 1 -not -name "src" -not -name "public" -not -name "node_modules" -not -name "react-ui" -exec basename {} \; > /tmp/files_to_move.txt

# Now move those files
mkdir -p new_root
while IFS= read -r file; do
    cp -r "react-ui/$file" new_root/ 2>/dev/null || true
done < /tmp/files_to_move.txt

# Move the entire src and public directories
cp -r react-ui/src new_root/
cp -r react-ui/public new_root/

# Update visualization-bridge.js
echo "Updating import paths..."
if [ -f "new_root/src/utils/visualization-bridge.js" ]; then
    sed -i 's|@core/AppCore|../lib/core/AppCore|g' new_root/src/utils/visualization-bridge.js
    sed -i 's|import { AppCore } from "\.\.\/\.\.\/\.\.\/src\/core\/AppCore\.js"|import { AppCore } from "../lib/core/AppCore.js"|g' new_root/src/utils/visualization-bridge.js
fi

# Update package.json to include GitHub Pages configuration
echo "Updating package.json for GitHub Pages..."
if [ -f "new_root/package.json" ]; then
    # Add homepage and deploy scripts if they don't exist
    sed -i '/"name":/a \  "homepage": "https://yourusername.github.io/math-visualizer",' new_root/package.json
    sed -i '/"scripts":/a \    "predeploy": "npm run build",\n    "deploy": "gh-pages -d build",' new_root/package.json
fi

echo "Reorganization complete!"
echo "The new project structure is in the 'new_root' directory."
echo "After verifying everything looks good, you can move these files to your actual project root."
echo "Remember to install gh-pages package with: npm install --save-dev gh-pages"
