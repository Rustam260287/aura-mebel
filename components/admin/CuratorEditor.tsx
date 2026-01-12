import React, { useState, useEffect } from 'react';
import { CuratorProfile, DEFAULT_CURATOR_PROFILE } from '../../types/curator';
import { Button } from '../Button';
import { XMarkIcon } from '../icons';

interface CuratorEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profile: Partial<CuratorProfile>) => Promise<void>;
    initialData?: CuratorProfile | null;
}

export const CuratorEditor: React.FC<CuratorEditorProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const [formData, setFormData] = useState<Partial<CuratorProfile>>(DEFAULT_CURATOR_PROFILE);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData ? { ...initialData } : { ...DEFAULT_CURATOR_PROFILE });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Ошибка при сохранении');
        } finally {
            setIsSaving(false);
        }
    };

    const updateContact = (key: keyof CuratorProfile['contacts'], value: string) => {
        setFormData(prev => ({
            ...prev,
            contacts: {
                ...prev.contacts,
                [key]: value
            }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-subtle-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-serif text-brand-brown">
                        {initialData ? 'Редактировать куратора' : 'Новый куратор'}
                    </h2>
                    <Button variant="ghost" onClick={onClose} className="p-2 -mr-2">
                        <XMarkIcon className="w-6 h-6" />
                    </Button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Main Info */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Имя (публичное)</label>
                            <input
                                required
                                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                                value={formData.displayName || ''}
                                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                placeholder="Анна"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Роль (подпись)</label>
                            <input
                                required
                                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                                value={formData.roleLabel || ''}
                                onChange={e => setFormData({ ...formData, roleLabel: e.target.value })}
                                placeholder="Старший куратор"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Приоритет (0-100)</label>
                            <input
                                type="number"
                                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                                value={formData.priority || 0}
                                onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Чем выше, тем чаще выбирается</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Ссылка на Аватар</label>
                            <input
                                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                                value={formData.avatarUrl || ''}
                                onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Availability */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Статус</label>
                            <select
                                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown bg-white"
                                value={formData.status || 'offline'}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="online">🟢 Онлайн</option>
                                <option value="offline">🔴 Оффлайн</option>
                                <option value="schedule">🕒 По расписанию</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Часы работы</label>
                            <input
                                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                                value={formData.workingHours || ''}
                                onChange={e => setFormData({ ...formData, workingHours: e.target.value })}
                                placeholder="10:00 - 19:00"
                            />
                        </div>

                        {/* Contacts */}
                        <div className="md:col-span-2 pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">Контакты</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">WhatsApp (только цифры)</label>
                                    <input
                                        className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                                        value={formData.contacts?.whatsapp || ''}
                                        onChange={e => updateContact('whatsapp', e.target.value)}
                                        placeholder="79000000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Telegram (username)</label>
                                    <div className="flex mt-1">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">@</span>
                                        <input
                                            className="flex-1 w-full rounded-none rounded-r-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                                            value={formData.contacts?.telegram || ''}
                                            onChange={e => updateContact('telegram', e.target.value)}
                                            placeholder="username"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-4 border-t border-gray-100 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isEnabled"
                                checked={formData.isEnabled}
                                onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                                className="h-4 w-4 text-brand-brown focus:ring-brand-brown border-gray-300 rounded"
                            />
                            <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">Активен (показывать в ротации)</label>
                        </div>

                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
                        <Button type="submit" variant="primary" isLoading={isSaving} disabled={isSaving}>
                            {initialData ? 'Сохранить изменения' : 'Создать куратора'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
