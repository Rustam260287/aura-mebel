
'use client'

import React, { useRef, useState } from 'react';
import { CubeIcon } from '../icons';
import { useAuth } from '../../contexts/AuthContext';
import type { ModelProcessingInfo } from '../../types';

interface ModelUploaderProps {
  objectId: string;
  onUploadSuccess: (result: { modelGlbUrl?: string; modelUsdzUrl?: string; modelProcessing?: ModelProcessingInfo }) => void;
  onUploadStateChange?: (state: { isLoading: boolean; progress: number | null }) => void;
}

const MAX_MODEL_SIZE = 100 * 1024 * 1024; // 100MB
const BIG_FILE_HINT_MB = 30;

export const ModelUploader: React.FC<ModelUploaderProps> = ({ objectId, onUploadSuccess, onUploadStateChange }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [softHint, setSoftHint] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'processing'>('idle');
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const { user } = useAuth();

  const setLoadingState = (next: { isLoading: boolean; progress: number | null }) => {
    setIsLoading(next.isLoading);
    setUploadProgress(next.progress);
    onUploadStateChange?.(next);
  };

  const processFile = async (file: File) => {
    // Валидация расширения
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isGlb = ext === 'glb';
    const isUsdz = ext === 'usdz';

    if (!isGlb && !isUsdz) {
      setError('Загрузите файл .glb или .usdz');
      return;
    }
    const normalizedContentType = isUsdz ? 'model/vnd.usdz+zip' : 'model/gltf-binary';

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
    setPhase('uploading');

    try {
      const token = await user.getIdToken();

      const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
      if (sizeMb >= BIG_FILE_HINT_MB) {
        setSoftHint('Большие файлы загружаются напрямую в Storage — это может занять немного времени.');
      }

      const urlRes = await fetch('/api/admin/models/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          objectId,
          size: file.size,
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

      if (!uploadUrl || !filePath) {
        setError('Ошибка загрузки: некорректный ответ сервера');
        setLoadingState({ isLoading: false, progress: null });
        setPhase('idle');
        return;
      }

      if (xhrRef.current) {
        try {
          xhrRef.current.abort();
        } catch { }
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
        setPhase('idle');
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

        setLoadingState({ isLoading: true, progress: null });
        setPhase('processing');
        try {
          const finalizeRes = await fetch('/api/admin/models/finalize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ objectId }),
          });
          const finalizeData = await finalizeRes.json().catch(() => null);
          if (!finalizeRes.ok) {
            const serverError = finalizeData?.error;
            failWithMessage(typeof serverError === 'string' ? serverError : `Ошибка финализации (${finalizeRes.status})`);
            return;
          }

          complete();
          setLoadingState({ isLoading: false, progress: null });
          setPhase('idle');
          onUploadSuccess({
            modelGlbUrl: typeof finalizeData?.modelGlbUrl === 'string' ? finalizeData.modelGlbUrl : undefined,
            modelUsdzUrl: typeof finalizeData?.modelUsdzUrl === 'string' ? finalizeData.modelUsdzUrl : undefined,
            modelProcessing: finalizeData?.modelProcessing as ModelProcessingInfo | undefined,
          });
        } catch (e: any) {
          failWithMessage(e?.message ? String(e.message) : 'Ошибка финализации');
        }
      };

      xhr.send(file);

    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Ошибка загрузки');
      setLoadingState({ isLoading: false, progress: null });
      setPhase('idle');
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      try {
        xhrRef.current.abort();
      } catch { }
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
        className={`border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer relative overflow-hidden ${isDragOver ? 'border-brand-brown bg-brand-cream/20' : 'border-gray-300 hover:border-brand-brown/50 hover:bg-gray-50'
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
            {phase === 'uploading' && (
              <>
                <div className="w-full max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-brand-brown transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress || 0}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-brand-brown">
                  Загрузка{typeof uploadProgress === 'number' ? ` ${uploadProgress}%` : '...'}
                </p>
              </>
            )}
            {phase === 'processing' && (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-brown mb-3" />
                <p className="text-sm font-bold text-brand-brown">Обработка модели…</p>
                <p className="text-xs text-gray-500 mt-1">Оптимизируем веса и подготавливаем для AR.</p>
              </>
            )}
            {phase === 'uploading' && (
              <button
                onClick={(e) => { e.stopPropagation(); cancelUpload(); }}
                className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
              >
                Отменить
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="bg-brand-cream/50 p-3 rounded-full mb-3">
              <CubeIcon className="w-8 h-8 text-brand-brown" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Нажмите или перетащите GLB / USDZ
            </p>
            <p className="text-xs text-gray-400">
              .glb или .usdz (до 100 МБ)
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
