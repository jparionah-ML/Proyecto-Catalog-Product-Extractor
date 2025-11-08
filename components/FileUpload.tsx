import React from 'react';

interface FileUploadProps {
  onFileChange: (files: FileList | null) => void;
  onProcess: () => void;
  fileCount: number;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, onProcess, fileCount, isLoading }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
      <label htmlFor="file-upload" className="cursor-pointer flex-grow w-full sm:w-auto">
        <div className="bg-white text-center text-indigo-600 font-semibold py-3 px-6 rounded-lg border border-gray-300 hover:bg-indigo-50 transition-all duration-300">
          {fileCount > 0 ? `${fileCount} file(s) selected` : 'Choose Files'}
        </div>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files)}
          disabled={isLoading}
        />
      </label>
      <button
        onClick={onProcess}
        disabled={isLoading || fileCount === 0}
        className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
      >
        {isLoading ? 'Processing...' : 'Process Catalog'}
      </button>
    </div>
  );
};