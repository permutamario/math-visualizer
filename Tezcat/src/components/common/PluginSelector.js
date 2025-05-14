import React, { useRef, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";

export const PluginSelector = ({
  showPluginSelector,
  setShowPluginSelector,
  plugins,
  activePlugin,
  handlePluginSelect,
  isMobile = false,
}) => {
  const { darkMode } = useTheme();
  const selectorRef = useRef(null);

  // Handle clicking outside to close the selector
  useEffect(() => {
    // Skip setup if not showing
    if (!showPluginSelector) return;

    function handleClickOutside(event) {
      // If we have a ref and the click is outside of it
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        // Check if clicking the plugin button - which has its own handler
        // We need to check both the event target and its parent elements
        let targetEl = event.target;
        let isPluginButton = false;

        // Walk up the DOM tree to find if any parent has the data attribute
        while (targetEl && targetEl !== document) {
          if (
            targetEl.getAttribute &&
            targetEl.getAttribute("data-plugin-button") === "true"
          ) {
            isPluginButton = true;
            break;
          }
          targetEl = targetEl.parentNode;
        }

        // If not clicking the button, close the selector
        if (!isPluginButton) {
          setShowPluginSelector(false);
        }
      }
    }

    // Add event listener with capture phase to get events before they're stopped
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true); // For mobile

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
  }, [showPluginSelector, setShowPluginSelector]);

  // Don't render anything if not showing
  if (!showPluginSelector) {
    return null;
  }

  // Prevent clicks inside from triggering outside handlers
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // If clicking on the backdrop (not its children), close the selector
        if (e.target === e.currentTarget) {
          setShowPluginSelector(false);
        }
      }}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg ${
          isMobile ? "w-[95%] max-h-[90vh]" : "max-w-4xl w-[90%] max-h-[80vh]"
        } shadow-xl transform transition-all`}
        ref={selectorRef}
        onClick={handleModalClick}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2
            className={`${
              isMobile ? "text-lg" : "text-xl"
            } font-bold text-gray-800 dark:text-white`}
          >
            Select Visualization
          </h2>
          <button
            className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 rounded-full p-2"
            onClick={() => setShowPluginSelector(false)}
          >
            ✕
          </button>
        </div>
        <div
          className={`${
            isMobile
              ? "p-4 grid grid-cols-1 gap-4"
              : "p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          } overflow-y-auto ${
            isMobile ? "max-h-[calc(90vh-80px)]" : "max-h-[calc(80vh-80px)]"
          }`}
        >
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className={`bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform ${
                isMobile
                  ? "flex" // Use flex for mobile to create horizontal layout
                  : "hover:-translate-y-1 hover:shadow-lg" // Keep vertical layout for desktop
              } ${plugin.id === activePlugin.id ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => handlePluginSelect(plugin.id)}
            >
              {isMobile ? (
                // Mobile layout: Text on left, preview on right
                <>
                  <div className="flex-1 p-3 flex flex-col justify-center">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1 text-sm">
                      {plugin.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs leading-tight">
                      {plugin.description}
                    </p>
                  </div>
                  <div className="w-24 h-24 bg-blue-50 dark:bg-gray-600 flex items-center justify-center">
                    <div className="opacity-80 text-blue-500 dark:text-blue-400 w-10 h-10">
                      {plugin.renderingType === "3d" ? (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M12 1L1 5v14l11 4 11-4V5L12 1zM5 7.2l6-2.2 6 2.2v7.1l-6 2.2-6-2.2V7.2z"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M4 4h16v16H4V4z M12 17.5L4.5 10l3-3L12 11.5l4.5-4.5 3 3L12 17.5z"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                // Desktop layout: Standard vertical layout
                <>
                  <div className="h-36 bg-blue-50 dark:bg-gray-600 flex items-center justify-center">
                    <div className="w-12 h-12 opacity-80 text-blue-500 dark:text-blue-400">
                      {plugin.renderingType === "3d" ? (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M12 1L1 5v14l11 4 11-4V5L12 1zM5 7.2l6-2.2 6 2.2v7.1l-6 2.2-6-2.2V7.2z"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-full h-full">
                          <path
                            fill="currentColor"
                            d="M4 4h16v16H4V4z M12 17.5L4.5 10l3-3L12 11.5l4.5-4.5 3 3L12 17.5z"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1 text-sm">
                      {plugin.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs leading-tight">
                      {plugin.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PluginSelector;
