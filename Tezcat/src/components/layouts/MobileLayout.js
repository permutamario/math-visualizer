import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { Canvas } from "../common/Canvas";
import { PluginSelector } from "../common/PluginSelector";
import {
  ControlSlider,
  ControlCheckbox,
  ControlColor,
  ControlDropdown,
} from "../controls";

export const MobileLayout = ({
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
}) => {
  const { darkMode, toggleTheme } = useTheme();
  const [showVisualMenu, setShowVisualMenu] = useState(false);
  const [showStructuralMenu, setShowStructuralMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Priority panel state
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [priorityBarVisible, setPriorityBarVisible] = useState(true);
  const inactivityTimerRef = useRef(null);

  // Refs for click-outside detection
  const visualMenuRef = useRef(null);
  const structuralMenuRef = useRef(null);
  const actionsMenuRef = useRef(null);
  const visualButtonRef = useRef(null);
  const structuralButtonRef = useRef(null);
  const actionsButtonRef = useRef(null);

  // Close menus when opening plugin selector
  useEffect(() => {
    if (showPluginSelector) {
      setShowVisualMenu(false);
      setShowStructuralMenu(false);
      setShowActionsMenu(false);
    }
  }, [showPluginSelector]);

  // Toggle menu functions
  const toggleVisualMenu = () => {
    setShowVisualMenu(!showVisualMenu);
    setShowStructuralMenu(false);
    setShowActionsMenu(false);
  };

  const toggleStructuralMenu = () => {
    setShowStructuralMenu(!showStructuralMenu);
    setShowVisualMenu(false);
    setShowActionsMenu(false);
  };

  const toggleActionsMenu = () => {
    setShowActionsMenu(!showActionsMenu);
    setShowVisualMenu(false);
    setShowStructuralMenu(false);
  };

  // Handle clicks outside of menus to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check Visual Menu
      if (
        showVisualMenu &&
        visualMenuRef.current &&
        !visualMenuRef.current.contains(event.target) &&
        visualButtonRef.current &&
        !visualButtonRef.current.contains(event.target)
      ) {
        setShowVisualMenu(false);
      }

      // Check Structural Menu
      if (
        showStructuralMenu &&
        structuralMenuRef.current &&
        !structuralMenuRef.current.contains(event.target) &&
        structuralButtonRef.current &&
        !structuralButtonRef.current.contains(event.target)
      ) {
        setShowStructuralMenu(false);
      }

      // Check Actions Menu
      if (
        showActionsMenu &&
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(event.target) &&
        actionsButtonRef.current &&
        !actionsButtonRef.current.contains(event.target)
      ) {
        setShowActionsMenu(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showVisualMenu, showStructuralMenu, showActionsMenu]);

  // Priority bar visibility management
  useEffect(() => {
    // Make the priority bar visible whenever user interacts
    const showPriorityBar = () => {
      setPriorityBarVisible(true);

      // Clear any existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Set a new timer to hide the priority bar after 3 seconds of inactivity
      inactivityTimerRef.current = setTimeout(() => {
        setPriorityBarVisible(false);
      }, 3000);
    };

    // Show initially
    showPriorityBar();

    // Add event listeners for user interaction
    const events = [
      "touchstart",
      "touchmove",
      "mousedown",
      "mousemove",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, showPriorityBar);
    });

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      events.forEach((event) => {
        document.removeEventListener(event, showPriorityBar);
      });
    };
  }, []);

  // Handler for rotation changes
  const handleRotationChange = (newRotation) => {
    setRotation(newRotation);
    // In a real implementation, this would update the 3D model rotation
    console.log("Rotation updated to:", newRotation);
  };

  // Animation toggle handler
  const handleAnimateToggle = () => {
    console.log("Animation toggled");
    // This would start/stop animation in the actual implementation
  };

  // Reset view handler
  const handleResetView = () => {
    setRotation({ x: 0, y: 0 });
    console.log("View reset to default position");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Title Header - Only show if not in fullscreen mode */}
      {!fullscreen && (
        <div className="h-8 bg-white dark:bg-gray-700 shadow-sm flex items-center justify-between px-2 z-10">
          {/* Left side spacer to keep title centered */}
          <div className="w-16"></div>

          {/* Title */}
          <h1 className="text-sm font-medium text-gray-800 dark:text-white">
            {activePlugin.name}
          </h1>

          {/* Right side buttons */}
          <div className="flex items-center h-full">
            {/* Theme Toggle */}
            <button
              className="h-8 w-8 flex items-center justify-center text-gray-800 dark:text-white"
              onClick={toggleTheme}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* Fullscreen Toggle */}
            <button
              className="h-8 w-8 flex items-center justify-center text-gray-800 dark:text-white"
              onClick={toggleFullscreen}
            >
              {fullscreen ? "⤢" : "⛶"}
            </button>
          </div>
        </div>
      )}

      {/* Class Parameters Section - Below title header */}
      {!fullscreen && (
        <div className="bg-white dark:bg-gray-700 shadow-md z-10 overflow-y-auto border-t border-gray-200 dark:border-gray-600">
          <div className="p-2 space-y-2">
            <ControlDropdown
              id="class-selector-mobile"
              label="Class"
              value="DefaultClass" // This would come from props
              options={["DefaultClass", "Class A", "Class B", "Class C"]} // This would come from props
              onChange={(value) => console.log("Class changed:", value)} // This would call a handler from props
              isMobile={true}
            />

            <ControlSlider
              id="class-parameter-mobile"
              label="Value"
              value={75} // This would come from props
              min={0}
              max={100}
              step={1}
              onChange={(value) =>
                console.log("Class parameter changed:", value)
              } // This would call a handler from props
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Main Canvas - Now takes remaining space below header and class params */}
      <div className="flex-1 bg-white dark:bg-gray-900 relative">
        <Canvas activePlugin={activePlugin} />

        {/* Fullscreen controls - only shown when in fullscreen mode */}
        {fullscreen && (
          <div className="absolute top-0 right-0 m-1 flex items-center">
            <button
              className="h-8 w-8 flex items-center justify-center text-gray-800 dark:text-white bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-md shadow-md mr-1"
              onClick={toggleTheme}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <button
              className="h-8 w-8 flex items-center justify-center text-gray-800 dark:text-white bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-md shadow-md"
              onClick={toggleFullscreen}
            >
              {fullscreen ? "⤢" : "⛶"}
            </button>
          </div>
        )}
      </div>

      {/* Priority Bar - Positioned above toolbar, raised 5% and more compact */}
      <div
        className={`fixed bottom-[5rem] left-0 right-0 px-4 z-20 transition-opacity duration-300 ${
          priorityBarVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-gray-800/70 backdrop-blur-md rounded-lg shadow-lg p-1 flex flex-wrap justify-between items-center gap-1">
          <div className="flex items-center flex-1 min-w-[120px]">
            <label className="text-white text-[9px] mr-1 w-8">X-Axis</label>
            <input
              type="range"
              className="w-full h-4"
              min="0"
              max="360"
              step="1"
              value={rotation.x}
              onChange={(e) =>
                handleRotationChange({
                  ...rotation,
                  x: parseInt(e.target.value),
                })
              }
            />
            <span className="text-white text-[9px] ml-1 w-6 text-right">
              {rotation.x}°
            </span>
          </div>

          <div className="flex items-center flex-1 min-w-[120px]">
            <label className="text-white text-[9px] mr-1 w-8">Y-Axis</label>
            <input
              type="range"
              className="w-full h-4"
              min="0"
              max="360"
              step="1"
              value={rotation.y}
              onChange={(e) =>
                handleRotationChange({
                  ...rotation,
                  y: parseInt(e.target.value),
                })
              }
            />
            <span className="text-white text-[9px] ml-1 w-6 text-right">
              {rotation.y}°
            </span>
          </div>

          <div className="flex gap-1 ml-1">
            <button
              className="bg-blue-500 text-white text-[9px] py-1 px-2 rounded"
              onClick={handleAnimateToggle}
            >
              Animate
            </button>
            <button
              className="bg-gray-600 text-white text-[9px] py-1 px-2 rounded"
              onClick={handleResetView}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Compact Icon Toolbar */}
      {!fullscreen && (
        <div className="fixed bottom-2 left-0 right-0 px-4 z-20">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg flex items-center py-1 px-0">
            {/* Visual Parameters Icon */}
            <button
              className="flex-1 flex flex-col items-center py-1"
              onClick={toggleVisualMenu}
              ref={visualButtonRef}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={showVisualMenu ? "#3B82F6" : "currentColor"}
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                >
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path
                    fillRule="evenodd"
                    d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span
                className={`text-[10px] ${
                  showVisualMenu
                    ? "text-blue-500 font-medium"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                Visual
              </span>
            </button>

            {/* Structural Parameters Icon */}
            <button
              className="flex-1 flex flex-col items-center py-1"
              onClick={toggleStructuralMenu}
              ref={structuralButtonRef}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={showStructuralMenu ? "#3B82F6" : "currentColor"}
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span
                className={`text-[10px] ${
                  showStructuralMenu
                    ? "text-blue-500 font-medium"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                Structural
              </span>
            </button>

            {/* Actions Icon */}
            <button
              className="flex-1 flex flex-col items-center py-1"
              onClick={toggleActionsMenu}
              ref={actionsButtonRef}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={showActionsMenu ? "#3B82F6" : "currentColor"}
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span
                className={`text-[10px] ${
                  showActionsMenu
                    ? "text-blue-500 font-medium"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                Actions
              </span>
            </button>

            {/* Plugin Icon */}
            <button
              className="flex-1 flex flex-col items-center py-1"
              onClick={() => setShowPluginSelector(true)}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="#3B82F6"
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  <circle cx="12" cy="12" r="5" />
                </svg>
              </div>
              <span className="text-[10px] text-gray-600 dark:text-gray-300">
                Plugins
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Options Menu (Slide-up) */}
      <div
        className={`fixed bottom-12 left-5 w-[280px] bg-white dark:bg-gray-700 rounded-lg shadow-lg z-30 transition-all transform ${
          showVisualMenu
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0 pointer-events-none"
        }`}
        ref={visualMenuRef}
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-600">
            Visual Options
          </h3>
          <div className="mt-3 space-y-4 max-h-[50vh] overflow-y-auto">
            <ControlSlider
              id="amplitude-mobile"
              label="Amplitude"
              value={visualParams.amplitude}
              min={0}
              max={100}
              step={1}
              onChange={(value) => handleVisualParamChange("amplitude", value)}
            />
            <ControlSlider
              id="frequency-mobile"
              label="Frequency"
              value={visualParams.frequency}
              min={1}
              max={50}
              step={1}
              onChange={(value) => handleVisualParamChange("frequency", value)}
            />
            <ControlCheckbox
              id="showPoints-mobile"
              label="Show Points"
              checked={visualParams.showPoints}
              onChange={(checked) =>
                handleVisualParamChange("showPoints", checked)
              }
            />
            <ControlColor
              id="color-mobile"
              label="Line Color"
              value={visualParams.color}
              onChange={(value) => handleVisualParamChange("color", value)}
            />
          </div>
        </div>
      </div>

      {/* Structural Menu (Slide-up) */}
      <div
        className={`fixed bottom-12 left-1/2 transform -translate-x-1/2 w-[280px] bg-white dark:bg-gray-700 rounded-lg shadow-lg z-30 transition-all ${
          showStructuralMenu
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0 pointer-events-none"
        }`}
        ref={structuralMenuRef}
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-600">
            Structural Parameters
          </h3>
          <div className="mt-3 space-y-4 max-h-[50vh] overflow-y-auto">
            <ControlSlider
              id="resolution-menu-mobile"
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
              id="layers-menu-mobile"
              label="Layers"
              value={structuralParams.layers}
              min={1}
              max={10}
              step={1}
              onChange={(value) => handleStructuralParamChange("layers", value)}
            />
            <ControlDropdown
              id="renderQuality-menu-mobile"
              label="Render Quality"
              value={structuralParams.renderQuality}
              options={["low", "medium", "high", "ultra"]}
              onChange={(value) =>
                handleStructuralParamChange("renderQuality", value)
              }
            />
          </div>
        </div>
      </div>

      {/* Actions Menu (Slide-up) */}
      <div
        className={`fixed bottom-12 right-5 w-[200px] bg-white dark:bg-gray-700 rounded-lg shadow-lg z-30 transition-all transform ${
          showActionsMenu
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0 pointer-events-none"
        }`}
        ref={actionsMenuRef}
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-600">
            Actions
          </h3>
          <div className="mt-3 space-y-2">
            {actions.map((action) => (
              <button
                key={action.id}
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md shadow transition-colors"
                onClick={() => {
                  handleActionClick(action.id);
                  setShowActionsMenu(false);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plugin Selector Modal */}
      <PluginSelector
        showPluginSelector={showPluginSelector}
        setShowPluginSelector={setShowPluginSelector}
        plugins={plugins}
        activePlugin={activePlugin}
        handlePluginSelect={handlePluginSelect}
        isMobile={true}
      />
    </div>
  );
};

export default MobileLayout;
