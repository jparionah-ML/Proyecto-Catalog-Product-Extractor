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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Dropzone Area */}
        <div className="md:col-span-8">
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-xl p-8 h-48 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group
              ${isDragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
              ${disabled ? 'opacity-60 cursor-not-allowed hover:border-slate-300 hover:bg-transparent' : 'bg-white'}
            `}
          >
            <input {...getInputProps()} />
            
            {file ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="h-12 w-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    </div>
                    <p className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium underline"
                    >
                        Remove file
                    </button>
                </div>
            ) : (
                <>
                    <div className={`p-3 rounded-full bg-slate-100 text-slate-400 mb-3 group-hover:bg-indigo-100 group-hover:text-indigo-500 transition-colors ${isDragActive ? 'bg-indigo-100 text-indigo-500' : ''}`}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    </div>
                    <p className="font-medium text-slate-700">
                        {isDragActive ? "Drop PDF file here" : "Click to upload PDF"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF files only (max 50MB)</p>
                </>
            )}
          </div>
        </div>

        {/* Configuration Area */}
        <div className="md:col-span-4 flex flex-col justify-between h-48">
          <div>
            <label htmlFor="brand-select" className="block text-sm font-semibold text-slate-700 mb-2">
              Catalog Brand
            </label>
            <div className="relative">
                <select
                    id="brand-select"
                    value={brand}
                    onChange={(e) => onBrandChange(e.target.value as Brand | '')}
                    disabled={disabled}
                    className="block w-full pl-3 pr-10 py-3 text-base border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm appearance-none bg-white disabled:bg-slate-100"
                >
                    <option value="" disabled>Select a brand...</option>
                    <option value="Belcorp">Belcorp (L'Bel, Esika)</option>
                    <option value="Natura">Natura</option>
                    <option value="Generic">Generic / Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
                Selecting the correct brand improves extraction accuracy by using specialized prompts.
            </p>
          </div>

          <button
            onClick={onProcess}
            disabled={!file || !brand || disabled}
            className={`w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-sm text-white transition-all duration-200
                ${!file || !brand || disabled 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:transform active:scale-[0.98]'
                }
            `}
          >
            {disabled ? 'Processing...' : 'Start Extraction'}
          </button>
        </div>
      </div>
    </div>
  );
};