import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { PeriodSelect } from './PeriodSelect';

type SavedInsightsResponse = {
  period: { from: string; to: string; days: number };
  totals: {
    visitorsWithSaved: number;
    totalSaves: number;
    uniqueSavedObjects: number;
  };
  topSaved: Array<{ objectId: string; objectName: string | null; saves: number }>;
};

export const AdminSavedInsights: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<SavedInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => data?.topSaved || [], [data]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/journey/saved-insights?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as SavedInsightsResponse | { error?: string };
        if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
        if (isActive) setData(json as SavedInsightsResponse);
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
          <h1 className="text-2xl font-semibold text-brand-charcoal">Сохранено (агрегировано)</h1>
          <p className="text-sm text-gray-500 mt-1">Сигнал намерения без давления</p>
        </div>
        <PeriodSelect days={days} onChange={setDays} />
      </div>

      {error && (
        <div className="bg-white p-4 rounded-lg border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Посетители с сохранением</div>
          <div className="mt-2 text-3xl font-serif text-brand-brown">{loading ? '…' : data?.totals.visitorsWithSaved ?? '—'}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Всего сохранений</div>
          <div className="mt-2 text-3xl font-serif text-brand-brown">{loading ? '…' : data?.totals.totalSaves ?? '—'}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Уникальных объектов</div>
          <div className="mt-2 text-3xl font-serif text-brand-brown">{loading ? '…' : data?.totals.uniqueSavedObjects ?? '—'}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="text-sm text-gray-500">Чаще сохраняют</div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">Нет данных за выбранный период.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left font-medium px-6 py-3">Объект</th>
                  <th className="text-left font-medium px-6 py-3">Сохранений</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.objectId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-brand-charcoal">
                      <div className="font-medium">{row.objectName || '—'}</div>
                      <div className="text-xs font-mono text-gray-400">{row.objectId}</div>
                    </td>
                    <td className="px-6 py-3">{row.saves}</td>
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
