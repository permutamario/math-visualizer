import React from "react";

export const ControlCheckbox = ({ id, label, checked, onChange }) => {
  const handleChange = (e) => {
    onChange(e.target.checked);
  };

  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={id}
        className="text-gray-700 dark:text-gray-200 font-medium"
      >
        {label}
      </label>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="w-4 h-4 text-blue-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
      />
    </div>
  );
};
