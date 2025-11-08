// Fix: Define the Product interface to be used across the application.
export interface Product {
  brand: string;
  campaign: string;
  code: string;
  name: string;
  presentation?: string;
  content: number;
  offerPrice: number;
  regularPrice: number;
  pageNumber: number;
}

export type Brand = 'Belcorp' | 'Natura' | 'Generic';
