import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

export const Canvas = ({ activePlugin }) => {
  const { darkMode } = useTheme();

  return (
    <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-500">
      Visualization Canvas ({activePlugin.name})
    </div>
  );
};
