'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '../../firebaseConfig';
import { AuthGuard } from '../../components/AuthGuard';

const storage = getStorage(app);

function ModelUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDownloadURL(null);
      setError(null);
      setUploadProgress(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Сначала выберите файл');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `models/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (uploadError) => {
        console.error('Upload Error:', uploadError);
        setError(`Ошибка загрузки: ${uploadError.message}`);
        setIsLoading(false);
        setUploadProgress(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url);
          setIsLoading(false);
          setUploadProgress(100);
        });
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Загрузчик 3D моделей</h1>

      <div className="space-y-4">
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Выберите .glb или .usdz файл:
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".glb,.usdz"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-brown/10 file:text-brand-brown hover:file:bg-brand-brown/20"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="w-full bg-brand-brown text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-charcoal transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Загрузка...
            </>
          ) : (
            'Загрузить в хранилище'
          )}
        </button>
      </div>

      {uploadProgress !== null && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-1">Прогресс: {Math.round(uploadProgress)}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      {downloadURL && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Файл успешно загружен!</h3>
          <p className="text-sm text-gray-700 mt-2">Ссылка на вашу модель:</p>
          <input
            type="text"
            readOnly
            value={downloadURL}
            className="w-full p-2 mt-1 bg-gray-100 border border-gray-300 rounded-md text-sm cursor-copy"
            onFocus={(e) => e.target.select()}
          />
          <p className="text-xs text-gray-500 mt-2">Скопируйте эту ссылку, чтобы привязать модель к товару.</p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

const UploadModelPage = () => (
  <AuthGuard>
    <ModelUploader />
  </AuthGuard>
);

// Отключаем SSR, чтобы Firebase Storage не дергался на сервере
export default dynamic(() => Promise.resolve(UploadModelPage), { ssr: false });
