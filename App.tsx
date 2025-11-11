// Fix: Implement the main App component, managing state and orchestrating child components.
import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ResultsDisplay } from './components/ResultsDisplay';
import { SummaryDisplay } from './components/SummaryDisplay';
import { Product, Brand, ProcessSummary } from './types';
import { processPdf } from './services/geminiService';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ currentPage: number; totalPages: number } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | ''>('');
  const [summary, setSummary] = useState<ProcessSummary | null>(null);


  const handleProcess = async () => {
    if (!selectedFile || !selectedBrand) {
      setError("Please select a file and a brand before processing.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setProducts([]);
    setProgress(null);
    setSummary(null);
    
    const startTime = Date.now();

    try {
      let totalPagesInRun = 0;
      const progressCallback = (p: { currentPage: number; totalPages: number }) => {
        setProgress(p);
        totalPagesInRun = p.totalPages;
      };

      const results = await processPdf(selectedFile, selectedBrand, progressCallback);
      setProducts(results);

      const endTime = Date.now();
      const durationInSeconds = (endTime - startTime) / 1000;
      
      setSummary({
        brand: selectedBrand,
        totalPages: totalPagesInRun,
        totalProducts: results.length,
        processingTime: parseFloat(durationInSeconds.toFixed(2)),
      });

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during processing.');
      }
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload Catalog PDF</h2>
          <p className="text-gray-600 mb-6">
            Select a brand and a PDF file of a product catalog. The system will extract product information from each page using the Gemini API.
          </p>
          <FileUpload 
            onFileChange={setSelectedFile}
            onBrandChange={setSelectedBrand}
            onProcess={handleProcess}
            brand={selectedBrand}
            file={selectedFile}
            disabled={isLoading} 
          />
        </div>
        
        {isLoading && <div className="max-w-4xl mx-auto mt-6"><Loader progress={progress} /></div>}
        {error && <div className="max-w-4xl mx-auto mt-6"><ErrorDisplay message={error} /></div>}
        
        {(summary || products.length > 0) && !isLoading && (
          <div className="max-w-7xl mx-auto mt-8">
            {summary && <SummaryDisplay summary={summary} />}
            {products.length > 0 && <ResultsDisplay data={products} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;