'use client';

import React, { useEffect, useState } from 'react';
import { ContactConfig, DEFAULT_CONTACTS, getTelegramLink, getWhatsAppLink } from '../../../lib/config/contacts';

interface HandoffOptionsProps {
    onSelect: (channel: 'whatsapp' | 'telegram' | 'phone') => void;
    onCancel: () => void;
}

export const HandoffOptions: React.FC<HandoffOptionsProps> = ({ onSelect, onCancel }) => {
    const [config, setConfig] = useState<ContactConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/contacts');
                if (res.ok) {
                    const data = await res.json();
                    setConfig(data);
                } else {
                    setConfig(DEFAULT_CONTACTS);
                }
            } catch (e) {
                console.error(e);
                setConfig(DEFAULT_CONTACTS);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleChannelClick = (channel: 'whatsapp' | 'telegram') => {
        onSelect(channel);
        if (!config) return;

        let url = '';
        if (channel === 'whatsapp' && config.whatsappNumber) {
            url = getWhatsAppLink(config.whatsappNumber);
        } else if (channel === 'telegram' && config.telegramUsername) {
            url = getTelegramLink(config.telegramUsername);
        }

        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-xs text-gray-400">Loading contacts...</div>;
    }

    const hasWhatsApp = !!config?.whatsappNumber;
    const hasTelegram = !!config?.telegramUsername;

    // If no channels configured, show fallback or nothing
    if (!hasWhatsApp && !hasTelegram) {
        return (
            <div className="flex flex-col gap-2 mt-4 w-full animate-fade-in-up">
                <div className="text-center text-xs text-gray-500 mb-2">
                    Контакты временно недоступны.
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

            <button
                onClick={onCancel}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 self-center"
            >
                Отмена
            </button>
        </div>
    );
};
