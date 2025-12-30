import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { PeriodSelect } from './PeriodSelect';

type ActiveVisitorsResponse = {
  period: { from: string; to: string; days: number };
  visitors: Array<{
    id: string;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
    device: 'mobile' | 'desktop' | null;
    os: 'ios' | 'android' | 'other' | null;
    country: string | null;
    lastObjectId: string | null;
    lastObjectName: string | null;
    lastEventType: string | null;
    lastEventAt: string | null;
    lastIntentAt: string | null;
    savedCount: number;
    lastArDurationSec: number | null;
  }>;
};

const formatTime = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const pluralObjects = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'объект';
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return 'объекта';
  return 'объектов';
};

const describeLastAction = (row: ActiveVisitorsResponse['visitors'][number]) => {
  const t = row.lastEventType;
  if (t === 'FINISH_AR') {
    return row.lastArDurationSec != null ? `Примерял в AR, ${row.lastArDurationSec} сек` : 'Примерял в AR';
  }
  if (t === 'START_AR') return 'Запустил AR примерку';
  if (t === 'OPEN_3D') return 'Открыл 3D';
  if (t === 'VIEW_OBJECT') return 'Смотрел объект';
  if (t === 'SAVE_OBJECT') {
    return row.savedCount > 0 ? `Сохранил ${row.savedCount} ${pluralObjects(row.savedCount)}` : 'Сохранил';
  }
  if (t === 'OPEN_SAVED') return 'Открыл сохранённое';
  if (t === 'REMOVE_OBJECT') return 'Обновил сохранённое';
  if (t === 'CONTACT_MANAGER') return 'Открыл связь с менеджером';
  return 'Активность';
};

export const AdminActiveVisitors: React.FC<{ onOpenVisitor: (visitorId: string) => void }> = ({ onOpenVisitor }) => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ActiveVisitorsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => data?.visitors || [], [data]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/journey/active-visitors?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as ActiveVisitorsResponse | { error?: string };
        if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
        if (isActive) setData(json as ActiveVisitorsResponse);
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
          <h1 className="text-2xl font-semibold text-brand-charcoal">Активные посетители</h1>
          <p className="text-sm text-gray-500 mt-1">Только с намерением: сохранение или контакт</p>
        </div>
        <PeriodSelect days={days} onChange={setDays} />
      </div>

      {error && (
        <div className="bg-white p-4 rounded-lg border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {loading ? 'Загрузка…' : `Найдено: ${rows.length}`}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">Пока нет посетителей с намерением за выбранный период.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left font-medium px-6 py-3">Visitor ID</th>
                  <th className="text-left font-medium px-6 py-3">Последний объект</th>
                  <th className="text-left font-medium px-6 py-3">Последнее действие</th>
                  <th className="text-left font-medium px-6 py-3">Сохранено</th>
                  <th className="text-left font-medium px-6 py-3">Активность</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onOpenVisitor(row.id)}
                  >
                    <td className="px-6 py-3 font-mono text-xs text-brand-charcoal">{row.id.slice(0, 10)}…</td>
                    <td className="px-6 py-3 text-brand-charcoal">
                      {row.lastObjectName || (row.lastObjectId ? row.lastObjectId.slice(0, 8) + '…' : '—')}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{describeLastAction(row)}</td>
                    <td className="px-6 py-3 text-gray-700">{row.savedCount}</td>
                    <td className="px-6 py-3 text-gray-700">{formatTime(row.lastEventAt || row.lastSeenAt)}</td>
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
