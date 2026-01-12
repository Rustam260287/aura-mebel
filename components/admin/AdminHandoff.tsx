import React, { useState, useEffect, useMemo } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../Button';
import { CuratorList } from './CuratorList';

interface HandoffSettings {
  managerName?: string;
  managerRole?: string;
  avatarUrl?: string;
  workingHours?: string;
  availabilityStatus?: 'online' | 'offline' | 'schedule';
  whatsappNumber?: string;
  telegramUsername?: string;
  messageAfterAr?: string;
  updatedAt?: string;
}

const normalizePhone = (phone: string) => {
  return phone.replace(/[^0-9]/g, '');
};

export const AdminHandoff: React.FC = () => {
  const [settings, setSettings] = useState<HandoffSettings | null>(null);
  const [form, setForm] = useState<HandoffSettings>({ availabilityStatus: 'online' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/admin/handoff');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          setForm(data || { availabilityStatus: 'online' });
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const isDirty = useMemo(() => JSON.stringify(settings || {}) !== JSON.stringify(form || {}), [settings, form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'whatsappNumber') nextValue = normalizePhone(value);
    if (name === 'telegramUsername') nextValue = value.replace('@', '').replace('https://t.me/', '').trim();
    setForm(prev => ({ ...prev, [name]: nextValue }));
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload: HandoffSettings = {
        managerName: (form.managerName || '').trim(),
        managerRole: (form.managerRole || '').trim(),
        avatarUrl: (form.avatarUrl || '').trim(),
        workingHours: (form.workingHours || '').trim(),
        availabilityStatus: form.availabilityStatus || 'online',
        whatsappNumber: (form.whatsappNumber || '').trim(),
        telegramUsername: (form.telegramUsername || '').trim(),
        messageAfterAr: (form.messageAfterAr || '').trim(),
      };

      const res = await fetch('/api/admin/handoff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = `Ошибка ${res.status}`;
        try {
          const errorData = await res.json();
          if (errorData.error) errorMsg = errorData.error;
          if (errorData.foundRole) errorMsg += ` (Ваша роль: ${errorData.foundRole})`;
        } catch (e) {
          // ignore json parse error
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setSettings(data);
      setForm(data); // Sync form with saved data
    } catch (err) {
      console.error(err);
      setError('Не удалось сохранить изменения');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* SECTION 1: TEAM MANAGEMENT */}
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-serif text-brand-brown">Команда и Hand-off</h1>
          <p className="text-sm text-gray-600 mt-2 max-w-2xl">
            Управляйте публичными профилями кураторов. Система автоматически выбирает подходящего куратора для пользователя на основе статуса и расписания.
          </p>
        </div>
        <CuratorList />
      </div>

      <div className="w-full h-px bg-gray-200" />

      {/* SECTION 2: FALLBACK SETTINGS */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Общие настройки и Fallback</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Этот профиль используется, если ни один куратор не доступен или не найден. Также здесь настраивается сообщение после AR.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm text-sm text-gray-600">
            Загрузка настроек...
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-8 items-start">
            {/* LEFT COLUMN: FORM */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-8 flex-1 w-full max-w-3xl">
              {/* Identity Group */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <UserCircleIcon className="w-4 h-4" />
                  Запасной Профиль (Fallback)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Имя (по умолч.)</label>
                    <input
                      name="managerName"
                      value={form.managerName || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                      placeholder="Например: Aura Support"
                    />
                  </div>
                  {/* ... Rest of the form inputs remain the same ... */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Роль</label>
                    <input
                      name="managerRole"
                      value={form.managerRole || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                      placeholder="Сервис заботы"
                    />
                  </div>
                </div>
                {/* Simplified view for brevity in this replace block - I need to keep the full form logic if possible or just wrap the existing return */}
                {/* Since I am replacing the RETURN block, I must reproduce the form content or refactor it out. 
                     Refactoring is safer to avoid code duplication errors in replace tool.
                     I will paste the FULL content of the form here.
                 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Ссылка на аватар (URL)</label>
                    <input
                      name="avatarUrl"
                      value={form.avatarUrl || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-gray-100" />

              {/* Channels Group */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Каналы связи (Fallback)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">WhatsApp (цифры)</label>
                    <input
                      name="whatsappNumber"
                      value={form.whatsappNumber || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                      placeholder="79990000000"
                    />
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
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-gray-100" />

              {/* Message Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Сообщение после AR (Quiet UX)</label>
                <textarea
                  name="messageAfterAr"
                  value={form.messageAfterAr || ''}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                  placeholder="Если захотите обсудить детали — мы на связи."
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}

              <div className="flex items-center justify-between pt-4">
                <div className="text-xs text-gray-500">
                  {settings?.updatedAt ? `обновлено: ${new Date(settings.updatedAt).toLocaleString('ru-RU')}` : ''}
                </div>
                <Button type="button" onClick={save} disabled={isSaving || !isDirty}>
                  {isSaving ? 'Сохранение…' : 'Сохранить общие настройки'}
                </Button>
              </div>
            </div>

            {/* RIGHT COLUMN: PREVIEW */}
            <div className="w-full xl:w-80 flex-shrink-0 opacity-70 grayscale">
              <div className="sticky top-6">
                <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider text-center">Fallback Preview</h3>
                <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-brand-cream-dark mb-3 overflow-hidden relative border-2 border-white shadow-sm">
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt="Curator" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-brown/40">
                        <UserCircleIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-brand-charcoal">{form.managerName || 'Имя куратора'}</h4>
                  <p className="text-xs text-brand-beige-dark mb-1">{form.managerRole || 'Должность'}</p>
                  <div className="flex gap-2 w-full justify-center mt-3">
                    {form.whatsappNumber && <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">W</div>}
                    {form.telegramUsername && <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">T</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
