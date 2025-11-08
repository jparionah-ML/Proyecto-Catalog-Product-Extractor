import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Brand } from '../types';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  onBrandChange: (brand: Brand | '') => void;
  onProcess: () => void;
  disabled: boolean;
  file: File | null;
  brand: Brand | '';
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, onBrandChange, onProcess, disabled, file, brand }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileChange(acceptedFiles[0]);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: disabled
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 h-full flex items-center justify-center text-center cursor-pointer transition-colors duration-300
              ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <p className="font-semibold text-sm">
                {isDragActive ? "Drop the PDF here" : "Drag & drop or click to select a PDF"}
              </p>
              {file && <p className="text-xs text-green-600 mt-1">Selected: {file.name}</p>}
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="brand-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Brand
          </label>
          <select
            id="brand-select"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value as Brand | '')}
            disabled={disabled}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value="" disabled>-- Choose a brand --</option>
            <option value="Belcorp">Belcorp (Ésika, L'Bel, Cyzone)</option>
            <option value="Natura">Natura</option>
            <option value="Generic">Generic</option>
          </select>
        </div>
      </div>
      <div className="text-center">
        <button
          onClick={onProcess}
          disabled={!file || !brand || disabled}
          className="w-full md:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Process Catalog
        </button>
      </div>
    </div>
  );
};
