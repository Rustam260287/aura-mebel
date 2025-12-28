
'use client'

import React, { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../../firebaseConfig'; 
import { CubeIcon, ArrowUpTrayIcon, XMarkIcon } from '../icons';

// Инициализируем Storage
const storage = getStorage(app);

interface ModelUploaderProps {
  onUploadSuccess: (url: string, ext: 'glb' | 'usdz') => void;
}

export const ModelUploader: React.FC<ModelUploaderProps> = ({ onUploadSuccess }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadTask, setUploadTask] = useState<any>(null);

  const processFile = async (file: File) => {
    // Валидация расширения
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'usdz') {
        setError('Пожалуйста, загрузите файл .glb или .usdz');
        return;
    }
    const normalizedExt = ext as 'glb' | 'usdz';

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
        // Создаем уникальное имя файла
        const fileName = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `models/${fileName}`);
        
        // Запускаем загрузку (Resumable upload)
        const task = uploadBytesResumable(storageRef, file);
        setUploadTask(task);

        task.on('state_changed',
          (snapshot) => {
            // Вычисляем прогресс
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload Error:", error);
            setError(`Ошибка загрузки: ${error.message}`);
            setIsLoading(false);
            setUploadProgress(null);
            setUploadTask(null);
          },
          async () => {
            // Загрузка завершена
            const url = await getDownloadURL(task.snapshot.ref);
            setIsLoading(false);
            setUploadProgress(null);
            setUploadTask(null);
            onUploadSuccess(url, normalizedExt);
          }
        );
    } catch (e: any) {
        setError(e.message);
        setIsLoading(false);
        setUploadProgress(null);
    }
  };

  const cancelUpload = () => {
      if (uploadTask) {
          uploadTask.cancel();
          setUploadTask(null);
          setIsLoading(false);
          setUploadProgress(null);
          setError("Загрузка отменена");
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
        className={`border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer relative overflow-hidden ${
            isDragOver ? 'border-brand-brown bg-brand-cream/20' : 'border-gray-300 hover:border-brand-brown/50 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && document.getElementById('model-upload-input')?.click()}
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
            <div className="relative z-10 flex flex-col items-center justify-center py-4">
                <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div 
                        className="h-full bg-brand-brown transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress || 0}%` }}
                    />
                </div>
                <p className="text-sm font-bold text-brand-brown">
                    Загрузка {Math.round(uploadProgress || 0)}%
                </p>
                <button 
                    onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                    className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
                >
                    Отменить
                </button>
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
