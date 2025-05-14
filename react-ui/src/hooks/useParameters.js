import { useState } from "react";

export const useParameters = (initialParams = {}) => {
  const [parameters, setParameters] = useState(initialParams);

  const updateParameter = (id, value) => {
    setParameters((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const updateParameters = (newParams) => {
    setParameters((prev) => ({
      ...prev,
      ...newParams,
    }));
  };

  const resetParameters = () => {
    setParameters(initialParams);
  };

  return {
    parameters,
    updateParameter,
    updateParameters,
    resetParameters,
  };
};
