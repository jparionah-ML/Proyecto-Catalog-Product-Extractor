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
  const [progress, setProgress] = useState<{ completedPages: number; totalPages: number } | null>(null);
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
    
    const start = Date.now();

    try {
      const results = await processPdf(
        selectedFile, 
        selectedBrand, 
        (p) => setProgress(p), 
        (newItems) => setProducts(prev => [...prev, ...newItems])
      );

      const duration = (Date.now() - start) / 1000;
      
      setSummary({
        brand: selectedBrand,
        totalPages: progress?.totalPages || 0,
        totalProducts: results.length,
        processingTime: parseFloat(duration.toFixed(2)),
      });

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="space-y-8">
          
          {/* Upload Section */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
             <div className="p-6 md:p-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">New Extraction</h2>
                    <p className="text-slate-500 mt-1">Upload your PDF catalog to begin extracting product data.</p>
                </div>
                <FileUpload 
                    onFileChange={setSelectedFile}
                    onBrandChange={setSelectedBrand}
                    onProcess={handleProcess}
                    brand={selectedBrand}
                    file={selectedFile}
                    disabled={isLoading} 
                />
             </div>
             
             {isLoading && (
                 <div className="bg-slate-50 border-t border-slate-100 p-6 md:p-8">
                     <Loader progress={progress} />
                 </div>
             )}
          </section>

          {error && <ErrorDisplay message={error} />}
          
          {/* Results Section */}
          {(products.length > 0 || summary) && (
             <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {summary && <SummaryDisplay summary={summary} />}
                <ResultsDisplay data={products} isLoading={isLoading} />
             </section>
          )}
        </div>
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} Catalog Extractor AI. Powered by Gemini 2.5 Flash.</p>
      </footer>
    </div>
  );
};

export default App;
