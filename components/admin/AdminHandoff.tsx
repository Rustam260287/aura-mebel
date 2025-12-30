import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { Button } from '../Button';

interface HandoffSettings {
  managerName?: string;
  managerRole?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  messageAfterAr?: string;
  updatedAt?: string;
}

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '').trim();

export const AdminHandoff: React.FC = () => {
  const [settings, setSettings] = useState<HandoffSettings | null>(null);
  const [form, setForm] = useState<HandoffSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Пользователь не авторизован');
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/handoff', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || `Ошибка загрузки (${res.status})`);
        }
        setSettings(data as HandoffSettings);
        setForm(data as HandoffSettings);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Не удалось загрузить настройки';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const isDirty = useMemo(() => JSON.stringify(settings || {}) !== JSON.stringify(form || {}), [settings, form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const save = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('Пользователь не авторизован');
      const token = await user.getIdToken();

      const payload: HandoffSettings = {
        managerName: form.managerName?.trim() || '',
        managerRole: form.managerRole?.trim() || '',
        email: form.email?.trim() || '',
        phone: normalizePhone(form.phone || ''),
        whatsapp: form.whatsapp?.trim() || '',
        telegram: form.telegram?.trim() || '',
        messageAfterAr: form.messageAfterAr?.trim() || '',
      };

      const res = await fetch('/api/admin/handoff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Ошибка сохранения (${res.status})`);
      }

      setSettings(data as HandoffSettings);
      setForm(data as HandoffSettings);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось сохранить настройки';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-brand-brown">Контакт и hand-off</h1>
        <p className="text-sm text-gray-600 mt-2 max-w-2xl">
          Это мягкая передача: после AR посетитель видит спокойное сообщение и контакт менеджера.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm text-sm text-gray-600">
          Загрузка…
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Имя менеджера</label>
              <input
                name="managerName"
                value={form.managerName || ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                placeholder="Например: Анна"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Роль</label>
              <input
                name="managerRole"
                value={form.managerRole || ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                placeholder="Например: куратор"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                value={form.email || ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                placeholder="hello@labelcom…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Телефон</label>
              <input
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                placeholder="+7…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp link</label>
              <input
                name="whatsapp"
                value={form.whatsapp || ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                placeholder="https://wa.me/…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telegram link</label>
              <input
                name="telegram"
                value={form.telegram || ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                placeholder="https://t.me/…"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Сообщение после AR</label>
            <textarea
              name="messageAfterAr"
              value={form.messageAfterAr || ''}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
              placeholder="Если хотите — обсудим решение…"
            />
            <p className="text-xs text-gray-500 mt-2">
              Показывается в карточке объекта после закрытия AR-режима.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">
              {settings?.updatedAt ? `обновлено: ${new Date(settings.updatedAt).toLocaleString('ru-RU')}` : ''}
            </div>
            <Button type="button" onClick={save} disabled={isSaving || !isDirty}>
              {isSaving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
