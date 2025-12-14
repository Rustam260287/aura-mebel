
import { getAdminStorage } from '../firebaseAdmin';
import fetch from 'node-fetch';

/**
 * Сервис для управления медиа-файлами.
 * Все операции возвращают публичные HTTPS ссылки на Firebase Storage.
 */
export class MediaService {
  
  /**
   * Загружает буфер (картинку) в Firebase Storage
   */
  static async uploadBuffer(buffer: Buffer, folder: string, mimeType: string = 'image/png'): Promise<string> {
    const storage = getAdminStorage();
    if (!storage) throw new Error("Firebase Storage not initialized");

    const bucket = storage.bucket();
    // Генерируем уникальное имя: folder/timestamp_random.ext
    const ext = mimeType.split('/')[1] || 'png';
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
   * Скачивает картинку по URL и сохраняет её в наш Storage.
   * Полезно для импорта товаров или сохранения результатов AI.
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
