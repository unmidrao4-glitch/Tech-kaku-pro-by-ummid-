
import React from 'react';

interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({ text, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 my-4">
      <div
        className={`animate-spin rounded-full border-solid border-indigo-500 border-t-transparent ${sizeClasses[size]}`}
      ></div>
      {text && <p className="text-gray-400 animate-pulse">{text}</p>}
    </div>
  );
};
