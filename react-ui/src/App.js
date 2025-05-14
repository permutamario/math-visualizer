import React, { useState, useEffect } from 'react';
import { DesktopLayout, MobileLayout } from './components/layouts';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import { ThemeProvider } from './contexts/ThemeContext';
import VisualizationContainer from './components/VisualizationContainer';
import visualizationBridge from './utils/visualization-bridge';
import './App.css';

function App() {
  const { isMobile } = useDeviceDetection();
  const [plugins, setPlugins] = useState([]);
  const [activePluginId, setActivePluginId] = useState('wave-plugin'); // Default plugin
  const [activePlugin, setActivePlugin] = useState(null);
  const [showPluginSelector, setShowPluginSelector] = useState(false);
  const [visualParams, setVisualParams] = useState({});
  const [structuralParams, setStructuralParams] = useState({});
  const [actions, setActions] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);

  // Handle parameter changes from the visualization engine
  const handleParameterChange = (parameterId, value, group) => {
    if (group === 'visual') {
      setVisualParams(prev => ({ ...prev, [parameterId]: value }));
    } else if (group === 'structural') {
      setStructuralParams(prev => ({ ...prev, [parameterId]: value }));
    }
  };

  // Handle plugin loading
  const handlePluginLoaded = (core) => {
    // Get available plugins
    const availablePlugins = visualizationBridge.getPlugins();
    setPlugins(availablePlugins);
    
    // Find active plugin
    const currentPlugin = availablePlugins.find(p => p.id === activePluginId) || availablePlugins[0];
    setActivePlugin(currentPlugin);
    
    // Get parameters
    const visualParamGroup = visualizationBridge.getParameters('visual');
    const structuralParamGroup = visualizationBridge.getParameters('structural');
    
    setVisualParams(visualParamGroup.values || {});
    setStructuralParams(structuralParamGroup.values || {});
    
    // Get actions
    setActions(visualizationBridge.getActions());
  };

  // Handle plugin selection
  const handlePluginSelect = (pluginId) => {
    setActivePluginId(pluginId);
    setShowPluginSelector(false);
  };

  // Handle visual parameter changes
  const handleVisualParamChange = (id, value) => {
    visualizationBridge.setParameter(id, value, 'visual');
    setVisualParams(prev => ({ ...prev, [id]: value }));
  };

  // Handle structural parameter changes
  const handleStructuralParamChange = (id, value) => {
    visualizationBridge.setParameter(id, value, 'structural');
    setStructuralParams(prev => ({ ...prev, [id]: value }));
  };

  // Handle action click
  const handleActionClick = (actionId) => {
    visualizationBridge.executeAction(actionId);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  return (
    <ThemeProvider>
      <div className="h-screen w-screen overflow-hidden">
        <div className="relative h-full bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
          {/* Visualization Container */}
          <VisualizationContainer 
            pluginId={activePluginId}
            onPluginLoaded={handlePluginLoaded}
            onParameterChange={handleParameterChange}
            className="absolute inset-0"
          />
          
          {/* UI Layout */}
          {isMobile ? (
            <MobileLayout
              activePlugin={activePlugin || { name: 'Loading...' }}
              showPluginSelector={showPluginSelector}
              setShowPluginSelector={setShowPluginSelector}
              plugins={plugins}
              handlePluginSelect={handlePluginSelect}
              visualParams={visualParams}
              handleVisualParamChange={handleVisualParamChange}
              structuralParams={structuralParams}
              handleStructuralParamChange={handleStructuralParamChange}
              actions={actions}
              handleActionClick={handleActionClick}
              fullscreen={fullscreen}
              toggleFullscreen={toggleFullscreen}
            />
          ) : (
            <DesktopLayout
              activePlugin={activePlugin || { name: 'Loading...' }}
              showPluginSelector={showPluginSelector}
              setShowPluginSelector={setShowPluginSelector}
              plugins={plugins}
              handlePluginSelect={handlePluginSelect}
              visualParams={visualParams}
              handleVisualParamChange={handleVisualParamChange}
              structuralParams={structuralParams}
              handleStructuralParamChange={handleStructuralParamChange}
              actions={actions}
              handleActionClick={handleActionClick}
              fullscreen={fullscreen}
              toggleFullscreen={toggleFullscreen}
            />
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
