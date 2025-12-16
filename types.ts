
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
  videoUrl?: string; // Добавлено поле для видео
  model3d?: string; // Временное поле для UI/форм
  model3dUrl?: string; // URL 3D модели (GLB)
  model3dIosUrl?: string; // URL для iOS Quick Look (USDZ)
  has3D?: boolean; // Флаг наличия 3D модели
  description: string;
  seoDescription?: string;
  rating: number;
  reviews: Review[];
  details?: ProductDetails; // Made optional as per test fix
  isConfigurable?: boolean;
  configurationOptions?: ConfigurationOption[];
  upscaledImageUrl?: string; // Добавляем необязательное поле
  tags?: string[];
  styleTags?: string[];
  materialTags?: string[];
  colorTags?: string[];
  formTags?: string[];
  specs?: Record<string, string>; // Характеристики (Ширина, Глубина и т.д.)
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML content
  relatedProducts?: string[]; // array of product IDs
  imagePrompt?: string; // Make optional as generated posts might not have it
  imageUrl: string;
  status: 'draft' | 'published'; // Added status field
  createdAt?: string;
  tags?: string[]; // Added tags
  author?: string; // Added author
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
  role: 'user' | 'assistant'; // unified role names
  content: string;
  products?: Partial<Product>[]; // Can attach products to a message
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
    userId?: string; // Added userId for security rules
}

export type AdminView = 'dashboard' | 'products' | 'blog' | 'chat-analytics' | 'orders';

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
