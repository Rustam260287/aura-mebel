import React, { memo, useEffect, useState } from 'react';
import type { JournalEntry } from '../types';
import { Button } from './Button';
import { XMarkIcon, TrashIcon } from './icons';
import Image from 'next/image';
import { getAuth } from 'firebase/auth';

interface JournalEditModalProps {
  entry: JournalEntry;
  onClose: () => void;
  onSave: (entryData: JournalEntry) => Promise<void>;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export const JournalEditModal: React.FC<JournalEditModalProps> = memo(({ entry, onClose, onSave }) => {
  const [formData, setFormData] = useState<JournalEntry>(entry);
  const [relatedObjectsString, setRelatedObjectsString] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(entry);
    setRelatedObjectsString((entry.relatedObjectIds || []).join(', '));
    setSaveError(null);
  }, [entry]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      setSaveError('Поддерживаются только изображения');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setSaveError('Файл слишком большой. Максимальный размер 10 МБ.');
      return;
    }
    setIsUploading(true);
    setSaveError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Вы не авторизованы');
      const token = await user.getIdToken();

      const res = await fetch('/api/admin/upload?folder=journal', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          Authorization: `Bearer ${token}`,
        },
        body: file,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data as any)?.error || 'Не удалось загрузить изображение');
      }
      const url = (data as any)?.url;
      if (typeof url !== 'string' || !url) {
        throw new Error('Некорректный ответ сервера');
      }

      setFormData(prev => ({
        ...prev,
        imageUrl: url,
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setSaveError('Ошибка загрузки изображения');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const relatedObjectIds = relatedObjectsString
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    const finalData: JournalEntry = {
      ...formData,
      relatedObjectIds,
    };

    try {
      await onSave(finalData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить запись';
      setSaveError(message);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-serif text-brand-brown">Редактировать запись журнала</h2>
          <Button variant="ghost" onClick={onClose} className="p-2 -mr-2">
            <XMarkIcon className="w-6 h-6" />
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Заголовок
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Статус
              </label>
              <select
                name="status"
                id="status"
                value={formData.status || 'draft'}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border"
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
              Анонс
            </label>
            <textarea
              name="excerpt"
              id="excerpt"
              value={formData.excerpt || ''}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Обложка</label>
            {formData.imageUrl ? (
              <div className="relative group w-full max-w-md aspect-video bg-gray-100 rounded overflow-hidden">
                <Image src={formData.imageUrl} alt="Cover" fill className="object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  aria-label="Удалить изображение"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="w-full max-w-md h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-brand-brown bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-sm text-gray-600">
                  {isUploading ? 'Загрузка...' : 'Нажмите для загрузки изображения'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Текст (HTML)
            </label>
            <textarea
              name="content"
              id="content"
              value={formData.content}
              onChange={handleChange}
              rows={12}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border font-mono text-sm"
            />
          </div>

          <div>
            <label htmlFor="relatedObjectIds" className="block text-sm font-medium text-gray-700">
              ID связанных объектов (через запятую)
            </label>
            <input
              type="text"
              name="relatedObjectIds"
              id="relatedObjectIds"
              value={relatedObjectsString}
              onChange={e => setRelatedObjectsString(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border"
            />
          </div>

          <div>
            <label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-700">
              Промпт для изображения (опционально)
            </label>
            <input
              type="text"
              name="imagePrompt"
              id="imagePrompt"
              value={formData.imagePrompt || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-brown focus:ring-brand-brown p-2 border"
            />
          </div>

          {saveError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {saveError}
            </div>
          )}
        </form>

        <footer className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isUploading}>
            Сохранить
          </Button>
        </footer>
      </div>
    </div>
  );
});

JournalEditModal.displayName = 'JournalEditModal';
