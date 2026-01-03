'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { PeriodSelect } from '../journey/PeriodSelect';
import { VISITOR_STAGE_LABEL, VISITOR_STAGE_ORDER } from '../../../lib/crm/stages';
import type { VisitorStage } from '../../../types';

type VisitorsResponse = {
  period: { from: string; to: string; days: number; limit: number };
  visitors: Array<{
    id: string;
    stage: VisitorStage;
    stageAuto: VisitorStage;
    stageManual: VisitorStage | null;
    stageManualAt: string | null;
    stageManualBy: { uid: string; email: string | null } | null;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
    device: 'mobile' | 'desktop' | null;
    os: 'ios' | 'android' | 'other' | null;
    country: string | null;
    partnerId: string | null;
    lastObjectId: string | null;
    lastObjectName: string | null;
    lastEventType: string | null;
    lastEventAt: string | null;
    lastIntentAt: string | null;
    savedCount: number;
    snapshotCount: number;
    hasAr: boolean;
  }>;
};

const formatTime = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const pickActivityAt = (row: VisitorsResponse['visitors'][number]) => {
  return row.lastIntentAt || row.lastEventAt || row.lastSeenAt;
};

const shortId = (id: string) => (id.length > 10 ? `${id.slice(0, 10)}…` : id);

export const AdminVisitorsCRM: React.FC<{ onOpenVisitor: (visitorId: string) => void }> = ({ onOpenVisitor }) => {
  const [days, setDays] = useState(30);
  const [mode, setMode] = useState<'kanban' | 'list'>('kanban');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<VisitorsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = data?.visitors || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const id = r.id.toLowerCase();
      const obj = (r.lastObjectName || r.lastObjectId || '').toLowerCase();
      const partner = (r.partnerId || '').toLowerCase();
      return id.includes(q) || obj.includes(q) || partner.includes(q);
    });
  }, [data, query]);

  const stageCounts = useMemo(() => {
    const counts = new Map<VisitorStage, number>();
    for (const s of VISITOR_STAGE_ORDER) counts.set(s, 0);
    for (const row of rows) counts.set(row.stage, (counts.get(row.stage) || 0) + 1);
    return counts;
  }, [rows]);

  const grouped = useMemo(() => {
    const out = new Map<VisitorStage, VisitorsResponse['visitors']>();
    for (const s of VISITOR_STAGE_ORDER) out.set(s, []);
    for (const row of rows) out.get(row.stage)?.push(row);
    for (const [k, list] of out.entries()) {
      list.sort((a, b) => (pickActivityAt(b) || '').localeCompare(pickActivityAt(a) || ''));
      out.set(k, list);
    }
    return out;
  }, [rows]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Not authenticated');
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/visitors?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as VisitorsResponse | { error?: string };
        if (!res.ok) throw new Error((json as any)?.error || `HTTP ${res.status}`);
        if (isActive) setData(json as VisitorsResponse);
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
          <h1 className="text-2xl font-semibold text-brand-charcoal">Посетители</h1>
          <p className="text-sm text-gray-500 mt-1">Этапы готовности вычисляются по событиям. Контакты не требуются.</p>
        </div>
        <PeriodSelect days={days} onChange={setDays} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {VISITOR_STAGE_ORDER.map((s) => (
          <div
            key={s}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
            title={VISITOR_STAGE_LABEL[s]}
          >
            <span className="text-gray-500">{VISITOR_STAGE_LABEL[s]}</span>
            <span className="font-semibold text-brand-charcoal">{stageCounts.get(s) || 0}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('kanban')}
            className={[
              'px-3 py-2 rounded-lg text-sm border transition-colors',
              mode === 'kanban' ? 'bg-brand-brown text-white border-brand-brown' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
            ].join(' ')}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setMode('list')}
            className={[
              'px-3 py-2 rounded-lg text-sm border transition-colors',
              mode === 'list' ? 'bg-brand-brown text-white border-brand-brown' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
            ].join(' ')}
          >
            List
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по visitor / объекту / партнёру"
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm w-full md:w-[420px]"
        />
        <div className="text-sm text-gray-500">{loading ? 'Загрузка…' : `Показано: ${rows.length}`}</div>
      </div>

      {error && <div className="bg-white p-4 rounded-lg border border-red-200 text-sm text-red-700">{error}</div>}

      {mode === 'list' ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-8 text-sm text-gray-500">Нет данных за выбранный период.</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left font-medium px-6 py-3">Visitor</th>
                    <th className="text-left font-medium px-6 py-3">Этап</th>
                    <th className="text-left font-medium px-6 py-3">Последний объект</th>
                    <th className="text-left font-medium px-6 py-3">Сигналы</th>
                    <th className="text-left font-medium px-6 py-3">Активность</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onOpenVisitor(row.id)}>
                      <td className="px-6 py-3 font-mono text-xs text-brand-charcoal">{shortId(row.id)}</td>
                      <td className="px-6 py-3 text-gray-700">{VISITOR_STAGE_LABEL[row.stage]}</td>
                      <td className="px-6 py-3 text-brand-charcoal max-w-[360px] truncate">
                        {row.lastObjectName || (row.lastObjectId ? row.lastObjectId.slice(0, 8) + '…' : '—')}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.hasAr && (
                            <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-700">
                              🟢 AR
                            </span>
                          )}
                          {row.snapshotCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-700">
                              📸 {row.snapshotCount}
                            </span>
                          )}
                          {row.savedCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-700">
                              ⭐ {row.savedCount}
                            </span>
                          )}
                          {row.partnerId && (
                            <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-700">
                              partner {row.partnerId}
                            </span>
                          )}
                          {!row.hasAr && row.snapshotCount === 0 && row.savedCount === 0 && !row.partnerId && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{formatTime(pickActivityAt(row))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[980px] grid grid-cols-8 gap-4">
            {VISITOR_STAGE_ORDER.map((stage) => {
              const list = grouped.get(stage) || [];
              return (
                <div key={stage} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <div className="text-sm font-semibold text-brand-charcoal">{VISITOR_STAGE_LABEL[stage]}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{list.length}</div>
                  </div>
                  <div className="p-3 space-y-2 overflow-y-auto max-h-[66vh]">
                    {list.length === 0 ? (
                      <div className="text-xs text-gray-400 px-1 py-2">—</div>
                    ) : (
                      list.map((row) => (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => onOpenVisitor(row.id)}
                          className="w-full text-left rounded-lg border border-gray-200 hover:border-brand-brown/50 hover:bg-brand-cream/10 transition-colors p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-mono text-[11px] text-gray-500">{shortId(row.id)}</div>
                            <div className="text-[11px] text-gray-400">{formatTime(pickActivityAt(row))}</div>
                          </div>
                          <div className="mt-2 text-sm text-brand-charcoal truncate">
                            {row.lastObjectName || (row.lastObjectId ? row.lastObjectId.slice(0, 8) + '…' : '—')}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {row.hasAr && <span className="text-[11px] text-gray-600">🟢 AR</span>}
                            {row.snapshotCount > 0 && <span className="text-[11px] text-gray-600">📸 {row.snapshotCount}</span>}
                            {row.savedCount > 0 && <span className="text-[11px] text-gray-600">⭐ {row.savedCount}</span>}
                            {row.partnerId && <span className="text-[11px] text-gray-600">partner {row.partnerId}</span>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

