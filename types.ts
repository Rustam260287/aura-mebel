
// Existing interfaces (Product, BlogPost, etc.) remain the same...

export interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  imageUrls: string[];
  videoUrl?: string;
  model3dUrl?: string;
  model3dIosUrl?: string;
  has3D?: boolean;
  description: string;
  seoDescription?: string;
  rating: number;
  reviews: Review[];
  specs?: Record<string, string>;
  tags?: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  status: 'draft' | 'published';
  createdAt?: string;
  relatedProducts?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: Partial<Product>[]; // Can attach products to a message
}

// --- NEW TYPES FOR LABEL AI ---

export type UserRole = 'client' | 'designer' | 'production_manager';

/**
 * The "Memory" of the AI for a specific user project.
 * This will be stored in a 'projects' collection in Firestore.
 */
export interface ProjectContext {
  id: string;
  userId: string; // Firebase Auth UID
  name: string; // e.g., "Гостиная для Ивановых"
  role: UserRole; // Defines the AI's communication mode
  
  // Project parameters
  roomType?: string; // "гостиная", "спальня"
  stylePreference?: string; // "лофт", "классика"
  budgetConstraint?: number;
  
  // State
  items: Partial<Product>[]; // Products selected for this project
  chatHistory: ChatMessage[];
  
  createdAt: string;
  updatedAt: string;
}

// Other existing types...
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
  | { page: 'admin' };

export type AdminView = 'dashboard' | 'products' | 'blog' | 'chat-analytics' | 'orders';
