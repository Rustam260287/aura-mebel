import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import type { ObjectAdmin, ScenePresetAdmin } from '../../types';
import { Button } from '../Button';
import { PencilSquareIcon, TrashIcon } from '../icons';
import { ConfirmationModal } from '../ConfirmationModal';
import { useToast } from '../../contexts/ToastContext';

interface AdminScenesProps {
  scenes: ScenePresetAdmin[];
  objects: ObjectAdmin[];
  onAddScene: () => void;
  onEditScene: (scene: ScenePresetAdmin) => void;
  onDeleteScene: (sceneId: string) => Promise<void>;
}

export const AdminScenes: React.FC<AdminScenesProps> = ({
  scenes,
  objects,
  onAddScene,
  onEditScene,
  onDeleteScene,
}) => {
  const { addToast } = useToast();
  const [sceneToDelete, setSceneToDelete] = useState<ScenePresetAdmin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const objectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of objects) map.set(o.id, o.name || o.id);
    return map;
  }, [objects]);

  const handleConfirmDelete = async () => {
    if (!sceneToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteScene(sceneToDelete.id);
      addToast(`Сцена "${sceneToDelete.title}" удалена.`, 'success');
    } catch (error) {
      console.error(error);
      addToast('Не удалось удалить сцену.', 'error');
    } finally {
      setIsDeleting(false);
      setSceneToDelete(null);
    }
  };

  const buildObjectsLabel = (scene: ScenePresetAdmin) => {
    const ids = (scene.objects || []).map((o) => o.objectId).filter(Boolean);
    const names = ids
      .slice(0, 3)
      .map((id) => objectNameById.get(id) || id);
    const suffix = ids.length > 3 ? ` +${ids.length - 3}` : '';
    return `${ids.length} • ${names.join(', ')}${suffix}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-brand-brown">Сцены / комплекты</h1>
          <p className="text-sm text-gray-500 mt-2">
            Сцена — это композиция из отдельных объектов (JSON), без склейки моделей.
          </p>
        </div>
        <Button onClick={onAddScene}>Добавить сцену</Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Сцена</th>
                <th scope="col" className="px-6 py-3">Состав</th>
                <th scope="col" className="px-6 py-3">Статус</th>
                <th scope="col" className="px-6 py-3">Обновлено</th>
                <th scope="col" className="px-6 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene) => (
                <tr key={scene.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <Image
                      src={scene.coverImageUrl?.trim() || '/placeholder.svg'}
                      alt={scene.title}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded-md bg-gray-100"
                    />
                    <span className="truncate max-w-xs">{scene.title}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{buildObjectsLabel(scene)}</td>
                  <td className="px-6 py-4">{scene.status || 'draft'}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{scene.updatedAt || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => onEditScene(scene)}>
                        <PencilSquareIcon className="w-5 h-5 sm:mr-2" />
                        <span className="hidden sm:inline">Редактировать</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => setSceneToDelete(scene)}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {scenes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    Пока нет сцен. Создайте первую композицию.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!sceneToDelete}
        onClose={() => setSceneToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Подтвердите удаление"
        message={
          <>
            Вы уверены, что хотите удалить сцену &quot;<strong>{sceneToDelete?.title}</strong>&quot;? Это действие необратимо.
          </>
        }
        isLoading={isDeleting}
      />
    </div>
  );
};

