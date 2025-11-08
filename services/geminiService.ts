import { GoogleGenAI, Type } from "@google/genai";
import { Product, CatalogMetadata } from '../types';

if (!process.env.API_KEY) {
    // In a real app, you'd want to handle this more gracefully.
    // For this environment, we assume it's set.
    console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const EXTRACTION_PROMPT = `
You are an expert data extraction AI for product catalogs.
Analyze the attached catalog page image.
The master Brand and Campaign are provided. Your task is to extract all valid product blocks from this page.

Extraction Rules:
1.  A product is valid only if it has a Name, a Code, and at least a Regular Price.
2.  If a product is a SET or KIT, 'presentation' and 'content' should be null/0.
3.  For products with variants (e.g., different shades), create a separate entry for each variant, inheriting common details like price.
4.  If an offer price is not explicitly shown but a discount percentage is (e.g., 50% DSCTO), calculate it from the regular price. If no offer price or discount is shown, set offerPrice to 0.
5.  Assign the provided page number to every product found on this page.

Return the result as a JSON array of product objects according to the provided schema. If no valid products are found, return an empty array.
`;

const METADATA_PROMPT = `
Analyze the first page of the catalog provided in the image.
Extract the Brand name (e.g., Esika, L'BEL, Cyzone) and the Campaign code.
The campaign code is in the format "C-XX/YYYY". Convert it to "YYYYXX".
Return the result as a single JSON object with 'brand' and 'campaign' keys.
`;

const productSchema = {
    type: Type.OBJECT,
    properties: {
        code: { type: Type.STRING, description: 'Product code/ID.' },
        name: { type: Type.STRING, description: 'Full product name, including variant if applicable.' },
        presentation: { type: Type.STRING, description: "Unit of measure ('ml' or 'gr'). Should be an empty string for sets, kits, or non-measured items." },
        content: { type: Type.NUMBER, description: "Numerical value of the content. 0 for sets/kits." },
        offerPrice: { type: Type.NUMBER, description: "Promotional price. 0 if not available." },
        regularPrice: { type: Type.NUMBER, description: "Original/list price. Must be present for a valid product." },
    },
    required: ["code", "name", "regularPrice"]
};

const extractProductsFromPage = async (
    file: File,
    pageNumber: number,
    metadata: CatalogMetadata
): Promise<Product[]> => {
    const imagePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                imagePart,
                { text: `Master Brand: ${metadata.brand}, Master Campaign: ${metadata.campaign}, Page Number: ${pageNumber}` }
            ]
        },
        config: {
            systemInstruction: EXTRACTION_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: productSchema
            },
        },
    });

    try {
        const jsonText = response.text.trim();
        const productsOnPage: Omit<Product, 'brand' | 'campaign' | 'pageNumber'>[] = JSON.parse(jsonText);

        return productsOnPage.map(p => ({
            ...p,
            brand: metadata.brand,
            campaign: metadata.campaign,
            pageNumber: pageNumber,
            presentation: p.presentation || null,
        }));
    } catch (e) {
        console.error(`Failed to parse JSON for page ${pageNumber}:`, response.text);
        throw new Error(`The model returned an invalid format for page ${pageNumber}. Please check the console for details.`);
    }
};

const extractMetadata = async (firstPageFile: File): Promise<CatalogMetadata> => {
    const imagePart = await fileToGenerativePart(firstPageFile);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart] },
        config: {
            systemInstruction: METADATA_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    brand: { type: Type.STRING },
                    campaign: { type: Type.STRING },
                },
                required: ["brand", "campaign"]
            },
        },
    });
    
    try {
        const jsonText = response.text.trim();
        const metadata: CatalogMetadata = JSON.parse(jsonText);
        if(metadata.brand === "L'BEL") metadata.brand = "LBel";
        return metadata;
    } catch(e) {
        console.error("Failed to parse metadata JSON:", response.text);
        throw new Error("Could not extract Brand and Campaign from the first page.");
    }
};

export const extractProductsFromCatalog = async (
    files: File[],
    onProgress: (progress: { currentPage: number, totalPages: number }) => void
): Promise<Product[]> => {
    if (files.length === 0) return [];
    
    const firstPage = files[0];
    const metadata = await extractMetadata(firstPage);
    
    if (!metadata || !metadata.brand || !metadata.campaign) {
        throw new Error("Failed to retrieve essential metadata (Brand/Campaign) from the first catalog page.");
    }

    const allProducts: Product[] = [];
    const totalPages = files.length;

    for (const [index, file] of files.entries()) {
        const currentPage = index + 1;
        onProgress({ currentPage, totalPages });
        const productsOnPage = await extractProductsFromPage(file, currentPage, metadata);
        allProducts.push(...productsOnPage);
    }
    
    return allProducts;
};