import React, { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { Canvas } from "../common/Canvas";
import { ControlPanel } from "../common/ControlPanel";
import { PluginSelector } from "../common/PluginSelector";
import {
  ControlSlider,
  ControlCheckbox,
  ControlColor,
  ControlDropdown,
} from "../controls";
import PriorityPanel from "../common/PriorityPanel"; // Import the separate component

export const DesktopLayout = ({
  activePlugin,
  showPluginSelector,
  setShowPluginSelector,
  plugins,
  handlePluginSelect,
  visualParams,
  handleVisualParamChange,
  structuralParams,
  handleStructuralParamChange,
  actions,
  handleActionClick,
  fullscreen,
  toggleFullscreen,
  classData = null,
  selectedClass,
  handleClassChange,
}) => {
  const { darkMode, toggleTheme } = useTheme();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleRotationChange = (newRotation) => {
    setRotation(newRotation);
    // Here you would typically update your 3D model rotation
    console.log("Rotation updated:", newRotation);
  };

  const handleAnimate = () => {
    // Handle animation start/stop
    console.log("Animation toggled");
  };

  const handleResetView = () => {
    // Reset view to default
    setRotation({ x: 0, y: 0 });
    console.log("View reset");
  };

  return (
    <div className="flex relative h-full w-full">
      {/* Main Canvas */}
      <div className="absolute inset-0 bg-white dark:bg-gray-900 transition-colors">
        <Canvas activePlugin={activePlugin} />
      </div>

      {/* Plugin Selector Button */}
      <button
        className="absolute top-5 left-5 w-12 h-12 rounded-full bg-white dark:bg-gray-700 shadow-md z-10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        onClick={() => setShowPluginSelector(true)}
        data-plugin-button="true"
      >
        <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
              fill="white"
            />
            <circle cx="12" cy="12" r="5" fill="white" />
          </svg>
        </div>
      </button>

      {/* Theme Toggle */}
      <button
        className="absolute top-5 right-20 w-10 h-10 rounded-full bg-gray-800/50 dark:bg-gray-600/50 z-10 flex items-center justify-center text-white shadow-md"
        onClick={toggleTheme}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      {/* Fullscreen Toggle */}
      <button
        className="absolute top-5 right-5 w-10 h-10 rounded-md bg-gray-800/50 dark:bg-gray-600/50 z-10 flex items-center justify-center text-white shadow-md"
        onClick={toggleFullscreen}
      >
        {fullscreen ? "⤢" : "⛶"}
      </button>

      {/* Priority Panel - always visible even in fullscreen */}
      <PriorityPanel
        rotationX={rotation.x}
        rotationY={rotation.y}
        onRotationChange={handleRotationChange}
        onAnimate={handleAnimate}
        onResetView={handleResetView}
      />

      {/* Panels (hidden in fullscreen rather than removed) */}
      <div
        className={`${
          fullscreen ? "opacity-0 pointer-events-none" : "opacity-100"
        } transition-opacity duration-300`}
      >
        {/* Visual Parameters Panel (Left Side) */}
        <ControlPanel
          title="Visual"
          className="absolute top-[11vh] left-5 w-[14vw] max-w-xs overflow-y-auto"
          panelType="visual"
        >
          <div className="space-y-2">
            <ControlSlider
              id="amplitude"
              label="Amplitude"
              value={visualParams.amplitude}
              min={0}
              max={100}
              step={1}
              onChange={(value) => handleVisualParamChange("amplitude", value)}
            />
            <ControlSlider
              id="frequency"
              label="Frequency"
              value={visualParams.frequency}
              min={1}
              max={50}
              step={1}
              onChange={(value) => handleVisualParamChange("frequency", value)}
            />
            <ControlCheckbox
              id="showPoints"
              label="Show Points"
              checked={visualParams.showPoints}
              onChange={(checked) =>
                handleVisualParamChange("showPoints", checked)
              }
            />
            <ControlColor
              id="color"
              label="Line Color"
              value={visualParams.color}
              onChange={(value) => handleVisualParamChange("color", value)}
            />
          </div>
        </ControlPanel>

        {/* Actions Panel (Left Side, positioned with gap) */}
        <ControlPanel
          title="Actions"
          className="absolute top-[55vh] left-5 w-[14vw] max-w-xs overflow-y-auto"
          panelType="actions"
        >
          <div className="space-y-2">
            {actions.map((action) => (
              <button
                key={action.id}
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md shadow transition-colors"
                onClick={() => handleActionClick(action.id)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </ControlPanel>

        {/* Class Selection Panel (Right Side, top) - Only shown if classData exists */}
        {classData && classData.length > 0 && (
          <ControlPanel
            title="Class Selection"
            className="absolute top-[11vh] right-5 w-[14vw] max-w-xs overflow-y-auto"
            panelType="class"
          >
            <div className="space-y-2">
              <ControlDropdown
                id="classSelector"
                label="Select Class"
                value={selectedClass}
                options={classData.map((c) => c.name || c.id)}
                onChange={(value) => handleClassChange(value)}
              />
            </div>
          </ControlPanel>
        )}

        {/* Structural Parameters Panel (Right Side) */}
        <ControlPanel
          title="Structural"
          className={`absolute ${
            classData && classData.length > 0
              ? "top-[37vh]" // 11vh (top) + 15vh (estimated class panel) + 11vh (gap)
              : "top-[11vh]"
          } right-5 w-[14vw] max-w-xs overflow-y-auto`}
          panelType="structural"
        >
          <div className="space-y-2">
            <ControlSlider
              id="resolution"
              label="Resolution"
              value={structuralParams.resolution}
              min={10}
              max={200}
              step={1}
              onChange={(value) =>
                handleStructuralParamChange("resolution", value)
              }
            />
            <ControlSlider
              id="layers"
              label="Layers"
              value={structuralParams.layers}
              min={1}
              max={10}
              step={1}
              onChange={(value) => handleStructuralParamChange("layers", value)}
            />
            <ControlDropdown
              id="renderQuality"
              label="Render Quality"
              value={structuralParams.renderQuality}
              options={["low", "medium", "high", "ultra"]}
              onChange={(value) =>
                handleStructuralParamChange("renderQuality", value)
              }
            />
          </div>
        </ControlPanel>
      </div>

      {/* Plugin Selector Modal */}
      <PluginSelector
        showPluginSelector={showPluginSelector}
        setShowPluginSelector={setShowPluginSelector}
        plugins={plugins}
        activePlugin={activePlugin}
        handlePluginSelect={handlePluginSelect}
      />
    </div>
  );
};

export default DesktopLayout;
