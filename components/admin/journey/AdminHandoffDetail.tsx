import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';

type HandoffDetailResponse = {
  visitorId: string;
  handoff: {
    at: string | null;
    reason: 'pricing' | 'purchase' | 'contact' | null;
    objectId: string | null;
    objectName: string | null;
    actions: Array<'VIEW_3D' | 'AR_TRY' | 'SAVE'>;
    arDurationSec: number | null;
    lastQuestions: string[];
    timestamp: string | null;
  };
  path: Array<{
    type: string;
    at: string | null;
    objectId: string | null;
    objectName: string | null;
    meta: { durationSec?: number } | null;
  }>;
};

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (value: number | null) => {
  if (value == null) return '—';
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

const describeEvent = (event: HandoffDetailResponse['path'][number]) => {
  const name = event.objectName || (event.objectId ? event.objectId.slice(0, 8) + '…' : '');
  const withName = (base: string) => (name ? `${base} ${name}` : base);

  if (event.type === 'VIEW_OBJECT') return withName('Посмотрел объект');
  if (event.type === 'OPEN_3D') return withName('Открыл 3D для');
  if (event.type === 'START_AR') return withName('Запустил AR примерку для');
  if (event.type === 'FINISH_AR') {
    const duration = event.meta?.durationSec;
    return duration != null ? `Завершил AR (${duration} сек)` : 'Завершил AR примерку';
  }
  if (event.type === 'SAVE_OBJECT') return withName('Сохранил');
  if (event.type === 'REMOVE_OBJECT') return withName('Убрал из сохранённого');
  if (event.type === 'HANDOFF_REQUESTED') return `Запросил hand-off (${reasonLabel((event as any)?.meta?.handoff?.reason ?? null)})`;
  return event.type;
};

export const AdminHandoffDetail: React.FC<{ visitorId: string; onBack: () => void }> = ({ visitorId, onBack }) => {
  const [data, setData] = useState<HandoffDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stages = useMemo(() => {
    const actions = data?.handoff.actions || [];
    return {
      view3d: actions.includes('VIEW_3D'),
      ar: actions.includes('AR_TRY'),
      saved: actions.includes('SAVE'),
    };
  }, [data?.handoff.actions]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/journey/handoff/${encodeURIComponent(visitorId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as HandoffDetailResponse | { error?: string };
        if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
        if (isActive) setData(json as HandoffDetailResponse);
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
  }, [visitorId]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <button type="button" onClick={onBack} className="text-sm text-brand-brown hover:text-brand-charcoal transition-colors">
            ← Назад
          </button>
          <h1 className="text-2xl font-semibold text-brand-charcoal mt-2">Hand-off: контекст</h1>
          <p className="text-xs text-gray-500 mt-1 font-mono">Visitor ID: {visitorId}</p>
        </div>
      </div>

      {error && <div className="bg-white p-4 rounded-lg border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500">Объект</div>
            <div className="text-sm text-brand-charcoal mt-1">
              {loading ? '…' : data?.handoff.objectName || (data?.handoff.objectId ? data.handoff.objectId.slice(0, 8) + '…' : '—')}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Причина</div>
            <div className="text-sm text-brand-charcoal mt-1">{loading ? '…' : reasonLabel(data?.handoff.reason ?? null)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">AR длительность</div>
            <div className="text-sm text-brand-charcoal mt-1">{loading ? '…' : formatDuration(data?.handoff.arDurationSec ?? null)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Когда</div>
            <div className="text-sm text-brand-charcoal mt-1">{loading ? '…' : formatDateTime(data?.handoff.at ?? null)}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs border ${stages.view3d ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-white border-gray-100 text-gray-400'}`}>
            3D
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs border ${stages.ar ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-white border-gray-100 text-gray-400'}`}>
            AR
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs border ${stages.saved ? 'bg-gray-50 border-gray-200 text-gray-800' : 'bg-white border-gray-100 text-gray-400'}`}>
            Сохранён
          </span>
        </div>

        <div className="mt-5">
          <div className="text-xs text-gray-500">Последний вопрос</div>
          <div className="text-sm text-brand-charcoal mt-1">
            {loading ? '…' : data?.handoff.lastQuestions?.slice(-1)[0] || '—'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="text-sm text-gray-500">{loading ? 'Загрузка…' : `Действий: ${data?.path.length ?? 0}`}</div>
        </div>
        {(data?.path?.length ?? 0) === 0 ? (
          <div className="p-8 text-sm text-gray-500">Нет действий для отображения.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data!.path.map((event, idx) => (
              <div key={`${event.type}:${event.at ?? idx}`} className="px-6 py-4 flex items-start gap-4">
                <div className="w-28 text-xs text-gray-400">{formatDateTime(event.at)}</div>
                <div className="flex-1">
                  <div className="text-sm text-brand-charcoal">{describeEvent(event)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

