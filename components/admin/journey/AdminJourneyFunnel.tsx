import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { PeriodSelect } from './PeriodSelect';

type OverviewResponse = {
  period: { from: string; to: string; days: number };
  totals: {
    visitors: number;
    viewedObjectVisitors: number;
    opened3dVisitors: number;
    arVisitors: number;
    savedVisitors: number;
    contactedVisitors: number;
  };
};

const formatRange = (period: OverviewResponse['period']) => {
  const from = new Date(period.from);
  const to = new Date(period.to);
  return `${from.toLocaleDateString('ru-RU')} — ${to.toLocaleDateString('ru-RU')}`;
};

export const AdminJourneyFunnel: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stages = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: 'view',
        label: 'Просмотр объектов',
        hint: 'Интерес',
        count: data.totals.viewedObjectVisitors,
      },
      {
        key: '3d',
        label: 'Открытие 3D',
        hint: 'Осознанность',
        count: data.totals.opened3dVisitors,
      },
      {
        key: 'ar',
        label: 'AR примерка',
        hint: 'Дошли до примерки',
        count: data.totals.arVisitors,
      },
      {
        key: 'saved',
        label: 'Сохранение',
        hint: 'Сохранили для размышления',
        count: data.totals.savedVisitors,
      },
      {
        key: 'contact',
        label: 'Запрос менеджера',
        hint: 'Явный hand-off',
        count: data.totals.contactedVisitors,
      },
    ] as const;
  }, [data]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/journey/overview?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as OverviewResponse | { error?: string };
        if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
        if (isActive) setData(json as OverviewResponse);
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
          <h1 className="text-2xl font-semibold text-brand-charcoal">Путь посетителей</h1>
          <p className="text-sm text-gray-500 mt-1">
            Этапы опыта без давления и оценок
            {data?.period ? ` · ${formatRange(data.period)}` : ''}
          </p>
        </div>
        <PeriodSelect days={days} onChange={setDays} />
      </div>

      {error && (
        <div className="bg-white p-4 rounded-lg border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Всего посетителей</div>
          <div className="mt-2 text-4xl font-serif text-brand-brown">
            {loading ? '…' : data?.totals.visitors ?? '—'}
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Анонимно. Без контактов, без персональных данных.
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-sm text-gray-500">Этапы</div>
          <div className="mt-4 space-y-3">
            {stages.map((stage, index) => (
              <div key={stage.key} className="flex items-center gap-3">
                <div className="w-8 text-xs text-gray-400">{index + 1}</div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-sm font-medium text-brand-charcoal">{stage.label}</div>
                    <div className="text-sm font-semibold text-brand-brown">
                      {loading ? '…' : stage.count}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{stage.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
