import React from "react";

export const ControlSlider = ({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  isMobile = false,
}) => {
  const handleChange = (e) => {
    onChange(Number(e.target.value));
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
      <div
        className={`${
          isMobile ? "flex-1 flex items-center" : "flex items-center"
        }`}
      >
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-md appearance-none cursor-pointer"
        />
        <span className="ml-2 text-gray-600 dark:text-gray-300 text-sm min-w-6 text-right">
          {value}
        </span>
      </div>
    </div>
  );
};
