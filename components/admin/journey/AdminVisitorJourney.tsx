import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getHandoffReasonLabel } from '../../../lib/journey/handoff';

type VisitorJourneyResponse = {
  visitor: {
    id: string;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
    device: 'mobile' | 'desktop' | null;
    os: 'ios' | 'android' | 'other' | null;
    country: string | null;
    savedObjectIds: string[];
  };
  events: Array<{
    id: string;
    type: string;
    objectId: string | null;
    objectName: string | null;
    createdAt: string | null;
    meta: Record<string, unknown> | null;
  }>;
};

const formatTime = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const describeEvent = (event: VisitorJourneyResponse['events'][number]) => {
  const name = event.objectName || (event.objectId ? event.objectId.slice(0, 8) + '…' : '');
  const withName = (base: string) => (name ? `${base} ${name}` : base);

  if (event.type === 'VIEW_OBJECT') return withName('Посмотрел объект');
  if (event.type === 'OPEN_3D') return withName('Открыл 3D для');
  if (event.type === 'START_AR') return withName('Запустил AR примерку для');
  if (event.type === 'AR_SNAPSHOT_REQUESTED') return withName('Нажал «Сделать снимок» для');
  if (event.type === 'AR_SNAPSHOT_CREATED') return withName('Сделал AR‑снимок для');
  if (event.type === 'FINISH_AR') {
    const duration = typeof event.meta?.durationSec === 'number' ? event.meta.durationSec : null;
    return duration != null ? `Примерял в комнате (AR, ${duration} сек)` : 'Завершил AR примерку';
  }
  if (event.type === 'SAVE_OBJECT') return withName('Сохранил');
  if (event.type === 'REMOVE_OBJECT') return withName('Убрал из сохранённого');
  if (event.type === 'OPEN_SAVED') return 'Открыл сохранённое';
  if (event.type === 'CONTACT_MANAGER') return 'Открыл связь с менеджером';
  if (event.type === 'HANDOFF_REQUESTED') {
    const label = getHandoffReasonLabel((event.meta as any)?.handoff?.reason ?? null);
    return label !== '—' ? `Запросил hand-off (${label})` : 'Запросил hand-off';
  }
  return event.type;
};

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const AdminVisitorJourney: React.FC<{ visitorId: string; onBack: () => void }> = ({ visitorId, onBack }) => {
  const [data, setData] = useState<VisitorJourneyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const events = useMemo(() => data?.events || [], [data]);
  const snapshots = useMemo(() => {
    return events
      .filter((e) => e.type === 'AR_SNAPSHOT_CREATED')
      .map((e) => {
        const snapshot = (e.meta as any)?.snapshot;
        const url = typeof snapshot?.url === 'string' ? snapshot.url : null;
        const platform = typeof (e.meta as any)?.platform === 'string' ? (e.meta as any).platform : null;
        return {
          id: e.id,
          url,
          createdAt: e.createdAt,
          objectName: e.objectName,
          objectId: e.objectId,
          platform,
        };
      })
      .filter((s) => Boolean(s.url));
  }, [events]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/journey/visitors/${encodeURIComponent(visitorId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as VisitorJourneyResponse | { error?: string };
        if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
        if (isActive) setData(json as VisitorJourneyResponse);
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
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-brand-brown hover:text-brand-charcoal transition-colors"
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-semibold text-brand-charcoal mt-2">Путь посетителя</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">Visitor ID: {visitorId}</p>
        </div>
      </div>

      {error && (
        <div className="bg-white p-4 rounded-lg border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {data?.visitor && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500">Первый визит</div>
              <div className="text-sm text-brand-charcoal mt-1">{formatDateTime(data.visitor.firstSeenAt)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Последняя активность</div>
              <div className="text-sm text-brand-charcoal mt-1">{formatDateTime(data.visitor.lastSeenAt)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Устройство</div>
              <div className="text-sm text-brand-charcoal mt-1">
                {data.visitor.device || '—'} · {data.visitor.os || '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Сохранено</div>
              <div className="text-sm text-brand-charcoal mt-1">{data.visitor.savedObjectIds.length}</div>
            </div>
          </div>
        </div>
      )}

      {snapshots.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="text-sm font-medium text-brand-charcoal">AR снимки</div>
            <div className="text-xs text-gray-500">{snapshots.length}</div>
          </div>
          <div className="p-6">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {snapshots
                .slice()
                .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
                .map((s) => (
                  <a
                    key={s.id}
                    href={s.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 w-40"
                    title={`${s.objectName || s.objectId || ''} ${formatDateTime(s.createdAt)}`}
                  >
                    <div className="relative w-40 aspect-[3/4] rounded-xl overflow-hidden border border-stone-beige/30 bg-stone-beige/10">
                      {s.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.url} alt="AR snapshot" className="w-full h-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs text-brand-charcoal truncate">
                        {s.objectName || (s.objectId ? s.objectId.slice(0, 8) + '…' : '—')}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center justify-between gap-2">
                        <span>{formatTime(s.createdAt)}</span>
                        <span className="uppercase">{s.platform || ''}</span>
                      </div>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-500">{loading ? 'Загрузка…' : `Событий: ${events.length}`}</div>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-sm text-gray-500">Пока нет событий.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.id} className="px-6 py-4 flex items-start gap-4">
                <div className="w-16 text-sm text-gray-400">{formatTime(event.createdAt)}</div>
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
