import React from 'react';

interface LoaderProps {
  progress: { currentPage: number; totalPages: number } | null;
}

export const Loader: React.FC<LoaderProps> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
      <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-lg font-semibold text-gray-600">
        Extracting product data...
      </p>
      {progress ? (
        <p className="text-gray-500">
          Processing page {progress.currentPage} of {progress.totalPages}...
        </p>
      ) : (
        <p className="text-gray-500">
          Preparing pages. This may take a few moments.
        </p>
      )}
    </div>
  );
};