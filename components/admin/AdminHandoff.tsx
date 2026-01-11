import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { Button } from '../Button';

interface HandoffSettings {
  managerName?: string;
  managerRole?: string;
  whatsappNumber?: string;
  telegramUsername?: string;
  messageAfterAr?: string;
  updatedAt?: string;
  // Legacy fields (optional) to avoid crash if present
  email?: string;
  phone?: string;
}

const normalizePhone = (value: string) => value.replace(/[^\d]/g, '');

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
    let nextValue = value;

    // Auto-formatting logic
    if (name === 'whatsappNumber') {
      nextValue = normalizePhone(value);
    }
    if (name === 'telegramUsername') {
      nextValue = value.replace('@', '').replace('https://t.me/', '').trim();
    }

    setForm(prev => ({ ...prev, [name]: nextValue }));
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
        whatsappNumber: form.whatsappNumber || '',
        telegramUsername: form.telegramUsername || '',
        messageAfterAr: form.messageAfterAr?.trim() || '',
        // Preserve legacy if defined, or clear them? Better to clear or ignore.
        // We will just send what we edit.
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
          Настройте, куда посетитель сможет написать после визуальной примерки.
          Используйте только цифры для WhatsApp и юзернейм для Telegram.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm text-sm text-gray-600">
          Загрузка…
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Identity Group */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Представитель</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Имя куратора</label>
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
                    placeholder="Например: Консультант Aura"
                  />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 md:col-span-2" />

            {/* Channels Group */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Каналы связи</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp (только цифры)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      name="whatsappNumber"
                      value={form.whatsappNumber || ''}
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                      placeholder="79990000000"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Без плюсов и пробелов.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telegram Username</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">@</span>
                    </div>
                    <input
                      name="telegramUsername"
                      value={form.telegramUsername || ''}
                      onChange={handleChange}
                      className="w-full rounded-md border-gray-300 p-2 pl-7 border focus:border-brand-brown focus:ring-brand-brown"
                      placeholder="aura_support"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Без ссылки, только логин.</p>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 md:col-span-2" />

            {/* Message Group */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Сообщение после AR (Quiet UX)</label>
              <textarea
                name="messageAfterAr"
                value={form.messageAfterAr || ''}
                onChange={handleChange}
                rows={3}
                className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                placeholder="Если захотите обсудить детали — мы на связи."
              />
              <p className="text-xs text-gray-500 mt-2">
                Появляется один раз за сессию, если посетитель долго смотрел AR и вышел. Не пытайтесь продавать здесь.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-gray-500">
              {settings?.updatedAt ? `обновлено: ${new Date(settings.updatedAt).toLocaleString('ru-RU')}` : ''}
            </div>
            <Button type="button" onClick={save} disabled={isSaving || !isDirty}>
              {isSaving ? 'Сохранение…' : 'Сохранить настройки'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
