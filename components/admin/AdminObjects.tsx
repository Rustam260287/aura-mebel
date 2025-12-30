
import React, { useState } from 'react';
import type { ObjectAdmin } from '../../types';
import { Button } from '../../components/Button';
import { PencilSquareIcon, TrashIcon } from '../icons';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useToast } from '../../contexts/ToastContext';
import Image from 'next/image';

interface AdminObjectsProps {
  objects: ObjectAdmin[];
  onEditObject: (object: ObjectAdmin) => void;
  onDeleteObject: (objectId: string) => Promise<void>;
  onAddObject: () => void;
  onBulkGenerateDescriptions: (ids: string[]) => Promise<void>;
}

export const AdminObjects: React.FC<AdminObjectsProps> = ({
  objects,
  onEditObject,
  onDeleteObject,
  onAddObject,
  onBulkGenerateDescriptions,
}) => {
  const [objectToDelete, setObjectToDelete] = useState<ObjectAdmin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const { addToast } = useToast();

  const toggleSelectAll = () => {
    if (selectedIds.length === objects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(objects.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirmDelete = async () => {
    if (objectToDelete) {
      setIsDeleting(true);
      try {
        await onDeleteObject(objectToDelete.id);
        addToast(`Объект "${objectToDelete.name}" был удален.`, 'success');
      } catch (error) {
        addToast(`Не удалось удалить объект.`, 'error');
        console.error(error);
      } finally {
        setObjectToDelete(null);
        setIsDeleting(false);
      }
    }
  };

  const handleBulkDescriptions = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await onBulkGenerateDescriptions(selectedIds);
      addToast(`Описания обновлены для ${selectedIds.length} объектов`, 'success');
    } catch (error) {
      console.error(error);
      addToast('Не удалось выполнить массовое обновление описаний.', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-brand-brown">Управление объектами</h1>
          <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 text-xs bg-gray-100 px-3 py-2 rounded-full border border-gray-200">
              <span className="text-gray-600">
                Выбрано: <b>{selectedIds.length}</b>
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleBulkDescriptions}
                disabled={isBulkProcessing}
              >
                Тексты для выбранных
              </Button>
            </div>
          )}
          <Button onClick={onAddObject}>Добавить объект</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-brand-brown focus:ring-brand-brown"
                    checked={selectedIds.length === objects.length && objects.length > 0}
                    onChange={toggleSelectAll}
                    aria-label="Выбрать все"
                  />
                </th>
                <th scope="col" className="px-6 py-3">Объект</th>
                <th scope="col" className="px-6 py-3">Тип</th>
                <th scope="col" className="px-6 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {objects.map(object => (
                <tr key={object.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-brand-brown focus:ring-brand-brown"
                      checked={selectedIds.includes(object.id)}
                      onChange={() => toggleSelectOne(object.id)}
                      aria-label={`Выбрать объект ${object.name}`}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <Image src={(object.imageUrls && object.imageUrls[0]) || '/placeholder.svg'} alt={object.name} className="w-12 h-12 object-cover rounded-md" width={48} height={48} />
                    <span className="truncate max-w-xs">{object.name}</span>
                  </td>
                  <td className="px-6 py-4">{object.objectType}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEditObject(object)}>
                            <PencilSquareIcon className="w-5 h-5 sm:mr-2" />
                            <span className="hidden sm:inline">Редактировать</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setObjectToDelete(object)}>
                            <TrashIcon className="w-5 h-5" />
                        </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmationModal
        isOpen={!!objectToDelete}
        onClose={() => setObjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Подтвердите удаление"
        message={
          <>
            Вы уверены, что хотите удалить объект &quot;<strong>{objectToDelete?.name}</strong>&quot;? Это действие необратимо.
          </>
        }
        isLoading={isDeleting}
      />
    </div>
  );
};
