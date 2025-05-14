import React, { useEffect, useRef } from 'react';
import visualizationBridge from '../utils/visualization-bridge';
import VisualizationCanvas from './common/VisualizationCanvas';

const VisualizationContainer = ({ 
  pluginId, 
  onPluginLoaded,
  onParameterChange,
  className = '' 
}) => {
  const containerRef = useRef(null);
  
  // Initialize the visualization engine
  useEffect(() => {
    if (!containerRef.current) return;
    
    visualizationBridge.initialize(containerRef.current)
      .then(() => {
        console.log('Visualization engine initialized');
        
        // Set up parameter change listener
        if (visualizationBridge.core && onParameterChange) {
          visualizationBridge.core.events.on('parameterChange', onParameterChange);
        }
        
        // Load initial plugin if provided
        if (pluginId) {
          return visualizationBridge.loadPlugin(pluginId);
        }
      })
      .then(() => {
        if (onPluginLoaded) {
          onPluginLoaded(visualizationBridge.core);
        }
      })
      .catch(error => {
        console.error('Failed to initialize visualization:', error);
      });
      
    // Cleanup
    return () => {
      if (visualizationBridge.core && onParameterChange) {
        visualizationBridge.core.events.off('parameterChange', onParameterChange);
      }
    };
  }, []);
  
  // Load a new plugin when pluginId changes
  useEffect(() => {
    if (pluginId && visualizationBridge.initialized) {
      visualizationBridge.loadPlugin(pluginId)
        .then(() => {
          if (onPluginLoaded) {
            onPluginLoaded(visualizationBridge.core);
          }
        })
        .catch(error => {
          console.error(`Failed to load plugin ${pluginId}:`, error);
        });
    }
  }, [pluginId]);
  
  return (
    <div 
      ref={containerRef} 
      className={`visualization-container ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <VisualizationCanvas />
    </div>
  );
};

export default VisualizationContainer;
