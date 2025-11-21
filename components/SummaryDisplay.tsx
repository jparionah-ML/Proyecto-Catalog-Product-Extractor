import React from 'react';
import { ProcessSummary } from '../types';
import { Layers, FileText, ShoppingBag, Clock } from 'lucide-react';

interface SummaryDisplayProps {
  summary: ProcessSummary;
}

const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard 
        label="Brand" 
        value={summary.brand} 
        icon={Layers} 
        colorClass="bg-purple-50 text-purple-600" 
      />
      <StatCard 
        label="Pages Scanned" 
        value={summary.totalPages} 
        icon={FileText} 
        colorClass="bg-blue-50 text-blue-600" 
      />
      <StatCard 
        label="Products Found" 
        value={summary.totalProducts} 
        icon={ShoppingBag} 
        colorClass="bg-green-50 text-green-600" 
      />
      <StatCard 
        label="Time Elapsed" 
        value={`${summary.processingTime}s`} 
        icon={Clock} 
        colorClass="bg-orange-50 text-orange-600" 
      />
    </div>
  );
};
