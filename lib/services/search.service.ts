
import OpenAI from 'openai';
import { getAdminDb } from '../firebaseAdmin';
import admin from 'firebase-admin';
import type { ObjectAdmin } from '../../types';
import { COLLECTIONS } from '../db/collections';

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
   * Умный поиск объектов (Гибридный: Векторы + Теги + Размеры + Точное название)
   */
  static async search(options: SearchOptions): Promise<ObjectAdmin[]> {
    const { query, limit = 10 } = options;
    const db = getAdminDb();
    if (!db) return [];

    // 1. Подготовка (Кеширование в памяти для скорости)
    const snapshot = await db.collection(COLLECTIONS.objects).limit(300).get();
    const allObjects = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        objectType: d.objectType ?? d.category ?? '',
        _searchTags: this.extractObjectTags(d),
        _dims: this.parseDimensions((d.description || d.description_main || '').toString())
      } as any;
    });

    const userDims = this.parseDimensions(query);
    const queryTags = this.extractQueryTags(query);
    
    // Подготовка ключевых слов для поиска по названию
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // 2. Векторный поиск (если есть ключ)
    let candidates = allObjects;
    let embeddingsMap = new Map<string, number>();

    if (process.env.OPENAI_API_KEY) {
        const embedding = await this.getEmbedding(query);
        if (embedding) {
            candidates.forEach(p => {
                const score = this.cosineSimilarity(embedding, p.embedding || []);
                embeddingsMap.set(p.id, score);
            });
        }
    }

    // 3. Гибридный ранкинг (Scoring)
    candidates = candidates.map(p => {
        let score = embeddingsMap.get(p.id) || 0;

        // A. Бонус за название (Keyword Match) - Самый важный!
        const nameLower = p.name.toLowerCase();
        queryWords.forEach(word => {
            if (nameLower.includes(word)) {
                score += 5.0; // Огромный бонус за совпадение имени (Парус, Gucci и т.д.)
            }
        });

        // B. Бонус за теги
        const pTags = new Set(p._searchTags);
        queryTags.forEach(t => {
            if (pTags.has(t)) score += 0.5;
        });

        // C. Бонус/Штраф за размеры
        score += this.sizePenalty(userDims, p._dims);

        return { ...p, _score: score };
    });

    // 4. Сортировка и выдача
    return candidates
        .sort((a, b) => b._score - a._score)
        .slice(0, limit);
  }

  // --- HELPERS ---

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
      // Only apply if user asked for specific dims
      if (user.length) p += cmp(user.length, prod.length);
      if (user.width) p += cmp(user.width, prod.width);
      if (user.depth) p += cmp(user.depth, prod.depth);
      if (user.height) p += cmp(user.height, prod.height);
      return p;
  }

  private static extractQueryTags(text: string) {
      const t = text.toLowerCase();
      const tags = new Set<string>();
      const add = (c: boolean, v: string) => c && tags.add(v);
      add(/диван/.test(t), 'диван');
      add(/кровать/.test(t), 'кровать');
      add(/стол/.test(t), 'стол');
      return Array.from(tags);
  }

  private static extractObjectTags(data: any) {
      const tags = new Set<string>();
      if (Array.isArray(data.tags)) data.tags.forEach((t: string) => tags.add(t.toLowerCase()));
      return Array.from(tags);
  }
}
