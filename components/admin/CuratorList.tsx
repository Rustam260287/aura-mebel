import React, { useState, useEffect } from 'react';
import { CuratorProfile } from '../../types/curator';
import { Button } from '../Button';
import { UserPlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { CuratorEditor } from './CuratorEditor';

export const CuratorList: React.FC = () => {
    const [curators, setCurators] = useState<CuratorProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingCurator, setEditingCurator] = useState<CuratorProfile | null>(null);

    const fetchCurators = async () => {
        try {
            const res = await fetch('/api/admin/curators');
            if (res.ok) {
                const data = await res.json();
                setCurators(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCurators();
    }, []);

    const handleSave = async (profileData: Partial<CuratorProfile>) => {
        const res = await fetch('/api/admin/curators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        if (res.ok) {
            fetchCurators();
        } else {
            throw new Error('Failed to save');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены? Удаление необратимо.')) return;

        const res = await fetch(`/api/admin/curators?id=${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            setCurators(prev => prev.filter(c => c.id !== id));
        }
    };

    const openEditor = (curator?: CuratorProfile) => {
        setEditingCurator(curator || null);
        setEditorOpen(true);
    };

    if (isLoading) return <div className="p-4 text-gray-500">Загрузка списка кураторов...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Команда кураторов</h2>
                <Button onClick={() => openEditor()} variant="primary" size="sm">
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Добавить
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {curators.map(curator => (
                    <div key={curator.id} className={`group relative bg-white border rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${!curator.isEnabled ? 'opacity-60 grayscale' : ''}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden relative">
                                    {curator.avatarUrl && <img src={curator.avatarUrl} alt="" className="w-full h-full object-cover" />}
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white ${curator.status === 'online' ? 'bg-green-500' : curator.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{curator.displayName}</h3>
                                    <p className="text-xs text-brand-brown">{curator.roleLabel}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Priority: {curator.priority}</span>
                                        {!curator.isEnabled && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Disabled</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => openEditor(curator)}>
                                    <PencilIcon className="w-4 h-4 text-gray-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(curator.id)}>
                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <div>
                                <span className="block text-[10px] text-gray-400">График</span>
                                {curator.workingHours || '-'}
                            </div>
                            <div>
                                <span className="block text-[10px] text-gray-400">Контакты</span>
                                {[
                                    curator.contacts.whatsapp ? 'WA' : null,
                                    curator.contacts.telegram ? 'TG' : null
                                ].filter(Boolean).join(', ') || 'Нет'}
                            </div>
                        </div>
                    </div>
                ))}

                {curators.length === 0 && (
                    <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-gray-500 mb-2">В команде пока никого нет</p>
                        <Button onClick={() => openEditor()} variant="secondary">Создать первого куратора</Button>
                    </div>
                )}
            </div>

            <CuratorEditor
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                onSave={handleSave}
                initialData={editingCurator}
            />
        </div>
    );
};
