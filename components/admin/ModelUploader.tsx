
'use client'

import React, { useRef, useState } from 'react';
import { CubeIcon } from '../icons';
import { useAuth } from '../../contexts/AuthContext';

interface ModelUploaderProps {
  onUploadSuccess: (url: string, ext: 'glb' | 'usdz') => void;
  onUploadStateChange?: (state: { isLoading: boolean; progress: number | null }) => void;
}

const MAX_MODEL_SIZE = 100 * 1024 * 1024; // 100MB
const BIG_FILE_HINT_MB = 30;

const asModelKind = (value: unknown): 'glb' | 'usdz' | undefined => {
  if (value === 'glb' || value === 'usdz') return value;
  return undefined;
};

export const ModelUploader: React.FC<ModelUploaderProps> = ({ onUploadSuccess, onUploadStateChange }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [softHint, setSoftHint] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const { user } = useAuth();

  const setLoadingState = (next: { isLoading: boolean; progress: number | null }) => {
    setIsLoading(next.isLoading);
    setUploadProgress(next.progress);
    onUploadStateChange?.(next);
  };

  const parseJsonSafely = (text: string): any | null => {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const processFile = async (file: File) => {
    // Валидация расширения
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'usdz') {
        setError('Пожалуйста, загрузите файл .glb или .usdz');
        return;
    }
    const normalizedExt = ext as 'glb' | 'usdz';
    const normalizedContentType =
      normalizedExt === 'glb' ? 'model/gltf-binary' : 'model/vnd.usdz+zip';

    if (!user) {
      setError('Вы не авторизованы');
      return;
    }

    if (file.size > MAX_MODEL_SIZE) {
      setError('Файл слишком большой. Максимальный размер 100 МБ.');
      return;
    }

    setLoadingState({ isLoading: true, progress: 0 });
    setError(null);
    setSoftHint(null);
    
    try {
        const token = await user.getIdToken();

        const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
        if (sizeMb >= BIG_FILE_HINT_MB) {
          setSoftHint('Большие файлы загружаются напрямую в Storage — это может занять немного времени.');
        }

        const urlRes = await fetch('/api/admin/upload-model-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: file.name,
            size: file.size,
            extension: normalizedExt,
            contentType: file.type || normalizedContentType,
          }),
        });

        const urlData = await urlRes.json().catch(() => null);
        if (!urlRes.ok) {
          const serverError = urlData?.error;
          setError(typeof serverError === 'string' ? serverError : `Ошибка подготовки загрузки (${urlRes.status})`);
          setLoadingState({ isLoading: false, progress: null });
          return;
        }

        const uploadUrl = typeof urlData?.uploadUrl === 'string' ? urlData.uploadUrl : '';
        const filePath = typeof urlData?.filePath === 'string' ? urlData.filePath : '';
        const serverContentType =
          typeof urlData?.contentType === 'string' ? urlData.contentType : file.type || normalizedContentType;
        const serverKind = asModelKind(urlData?.kind) || normalizedExt;

        if (!uploadUrl || !filePath) {
          setError('Ошибка загрузки: некорректный ответ сервера');
          setLoadingState({ isLoading: false, progress: null });
          return;
        }

        if (xhrRef.current) {
          try {
            xhrRef.current.abort();
          } catch {}
        }

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', serverContentType);

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const percent = Math.max(0, Math.min(99, Math.round((e.loaded * 100) / e.total)));
          setLoadingState({ isLoading: true, progress: percent });
        };

        const complete = () => {
          xhrRef.current = null;
        };

        const failWithMessage = (message: string) => {
          complete();
          setError(message);
          setLoadingState({ isLoading: false, progress: null });
        };

        xhr.onerror = () => {
          failWithMessage('Ошибка сети при загрузке');
        };

        xhr.onabort = () => {
          failWithMessage('Загрузка отменена');
        };

        xhr.onload = async () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            failWithMessage(`Ошибка загрузки (${xhr.status})`);
            return;
          }

          setLoadingState({ isLoading: true, progress: 99 });
          try {
            const finalizeRes = await fetch('/api/admin/upload-model-finalize', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ filePath, contentType: serverContentType }),
            });
            const finalizeData = await finalizeRes.json().catch(() => null);
            if (!finalizeRes.ok) {
              const serverError = finalizeData?.error;
              failWithMessage(typeof serverError === 'string' ? serverError : `Ошибка финализации (${finalizeRes.status})`);
              return;
            }
            const url = finalizeData?.url;
            if (!url || typeof url !== 'string') {
              failWithMessage('Ошибка загрузки: некорректный ответ сервера');
              return;
            }
            complete();
            setLoadingState({ isLoading: false, progress: null });
            onUploadSuccess(url, serverKind);
          } catch (e: any) {
            failWithMessage(e?.message ? String(e.message) : 'Ошибка финализации');
          }
        };

        xhr.send(file);

    } catch (e: any) {
        setError(e?.message ? String(e.message) : 'Ошибка загрузки');
        setLoadingState({ isLoading: false, progress: null });
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      try {
        xhrRef.current.abort();
      } catch {}
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
                    Загрузка{typeof uploadProgress === 'number' ? ` ${uploadProgress}%` : '...'}
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
      {softHint && !error && !isLoading && (
        <p className="text-[11px] text-gray-400 mt-2 text-center">{softHint}</p>
      )}
      {softHint && isLoading && (
        <p className="text-[11px] text-gray-400 mt-2 text-center">{softHint}</p>
      )}
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
};
