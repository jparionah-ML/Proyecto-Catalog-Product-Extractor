import { Type } from '@google/genai';
import { Brand } from '../types';

// Fix: Updated prompt to use schema-consistent field names (e.g., code, name, regularPrice).
const belcorpPrompt = `
You are an expert at extracting structured product data from BELCORP (Esika, L'BEL, Cyzone) catalog pages.
Analyze the provided image and extract all valid product entries.

<REGLAS>
1.  **Product Attributes**
    *   **brand:** The value should be one of: Esika, L'BEL, or Cyzone. Correct 'L'BEL' to 'LBel'. This value is a MASTER VALUE for the entire session.
    *   **campaign:** Find text like "C-XX/YYYY". Construct the campaign ID as YYYYXX (e.g., "C-09/2025" becomes 202509). This is a MASTER VALUE and must be applied to all extracted products.
    *   **code:** Extract the product code. It may have a leading zero.
    *   **name:** Extract the product name. For SETs or KITs, include component descriptions. For products with variants (e.g., shades, scents), combine the main name and the variant name. Create individual records for each variant, inheriting common attributes.
    *   **presentation and content:** Extract 'presentation' as "ml" or "gr" and 'content' as the numeric value. For SETs or KITs, these should be empty.

2.  **Price Attributes**
    *   **regularPrice:** Identify the original price, often found with text like "valorizado en", "precio regular", or is struck-through.
    *   **offerPrice:** Identify the promotional price, usually more prominent. If only a discount percentage (e.g., 50% DSCTO) is visible, calculate the offer price from the regular price. If a price per unit is shown, multiply by the 'content'. If no offer price is found, use 0.

3.  **Validation Rules**
    *   A product is valid only if it has a \`name\`, \`code\`, and at least a \`regularPrice\`.
    *   A "Valid Product Block" is a visually distinct area (bordered, different background) or a tightly grouped cluster of product information.
    *   Register a product every time it appears on any page. Do not deduplicate by code. The combination of \`code\` and the page number defines a unique entry.
</REGLAS>

Return the data as a JSON array matching the provided schema. Do not return markdown \`json\` block.
`;

// Fix: Updated prompt to use schema-consistent field names and clarified rules.
const naturaPrompt = `
You are an expert at extracting structured product data from Natura catalog pages.
Analyze the provided image and extract all valid product entries, paying close attention to regular products versus refills ("repuesto").

<REGLAS>
1.  **Product Attributes**
    *   **brand:** The value must be 'Natura'. This is a MASTER VALUE.
    *   **campaign:** Find text like "C-XX/YYYY". Construct the campaign ID as YYYYXX (e.g., "C-09/2025" becomes 202509). This is a MASTER VALUE.
    *   **code:** Extract the product code.
    *   **name:** Extract the product name. For variants, create separate records. For refills, prefix the name with "Repuesto ".
    *   **presentation and content:** Extract 'presentation' as "ml" or "gr" and 'content' as the numeric value. Exclude for accessories, SETs or KITs.

2.  **Price Attributes (Special Natura Rules)**
    *   Identify a "product block" (a self-contained visual area for a product).
    *   **Refill Condition:** Check if the word "repuesto" (or plural, case-insensitive) exists in the block.
    *   **CASE A (Not a Refill):** Create ONE record. Extract the \`regularPrice\` (original/struck-through price) and \`offerPrice\` (promotional price).
    *   **CASE B (Is a Refill):** Create TWO separate records:
        1.  **Regular Product:** Use the code and prices NOT in proximity to the word "repuesto".
        2.  **Refill Product:** Use the code and prices that ARE in proximity to the word "repuesto". The \`name\` must be prefixed with "Repuesto ". The offer price for a refill is typically 0 unless explicitly stated otherwise.

3.  **Validation Rules**
    *   A product must have \`name\`, \`code\`, and \`regularPrice\`.
    *   Register a product for every appearance on any page. Uniqueness is defined by \`code\` + page number.
</REGLAS>

Return the data as a JSON array matching the provided schema. Do not return markdown \`json\` block.
`;

const genericPrompt = `
You are an expert at extracting structured data from product catalog pages.
Analyze the provided image of a catalog page and extract all product details.
For each product, identify the following fields:
- brand: The brand of the product.
- campaign: The campaign name or catalog edition.
- code: The unique product code or SKU.
- name: The name of the product.
- presentation: The unit of the content (e.g., "ml", "L", "units", "g", "kg").
- content: The numerical value of the content (e.g., for "750ml", content is 750 and presentation is "ml").
- offerPrice: The discounted or offer price.
- regularPrice: The original or regular price.

IMPORTANT: All monetary values and content values must be extracted as numbers, without currency symbols, units or commas.
If a value is not present for a field, use a sensible default (e.g., 0 for prices/content, empty string for text fields).
Return the data as a JSON array matching the provided schema. Do not return markdown \`json\` block.
`;


export const getPrompt = (brand: Brand): string => {
  switch (brand) {
    case 'Belcorp':
      return belcorpPrompt;
    case 'Natura':
      return naturaPrompt;
    case 'Generic':
    default:
      return genericPrompt;
  }
};

export const getJsonSchema = () => {
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        brand: { type: Type.STRING, description: "The brand of the product." },
        campaign: { type: Type.STRING, description: "The campaign name or catalog edition." },
        code: { type: Type.STRING, description: "The unique product code or SKU." },
        name: { type: Type.STRING, description: "The name of the product." },
        presentation: { type: Type.STRING, description: "The unit of the product's content (e.g., ml, g, units)." },
        content: { type: Type.NUMBER, description: "The numerical value of the product's content." },
        offerPrice: { type: Type.NUMBER, description: "The discounted or offer price." },
        regularPrice: { type: Type.NUMBER, description: "The original or regular price." },
      },
      required: ["code", "name", "regularPrice"]
    }
  };
  return schema;
};
