import { Type } from '@google/genai';
import { Brand } from '../types';

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      brand: { type: Type.STRING, description: "The brand of the product (e.g., Esika, LBel, Cyzone, Natura)." },
      campaign: { type: Type.STRING, description: "The campaign ID in format YYYYXX (e.g., 202509)." },
      code: { type: Type.STRING, description: "The unique product code." },
      name: { type: Type.STRING, description: "The product name, including variants or component details." },
      presentation: { type: Type.STRING, description: "Unit of measure (ml, gr) if applicable." },
      content: { type: Type.NUMBER, description: "Numeric content value." },
      offerPrice: { type: Type.NUMBER, description: "Promotional price." },
      regularPrice: { type: Type.NUMBER, description: "Regular or original price." },
    },
    required: ["code", "name", "regularPrice"]
  }
};

// Enhanced prompt based on detailed user specifications
const belcorpPrompt = `
You are an expert at extracting structured product data from BELCORP (Esika, L'BEL, Cyzone) catalog pages.
Analyze the image and extract valid products into a JSON array.

<RULES>
1. **Master Data (Apply to all)**
   - **brand**: Must be 'Esika', 'LBel', or 'Cyzone'. Correct "L'BEL" to "LBel".
   - **campaign**: Find "C-XX/YYYY" and convert to YYYYXX (e.g., "C-09/2025" -> "202509").

2. **Product Extraction**
   - **code**: Extract the numeric code (keep leading zeros).
   - **name**: Full name + variants + set components.
   - **presentation/content**: Extract 'ml' or 'gr' and the number. Empty for sets/accessories.
   - **Variants**: Create a separate record for each variant (shade, scent) sharing the main price/name attributes.

3. **Pricing Logic**
   - **regularPrice**: Found near "valorizado en", "precio regular", or struck-through.
   - **offerPrice**: The highlighted promotional price. 
     - If only % discount is shown, calculate: regularPrice * (1 - discount).
     - If price is per unit, multiply by content if appropriate (usually just take the displayed total price).
     - If no offer found, set to 0.

4. **Validation**
   - Must have Name, Code, and at least Regular Price (or Offer Price if Regular is missing).
   - Ignore products without codes.
</RULES>
`;

const naturaPrompt = `
You are an expert at extracting structured product data from NATURA catalog pages.
Analyze the image and extract valid products into a JSON array.

<RULES>
1. **Master Data**
   - **brand**: Always 'Natura'.
   - **campaign**: Find "C-XX/YYYY" -> YYYYXX.

2. **Refill (Repuesto) Logic**
   - Check for the word "repuesto" (refill) in the product block.
   - **Case A (Regular)**: If NOT a refill, extract normally.
   - **Case B (Refill)**: If a block contains regular AND refill prices:
     - Create one record for the **Main Product** (prices away from "repuesto").
     - Create a SECOND record for the **Refill**:
       - **name**: Prefix with "Repuesto ".
       - **code**: The code associated with the refill price.
       - **prices**: Use the refill specific prices.

3. **Pricing**
   - **regularPrice**: Struck-through or "precio regular".
   - **offerPrice**: Highlighted price. If not present, 0.

4. **Validation**
   - Must have Code and Name.
</RULES>
`;

const genericPrompt = `
You are an expert at extracting structured product data from catalog pages.
Extract all products with codes and prices.

<RULES>
- **brand**: Detect the brand if visible, or use 'Generic'.
- **campaign**: Detect campaign/catalog ID if visible.
- **code**: Unique SKU/Code.
- **name**: Product title.
- **prices**: Extract 'regularPrice' (original) and 'offerPrice' (discounted).
- **content**: numeric value (e.g. 100).
- **presentation**: unit (e.g. ml).
</RULES>
`;

export const getPrompt = (brand: Brand): string => {
  switch (brand) {
    case 'Belcorp': return belcorpPrompt;
    case 'Natura': return naturaPrompt;
    default: return genericPrompt;
  }
};

export const getJsonSchema = () => schema;
