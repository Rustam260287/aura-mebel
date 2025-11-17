import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useAiChat } from '../contexts/AiChatContext';
import { PaperAirplaneIcon, XMarkIcon, SparklesIcon } from './Icons';
import { Button } from './Button';

const parseMarkdown = (text: string) => {
    let html = text
        .replace(/</g, '&lt;').replace(/>/g, '&gt;') // Basic XSS protection
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

    const lines = html.split('\n');
    let inList = false;
    html = lines.map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            const listItem = `<li>${trimmedLine.substring(2)}</li>`;
            if (!inList) {
                inList = true;
                return `<ul>${listItem}`;
            }
            return listItem;
        } else {
            if (inList) {
                inList = false;
                return `</ul>${trimmedLine ? `<p>${trimmedLine}</p>` : ''}`;
            }
            return trimmedLine ? `<p>${trimmedLine}</p>` : '';
        }
    }).join('');

    if (inList) {
        html += '</ul>';
    }

    return html;
};

export const AiChatbot: React.FC = memo(() => {
    const { isOpen, toggleChat, messages, sendMessage, isLoading } = useAiChat();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleSend = useCallback(() => {
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    }, [input, sendMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);
    
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed bottom-24 right-6 w-[calc(100%-3rem)] max-w-md h-[70vh] max-h-[600px] bg-brand-cream rounded-2xl shadow-2xl flex flex-col z-40 animate-subtle-fade-in"
            aria-modal="true"
            role="dialog"
        >
            <header className="flex items-center justify-between p-4 border-b border-brand-cream-dark">
                <div className="flex items-center gap-3">
                    <SparklesIcon className="w-6 h-6 text-brand-terracotta" />
                    <h2 className="text-lg font-serif text-brand-brown">Aura AI-помощник</h2>
                </div>
                <Button variant="ghost" onClick={toggleChat} className="p-2 -mr-2" aria-label="Закрыть чат">
                    <XMarkIcon className="w-6 h-6"/>
                </Button>
            </header>

            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            msg.role === 'user' 
                                ? 'bg-brand-terracotta text-white rounded-br-lg' 
                                : 'bg-white text-brand-charcoal rounded-bl-lg shadow-sm'
                        }`}>
                            <div 
                                className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2"
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} 
                            />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-white text-brand-charcoal rounded-bl-lg shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-brand-cream-dark bg-white/50">
                <div className="flex items-end gap-2 bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-brand-brown p-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Спросите что-нибудь..."
                        className="flex-grow bg-transparent border-none focus:ring-0 resize-none max-h-32 text-brand-charcoal placeholder:text-gray-500"
                        rows={1}
                        disabled={isLoading}
                    />
                    <Button 
                        size="sm" 
                        className="p-2.5 rounded-md aspect-square" 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        aria-label="Отправить сообщение"
                    >
                        <PaperAirplaneIcon className="w-5 h-5"/>
                    </Button>
                </div>
            </div>
        </div>
    );
});

AiChatbot.displayName = 'AiChatbot';
