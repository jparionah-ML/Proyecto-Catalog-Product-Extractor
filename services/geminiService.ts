// Fix: Implement PDF processing and Gemini API interaction.
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import { Product, Brand } from "../types";
import { getJsonSchema, getPrompt } from "./promptService";

// The worker is needed for pdfjs-dist to work in a browser environment.
// Using a CDN for simplicity.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Fix: Initialize GoogleGenAI with API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

async function pdfToImages(file: File): Promise<string[]> {
  const images: string[] = [];
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          return reject(new Error("Failed to read file"));
        }
        const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const base64Image = canvas.toDataURL("image/jpeg").split(",")[1];
            images.push(base64Image);
          }
        }
        resolve(images);
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = (error) => {
      reject(error);
    };

    fileReader.readAsArrayBuffer(file);
  });
}

export const processPdf = async (
  file: File,
  brand: Brand,
  onProgress: (progress: { currentPage: number; totalPages: number }) => void
): Promise<Product[]> => {
  try {
    const imageDatas = await pdfToImages(file);
    const totalPages = imageDatas.length;
    let allProducts: Product[] = [];

    onProgress({ currentPage: 0, totalPages: totalPages });

    for (let i = 0; i < totalPages; i++) {
      const pageNumber = i + 1;
      onProgress({ currentPage: pageNumber, totalPages: totalPages });
      
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageDatas[i],
        },
      };

      const textPart = { text: getPrompt(brand) };

      // Fix: Call Gemini API using the correct method and parameters.
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: getJsonSchema()
        }
      });
      
      // Fix: Use response.text to get the generated content.
      const responseText = response.text.trim();
      
      try {
        // The API might return an array or a single object for a single product page.
        // We'll handle both cases.
        const parsedData = JSON.parse(responseText);
        const pageProducts: Omit<Product, 'pageNumber'>[] = Array.isArray(parsedData) ? parsedData : [parsedData];

        const productsWithMetadata = pageProducts.map(p => ({
          ...p,
          pageNumber: pageNumber,
          brand: p.brand || "N/A",
          campaign: p.campaign || "N/A"
        }));
        allProducts = [...allProducts, ...productsWithMetadata];
      } catch(e) {
        console.error(`Error parsing JSON from page ${pageNumber}:`, responseText, e);
        // Continue to next page if one page fails to parse
      }
    }
    
    return allProducts;
  } catch (error) {
    console.error("Error processing PDF:", error);
    if (error instanceof Error) {
        const message = error.message;
        // Try to parse a more specific error from Gemini
        try {
          const errorJson = JSON.parse(message.substring(message.indexOf('{'), message.lastIndexOf('}') + 1));
          if(errorJson.error?.message) {
            throw new Error(`Gemini API Error: ${errorJson.error.message}`);
          }
        } catch(e) {
          // Fallback to original error message
          throw new Error(`Failed to process PDF: ${message}`);
        }
        throw new Error(`Failed to process PDF: ${message}`);
    }
    throw new Error("An unknown error occurred during PDF processing.");
  }
};
