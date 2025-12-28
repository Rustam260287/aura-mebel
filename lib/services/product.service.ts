export interface ProductFilter {
  category?: string;
  price_min?: number;
  price_max?: number;
  search?: string;
}

export interface Models {
  glb?: string;
  usdz?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price?: number;
  imageUrls: string[];
  description: string;
  models?: Models;
  // TODO: Add other properties as needed
}
