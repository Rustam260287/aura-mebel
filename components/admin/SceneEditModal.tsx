import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { ObjectAdmin, SceneObjectTransform, ScenePresetAdmin } from '../../types';
import { Button } from '../Button';
import { XMarkIcon, PlusIcon, TrashIcon } from '../icons';
import { ScenePreview3D } from '../ScenePreview3D';

interface SceneEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: ScenePresetAdmin | null;
  allObjects: ObjectAdmin[];
  onSave: (scene: ScenePresetAdmin | Omit<ScenePresetAdmin, 'id'>) => Promise<void> | void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toNumber = (value: string, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const defaultTransformForIndex = (index: number): SceneObjectTransform => ({
  objectId: '',
  position: [index * 0.8, 0, 0],
  rotation: [0, 0, 0], // degrees
  scale: 1,
});

export const SceneEditModal: React.FC<SceneEditModalProps> = ({ isOpen, onClose, scene, allObjects, onSave }) => {
  const [formData, setFormData] = useState<ScenePresetAdmin | Omit<ScenePresetAdmin, 'id'> | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSaveError(null);
    setIsSaving(false);
    setSelectedObjectId('');

    if (scene) {
      setFormData(scene);
      return;
    }

    setFormData({
      title: '',
      description: '',
      status: 'draft',
      coverImageUrl: '',
      objects: [],
    });
  }, [isOpen, scene]);

  const objectsForPicker = useMemo(() => {
    return allObjects
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map((o) => ({
        id: o.id,
        name: o.name || o.id,
        hasGlb: Boolean(o.modelGlbUrl),
      }));
  }, [allObjects]);

  const addObjectToScene = () => {
    const id = selectedObjectId.trim();
    if (!id) return;
    const obj = allObjects.find((o) => o.id === id);
    if (!obj?.modelGlbUrl) {
      setSaveError('Для сцены нужен GLB (Android/Web). Сначала загрузите GLB у объекта.');
      return;
    }
    setFormData((prev) => {
      if (!prev) return prev;
      const nextObjects = [...(prev.objects || [])];
      const entry = defaultTransformForIndex(nextObjects.length);
      entry.objectId = id;
      nextObjects.push(entry);
      return { ...prev, objects: nextObjects };
    });
    setSelectedObjectId('');
  };

  const removeSceneObjectAt = (index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const next = [...(prev.objects || [])];
      next.splice(index, 1);
      return { ...prev, objects: next };
    });
  };

  const updateTransform = (index: number, patch: Partial<SceneObjectTransform>) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const next = [...(prev.objects || [])];
      const current = next[index];
      if (!current) return prev;
      next[index] = { ...current, ...patch };
      return { ...prev, objects: next };
    });
  };

  const handleChange = (field: 'title' | 'description' | 'coverImageUrl' | 'status', value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async () => {
    if (!formData) return;
    if (isSaving) return;
    const title = (formData.title || '').trim();
    if (!title) {
      setSaveError('Укажите название сцены.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const normalizedObjects = (formData.objects || []).filter((o) => Boolean(o.objectId));
      const payload = {
        ...formData,
        title,
        description: (formData.description || '').trim(),
        coverImageUrl: (formData.coverImageUrl || '').trim(),
        objects: normalizedObjects.map((o) => ({
          objectId: o.objectId,
          position: [o.position[0], o.position[1], o.position[2]] as [number, number, number],
          rotation: [o.rotation[0], o.rotation[1], o.rotation[2]] as [number, number, number],
          scale: clamp(o.scale, 0.01, 100),
        })),
      };

      await onSave(payload as any);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка сохранения';
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const title = scene ? 'Редактировать сцену' : 'Новая сцена';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 md:p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900">{title}</Dialog.Title>
                    <p className="text-sm text-gray-500 mt-1">
                      Композиция хранит только трансформы. Каждый предмет остаётся отдельной моделью.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                    aria-label="Закрыть"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                        <input
                          value={formData?.title || ''}
                          onChange={(e) => handleChange('title', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none text-sm"
                          placeholder="Например: Диван + 2 кресла"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                        <select
                          value={(formData as any)?.status || 'draft'}
                          onChange={(e) => handleChange('status', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none text-sm"
                        >
                          <option value="draft">draft</option>
                          <option value="ready">ready</option>
                          <option value="archived">archived</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Описание (опционально)</label>
                      <textarea
                        value={(formData as any)?.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none text-sm leading-relaxed"
                        placeholder="Коротко: как ощущается композиция и для какого пространства."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Обложка (URL, опционально)</label>
                      <input
                        value={(formData as any)?.coverImageUrl || ''}
                        onChange={(e) => handleChange('coverImageUrl', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none text-sm"
                        placeholder="https://..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Если не указана — на публичной карточке можно использовать изображение первого объекта.
                      </p>
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Добавить объект</label>
                          <select
                            value={selectedObjectId}
                            onChange={(e) => setSelectedObjectId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-brown/20 outline-none text-sm"
                          >
                            <option value="">Выберите из списка…</option>
                            {objectsForPicker.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name}
                                {!o.hasGlb ? ' (нет GLB)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button type="button" variant="outline" onClick={addObjectToScene} disabled={!selectedObjectId}>
                          <PlusIcon className="w-5 h-5 mr-2" />
                          Добавить
                        </Button>
                      </div>

                      <div className="mt-5 space-y-4">
                        {(formData?.objects || []).map((entry, idx) => (
                          <div key={`${entry.objectId}:${idx}`} className="rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {allObjects.find((o) => o.id === entry.objectId)?.name || entry.objectId}
                                </p>
                                <p className="text-xs text-gray-500">Позиция (м), вращение (°), масштаб</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSceneObjectAt(idx)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                                aria-label="Удалить из сцены"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              {(['x', 'y', 'z'] as const).map((axis, axisIndex) => (
                                <div key={`pos-${axis}`}>
                                  <label className="block text-xs text-gray-500 mb-1">pos {axis}</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={entry.position[axisIndex]}
                                    onChange={(e) => {
                                      const next = [...entry.position] as [number, number, number];
                                      next[axisIndex] = toNumber(e.target.value, next[axisIndex]);
                                      updateTransform(idx, { position: next });
                                    }}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-3">
                              {(['x', 'y', 'z'] as const).map((axis, axisIndex) => (
                                <div key={`rot-${axis}`}>
                                  <label className="block text-xs text-gray-500 mb-1">rot {axis}</label>
                                  <input
                                    type="number"
                                    step="1"
                                    value={entry.rotation[axisIndex]}
                                    onChange={(e) => {
                                      const next = [...entry.rotation] as [number, number, number];
                                      next[axisIndex] = toNumber(e.target.value, next[axisIndex]);
                                      updateTransform(idx, { rotation: next });
                                    }}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="mt-3">
                              <label className="block text-xs text-gray-500 mb-1">scale</label>
                              <input
                                type="number"
                                step="0.01"
                                value={entry.scale}
                                onChange={(e) => updateTransform(idx, { scale: toNumber(e.target.value, entry.scale) })}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                        ))}

                        {(formData?.objects || []).length === 0 && (
                          <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
                            Добавьте 2–3 объекта, затем настройте их трансформы и сохраните сцену.
                          </div>
                        )}
                      </div>
                    </div>

                    {saveError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                        {saveError}
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t lg:border-t-0 lg:border-l bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-800">Live preview</p>
                      <p className="text-xs text-gray-500">Поворот/зум — жестами или мышью</p>
                    </div>

                    <div className="aspect-[4/3] rounded-2xl border border-gray-200 bg-white">
                      <ScenePreview3D
                        className="w-full h-full"
                        sceneObjects={(formData?.objects || []) as SceneObjectTransform[]}
                        allObjects={allObjects}
                      />
                    </div>

                    <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                      Превью показывает композицию в браузере. В AR каждый предмет будет отдельно двигаться и масштабироваться.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-white">
                  <Button variant="ghost" onClick={onClose}>
                    Отмена
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Сохраняю…' : 'Сохранить'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
