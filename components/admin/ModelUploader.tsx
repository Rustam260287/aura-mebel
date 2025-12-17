
'use client'

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Import Auth
import { CubeIcon } from '../Icons';

interface ModelUploaderProps {
  onUploadSuccess: (url: string) => void;
}

export const ModelUploader: React.FC<ModelUploaderProps> = ({ onUploadSuccess }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Get user

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'usdz') {
        setError('Пожалуйста, загрузите файл .glb или .usdz');
        return;
    }
    
    // 3D модели могут быть большими, установим лимит в 100MB
    if (file.size > 100 * 1024 * 1024) {
        setError('Файл слишком большой. Максимальный размер: 100 МБ.');
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        if (!user) throw new Error("Вы не авторизованы");
        const token = await user.getIdToken();

        // Отправляем на тот же эндпоинт, что и изображения, но в папку 'models'
        // API-эндпоинт не будет оптимизировать 3D-модели (т.к. MIME-тип не 'image/'), что нам и нужно.
        const res = await fetch('/api/admin/upload?folder=models', {
            method: 'POST',
            headers: {
                'Content-Type': file.type || 'application/octet-stream',
                'Authorization': `Bearer ${token}` // Send Token
            },
            body: file 
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Upload failed');
        }
        
        const data = await res.json();
        onUploadSuccess(data.url);

      } catch (error: any) {
        setError("Ошибка загрузки: " + error.message);
      } finally {
        setIsLoading(false);
      }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer ${
            isDragOver ? 'border-brand-brown bg-brand-cream/20' : 'border-gray-300 hover:border-brand-brown/50 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('model-upload-input')?.click()}
      >
        <input 
            type="file" 
            id="model-upload-input" 
            className="hidden" 
            accept=".glb,.usdz" 
            onChange={handleFileChange}
            disabled={isLoading}
        />
        
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown mb-3"></div>
                <p className="text-sm font-medium text-brand-brown">Загрузка...</p>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-2">
                <div className="bg-brand-cream/50 p-3 rounded-full mb-3">
                    <CubeIcon className="w-8 h-8 text-brand-brown" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                    Нажмите или перетащите 3D модель
                </p>
                <p className="text-xs text-gray-400">
                    .glb, .usdz (до 100 МБ)
                </p>
            </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
};
