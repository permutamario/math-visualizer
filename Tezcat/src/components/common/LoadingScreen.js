import React from 'react';

const LoadingScreen = ({ isLoading, error }) => {
  if (!isLoading && !error) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col items-center justify-center z-50">
      <h1 className={`text-2xl mb-5 ${error ? 'text-red-600' : 'text-blue-600'}`}>
        {error ? 'Error' : 'Math Visualization Framework'}
      </h1>
      
      {!error && (
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      )}
      
      <p className={`mt-5 ${error ? 'text-red-600' : 'text-gray-600'}`}>
        {error ? `Failed to start: ${error}` : 'Initializing...'}
      </p>
    </div>
  );
};

export default LoadingScreen;
