
import React from 'react';
import { Product } from '../types';

interface ResultsDisplayProps {
  data: Product[];
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data }) => {

  const downloadCSV = () => {
    const headers = "Brand|Campaign|code|NameProduct|presentation|content|offerPrice|regularPrice|PageNumber";
    const rows = data.map(p => 
      [
        p.brand,
        p.campaign,
        p.code,
        `"${p.name.replace(/"/g, '""')}"`, // Handle quotes in product name
        p.presentation || '',
        p.content,
        p.offerPrice,
        p.regularPrice,
        p.pageNumber
      ].join('|')
    );
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `catalog_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-700">Extraction Results ({data.length} items)</h3>
        <button 
          onClick={downloadCSV}
          className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
        >
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {['Page', 'Code', 'Product Name', 'Content', 'Offer Price', 'Regular Price'].map(header => (
                  <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((product, index) => (
                <tr key={`${product.code}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.pageNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium max-w-xs truncate">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.content > 0 ? `${product.content} ${product.presentation}` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{product.offerPrice > 0 ? `$${product.offerPrice.toLocaleString()}` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 line-through">{`$${product.regularPrice.toLocaleString()}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
