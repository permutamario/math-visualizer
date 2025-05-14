// src/App.js
import React, { useState, useEffect } from 'react';
import './utils/libraryInit';  // Import library initialization early
import LoadingScreen from './components/common/LoadingScreen';
import { DesktopLayout, MobileLayout } from './components/layouts';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import visualizationBridge from './utils/visualization-bridge';
import VisualizationCanvas from './components/common/VisualizationCanvas';

function App() {
  // Application state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [activePlugin, setActivePlugin] = useState(null);
  const [plugins, setPlugins] = useState([]);
  const [showPluginSelector, setShowPluginSelector] = useState(false);
  
  // Parameters state
  const [visualParams, setVisualParams] = useState({
    amplitude: 50,
    frequency: 20,
    showPoints: true,
    color: '#4285f4'
  });
  
  const [structuralParams, setStructuralParams] = useState({
    resolution: 100,
    layers: 3,
    renderQuality: 'medium'
  });
  
  // Actions array for buttons
  const [actions, setActions] = useState([
    { id: 'reset', label: 'Reset View' },
    { id: 'export', label: 'Export Image' },
    { id: 'animate', label: 'Toggle Animation' }
  ]);
  
  // Detect mobile devices for responsive layout
  const { isMobile } = useDeviceDetection();
  
  // Fullscreen state
  const [fullscreen, setFullscreen] = useState(false);
  const toggleFullscreen = () => setFullscreen(!fullscreen);

  // Initialize the visualization engine
  useEffect(() => {
    const appContainer = document.getElementById('root');
    
    visualizationBridge.initialize(appContainer)
      .then(() => {
        // Get available plugins
        const availablePlugins = visualizationBridge.getPlugins();
        setPlugins(availablePlugins);
        
        // Load first plugin if available
        if (availablePlugins.length > 0) {
          setActivePlugin(availablePlugins[0]);
          return visualizationBridge.loadPlugin(availablePlugins[0].id);
        }
      })
      .then(() => {
        setLoading(false);
        setInitialized(true);
      })
      .catch(err => {
        console.error('Failed to initialize:', err);
        setLoading(false);
        setError(err.message);
      });
      
    // Cleanup on unmount
    return () => {
      // Cleanup visualization bridge if needed
    };
  }, []);
  
  // Handle plugin selection
  const handlePluginSelect = (pluginId) => {
    setLoading(true);
    
    visualizationBridge.loadPlugin(pluginId)
      .then(() => {
        const selectedPlugin = plugins.find(p => p.id === pluginId);
        setActivePlugin(selectedPlugin);
        setLoading(false);
        setShowPluginSelector(false);
      })
      .catch(err => {
        console.error(`Failed to load plugin ${pluginId}:`, err);
        setError(`Failed to load plugin: ${err.message}`);
        setLoading(false);
      });
  };
  
  // Handle parameter changes
  const handleVisualParamChange = (paramId, value) => {
    setVisualParams(prev => ({ ...prev, [paramId]: value }));
    visualizationBridge.setParameter(paramId, value, 'visual');
  };
  
  const handleStructuralParamChange = (paramId, value) => {
    setStructuralParams(prev => ({ ...prev, [paramId]: value }));
    visualizationBridge.setParameter(paramId, value, 'structural');
  };
  
  // Handle action button clicks
  const handleActionClick = (actionId) => {
    visualizationBridge.executeAction(actionId);
  };
  
  // Choose layout based on device
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  
  return (
    <div className="w-full h-full bg-white dark:bg-gray-900">
      {/* Loading screen overlay */}
      <LoadingScreen isLoading={loading} error={error} />
      
      {/* Visualization Canvas */}
      <VisualizationCanvas />
      
      {/* Main UI */}
      {initialized && !error && activePlugin && (
        <Layout 
          activePlugin={activePlugin}
          plugins={plugins}
          showPluginSelector={showPluginSelector}
          setShowPluginSelector={setShowPluginSelector}
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
  );
}

export default App;
