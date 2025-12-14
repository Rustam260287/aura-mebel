
import { getAdminDb } from '../firebaseAdmin';
import { Product } from '../../types';
import admin from 'firebase-admin';

export interface ProductFilter {
  category?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}

export class ProductService {
  private static getCollection() {
    const db = getAdminDb();
    if (!db) throw new Error("Database not initialized");
    return db.collection('products');
  }

  /**
   * Получить товар по ID
   */
  static async getById(id: string): Promise<Product | null> {
    try {
      const doc = await this.getCollection().doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as Product;
    } catch (error) {
      console.error(`ProductService.getById(${id}) error:`, error);
      return null;
    }
  }

  /**
   * Получить список товаров с фильтрацией и пагинацией.
   * (Логика перенесена из pages/products/index.tsx)
   */
  static async getAll(filter: ProductFilter = {}): Promise<{ products: Product[], total: number }> {
    try {
      let query: admin.firestore.Query = this.getCollection();

      // Categories
      if (filter.category && filter.category.length > 0) {
        if (filter.category.length === 1) {
            query = query.where('category', '==', filter.category[0]);
        } else {
            query = query.where('category', 'in', filter.category.slice(0, 10)); // Firestore limit
        }
      }

      // Price (Note: Firestore requires inequality filter on the same field as orderBy)
      // This logic often requires client-side filtering or advanced indexing.
      // For now, let's keep it simple: fetch then filter if complex sort needed.
      
      // ... Complex filtering logic to be migrated fully later ...
      // For this first version, we return basic query result
      
      const limit = filter.limit || 12;
      const offset = filter.offset || 0;

      // TODO: Implement proper sort + filter combination logic
      // For now, simple fetch
      
      const snapshot = await query.limit(limit).offset(offset).get();
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      // Total count (approx)
      // const countSnap = await query.count().get(); // New nodejs SDK supports count()
      
      return { products, total: 0 }; // Total 0 for now until full migration

    } catch (error) {
      console.error("ProductService.getAll error:", error);
      return { products: [], total: 0 };
    }
  }
}
