import React from 'react';
import { useTheme } from '../hooks/useTheme';

const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} border-4 rounded-full animate-spin ${
          isDark
            ? 'border-gray-600 border-t-blue-400'
            : 'border-gray-300 border-t-blue-600'
        }`}
      />
      {message && (
        <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;