import React from "react";

export const ControlDropdown = ({
  id,
  label,
  value,
  options,
  onChange,
  isMobile = false,
}) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className={`control ${isMobile ? "flex items-center" : ""}`}>
      <label
        htmlFor={id}
        className={`block text-gray-700 dark:text-gray-200 font-medium ${
          isMobile ? "text-sm mr-2 flex-shrink-0" : "mb-1"
        }`}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        className={`${
          isMobile ? "flex-1" : "w-full"
        } bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {typeof option === "string"
              ? option.charAt(0).toUpperCase() + option.slice(1)
              : option}
          </option>
        ))}
      </select>
    </div>
  );
};
