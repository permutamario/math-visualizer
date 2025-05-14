// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import './utils/libraryInit';  // Import utility for library initialization
import LoadingScreen from './components/common/LoadingScreen';
import { DesktopLayout, MobileLayout } from './components/layouts';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import visualizationBridge from './utils/visualization-bridge';

function App() {
  // Application state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [activePlugin, setActivePlugin] = useState(null);
  const [plugins, setPlugins] = useState([]);
  const [showPluginSelector, setShowPluginSelector] = useState(false);
  
  // Parameters state
  const [visualParams, setVisualParams] = useState({});
  const [structuralParams, setStructuralParams] = useState({});
  
  // Actions array for buttons
  const [actions, setActions] = useState([]);
  
  // Detect mobile devices for responsive layout
  const { isMobile } = useDeviceDetection();
  
  // Fullscreen state
  const [fullscreen, setFullscreen] = useState(false);
  const toggleFullscreen = () => setFullscreen(!fullscreen);

  // Initialize the visualization engine
  useEffect(() => {
    console.log("Initializing application...");
    
    visualizationBridge.initialize()
      .then(core => {
        console.log("Visualization engine initialized successfully");
        
        // Get available plugins
        const availablePlugins = visualizationBridge.getPlugins();
        console.log("Available plugins:", availablePlugins);
        setPlugins(availablePlugins);
        
        // Load first plugin if available
        if (availablePlugins.length > 0) {
          const firstPlugin = availablePlugins[0];
          console.log(`Loading first plugin: ${firstPlugin.id}`);
          
          return visualizationBridge.loadPlugin(firstPlugin.id)
            .then(() => {
              console.log(`Plugin ${firstPlugin.id} loaded successfully`);
              setActivePlugin(firstPlugin);
              
              // Get parameters
              const visualParameters = visualizationBridge.getParameters('visual');
              const structuralParameters = visualizationBridge.getParameters('structural');
              
              setVisualParams(visualParameters.values || {});
              setStructuralParams(structuralParameters.values || {});
              
              // Get actions
              const pluginActions = visualizationBridge.getActions();
              setActions(pluginActions);
            });
        } else {
          console.log("No plugins available");
          throw new Error("No visualization plugins found");
        }
      })
      .then(() => {
        setLoading(false);
        setInitialized(true);
        console.log("Application fully initialized");
      })
      .catch(err => {
        console.error('Failed to initialize:', err);
        setLoading(false);
        setError(err.message || "Failed to initialize visualization engine");
      });
      
    // Cleanup on unmount
    return () => {
      console.log("Cleaning up visualization bridge");
      visualizationBridge.cleanup();
    };
  }, []);
  
  // Handle plugin selection
  const handlePluginSelect = (pluginId) => {
    console.log(`Selecting plugin: ${pluginId}`);
    setLoading(true);
    
    // Unload current plugin first
    visualizationBridge.unloadPlugin()
      .then(() => visualizationBridge.loadPlugin(pluginId))
      .then(() => {
        // Find the selected plugin metadata
        const selectedPlugin = plugins.find(p => p.id === pluginId);
        setActivePlugin(selectedPlugin);
        
        // Get updated parameters
        const visualParameters = visualizationBridge.getParameters('visual');
        const structuralParameters = visualizationBridge.getParameters('structural');
        
        setVisualParams(visualParameters.values || {});
        setStructuralParams(structuralParameters.values || {});
        
        // Get updated actions
        const pluginActions = visualizationBridge.getActions();
        setActions(pluginActions);
        
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
    console.log(`Executing action: ${actionId}`);
    visualizationBridge.executeAction(actionId);
  };
  
  // Choose layout based on device
  const Layout = isMobile ? MobileLayout : DesktopLayout;
  
  return (
    <ThemeProvider>
      <div className="w-full h-full bg-white dark:bg-gray-900">
        {/* Loading screen overlay */}
        <LoadingScreen isLoading={loading} error={error} />
        
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
        
        {/* Canvas is now managed by the visualization bridge */}
        {/* The bridge will render to the canvas with ID "visualization-canvas" */}
        <div className="absolute inset-0 z-0">
          <canvas 
            id="visualization-canvas" 
            className="w-full h-full"
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
