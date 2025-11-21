import React from 'react';

interface LoaderProps {
  progress: { completedPages: number; totalPages: number } | null;
}

export const Loader: React.FC<LoaderProps> = ({ progress }) => {
  const percentage = progress && progress.totalPages > 0 
    ? Math.round((progress.completedPages / progress.totalPages) * 100) 
    : 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            AI Extraction In Progress
          </span>
          <span className="text-sm text-slate-600 font-medium">
            {progress 
              ? `Processing page ${progress.completedPages} of ${progress.totalPages}` 
              : 'Initializing Gemini Worker...'}
          </span>
        </div>
        <span className="text-2xl font-black text-slate-800 tabular-nums">
          {percentage}%
        </span>
      </div>
      
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div 
          className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite] -skew-x-12 origin-left transform translate-x-[-100%]"></div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
         <span>Analyzing document structure and identifying products...</span>
      </div>
      
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
