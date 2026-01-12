import React, { useState, useEffect, useMemo } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '../Button';

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

  const save = async () => { /* ... existing save logic but with new payload ... */
    // Payload construction needs to include new fields
    const payload: HandoffSettings = {
      managerName: form.managerName?.trim() || '',
      managerRole: form.managerRole?.trim() || '',
      avatarUrl: form.avatarUrl?.trim() || '',
      workingHours: form.workingHours?.trim() || '',
      availabilityStatus: form.availabilityStatus || 'online',
      whatsappNumber: form.whatsappNumber || '',
      telegramUsername: form.telegramUsername || '',
      messageAfterAr: form.messageAfterAr?.trim() || '',
    };
    // ... fetch ...
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-brand-brown">Контакт и hand-off</h1>
        <p className="text-sm text-gray-600 mt-2 max-w-2xl">
          Настройте профиль куратора Aura. Эти данные увидит пользователь, когда решит связаться с нами.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm text-sm text-gray-600">
          Загрузка…
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-8 items-start">

          {/* LEFT COLUMN: FORM */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-8 flex-1 w-full max-w-3xl">

            {/* Identity Group */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                <UserCircleIcon className="w-4 h-4" />
                Профиль Куратора
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Имя</label>
                  <input
                    name="managerName"
                    value={form.managerName || ''}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                    placeholder="Например: Анна"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Роль / Должность</label>
                  <input
                    name="managerRole"
                    value={form.managerRole || ''}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                    placeholder="Например: Куратор Aura"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Ссылка на аватар (URL)</label>
                  <input
                    name="avatarUrl"
                    value={form.avatarUrl || ''}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                    placeholder="https://..."
                  />
                  <p className="mt-1 text-xs text-gray-400">Рекомендуем квадратное фото 200x200px</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Статус доступности</label>
                  <select
                    name="availabilityStatus"
                    value={form.availabilityStatus || 'online'}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown bg-white"
                  >
                    <option value="online">🟢 Онлайн</option>
                    <option value="offline">🔴 Оффлайн</option>
                    <option value="schedule">🕒 По расписанию</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Часы работы</label>
                  <input
                    name="workingHours"
                    value={form.workingHours || ''}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border-gray-300 p-2 border focus:border-brand-brown focus:ring-brand-brown"
                    placeholder="Пн-Вс 10:00 - 19:00"
                  />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* Channels Group */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Каналы связи</h3>
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
                {isSaving ? 'Сохранение…' : 'Сохранить настройки'}
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW */}
          <div className="w-full xl:w-80 flex-shrink-0">
            <div className="sticky top-6">
              <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider text-center">Предпросмотр (Live)</h3>

              {/* PREVIEW CARD STYLING - Mimics CuratorCard */}
              <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-brand-cream-dark mb-3 overflow-hidden relative border-2 border-white shadow-sm">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="Curator" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-brown/40">
                      <UserCircleIcon className="w-8 h-8" />
                    </div>
                  )}
                  {form.availabilityStatus === 'online' && (
                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                  )}
                </div>
                <h4 className="font-medium text-brand-charcoal">{form.managerName || 'Имя куратора'}</h4>
                <p className="text-xs text-brand-beige-dark mb-1">{form.managerRole || 'Должность'}</p>

                {form.workingHours && (
                  <p className="text-[10px] text-gray-400 mb-4">{form.workingHours}</p>
                )}

                <div className="flex gap-2 w-full justify-center">
                  {form.whatsappNumber && (
                    <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">W</div>
                  )}
                  {form.telegramUsername && (
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">T</div>
                  )}
                </div>

                <div className="mt-4 text-[10px] text-gray-400">
                  "Мы поможем с размерами и доставкой"
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
