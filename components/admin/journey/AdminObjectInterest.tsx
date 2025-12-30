import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { PeriodSelect } from './PeriodSelect';

type ObjectInterestResponse = {
  period: { from: string; to: string; days: number };
  objects: Array<{
    objectId: string;
    objectName: string | null;
    viewed: number;
    opened3d: number;
    arSessions: number;
    saved: number;
    avgArDurationSec: number | null;
  }>;
};

const formatSec = (sec: number | null) => {
  if (sec == null) return '—';
  if (sec < 60) return `${sec} сек`;
  const m = Math.round(sec / 60);
  return `${m} мин`;
};

export const AdminObjectInterest: React.FC = () => {
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<ObjectInterestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = data?.objects || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => (r.objectName || '').toLowerCase().includes(q) || r.objectId.toLowerCase().includes(q));
  }, [data, query]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/journey/object-interest?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as ObjectInterestResponse | { error?: string };
        if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
        if (isActive) setData(json as ObjectInterestResponse);
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
          <h1 className="text-2xl font-semibold text-brand-charcoal">Объекты → интерес</h1>
          <p className="text-sm text-gray-500 mt-1">Понимание полезности объектов по этапам опыта</p>
        </div>
        <PeriodSelect days={days} onChange={setDays} />
      </div>

      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию или ID"
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm w-full md:w-[420px]"
        />
        <div className="text-sm text-gray-500">{loading ? 'Загрузка…' : `Объектов: ${rows.length}`}</div>
      </div>

      {error && (
        <div className="bg-white p-4 rounded-lg border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">Нет данных за выбранный период.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left font-medium px-6 py-3">Объект</th>
                  <th className="text-left font-medium px-6 py-3">Просмотрен</th>
                  <th className="text-left font-medium px-6 py-3">3D</th>
                  <th className="text-left font-medium px-6 py-3">AR примерки</th>
                  <th className="text-left font-medium px-6 py-3">Сохранён</th>
                  <th className="text-left font-medium px-6 py-3">Среднее AR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.objectId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-brand-charcoal">
                      <div className="font-medium">{row.objectName || '—'}</div>
                      <div className="text-xs font-mono text-gray-400">{row.objectId}</div>
                    </td>
                    <td className="px-6 py-3">{row.viewed}</td>
                    <td className="px-6 py-3">{row.opened3d}</td>
                    <td className="px-6 py-3">{row.arSessions}</td>
                    <td className="px-6 py-3">{row.saved}</td>
                    <td className="px-6 py-3">{formatSec(row.avgArDurationSec)}</td>
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
