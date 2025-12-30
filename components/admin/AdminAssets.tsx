import React, { useCallback, useMemo, useState } from 'react';
import type { ObjectAdmin } from '../../types';
import { Button } from '../Button';

interface AdminAssetsProps {
  objectsWith3D: ObjectAdmin[];
  objectsWithout3D: ObjectAdmin[];
  onOpenObject: (object: ObjectAdmin) => void;
}

type SizeState = {
  glbBytes?: number;
  usdzBytes?: number;
  glbError?: string;
  usdzError?: string;
  isLoading?: boolean;
};

const build3DLabel = (object: ObjectAdmin) => {
  const hasGlb = Boolean(object.modelGlbUrl);
  const hasUsdz = Boolean(object.modelUsdzUrl);
  if (hasGlb && hasUsdz) return 'GLB + USDZ';
  if (hasGlb) return 'GLB';
  if (hasUsdz) return 'USDZ';
  return '—';
};

const bytesToHuman = (bytes?: number) => {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  const precision = idx === 0 ? 0 : idx === 1 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[idx]}`;
};

const isOptimizedUrl = (url?: string) => {
  if (!url) return false;
  return /\/models\/optimized\//i.test(url);
};

export const AdminAssets: React.FC<AdminAssetsProps> = ({
  objectsWith3D,
  objectsWithout3D,
  onOpenObject,
}) => {
  const [sizes, setSizes] = useState<Record<string, SizeState>>({});

  const withGlb = objectsWith3D.filter(o => Boolean(o.modelGlbUrl)).length;
  const withUsdz = objectsWith3D.filter(o => Boolean(o.modelUsdzUrl)).length;
  const withBoth = objectsWith3D.filter(o => Boolean(o.modelGlbUrl && o.modelUsdzUrl)).length;

  const allObjects = useMemo(() => [...objectsWith3D, ...objectsWithout3D], [objectsWith3D, objectsWithout3D]);

  const fetchSizeBytes = useCallback(async (url: string) => {
    const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { method: 'HEAD' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const length = res.headers.get('content-length');
    const parsed = length ? Number(length) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed;
  }, []);

  const checkSizesForObject = useCallback(
    async (object: ObjectAdmin) => {
      setSizes((prev) => ({
        ...prev,
        [object.id]: { ...prev[object.id], isLoading: true, glbError: undefined, usdzError: undefined },
      }));

      const nextState: SizeState = { isLoading: false };
      const tasks: Array<Promise<void>> = [];

      if (object.modelGlbUrl) {
        tasks.push(
          fetchSizeBytes(object.modelGlbUrl)
            .then((bytes) => {
              nextState.glbBytes = bytes;
            })
            .catch((err) => {
              nextState.glbError = err instanceof Error ? err.message : 'Ошибка';
            }),
        );
      }

      if (object.modelUsdzUrl) {
        tasks.push(
          fetchSizeBytes(object.modelUsdzUrl)
            .then((bytes) => {
              nextState.usdzBytes = bytes;
            })
            .catch((err) => {
              nextState.usdzError = err instanceof Error ? err.message : 'Ошибка';
            }),
        );
      }

      await Promise.all(tasks);

      setSizes((prev) => ({
        ...prev,
        [object.id]: { ...prev[object.id], ...nextState, isLoading: false },
      }));
    },
    [fetchSizeBytes],
  );

  const nonOptimizedCount = useMemo(() => {
    return objectsWith3D.filter((o) => {
      const glbNeeds = Boolean(o.modelGlbUrl && !isOptimizedUrl(o.modelGlbUrl));
      const usdzNeeds = Boolean(o.modelUsdzUrl && !isOptimizedUrl(o.modelUsdzUrl));
      return glbNeeds || usdzNeeds;
    }).length;
  }, [objectsWith3D]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-brand-brown">3D и AR</h1>
        <p className="text-sm text-gray-600 mt-2 max-w-2xl">
          GLB — Android / Web / WebAR. USDZ — iPhone (AR Quick Look). Форматы не подменяют друг друга.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <div className="text-xs text-gray-500">С 3D</div>
          <div className="text-2xl font-serif text-brand-brown mt-1">{objectsWith3D.length}</div>
          <div className="text-xs text-gray-500 mt-2">
            GLB: {withGlb} · USDZ: {withUsdz} · оба: {withBoth}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <div className="text-xs text-gray-500">Без 3D</div>
          <div className="text-2xl font-serif text-brand-brown mt-1">{objectsWithout3D.length}</div>
          <div className="text-xs text-gray-500 mt-2">Добавьте GLB и/или USDZ в карточке объекта.</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
          <div className="text-xs text-gray-500">Быстрые действия</div>
          <div className="text-sm text-gray-600 mt-2">
            Откройте объект, загрузите GLB/USDZ и сразу проверьте размеры файла.
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Не оптимизировано: {nonOptimizedCount} · Оптимизация: <code className="font-mono">npm run optimize:3d</code>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-charcoal">Объекты</h2>
          <div className="text-xs text-gray-500">{allObjects.length} всего</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Объект
                </th>
                <th scope="col" className="px-6 py-3">
                  Тип
                </th>
                <th scope="col" className="px-6 py-3">
                  Форматы
                </th>
                <th scope="col" className="px-6 py-3">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3">
                  Размер
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allObjects.map(object => {
                const hasGlb = Boolean(object.modelGlbUrl);
                const hasUsdz = Boolean(object.modelUsdzUrl);
                const readyForAr = hasGlb && hasUsdz;
                const glbOptimized = object.modelGlbUrl ? isOptimizedUrl(object.modelGlbUrl) : false;
                const usdzOptimized = object.modelUsdzUrl ? isOptimizedUrl(object.modelUsdzUrl) : false;
                const needsOptimization = Boolean((hasGlb && !glbOptimized) || (hasUsdz && !usdzOptimized));

                const sizeState = sizes[object.id];
                const glbSize = bytesToHuman(sizeState?.glbBytes);
                const usdzSize = bytesToHuman(sizeState?.usdzBytes);
                const isSizeLoading = Boolean(sizeState?.isLoading);

                return (
                  <tr key={object.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{object.name}</td>
                  <td className="px-6 py-4">{object.objectType || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      {build3DLabel(object)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {readyForAr ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs text-green-700 border border-green-200">
                          Готово к AR
                        </span>
                      ) : hasGlb || hasUsdz ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700 border border-amber-200">
                          Частично
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-500 border border-gray-200">
                          Нет 3D
                        </span>
                      )}
                      {needsOptimization && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs text-red-700 border border-red-200">
                          Не оптимизировано
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {hasGlb || hasUsdz ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-700">
                          GLB: {hasGlb ? glbSize : '—'}
                          {sizeState?.glbError ? <span className="text-red-600"> · {sizeState.glbError}</span> : null}
                        </div>
                        <div className="text-xs text-gray-700">
                          USDZ: {hasUsdz ? usdzSize : '—'}
                          {sizeState?.usdzError ? <span className="text-red-600"> · {sizeState.usdzError}</span> : null}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      {(hasGlb || hasUsdz) && (
                        <button
                          type="button"
                          disabled={isSizeLoading}
                          onClick={() => checkSizesForObject(object)}
                          className="text-xs font-semibold text-brand-brown hover:text-brand-charcoal disabled:opacity-50"
                        >
                          {isSizeLoading ? 'Проверяю…' : 'Проверить'}
                        </button>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={() => onOpenObject(object)}>
                        Открыть
                      </Button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {allObjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Объектов пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
