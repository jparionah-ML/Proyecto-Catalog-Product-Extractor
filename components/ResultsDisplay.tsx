import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Download, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface ResultsDisplayProps {
  data: Product[];
  isLoading?: boolean;
}

type SortField = 'pageNumber' | 'offerPrice' | 'regularPrice' | 'content' | 'name';
type SortOrder = 'asc' | 'desc';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('pageNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterDeals, setFilterDeals] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.code.toLowerCase().includes(lower) ||
        p.campaign.toLowerCase().includes(lower)
      );
    }

    if (filterDeals) {
      result = result.filter(p => p.offerPrice > 0 && p.offerPrice < p.regularPrice);
    }

    // Sort
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc' 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });

    return result;
  }, [data, searchTerm, sortField, sortOrder, filterDeals]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const downloadCSV = () => {
    const headers = ["Page", "Brand", "Campaign", "Code", "Name", "Content", "Pres", "Regular Price", "Offer Price"];
    const rows = processedData.map(p => [
      p.pageNumber, p.brand, p.campaign, p.code, `"${p.name.replace(/"/g, '""')}"`, 
      p.content, p.presentation, p.regularPrice, p.offerPrice
    ].join(','));
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `extraction_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={`ml-1 inline-block transition-opacity ${sortField === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`}>
      {sortField === field && sortOrder === 'desc' ? '↓' : '↑'}
    </span>
  );

  const thClass = "px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer group select-none hover:bg-slate-100 hover:text-indigo-600 transition-colors";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Extracted Catalog Data</h3>
          <p className="text-xs text-slate-500 mt-1">
            {processedData.length} products found {isLoading && '(Processing...)'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
          </div>
          
          <button 
            onClick={() => setFilterDeals(!filterDeals)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              filterDeals 
              ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' 
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            {filterDeals ? 'Deals Only' : 'All Items'}
          </button>
          
          <button 
            onClick={downloadCSV}
            disabled={data.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-grow custom-scrollbar">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th onClick={() => handleSort('pageNumber')} className={thClass}>Page <SortIcon field="pageNumber" /></th>
              <th onClick={() => handleSort('name')} className={thClass}>Product <SortIcon field="name" /></th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
              <th onClick={() => handleSort('content')} className={thClass}>Content <SortIcon field="content" /></th>
              <th onClick={() => handleSort('regularPrice')} className={`${thClass} text-right`}>Regular <SortIcon field="regularPrice" /></th>
              <th onClick={() => handleSort('offerPrice')} className={`${thClass} text-right`}>Offer <SortIcon field="offerPrice" /></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((p, i) => (
                <tr key={`${p.code}-${p.pageNumber}-${i}`} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {p.pageNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.brand} • {p.campaign}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500 bg-slate-50/50 rounded w-min px-2">
                    {p.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {p.content ? `${p.content}${p.presentation || ''}` : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <span className={p.offerPrice > 0 ? "text-slate-400 line-through text-xs block" : "text-slate-900 font-medium"}>
                      {p.regularPrice.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {p.offerPrice > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                        {p.offerPrice.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-slate-100 p-4 rounded-full mb-3">
                      <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-base font-medium text-slate-600">No products found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search term.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> of <span className="font-medium text-slate-900">{processedData.length}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
