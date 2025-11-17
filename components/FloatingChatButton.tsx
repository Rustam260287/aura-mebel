import React, { memo } from 'react';
import { useAiChat } from '../contexts/AiChatContext';
import { XMarkIcon, RobotIcon } from './Icons';


export const FloatingChatButton: React.FC = memo(() => {
    const { isOpen, toggleChat } = useAiChat();

    return (
        <button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 bg-brand-brown text-white p-4 rounded-full shadow-lg hover:bg-brand-charcoal focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-brown transition-all duration-300 animate-scale-in z-40"
            title={isOpen ? "Закрыть чат" : "Открыть AI-помощника"}
            aria-label={isOpen ? "Закрыть чат" : "Открыть AI-помощника"}
        >
            {isOpen ? <XMarkIcon className="w-8 h-8"/> : <RobotIcon className="w-8 h-8" />}
        </button>
    );
});

FloatingChatButton.displayName = 'FloatingChatButton';
