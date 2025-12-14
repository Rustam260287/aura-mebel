
'use client'

import React, { useRef, useState } from 'react';

interface MediaUploaderProps {
  onUploadSuccess: (url: string, type: 'image' | 'video') => void;
  accept?: string;
  folder?: string;
  children: (open: () => void, isLoading: boolean) => React.ReactNode;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ onUploadSuccess, accept = "image/*,video/*", folder = 'products', children }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsLoading(true);
      try {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        const targetFolder = type === 'video' ? 'videos' : folder;
        
        const res = await fetch(`/api/admin/upload?folder=${targetFolder}`, {
            method: 'POST',
            headers: {
                'Content-Type': file.type
            },
            body: file // Send raw file
        });

        if (!res.ok) throw new Error('Upload failed');
        
        const data = await res.json();
        onUploadSuccess(data.url, type);

      } catch (error) {
        console.error("Upload failed", error);
        alert("Ошибка загрузки файла");
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
