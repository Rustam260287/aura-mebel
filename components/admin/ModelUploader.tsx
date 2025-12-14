
'use client'

import React, { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../../firebaseConfig'; 
import { CubeIcon, ArrowUpTrayIcon } from '../Icons';

const storage = getStorage(app);

interface ModelUploaderProps {
  onUploadSuccess: (url: string) => void;
}

export const ModelUploader: React.FC<ModelUploaderProps> = ({ onUploadSuccess }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = async (file: File) => {
    // Basic validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'usdz') {
        setError('Пожалуйста, загрузите файл .glb или .usdz');
        return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
        const fileName = `${new Date().getTime()}-${file.name}`;
        const storageRef = ref(storage, `models/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload Error:", error);
            setError(`Ошибка загрузки: ${error.message}`);
            setIsLoading(false);
            setUploadProgress(null);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
              // Creating a proxy-friendly URL if needed, but for now raw URL is fine as our Viewer handles it
              // Actually, better to store the direct firebase storage URL 
              setIsLoading(false);
              setUploadProgress(null);
              onUploadSuccess(url);
            });
          }
        );
    } catch (e: any) {
        setError(e.message);
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
        />
        
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-brown mb-3"></div>
                <p className="text-sm font-medium text-brand-brown">Загрузка... {uploadProgress ? Math.round(uploadProgress) : 0}%</p>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-2">
                <div className="bg-brand-cream/50 p-3 rounded-full mb-3">
                    <CubeIcon className="w-8 h-8 text-brand-brown" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                    Нажмите или перетащите 3D модель сюда
                </p>
                <p className="text-xs text-gray-400">
                    Поддерживаются форматы .glb и .usdz
                </p>
            </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
};
