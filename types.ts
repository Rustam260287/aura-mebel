
export interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProductDetails {
  dimensions: string;
  material: string;
  care: string;
}

export interface ConfigurationChoice {
    name: string;
}

export interface ConfigurationOption {
    id: string;
    name: string;
    choices: ConfigurationChoice[];
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  imageUrls: string[];
  description: string;
  seoDescription?: string;
  rating: number;
  reviews: Review[];
  details: ProductDetails;
  isConfigurable?: boolean;
  configurationOptions?: ConfigurationOption[];
}

export type View =
  | { page: 'home' }
  | { page: 'catalog'; category?: string; searchTerm?: string }
  | { page: 'product'; productId: number }
  | { page: 'wishlist' }
  | { page: 'about' }
  | { page: 'contacts' }
  | { page: 'lookbook' }
  | { page: 'visual-search' }
  | { page: 'blog-list' }
  | { page: 'blog-post'; postId: number }
  | { page: 'admin' };

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  relatedProducts: number[];
  imagePrompt: string;
  imageUrl: string;
}
