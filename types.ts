export interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string; // ISO date string
}

export interface ConfigurationOptionChoice {
    name: string;
}

export interface ConfigurationOption {
  id: string;
  name: string;
  choices: ConfigurationOptionChoice[];
}

export interface ProductDetails {
    dimensions: string;
    material: string;
    care: string;
}

export interface Product {
  id: string;
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

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML content
  relatedProducts: string[]; // array of product IDs
  imagePrompt: string;
  imageUrl: string;
}

export type View =
  | { page: 'home' }
  | { page: 'catalog', category?: string, searchTerm?: string }
  | { page: 'product', productId: string }
  | { page: 'wishlist' }
  | { page: 'ai-room-makeover' }
  | { page: 'blog-list' }
  | { page: 'blog-post', postId: string }
  | { page: 'about' }
  | { page: 'contacts' }
  | { page: 'checkout' }
  | { page: 'order-success', orderId: string }
  | { page: 'admin' }
  | { page: 'visual-search' }
  | { page: 'furniture-from-photo' }
  | { page: 'ai-designer' }
  | { page: 'virtual-showroom' }
  | { page: 'content-tools' };


export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatAnalysisResult {
    actionableInsights: string[];
    themes: string[];
    mentionedProducts: string[];
    commonQuestions: string[];
}