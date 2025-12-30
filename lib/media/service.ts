
import { getAdminStorage } from '../firebaseAdmin';
import fetch from 'node-fetch';

/**
 * Сервис для управления медиа-файлами.
 * Все операции возвращают публичные HTTPS ссылки на Firebase Storage.
 */
export class MediaService {
  private static inferFileExtension(mimeType: string): string {
    const normalized = (mimeType || '').toLowerCase().split(';')[0].trim();

    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'application/pdf': 'pdf',
      'model/gltf-binary': 'glb',
      'model/gltf+json': 'gltf',
      'model/vnd.usdz+zip': 'usdz',
    };

    if (map[normalized]) return map[normalized];

    const slashIndex = normalized.indexOf('/');
    const subtype = slashIndex >= 0 ? normalized.slice(slashIndex + 1) : normalized;
    const sanitized = subtype.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return sanitized || 'bin';
  }
  
  /**
   * Загружает буфер (картинку) в Firebase Storage
   */
  static async uploadBuffer(buffer: Buffer, folder: string, mimeType: string = 'image/png'): Promise<string> {
    const storage = getAdminStorage();
    if (!storage) throw new Error("Firebase Storage not initialized");

    const bucket = storage.bucket();
    // Генерируем уникальное имя: folder/timestamp_random.ext
    const ext = this.inferFileExtension(mimeType);
    const filename = `${folder}/${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      metadata: { contentType: mimeType },
      public: true // Делаем файл публичным
    });

    // Формируем постоянную публичную ссылку
    // Используем формат: https://storage.googleapis.com/BUCKET/PATH
    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  }

  /**
   * Загружает stream (например, большие 3D модели) в Firebase Storage без буферизации в памяти.
   */
  static async uploadStream(stream: NodeJS.ReadableStream, folder: string, mimeType: string): Promise<string> {
    const storage = getAdminStorage();
    if (!storage) throw new Error("Firebase Storage not initialized");

    const bucket = storage.bucket();
    const ext = this.inferFileExtension(mimeType);
    const filename = `${folder}/${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
    const file = bucket.file(filename);

    await new Promise<void>((resolve, reject) => {
      const writeStream = file.createWriteStream({
        resumable: false,
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });

      stream
        .on('error', reject)
        .pipe(writeStream)
        .on('error', reject)
        .on('finish', () => resolve());
    });

    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  }

  /**
   * Скачивает картинку по URL и сохраняет её в наш Storage.
   * Полезно для импорта объектов или сохранения результатов AI.
   */
  static async uploadFromUrl(url: string, folder: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'image/png';

      return await this.uploadBuffer(buffer, folder, contentType);
    } catch (error) {
      console.error(`MediaService: Failed to upload from URL ${url}`, error);
      throw error;
    }
  }
}
