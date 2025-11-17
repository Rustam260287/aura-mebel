"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { sendChatMessage } from '../services/geminiService'; // ИСПРАВЛЕНО
import type { Product, ChatMessage } from '../types';

interface AiChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  isLoading: boolean;
  error: string | null;
}

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

const initialMessage: ChatMessage = {
    role: 'model',
    content: 'Здравствуйте! Я — ваш ИИ-помощник Aura. Чем могу помочь в выборе мебели?'
};

export const AiChatProvider: React.FC<{ children: ReactNode; allProducts: Product[]; onSessionEnd: (messages: ChatMessage[]) => void; }> = ({ children, allProducts, onSessionEnd }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const toggleChat = useCallback(() => {
        if (isOpen && messages.length > 1) { 
            onSessionEnd(messages);
        }
        setIsOpen(prev => !prev);
    }, [isOpen, messages, onSessionEnd]);

    const sendMessage = useCallback(async (message: string) => {
        if (!message.trim()) return;

        setIsLoading(true);
        setError(null);
        
        const newMessages: ChatMessage[] = [...messages, { role: 'user', content: message }];
        setMessages(newMessages);
        
        try {
            const reply = await sendChatMessage(newMessages, allProducts);
            setMessages(prev => [...prev, { role: 'model', content: reply }]);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Произошла ошибка. Попробуйте еще раз.';
            setError(errorMessage);
            setMessages(prev => [...prev, { role: 'model', content: `К сожалению, произошла ошибка: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, allProducts]);

    const contextValue = useMemo(() => ({
        isOpen,
        toggleChat,
        messages,
        sendMessage,
        isLoading,
        error
    }), [isOpen, toggleChat, messages, sendMessage, isLoading, error]);

    return (
        <AiChatContext.Provider value={contextValue}>
            {children}
        </AiChatContext.Provider>
    );
};

export const useAiChat = () => {
    const context = useContext(AiChatContext);
    if (context === undefined) {
        throw new Error('useAiChat must be used within an AiChatProvider');
    }
    return context;
};
