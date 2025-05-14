import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Canvas component for rendering visualizations
 * This component serves as the main rendering surface for both 2D and 3D visualizations
 */
const VisualizationCanvas = () => {
  const canvasRef = useRef(null);
  const { darkMode } = useTheme();

  // Apply styles to the canvas when the theme changes
  useEffect(() => {
    if (canvasRef.current) {
      // The actual canvas styling is mainly handled by the visualization framework
      // This is just to ensure the canvas is visible and properly sized
      canvasRef.current.style.backgroundColor = darkMode ? '#1a1a1a' : '#f5f5f5';
    }
  }, [darkMode]);

  return (
    <canvas
      id="visualization-canvas"
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
};

export default VisualizationCanvas;
