'use client';

import React, { useState, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { XMarkIcon, PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 10;

interface SortableImageProps {
    id: string;
    url: string;
    index: number;
    onRemove: () => void;
}

const SortableImage: React.FC<SortableImageProps> = ({ id, url, index, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100 border-2 border-transparent hover:border-brand-brown/50 transition-all cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
        >
            <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
            />
            {/* Cover badge */}
            {index === 0 && (
                <div className="absolute top-1 left-1 bg-brand-brown text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                    Обложка
                </div>
            )}
            {/* Remove button */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
                <XMarkIcon className="w-4 h-4" />
            </button>
            {/* Index badge */}
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
            </div>
        </div>
    );
};

interface UploadingFile {
    id: string;
    name: string;
    progress: number;
    error?: string;
}

interface ImageGalleryEditorProps {
    images: string[];
    onChange: (images: string[]) => void;
    folder?: string;
}

export const ImageGalleryEditor: React.FC<ImageGalleryEditorProps> = ({
    images,
    onChange,
    folder = 'objects',
}) => {
    const { user } = useAuth();
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = images.indexOf(active.id as string);
            const newIndex = images.indexOf(over.id as string);
            onChange(arrayMove(images, oldIndex, newIndex));
        }
    };

    const handleRemove = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onChange(newImages);
    };

    const uploadFile = async (file: File, uploadId: string) => {
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();

        const res = await fetch(`/api/admin/upload?folder=${folder}`, {
            method: 'POST',
            headers: {
                'Content-Type': file.type,
                Authorization: `Bearer ${token}`,
            },
            body: file,
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Upload failed');
        }

        const data = await res.json();
        return data.url as string;
    };

    const handleFiles = useCallback(
        async (files: FileList | File[]) => {
            const fileArray = Array.from(files);
            const remaining = MAX_IMAGES - images.length;
            if (remaining <= 0) {
                alert(`Максимум ${MAX_IMAGES} изображений`);
                return;
            }

            const toUpload = fileArray.slice(0, remaining);
            const uploads: UploadingFile[] = toUpload.map((f, i) => ({
                id: `upload-${Date.now()}-${i}`,
                name: f.name,
                progress: 0,
            }));

            setUploadingFiles((prev) => [...prev, ...uploads]);

            const newUrls: string[] = [];

            for (let i = 0; i < toUpload.length; i++) {
                const file = toUpload[i];
                const uploadId = uploads[i].id;

                // Validate
                if (!file.type.startsWith('image/')) {
                    setUploadingFiles((prev) =>
                        prev.map((u) => (u.id === uploadId ? { ...u, error: 'Неверный формат' } : u))
                    );
                    continue;
                }
                if (file.size > MAX_IMAGE_SIZE) {
                    setUploadingFiles((prev) =>
                        prev.map((u) => (u.id === uploadId ? { ...u, error: 'Файл > 10MB' } : u))
                    );
                    continue;
                }

                try {
                    // Simulate progress
                    setUploadingFiles((prev) =>
                        prev.map((u) => (u.id === uploadId ? { ...u, progress: 30 } : u))
                    );

                    const url = await uploadFile(file, uploadId);
                    newUrls.push(url);

                    setUploadingFiles((prev) =>
                        prev.map((u) => (u.id === uploadId ? { ...u, progress: 100 } : u))
                    );
                } catch (err) {
                    setUploadingFiles((prev) =>
                        prev.map((u) =>
                            u.id === uploadId ? { ...u, error: (err as Error).message } : u
                        )
                    );
                }
            }

            // Remove completed uploads
            setTimeout(() => {
                setUploadingFiles((prev) => prev.filter((u) => u.progress < 100 || u.error));
            }, 1000);

            if (newUrls.length > 0) {
                onChange([...images, ...newUrls]);
            }
        },
        [images, onChange, user, folder]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    return (
        <div className="space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={images} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {images.map((url, index) => (
                            <SortableImage
                                key={url}
                                id={url}
                                url={url}
                                index={index}
                                onRemove={() => handleRemove(index)}
                            />
                        ))}

                        {/* Upload slot */}
                        {images.length < MAX_IMAGES && (
                            <label
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isDragOver
                                        ? 'border-brand-brown bg-brand-cream'
                                        : 'border-gray-300 hover:border-brand-brown/50 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={handleInputChange}
                                />
                                <ArrowUpTrayIcon className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Загрузить</span>
                                <span className="text-[10px] text-gray-400">до {MAX_IMAGES - images.length}</span>
                            </label>
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Uploading indicators */}
            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    {uploadingFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-2 text-sm">
                            <PhotoIcon className="w-4 h-4 text-gray-400" />
                            <span className="truncate flex-1">{file.name}</span>
                            {file.error ? (
                                <span className="text-red-500 text-xs">{file.error}</span>
                            ) : (
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-brown transition-all"
                                        style={{ width: `${file.progress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Instructions */}
            <p className="text-xs text-gray-400">
                Перетащите для изменения порядка. Первое фото = обложка. Макс. {MAX_IMAGES} фото, до 10МБ.
            </p>
        </div>
    );
};
