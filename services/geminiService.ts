// Fix: Implement PDF processing and Gemini API interaction.
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Product, Brand } from "../types";
import { getJsonSchema, getPrompt } from "./promptService";

// Tell TypeScript that pdfjsLib is available globally, loaded from index.html
declare const pdfjsLib: any;

// Fix: Initialize GoogleGenAI with API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * A wrapper for the Gemini API call that includes an exponential backoff retry mechanism.
 * @param model The model to use.
 * @param contents The contents for the request.
 * @param config The configuration for the request.
 * @param maxRetries The maximum number of retries.
 * @returns The GenerateContentResponse.
 */
async function generateContentWithRetry(
    model: string, 
    contents: any, 
    config: any, 
    maxRetries = 3
): Promise<GenerateContentResponse> {
  let attempt = 0;
  let delay = 2000; // Start with a 2-second delay

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      return response; // Success
    } catch (error) {
      if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429'))) {
        attempt++;
        if (attempt >= maxRetries) {
          console.error(`Failed after ${maxRetries} attempts.`);
          throw error; // Re-throw the error after the final attempt
        }
        console.warn(`Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Double the delay for the next retry
      } else {
        // For non-rate-limit errors, fail immediately
        throw error;
      }
    }
  }
  // This should be unreachable, but it's a fallback to satisfy TypeScript
  throw new Error("Failed to generate content after multiple retries.");
}


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
        if (error instanceof Error) {
            return reject(new Error(`Failed to process PDF: ${error.message}`));
        }
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

      // Fix: Call Gemini API using the new retry wrapper.
      const response: GenerateContentResponse = await generateContentWithRetry(
        "gemini-2.5-flash",
        { parts: [imagePart, textPart] },
        {
            responseMimeType: "application/json",
            responseSchema: getJsonSchema()
        }
      );
      
      const responseText = response.text.trim();
      
      try {
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
      }

      // Keep a small delay as a primary preventative measure. The retry is a fallback.
      if (i < totalPages - 1) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }
    
    return allProducts;
  } catch (error) {
    console.error("Error processing PDF:", error);
    if (error instanceof Error) {
        let friendlyMessage = error.message;

        if (friendlyMessage.includes('RESOURCE_EXHAUSTED') || friendlyMessage.includes('429')) {
             friendlyMessage = "You have exceeded your request quota for the Gemini API. Please check your plan and billing details, or try again later.";
        } else {
            try {
                const jsonString = friendlyMessage.substring(friendlyMessage.indexOf('{'));
                const errorJson = JSON.parse(jsonString);
                if (errorJson.error?.message) {
                    friendlyMessage = `An API error occurred: ${errorJson.error.message}`;
                }
            } catch (e) {
                // Fallback to original message if parsing fails
            }
        }
        throw new Error(friendlyMessage);
    }
    throw new Error("An unknown error occurred during PDF processing.");
  }
};