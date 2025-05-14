import React from "react";

export const ControlColor = ({ id, label, value, onChange }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="control">
      <label
        htmlFor={id}
        className="block text-gray-700 dark:text-gray-200 font-medium mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        type="color"
        value={value}
        onChange={handleChange}
        className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer"
      />
    </div>
  );
};
