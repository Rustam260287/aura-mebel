import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UsersIcon, ClockIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';

interface ObjectStats {
    objectId: string;
    viewed: number;
    saved: number;
    snapshots: number;
    arDurationSec: number;
    uniqueVisitors: number;
    avgViewTimeSec: number | null;
    medianViewTimeSec: number | null;
    returnVisitorRate: number;
}

interface AnalyticsData {
    period: { from: string; to: string; days: number };
    topObjects: ObjectStats[];
}

export const ObjectAnalytics: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [days, setDays] = useState(30);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/admin/analytics?days=${days}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const json = await res.json();
                setData(json);
            } catch (e) {
                setError('Не удалось загрузить аналитику');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user, days]);

    const formatTime = (seconds: number | null) => {
        if (seconds == null) return '—';
        if (seconds < 60) return `${seconds} сек`;
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return <div className="p-6 text-gray-500">Загрузка аналитики объектов...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-500">{error}</div>;
    }

    if (!data) return null;

    const totalUniqueVisitors = data.topObjects.reduce((sum, o) => sum + o.uniqueVisitors, 0);
    const avgViewTime = data.topObjects.length > 0
        ? Math.round(data.topObjects.filter(o => o.avgViewTimeSec).reduce((sum, o) => sum + (o.avgViewTimeSec || 0), 0) / data.topObjects.filter(o => o.avgViewTimeSec).length || 0)
        : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">📈 Аналитика объектов</h2>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                >
                    <option value={7}>7 дней</option>
                    <option value={30}>30 дней</option>
                    <option value={90}>90 дней</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <UsersIcon className="w-4 h-4" />
                        Уникальные посетители
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalUniqueVisitors}</div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <ClockIcon className="w-4 h-4" />
                        Ср. время просмотра
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatTime(avgViewTime)}</div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <EyeIcon className="w-4 h-4" />
                        Объектов с просмотрами
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{data.topObjects.length}</div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <ArrowPathIcon className="w-4 h-4" />
                        Ср. возврат
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {data.topObjects.length > 0
                            ? `${Math.round(data.topObjects.reduce((s, o) => s + o.returnVisitorRate, 0) / data.topObjects.length)}%`
                            : '—'}
                    </div>
                </div>
            </div>

            {/* Top Objects Table */}
            {data.topObjects.length > 0 && (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">🏆 Топ объектов по уникальным посетителям</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">#</th>
                                    <th className="px-4 py-3 text-left">Объект</th>
                                    <th className="px-4 py-3 text-right">Уник. посетители</th>
                                    <th className="px-4 py-3 text-right">Ср. время</th>
                                    <th className="px-4 py-3 text-right">Медиана</th>
                                    <th className="px-4 py-3 text-right" title="Процент посетителей, вернувшихся после 24ч">Возврат</th>
                                    <th className="px-4 py-3 text-right">Просмотры</th>
                                    <th className="px-4 py-3 text-right">Сохранения</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.topObjects.map((obj, i) => (
                                    <tr key={obj.objectId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                                        <td className="px-4 py-3 text-gray-700 font-medium truncate max-w-[200px]">
                                            {obj.objectId.slice(0, 20)}...
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{obj.uniqueVisitors}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">{formatTime(obj.avgViewTimeSec)}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{formatTime(obj.medianViewTimeSec)}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{obj.returnVisitorRate}%</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{obj.viewed}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{obj.saved}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {data.topObjects.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <EyeIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Пока нет данных о просмотрах объектов</p>
                </div>
            )}
        </div>
    );
};
