import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

export const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      className="absolute top-5 right-16 w-10 h-10 rounded-full bg-gray-800/50 dark:bg-gray-600/50 z-10 flex items-center justify-center text-white shadow-md"
      onClick={toggleTheme}
    >
      {darkMode ? "☀️" : "🌙"}
    </button>
  );
};
