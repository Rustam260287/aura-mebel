"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
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

    const aiRef = useRef<GoogleGenAI | null>(null);
    const chatRef = useRef<Chat | null>(null);
    
    const systemInstruction = useMemo(() => {
        const productListForContext = allProducts.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, description: p.description })).slice(0, 30);
        return `Вы — 'Aura Assist', дружелюбный и знающий ИИ-ассистент... (ваш системный промпт без изменений)`;
    }, [allProducts]);

    useEffect(() => {
        if (!aiRef.current) {
            const apiKey = process.env.NEXT_PUBLIC_API_KEY;
            if (!apiKey) {
                console.error("NEXT_PUBLIC_API_KEY environment variable not set. Using a placeholder.");
                aiRef.current = new GoogleGenAI({ apiKey: "MISSING_API_KEY" });
            } else {
                aiRef.current = new GoogleGenAI({ apiKey });
            }
        }
        
        if (!chatRef.current && aiRef.current) {
            chatRef.current = aiRef.current.chats.create({
                model: 'gemini-2.5-pro',
                config: {
                    systemInstruction: systemInstruction,
                }
            });
        }
    }, [systemInstruction]);
    
    const toggleChat = useCallback(() => {
        if (isOpen && messages.length > 1) { 
            onSessionEnd(messages);
        }
        setIsOpen(prev => !prev);
    }, [isOpen, messages, onSessionEnd]);

    const sendMessage = useCallback(async (message: string) => {
        if (!message.trim() || !chatRef.current) return;

        setIsLoading(true);
        setError(null);

        const userMessage: ChatMessage = { role: 'user', content: message };
        setMessages(prev => [...prev, userMessage]);
        
        try {
            const stream = await chatRef.current.sendMessageStream({ message });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = modelResponse;
                    return newMessages;
                });
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Произошла ошибка. Попробуйте еще раз.';
            setError(errorMessage);
            setMessages(prev => [...prev, { role: 'model', content: `К сожалению, произошла ошибка: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
