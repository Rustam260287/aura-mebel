'use client';

import React from 'react';

interface HandoffOptionsProps {
    onSelect: (channel: 'whatsapp' | 'telegram' | 'phone') => void;
    onCancel: () => void;
}

export const HandoffOptions: React.FC<HandoffOptionsProps> = ({ onSelect, onCancel }) => {
    return (
        <div className="flex flex-col gap-2 mt-4 w-full animate-fade-in-up">
            <button
                onClick={() => onSelect('whatsapp')}
                className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-brand-terracotta transition-all flex items-center justify-between group"
            >
                <span className="text-sm font-medium text-gray-800">WhatsApp</span>
                <span className="text-xs text-gray-400 group-hover:text-brand-terracotta">→</span>
            </button>
            <button
                onClick={() => onSelect('telegram')}
                className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-brand-terracotta transition-all flex items-center justify-between group"
            >
                <span className="text-sm font-medium text-gray-800">Telegram</span>
                <span className="text-xs text-gray-400 group-hover:text-brand-terracotta">→</span>
            </button>

            <button
                onClick={onCancel}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 self-center"
            >
                Отмена
            </button>
        </div>
    );
};
