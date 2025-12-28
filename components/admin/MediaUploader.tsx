'use client'

import React, { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface MediaUploaderProps {
  onUploadSuccess: (url: string, type: 'image' | 'video') => void;
  accept?: string;
  folder?: string;
  children: (open: () => void, isLoading: boolean) => React.ReactNode;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const sanitizeFolder = (folder?: string) => {
  if (!folder) return 'products';
  return folder.replace(/[^a-zA-Z0-9\-_/]/g, '') || 'products';
};

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUploadSuccess,
  accept = 'image/*',
  folder = 'products',
  children,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        alert('Поддерживаются только изображения');
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        alert('Файл слишком большой. Максимальный размер для фото 10МБ.');
        if (inputRef.current) inputRef.current.value = '';
        return;
      }

      setIsLoading(true);
      try {
        if (!user) throw new Error('Вы не авторизованы');
        const token = await user.getIdToken();

        const targetFolder = sanitizeFolder(folder);

        const res = await fetch(`/api/admin/upload?folder=${targetFolder}`, {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
            Authorization: `Bearer ${token}`,
          },
          body: file,
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        onUploadSuccess(data.url, 'image');
      } catch (error) {
        console.error('Upload failed', error);
        alert('Ошибка загрузки файла: ' + (error as any).message);
      } finally {
        setIsLoading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />
      {children(() => inputRef.current?.click(), isLoading)}
    </>
  );
};
