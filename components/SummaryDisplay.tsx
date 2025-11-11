import React from 'react';
import { ProcessSummary } from '../types';

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);
const TagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm0 0v11a2 2 0 002 2h5a2 2 0 002-2l-7-7z" />
  </svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const BrandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

interface SummaryDisplayProps {
  summary: ProcessSummary;
}

const SummaryCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-gray-50 p-4 rounded-lg flex items-center shadow-sm">
    <div className="p-3 rounded-full bg-gray-200 mr-4">
        {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold text-gray-700 mb-4">Processing Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Brand Processed" value={summary.brand} icon={<BrandIcon />} />
        <SummaryCard title="Pages Scanned" value={summary.totalPages} icon={<DocumentIcon />} />
        <SummaryCard title="Products Found" value={summary.totalProducts} icon={<TagIcon />} />
        <SummaryCard title="Processing Time" value={`${summary.processingTime}s`} icon={<ClockIcon />} />
      </div>
    </div>
  );
};
