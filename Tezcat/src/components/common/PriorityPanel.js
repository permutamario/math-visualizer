import React, { useState, useEffect } from "react";

const PriorityPanel = ({
  rotationX = 0,
  rotationY = 0,
  onRotationChange,
  onAnimate,
  onResetView,
}) => {
  const [visible, setVisible] = useState(true);
  const timeoutRef = React.useRef(null);

  // Handle mouse movement and visibility
  useEffect(() => {
    // Function to handle mouse movement
    const handleMouseMove = () => {
      // Always set to visible when mouse moves
      setVisible(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout - hide panel after 4 seconds of inactivity
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, 2000);
    };

    // Add event listener
    document.addEventListener("mousemove", handleMouseMove);

    // Set initial timeout - keep visible for 5 seconds initially
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 5000);

    // Cleanup function
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleRotationXChange = (e) => {
    if (onRotationChange) {
      onRotationChange({ x: parseInt(e.target.value), y: rotationY });
    }
  };

  const handleRotationYChange = (e) => {
    if (onRotationChange) {
      onRotationChange({ x: rotationX, y: parseInt(e.target.value) });
    }
  };

  return (
    <div
      className={`fixed left-1/2 transform -translate-x-1/2 w-[70%] 
                  transition-opacity duration-500 ease-in-out z-20
                  ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      style={{ bottom: "5%" }}
    >
      <div className="bg-transparent p-3 rounded-lg">
        <div className="flex items-center justify-center space-x-4">
          <div className="bg-gray-800/60 backdrop-blur-sm p-2 rounded-lg flex items-center">
            <label className="text-white mr-2 text-sm">Rotation X</label>
            <input
              type="range"
              className="w-40"
              min="0"
              max="360"
              step="1"
              value={rotationX}
              onChange={handleRotationXChange}
            />
            <span className="text-white ml-2 text-xs w-8 text-right">
              {rotationX}°
            </span>
          </div>

          <div className="bg-gray-800/60 backdrop-blur-sm p-2 rounded-lg flex items-center">
            <label className="text-white mr-2 text-sm">Rotation Y</label>
            <input
              type="range"
              className="w-40"
              min="0"
              max="360"
              step="1"
              value={rotationY}
              onChange={handleRotationYChange}
            />
            <span className="text-white ml-2 text-xs w-8 text-right">
              {rotationY}°
            </span>
          </div>

          <button
            className="bg-blue-500/80 hover:bg-blue-600/80 text-white px-4 py-2 rounded-md shadow-lg"
            onClick={onAnimate}
          >
            Animate
          </button>

          <button
            className="bg-gray-700/80 hover:bg-gray-800/80 text-white px-4 py-2 rounded-md shadow-lg"
            onClick={onResetView}
          >
            Reset View
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriorityPanel;
