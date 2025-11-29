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
  details?: ProductDetails; // Made optional as per test fix
  isConfigurable?: boolean;
  configurationOptions?: ConfigurationOption[];
  upscaledImageUrl?: string; // Добавляем необязательное поле
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML content
  relatedProducts: string[]; // array of product IDs
  imagePrompt: string;
  imageUrl: string;
  status: 'draft' | 'published'; // Added status field
  createdAt?: string;
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

export interface FurnitureBlueprint {
  furnitureName: string;
  blueprint: {
    estimatedDimensions: string[];
    materials: string[];
  };
  priceEstimate: {
    materialsCost: number;
    laborCost: number;
    totalPrice: number;
  };
}

export interface OrderItem {
    cartId: string;
    id: string;
    name: string;
    price: number;
    configuredPrice: number;
    imageUrls: string[];
    category: string;
    quantity: number;
    selectedOptions?: Record<string, string>;
}

export interface OrderCustomer {
    name: string;
    email: string;
    phone: string;
    address: string;
    comments?: string;
}

export interface Order {
    id: string;
    customer: OrderCustomer;
    items: OrderItem[];
    total: number;
    status: 'new' | 'processing' | 'completed' | 'cancelled';
    createdAt: string;
}

export type AdminView = 'dashboard' | 'products' | 'blog' | 'chat-analytics' | 'orders';
