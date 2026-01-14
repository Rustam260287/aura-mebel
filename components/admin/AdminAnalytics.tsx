import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChartBarIcon, EyeIcon, ShareIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ShareStats {
    totalShares: number;
    totalViews: number;
    topObjects: Array<{
        objectId: string;
        shareCount: number;
        viewCount: number;
    }>;
    recentShares: Array<{
        id: string;
        objectId: string;
        createdAt: string;
        viewCount: number;
    }>;
}

export const AdminAnalytics: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<ShareStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch('/api/admin/analytics/shares', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setStats(data);
            } catch (e) {
                setError('Не удалось загрузить статистику');
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [user]);

    if (isLoading) {
        return <div className="p-6 text-gray-500">Загрузка статистики...</div>;
    }

    if (error) {
        return <div className="p-6 text-red-500">{error}</div>;
    }

    if (!stats) return null;

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">📊 Share Analytics</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <ShareIcon className="w-4 h-4" />
                        Всего shares
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalShares}</div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <EyeIcon className="w-4 h-4" />
                        Всего просмотров
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <ChartBarIcon className="w-4 h-4" />
                        Объектов с shares
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.topObjects.length}</div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <EyeIcon className="w-4 h-4" />
                        Ср. просмотров
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.totalShares > 0 ? (stats.totalViews / stats.totalShares).toFixed(1) : '0'}
                    </div>
                </div>
            </div>

            {/* Top Objects */}
            {stats.topObjects.length > 0 && (
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">🏆 Топ объектов по shares</h3>
                    <div className="space-y-3">
                        {stats.topObjects.map((obj, i) => (
                            <div key={obj.objectId} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-400 w-5">{i + 1}</span>
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                        {obj.objectId}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-500">{obj.shareCount} shares</span>
                                    <span className="text-gray-400">{obj.viewCount} views</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Shares */}
            {stats.recentShares.length > 0 && (
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">🕐 Последние shares</h3>
                    <div className="space-y-2">
                        {stats.recentShares.map(share => (
                            <div key={share.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <ClockIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{formatDate(share.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-500 truncate max-w-[150px]">{share.objectId}</span>
                                    <span className="text-gray-400">{share.viewCount} views</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {stats.totalShares === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <ShareIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Пока нет share-ссылок</p>
                </div>
            )}
        </div>
    );
};
