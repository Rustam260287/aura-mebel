
import React, { useState, Fragment, useEffect, useRef } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { XMarkIcon, SparklesIcon, PhotoIcon, CubeIcon, PlusIcon } from './icons';
import type { ModelProcessingStatus, ObjectAdmin, ObjectStatus } from '../types';
import { ModelUploader } from './admin/ModelUploader';
import { MediaUploader } from './admin/MediaUploader';
import { useAuth } from '../contexts/AuthContext';
import { ModelPreview3D } from './admin/ModelPreview3D';

interface ObjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  object: ObjectAdmin | null;
  onSave: (updatedObject: ObjectAdmin | Omit<ObjectAdmin, 'id'>) => Promise<void> | void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export const ObjectEditModal: React.FC<ObjectEditModalProps> = ({ isOpen, onClose, object, onSave }) => {
  const [formData, setFormData] = useState<Partial<ObjectAdmin>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [is3DUploading, setIs3DUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { user } = useAuth();
  const oldGlbModelUrlRef = useRef<string | null>(null);
  const oldUsdzModelUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (object) {
      setFormData(object);
      oldGlbModelUrlRef.current = object.modelGlbUrl || null;
      oldUsdzModelUrlRef.current = object.modelUsdzUrl || null;
    } else {
      setFormData({
        name: '',
        objectType: '',
        description: '',
        status: 'draft',
        imageUrls: [],
        specs: {},
        modelGlbUrl: '',
        modelUsdzUrl: '',
      });
      oldGlbModelUrlRef.current = null;
      oldUsdzModelUrlRef.current = null;
    }
    setSaveError(null);
    setIsSaving(false);
  }, [object, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('specs.')) {
        const specKey = name.split('.')[1];
        setFormData(prev => ({
            ...prev,
            specs: {
                ...prev.specs,
                [specKey]: value
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const deleteOldFile = async (fileUrl: string | null) => {
    if (!fileUrl) return;
    try {
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      await fetch('/api/admin/delete-storage-object', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fileUrl }),
      });
    } catch (error) {
      console.error("Failed to delete old file:", error);
    }
  };

  const handleSave = async () => {
    if (is3DUploading || isSaving) return;

    const nextGlbUrl =
      typeof formData.modelGlbUrl === 'string' ? formData.modelGlbUrl.trim() || undefined : undefined;
    const nextUsdzUrl =
      typeof formData.modelUsdzUrl === 'string' ? formData.modelUsdzUrl.trim() || undefined : undefined;

    const shouldDeleteOldGlb =
      Boolean(object && formData.id && nextGlbUrl && nextGlbUrl !== (oldGlbModelUrlRef.current || undefined));
    const shouldDeleteOldUsdz =
      Boolean(object && formData.id && nextUsdzUrl && nextUsdzUrl !== (oldUsdzModelUrlRef.current || undefined));

    setIsSaving(true);
    setSaveError(null);
    try {
      if (object && formData.id) {
        await onSave({ ...object, ...formData } as ObjectAdmin);
      } else {
        await onSave(formData as Omit<ObjectAdmin, 'id'>);
      }

      if (shouldDeleteOldGlb) await deleteOldFile(oldGlbModelUrlRef.current);
      if (shouldDeleteOldUsdz) await deleteOldFile(oldUsdzModelUrlRef.current);

      oldGlbModelUrlRef.current = nextGlbUrl || null;
      oldUsdzModelUrlRef.current = nextUsdzUrl || null;

      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка сохранения';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIAnalyze = async () => {
      // ... existing code
  };

  const handle3DUpload = (result: { modelGlbUrl?: string; modelUsdzUrl?: string; modelProcessing?: any }) => {
      oldGlbModelUrlRef.current = formData.modelGlbUrl || null;
      oldUsdzModelUrlRef.current = formData.modelUsdzUrl || null;
      setFormData(prev => ({
        ...prev,
        ...(result.modelGlbUrl ? { modelGlbUrl: result.modelGlbUrl } : {}),
        ...(result.modelUsdzUrl ? { modelUsdzUrl: result.modelUsdzUrl } : {}),
        ...(result.modelProcessing ? { modelProcessing: result.modelProcessing } : {}),
      }));
  };

  const formatBytes = (value?: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '—';
    const mb = value / (1024 * 1024);
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  };

  const statusLabel = (status?: ModelProcessingStatus) => {
    switch (status) {
      case 'UPLOADED':
        return 'Файл загружен';
      case 'OPTIMIZING':
        return 'Оптимизация…';
      case 'OPTIMIZED':
        return 'Оптимизировано';
      case 'GENERATING_USDZ':
        return 'Генерация USDZ…';
      case 'READY':
        return 'Готово';
      case 'READY_WITHOUT_IOS':
        return 'Готово (без iOS)';
      case 'ERROR':
        return 'Ошибка';
      default:
        return '—';
    }
  };

  const handleMediaUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), url],
    }));
  };
  
  const handleRemoveImage = (index: number) => {
    // We don't delete from storage here, assuming it's handled on save if needed.
    // This just removes from the list to be saved.
    setFormData(prev => ({
        ...prev,
        imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 font-serif">
                    {object ? `Редактирование: ${formData.name}` : 'Добавление нового объекта'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-xl bg-brand-cream/30 p-1 mb-6">
                            {['Основное', 'Характеристики (AI)', '3D и Медиа', 'Изображения'].map((category) => (
                            <Tab key={category} className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all outline-none', selected ? 'bg-white shadow text-brand-brown' : 'text-gray-600 hover:bg-white/[0.12] hover:text-brand-brown')}>
                                {category}
                            </Tab>
                            ))}
                        </Tab.List>
                        <Tab.Panels>
                            <Tab.Panel className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Тип объекта</label>
                                    <input type="text" name="objectType" value={formData.objectType || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none" placeholder="диван / кресло / стол" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                                    <select
                                      name="status"
                                      value={(formData.status || 'draft') as ObjectStatus}
                                      onChange={handleChange}
                                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none bg-white"
                                    >
                                      <option value="draft">Draft</option>
                                      <option value="ready">Ready</option>
                                      <option value="archived">Archived</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1"><label className="block text-sm font-medium text-gray-700">Описание</label></div>
                                    <textarea name="description" rows={8} value={formData.description || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none text-sm leading-relaxed" />
                                </div>
                            </Tab.Panel>
                            <Tab.Panel className="space-y-6">
                                {/* ... existing specs panel */}
                            </Tab.Panel>
                            <Tab.Panel className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2"><CubeIcon className="w-5 h-5" />Загрузка 3D</h4>
                                        {object?.id ? (
                                          <ModelUploader
                                            objectId={object.id}
                                            onUploadSuccess={handle3DUpload}
                                            onUploadStateChange={(s) => setIs3DUploading(s.isLoading)}
                                          />
                                        ) : (
                                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
                                            Сначала сохраните объект, затем загрузите GLB — система автоматически оптимизирует модель и
                                            создаст USDZ для iOS.
                                          </div>
                                        )}

                                        <div className="mt-2 bg-white border border-gray-200 rounded-xl p-4">
                                          <div className="flex items-start justify-between gap-4">
                                            <div>
                                              <div className="text-xs text-gray-500">Статус</div>
                                              <div className="text-sm font-semibold text-gray-900 mt-1">
                                                {statusLabel(formData.modelProcessing?.status)}
                                              </div>
                                              {formData.modelProcessing?.error && (
                                                <div className="text-xs text-red-600 mt-2">{formData.modelProcessing.error}</div>
                                              )}
                                            </div>
                                            <div className="text-right">
                                              <div className="text-xs text-gray-500">Размер</div>
                                              <div className="text-sm text-gray-900 mt-1">
                                                {formatBytes(formData.modelProcessing?.sizeBeforeBytes)} →{' '}
                                                {formatBytes(formData.modelProcessing?.sizeAfterBytes)}
                                              </div>
                                              <div className="text-[11px] text-gray-500 mt-1">
                                                Текстуры ≤ {formData.modelProcessing?.maxTextureSize || 2048}px
                                              </div>
                                            </div>
                                          </div>

                                          <div className="mt-4 flex flex-wrap gap-2">
                                            <span
                                              className={[
                                                'px-2.5 py-1 rounded-full text-xs font-semibold border',
                                                formData.modelProcessing?.platforms?.web
                                                  ? 'bg-green-50 text-green-700 border-green-200'
                                                  : 'bg-white text-gray-500 border-gray-200',
                                              ].join(' ')}
                                            >
                                              Web
                                            </span>
                                            <span
                                              className={[
                                                'px-2.5 py-1 rounded-full text-xs font-semibold border',
                                                formData.modelProcessing?.platforms?.android
                                                  ? 'bg-green-50 text-green-700 border-green-200'
                                                  : 'bg-white text-gray-500 border-gray-200',
                                              ].join(' ')}
                                            >
                                              Android
                                            </span>
                                            <span
                                              className={[
                                                'px-2.5 py-1 rounded-full text-xs font-semibold border',
                                                formData.modelProcessing?.platforms?.ios
                                                  ? 'bg-green-50 text-green-700 border-green-200'
                                                  : 'bg-white text-gray-500 border-gray-200',
                                              ].join(' ')}
                                            >
                                              iOS
                                            </span>
                                          </div>

                                          {(formData.modelGlbUrl || formData.modelUsdzUrl) && (
                                            <div className="mt-4 space-y-2">
                                              <div>
                                                <div className="text-xs text-gray-500 mb-1">GLB (оптимизированный)</div>
                                                <input
                                                  value={formData.modelGlbUrl || ''}
                                                  readOnly
                                                  className="w-full p-2 border border-gray-200 rounded-lg text-[11px] font-mono bg-gray-50"
                                                />
                                              </div>
                                              <div>
                                                <div className="text-xs text-gray-500 mb-1">USDZ (iOS)</div>
                                                <input
                                                  value={formData.modelUsdzUrl || ''}
                                                  readOnly
                                                  className="w-full p-2 border border-gray-200 rounded-lg text-[11px] font-mono bg-gray-50"
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center min-h-[300px]">
                                        <ModelPreview3D
                                          glbUrl={formData.modelGlbUrl}
                                          usdzUrl={formData.modelUsdzUrl}
                                          posterUrl={(formData.imageUrls && formData.imageUrls[0]) || undefined}
                                          name={formData.name}
                                        />
                                    </div>
                                </div>
                            </Tab.Panel>
                            <Tab.Panel>
                                <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><PhotoIcon className="w-5 h-5" />Галерея изображений</h4>
                                <div className="grid grid-cols-4 gap-4">
                                    {(formData.imageUrls || []).map((url, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                                            <button onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <MediaUploader onUploadSuccess={handleMediaUpload}>
                                        {(open, isLoading) => (
                                            <button onClick={open} disabled={isLoading} className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 aspect-square">
                                                {isLoading ? '...' : <PlusIcon className="w-8 h-8 text-gray-400" />}
                                            </button>
                                        )}
                                    </MediaUploader>
                                </div>
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors">Отмена</button>
                  {saveError && <p className="text-xs text-red-600 self-center mr-auto">{saveError}</p>}
                  <button
                    onClick={handleSave}
                    disabled={is3DUploading || isSaving}
                    className="px-6 py-2.5 rounded-xl font-bold bg-brand-brown text-white hover:bg-brand-charcoal transition-all shadow-lg shadow-brand-brown/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {is3DUploading ? 'Загрузка 3D...' : isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
