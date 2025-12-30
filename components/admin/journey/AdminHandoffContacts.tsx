import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { PeriodSelect } from './PeriodSelect';

type ContactsResponse = {
  period: { from: string; to: string; days: number };
  contacts: Array<{
    id: string;
    lastHandoffAt: string | null;
    lastHandoffReason: 'pricing' | 'purchase' | 'contact' | null;
    lastObjectId: string | null;
    lastObjectName: string | null;
    lastActions: Array<'VIEW_3D' | 'AR_TRY' | 'SAVE'>;
    lastQuestions: string[];
    lastArDurationSec: number | null;
    savedCount: number;
    lastSeenAt: string | null;
  }>;
};

const formatTime = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (value: number | null) => {
  if (value == null) return null;
  const sec = Math.max(0, Math.round(value));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const reasonLabel = (reason: 'pricing' | 'purchase' | 'contact' | null) => {
  if (!reason) return '—';
  if (reason === 'pricing') return 'Стоимость';
  if (reason === 'purchase') return 'Как заказать';
  return 'Связь';
};

export const AdminHandoffContacts: React.FC<{ onOpenVisitor?: (visitorId: string) => void }> = ({ onOpenVisitor }) => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ContactsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => data?.contacts || [], [data]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/journey/contacts?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as ContactsResponse | { error?: string };
        if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
        if (isActive) setData(json as ContactsResponse);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Ошибка загрузки';
        if (isActive) setError(message);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand-charcoal">Очередь hand-off</h1>
          <p className="text-sm text-gray-500 mt-1">Посетители, которые явно запросили связь с менеджером</p>
        </div>
        <PeriodSelect days={days} onChange={setDays} />
      </div>

      {error && (
        <div className="bg-white p-4 rounded-lg border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="text-sm text-gray-500">{loading ? 'Загрузка…' : `Найдено: ${rows.length}`}</div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">Пока нет контактов за выбранный период.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left font-medium px-6 py-3">Visitor ID</th>
                  <th className="text-left font-medium px-6 py-3">Последний объект</th>
                  <th className="text-left font-medium px-6 py-3">Стадия</th>
                  <th className="text-left font-medium px-6 py-3">Причина</th>
                  <th className="text-left font-medium px-6 py-3">Вопрос</th>
                  <th className="text-left font-medium px-6 py-3">Когда</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={onOpenVisitor ? 'hover:bg-gray-50 cursor-pointer' : undefined}
                    onClick={onOpenVisitor ? () => onOpenVisitor(row.id) : undefined}
                  >
                    <td className="px-6 py-3 font-mono text-xs text-brand-charcoal">{row.id.slice(0, 10)}…</td>
                    <td className="px-6 py-3 text-brand-charcoal">
                      {row.lastObjectName || (row.lastObjectId ? row.lastObjectId.slice(0, 8) + '…' : '—')}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {row.lastActions.includes('VIEW_3D') && (
                          <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-700">
                            3D
                          </span>
                        )}
                        {row.lastActions.includes('AR_TRY') && (
                          <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-700">
                            AR{formatDuration(row.lastArDurationSec) ? ` ${formatDuration(row.lastArDurationSec)}` : ''}
                          </span>
                        )}
                        {row.lastActions.includes('SAVE') && (
                          <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-700">
                            Сохранён
                          </span>
                        )}
                        {row.lastActions.length === 0 && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{reasonLabel(row.lastHandoffReason)}</td>
                    <td className="px-6 py-3 text-gray-700 max-w-[420px] truncate">
                      {row.lastQuestions?.slice(-1)[0] || '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{formatTime(row.lastHandoffAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
