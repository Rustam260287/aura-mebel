import React, { useMemo, useState } from 'react';
import type { JournalEntry, ObjectAdmin } from '../../types';
import { Button } from '../Button';

type MediaTab = 'images' | 'journal';

interface AdminMediaProps {
  objectsWithoutImages: ObjectAdmin[];
  onOpenObject: (object: ObjectAdmin) => void;

  journalEntries: JournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  onEditJournalEntry: (entry: JournalEntry) => void;
  onDeleteJournalEntry: (entryId: string) => Promise<void>;
  onUpdateJournalEntry: (updatedEntry: JournalEntry) => Promise<void>;
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ru-RU');
};

export const AdminMedia: React.FC<AdminMediaProps> = ({
  objectsWithoutImages,
  onOpenObject,
  journalEntries,
  setJournalEntries,
  onEditJournalEntry,
  onDeleteJournalEntry,
  onUpdateJournalEntry,
}) => {
  const [tab, setTab] = useState<MediaTab>('images');
  const [busyEntryId, setBusyEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedJournalEntries = useMemo(() => {
    return [...journalEntries].sort((a, b) => {
      const dateA = a.createdAt || a.date || a.id;
      const dateB = b.createdAt || b.date || b.id;
      return String(dateB).localeCompare(String(dateA));
    });
  }, [journalEntries]);

  const createNewEntry = () => {
    const now = new Date().toISOString();
    const entry: JournalEntry = {
      id: now,
      title: 'Новая запись',
      content: '',
      status: 'draft',
      createdAt: now,
      date: now,
      excerpt: '',
      imageUrl: '',
      relatedObjectIds: [],
    };
    setJournalEntries(prev => [entry, ...prev]);
    onEditJournalEntry(entry);
    setTab('journal');
  };

  const updateEntry = async (entry: JournalEntry, patch: Partial<JournalEntry>) => {
    setError(null);
    setBusyEntryId(entry.id);
    try {
      const next = { ...entry, ...patch };
      await onUpdateJournalEntry(next);
      setJournalEntries(prev => {
        const idx = prev.findIndex(p => p.id === next.id);
        if (idx === -1) return [next, ...prev];
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось обновить запись';
      setError(message);
    } finally {
      setBusyEntryId(null);
    }
  };

  const deleteEntry = async (entry: JournalEntry) => {
    setError(null);
    setBusyEntryId(entry.id);
    try {
      await onDeleteJournalEntry(entry.id);
      setJournalEntries(prev => prev.filter(p => p.id !== entry.id));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось удалить запись';
      setError(message);
    } finally {
      setBusyEntryId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-brand-brown">Медиа</h1>
        <p className="text-sm text-gray-600 mt-2 max-w-2xl">
          Изображения загружаются в WebP и используются как спокойный контекст. Журнал — редакционный раздел без
          торговой и SEO-логики.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
          <button
            type="button"
            onClick={() => setTab('images')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              tab === 'images' ? 'bg-white shadow-sm text-brand-charcoal' : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            Изображения
          </button>
          <button
            type="button"
            onClick={() => setTab('journal')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              tab === 'journal' ? 'bg-white shadow-sm text-brand-charcoal' : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            Журнал
          </button>
          <div className="flex-1" />
          {tab === 'journal' && (
            <Button type="button" size="sm" onClick={createNewEntry}>
              Новая запись
            </Button>
          )}
        </div>

        <div className="p-6">
          {tab === 'images' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brand-charcoal">Объекты без изображений</h2>
                <div className="text-xs text-gray-500">{objectsWithoutImages.length}</div>
              </div>

              {objectsWithoutImages.length === 0 ? (
                <p className="text-sm text-gray-500">Все объекты имеют изображения.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {objectsWithoutImages.slice(0, 12).map(object => (
                    <li key={object.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{object.name}</div>
                        <div className="text-xs text-gray-500 truncate">{object.objectType || '—'}</div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => onOpenObject(object)}>
                        Открыть
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-brand-charcoal">Журнал</h2>
                <div className="text-xs text-gray-500">{sortedJournalEntries.length}</div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Заголовок
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Дата
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Статус
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedJournalEntries.map(entry => {
                      const isBusy = busyEntryId === entry.id;
                      const isPublished = entry.status === 'published';
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900 max-w-md truncate" title={entry.title}>
                            {entry.title}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDate(entry.createdAt || entry.date || entry.id)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                                isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {isPublished ? 'Опубликовано' : 'Черновик'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => onEditJournalEntry(entry)}>
                                Редактировать
                              </Button>
                              {isPublished ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isBusy}
                                  onClick={() => updateEntry(entry, { status: 'draft' })}
                                >
                                  В черновик
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isBusy}
                                  onClick={() => updateEntry(entry, { status: 'published' })}
                                >
                                  Опубликовать
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:bg-red-50"
                                disabled={isBusy}
                                onClick={() => deleteEntry(entry)}
                              >
                                Удалить
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {sortedJournalEntries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Записей пока нет.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

