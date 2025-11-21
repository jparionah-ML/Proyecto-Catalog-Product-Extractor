import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Product, Brand } from "../types";
import { getJsonSchema, getPrompt } from "./promptService";

declare const pdfjsLib: any;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Increase concurrency slightly for Flash model, but keep it safe
const CONCURRENCY_LIMIT = 3;

async function generateContentWithRetry(
    model: string, 
    contents: any, 
    config: any, 
    maxRetries = 3
): Promise<GenerateContentResponse> {
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      return response;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('503') || msg.includes('500')) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        const backoff = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed after retries");
}

async function renderPageToImage(pdfDocument: any, pageNumber: number): Promise<string> {
  try {
    const page = await pdfDocument.getPage(pageNumber);
    // Lower scale slightly to 1.2 to save memory/bandwidth without losing OCR accuracy for typical catalog text
    const viewport = page.getViewport({ scale: 1.2 }); 
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    
    if (!context) throw new Error("Canvas context unavailable");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    
    // JPEG 0.7 is usually sufficient for text OCR and much smaller
    const base64Image = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
    
    // Aggressive cleanup
    canvas.width = 0;
    canvas.height = 0;
    return base64Image;
  } catch (err) {
    console.error(`Error rendering page ${pageNumber}`, err);
    throw err;
  }
}

async function processSinglePage(
    pdfDocument: any, 
    pageIndex: number, 
    brand: Brand
): Promise<Product[]> {
    const pageNumber = pageIndex + 1;
    try {
        const base64Image = await renderPageToImage(pdfDocument, pageNumber);
        
        const response = await generateContentWithRetry(
            "gemini-2.5-flash",
            {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } },
                    { text: getPrompt(brand) }
                ]
            },
            {
                responseMimeType: "application/json",
                responseSchema: getJsonSchema()
            }
        );

        const text = response.text?.trim();
        if (!text) return [];

        const data = JSON.parse(text);
        const items: any[] = Array.isArray(data) ? data : [data];

        return items.map(p => ({
            brand: p.brand || brand,
            campaign: p.campaign || '',
            code: String(p.code || '').trim(),
            name: String(p.name || '').trim(),
            presentation: p.presentation || '',
            content: Number(p.content) || 0,
            offerPrice: Number(p.offerPrice) || 0,
            regularPrice: Number(p.regularPrice) || 0,
            pageNumber: pageNumber
        })).filter(p => p.code && p.name); // Basic validity check

    } catch (e) {
        console.warn(`Failed processing page ${pageNumber}`, e);
        return [];
    }
}

export const processPdf = async (
  file: File,
  brand: Brand,
  onProgress: (p: { completedPages: number; totalPages: number }) => void,
  onNewProducts: (products: Product[]) => void
): Promise<Product[]> => {
  
  const fileReader = new FileReader();
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      fileReader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
  });

  const pdfDocument = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
  const totalPages = pdfDocument.numPages;
  let completed = 0;
  const allProducts: Product[] = [];

  onProgress({ completedPages: 0, totalPages });

  // Chunk processing to manage concurrency
  const pages = Array.from({ length: totalPages }, (_, i) => i);
  
  for (let i = 0; i < pages.length; i += CONCURRENCY_LIMIT) {
      const chunk = pages.slice(i, i + CONCURRENCY_LIMIT);
      
      const results = await Promise.all(chunk.map(async (pageIndex) => {
          const products = await processSinglePage(pdfDocument, pageIndex, brand);
          completed++;
          onProgress({ completedPages: completed, totalPages });
          if (products.length > 0) {
              onNewProducts(products);
          }
          return products;
      }));
      
      results.forEach(r => allProducts.push(...r));
  }

  return allProducts;
};
