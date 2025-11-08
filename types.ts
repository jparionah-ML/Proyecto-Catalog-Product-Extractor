
export interface Product {
  brand: string;
  campaign: string;
  code: string;
  name: string;
  presentation: string | null;
  content: number;
  offerPrice: number;
  regularPrice: number;
  pageNumber: number;
}

export interface CatalogMetadata {
    brand: string;
    campaign: string;
}
