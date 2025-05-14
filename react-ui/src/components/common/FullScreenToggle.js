import React from "react";

export const FullscreenToggle = ({
  fullscreen,
  toggleFullscreen,
  isMobile = false,
}) => {
  return (
    <button
      className={
        isMobile
          ? "absolute top-0 right-0 w-10 h-8 flex items-center justify-center text-gray-800 dark:text-white z-20"
          : "absolute top-5 right-5 w-10 h-10 rounded-md bg-gray-800/50 dark:bg-gray-600/50 z-10 flex items-center justify-center text-white shadow-md"
      }
      onClick={toggleFullscreen}
    >
      {fullscreen ? "⤢" : "⛶"}
    </button>
  );
};
