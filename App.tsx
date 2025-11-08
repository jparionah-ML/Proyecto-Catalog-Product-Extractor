import React, { useState, useCallback } from 'react';
import { Product } from './types';
import { extractProductsFromCatalog } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Loader } from './components/Loader';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';

// Add declaration for pdf.js, loaded from CDN in index.html
declare const pdfjsLib: any;

interface ProgressState {
  currentPage: number;
  totalPages: number;
}

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles));
      setExtractedData([]);
      setError(null);
    }
  };

  const processFilesForExtraction = async (filesToProcess: File[]): Promise<File[]> => {
    const imageFiles: File[] = [];
    if (typeof pdfjsLib === 'undefined') {
        throw new Error("PDF processing library is not loaded. Please check your internet connection and refresh the page.");
    }

    for (const file of filesToProcess) {
      if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      } else if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const numPages = pdf.numPages;
  
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Use higher scale for better quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
  
            if (context) {
              await page.render({ canvasContext: context, viewport: viewport }).promise;
              const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
              if (blob) {
                // Create a new File object with a descriptive name
                const imageFile = new File([blob], `${file.name}-page-${i}.jpg`, { type: 'image/jpeg' });
                imageFiles.push(imageFile);
              }
            }
          }
        } catch (pdfError) {
          console.error(`Error processing PDF ${file.name}:`, pdfError);
          throw new Error(`Failed to process PDF: ${file.name}. It may be corrupted or password-protected.`);
        }
      }
    }
    return imageFiles;
  };

  const handleProgressUpdate = useCallback((progressUpdate: ProgressState) => {
    setProgress(progressUpdate);
  }, []);

  const handleProcessCatalog = useCallback(async () => {
    if (files.length === 0) {
      setError("Please select catalog files (images or PDF) first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData([]);
    setProgress(null);

    try {
      const imageFiles = await processFilesForExtraction(files);
      if (imageFiles.length === 0) {
        throw new Error("No processable images found. Please provide image files or a valid, non-empty PDF.");
      }
      const data = await extractProductsFromCatalog(imageFiles, handleProgressUpdate);
      setExtractedData(data);
    } catch (err) {
      console.error(err);
      let friendlyMessage = "An unknown error occurred during extraction.";
      if (err instanceof Error) {
          friendlyMessage = err.message;
          // Try to parse a more specific error message from Gemini
          try {
              const errorJson = JSON.parse(err.message);
              if (errorJson.error && errorJson.error.message) {
                  friendlyMessage = errorJson.error.message;
              }
          } catch (parseError) {
              // Not a JSON error string, use the original message
          }
      }
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [files, handleProgressUpdate]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-700">Upload Catalog Pages</h2>
            <p className="text-gray-500 mt-2">
              Select one or more images or PDF files of your product catalog to begin the extraction process.
            </p>
          </div>

          <FileUpload
            onFileChange={handleFileChange}
            onProcess={handleProcessCatalog}
            fileCount={files.length}
            isLoading={isLoading}
          />

          {isLoading && <Loader progress={progress} />}
          
          {error && <ErrorDisplay message={error} />}

          {!isLoading && extractedData.length > 0 && (
            <ResultsDisplay data={extractedData} />
          )}
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Catalog Product Extractor. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;