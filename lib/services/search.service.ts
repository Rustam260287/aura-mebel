
import OpenAI from 'openai';
import { getAdminDb } from '../firebaseAdmin';
import admin from 'firebase-admin';
import { Product } from '../../types';

// Helper types
interface SearchOptions {
  query: string;
  limit?: number;
  minScore?: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class SearchService {
  
  /**
   * Умный поиск товаров (Гибридный: Векторы + Теги + Размеры)
   */
  static async search(options: SearchOptions): Promise<Product[]> {
    const { query, limit = 10 } = options;
    const db = getAdminDb();
    if (!db) return [];

    // 1. Подготовка всех товаров (в идеале - кешировать это или использовать Vector DB)
    // Для < 500 товаров можно держать в памяти или читать быстро
    const snapshot = await db.collection('products').limit(300).get();
    const allProducts = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        _searchTags: this.extractProductTags(d), // Helper
        _dims: this.parseDimensions((d.description || d.description_main || '').toString())
      } as any;
    });

    const userDims = this.parseDimensions(query);
    const queryTags = this.extractQueryTags(query);
    
    // 2. Векторный поиск (если есть ключ)
    let candidates = allProducts;
    if (process.env.OPENAI_API_KEY) {
        const embedding = await this.getEmbedding(query);
        if (embedding) {
            candidates = allProducts.map(p => ({
                ...p,
                _score: this.cosineSimilarity(embedding, p.embedding || []) + this.sizePenalty(userDims, p._dims)
            })).sort((a, b) => b._score - a._score);
        }
    }

    // 3. Теговый ре-ранкинг (если векторов нет или как дополнение)
    // Если кандидаты не отсортированы вектором, сортируем по тегам
    if (!process.env.OPENAI_API_KEY) {
        candidates = allProducts.map(p => {
            let score = 0;
            const pTags = new Set(p._searchTags);
            queryTags.forEach(t => pTags.has(t) && (score += 2));
            return { ...p, _score: score };
        }).sort((a, b) => b._score - a._score);
    }

    return candidates.slice(0, limit);
  }

  // --- HELPERS (Copied & Refined from chat/message.ts) ---

  private static async getEmbedding(text: string) {
    try {
        const res = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.slice(0, 2000),
        });
        return res.data[0]?.embedding;
    } catch (e) {
        console.error("Embedding failed", e);
        return null;
    }
  }

  private static cosineSimilarity(a: number[], b: number[]) {
    if (!a?.length || !b?.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB)) || 0;
  }

  private static parseDimensions(text: string) {
    const lower = (text || '').toLowerCase();
    const findVal = (keys: string[]) => {
        for (const key of keys) {
            const regex = new RegExp(`${key}[\\s:]*([0-9]{2,4})`, 'i');
            const match = lower.match(regex);
            if (match?.[1]) return Number(match[1]);
        }
        return undefined;
    };
    return {
        length: findVal(['длина', 'l=', 'l ']),
        width: findVal(['ширина', 'w=', 'w ']),
        depth: findVal(['глубина', 'depth', 'd=', 'd ']),
        height: findVal(['высота', 'h=', 'h ']),
    };
  }

  private static sizePenalty(user: any, prod: any) {
      if (!user) return 0;
      let p = 0;
      const cmp = (u?: number, v?: number) => {
          if (!u || !v) return 0;
          const diff = Math.abs(u - v) / u;
          return diff < 0.15 ? 0.5 : (diff > 0.3 ? -1 : 0);
      };
      p += cmp(user.length, prod.length);
      p += cmp(user.width, prod.width);
      // ... others
      return p;
  }

  private static extractQueryTags(text: string) {
      const t = text.toLowerCase();
      const tags = new Set<string>();
      const add = (c: boolean, v: string) => c && tags.add(v);
      add(/диван/.test(t), 'диван');
      add(/кровать/.test(t), 'кровать');
      add(/стол/.test(t), 'стол');
      // ... full list from chat logic ...
      return Array.from(tags);
  }

  private static extractProductTags(data: any) {
      // Simplified extraction logic for service
      const tags = new Set<string>();
      if (Array.isArray(data.tags)) data.tags.forEach((t: string) => tags.add(t.toLowerCase()));
      return Array.from(tags);
  }
}
