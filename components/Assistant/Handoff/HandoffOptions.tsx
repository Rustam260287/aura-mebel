'use client';

import React from 'react';
import { getTelegramLink, getWhatsAppLink, getMaxLink } from '../../../lib/config/contacts';

export interface CuratorContacts {
    whatsapp?: string;
    telegram?: string;
    max?: string;
    phone?: string;
}

interface HandoffOptionsProps {
    contacts?: CuratorContacts;
    onSelect: (channel: 'whatsapp' | 'telegram' | 'max' | 'phone') => void;
    onCancel: () => void;
}

export const HandoffOptions: React.FC<HandoffOptionsProps> = ({ contacts, onSelect, onCancel }) => {

    const handleChannelClick = (channel: 'whatsapp' | 'telegram' | 'max') => {
        onSelect(channel);
        if (!contacts) return;

        let url = '';
        if (channel === 'whatsapp' && contacts.whatsapp) {
            url = getWhatsAppLink(contacts.whatsapp);
        } else if (channel === 'telegram' && contacts.telegram) {
            url = getTelegramLink(contacts.telegram);
        } else if (channel === 'max' && contacts.max) {
            url = contacts.max.startsWith('http') ? contacts.max : getMaxLink(contacts.max);
        }

        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const hasWhatsApp = !!contacts?.whatsapp;
    const hasTelegram = !!contacts?.telegram;
    const hasMax = !!contacts?.max;

    // If no channels configured, show disabled state
    if (!hasWhatsApp && !hasTelegram && !hasMax) {
        return (
            <div className="flex flex-col gap-2 mt-4 w-full animate-fade-in-up">
                <div className="text-center text-xs text-gray-500 mb-2">
                    Нет доступных способов связи.
                </div>
                <button
                    onClick={onCancel}
                    className="mt-2 text-xs text-brand-charcoal hover:underline self-center"
                >
                    Закрыть
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 mt-4 w-full animate-fade-in-up">
            {hasWhatsApp && (
                <button
                    onClick={() => handleChannelClick('whatsapp')}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-brand-terracotta transition-all flex items-center justify-between group"
                >
                    <span className="text-sm font-medium text-gray-800">WhatsApp</span>
                    <span className="text-xs text-gray-400 group-hover:text-brand-terracotta">→</span>
                </button>
            )}

            {hasTelegram && (
                <button
                    onClick={() => handleChannelClick('telegram')}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-brand-terracotta transition-all flex items-center justify-between group"
                >
                    <span className="text-sm font-medium text-gray-800">Telegram</span>
                    <span className="text-xs text-gray-400 group-hover:text-brand-terracotta">→</span>
                </button>
            )}

            {hasMax && (
                <button
                    onClick={() => handleChannelClick('max')}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-brand-terracotta transition-all flex items-center justify-between group"
                >
                    <span className="text-sm font-medium text-gray-800">MAX</span>
                    <span className="text-xs text-gray-400 group-hover:text-brand-terracotta">→</span>
                </button>
            )}

            <button
                onClick={onCancel}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 self-center"
            >
                Отмена
            </button>
        </div>
    );
};

