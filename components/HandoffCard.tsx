'use client';

import React from 'react';

export type HandoffStatus = 'saved' | 'sent' | 'opened' | 'discussed';

interface HandoffCardProps {
    id: string;
    objectId: string;
    objectName?: string;
    snapshotUrl?: string | null;
    status: HandoffStatus;
    createdAt?: string | null;
    onClick?: (handoffId: string) => void;
}

const STATUS_LABELS: Record<HandoffStatus, string> = {
    saved: 'Сохранено',
    sent: 'Отправлено',
    opened: 'Просмотрено',
    discussed: 'Обсуждено',
};

const STATUS_COLORS: Record<HandoffStatus, string> = {
    saved: 'bg-stone-200 text-stone-600',
    sent: 'bg-blue-100 text-blue-600',
    opened: 'bg-amber-100 text-amber-700',
    discussed: 'bg-green-100 text-green-700',
};

export const HandoffCard: React.FC<HandoffCardProps> = ({
    id,
    objectName,
    snapshotUrl,
    status,
    createdAt,
    onClick,
}) => {
    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
        })
        : '';

    return (
        <button
            onClick={() => onClick?.(id)}
            className="group relative bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-lg transition-shadow text-left w-full"
        >
            {/* Snapshot */}
            <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
                {snapshotUrl ? (
                    <img
                        src={snapshotUrl}
                        alt="AR Scene"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-gray text-sm">
                        AR-сцена
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-soft-black truncate">
                        {objectName || 'Вариант мебели'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
                        {STATUS_LABELS[status]}
                    </span>
                </div>
                {formattedDate && (
                    <span className="text-xs text-muted-gray">{formattedDate}</span>
                )}
            </div>
        </button>
    );
};
