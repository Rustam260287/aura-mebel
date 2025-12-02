"use client";
import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { Transition } from '@headlessui/react';
import Image from 'next/image';
import { useRouter } from 'next/router';

interface ProductMini {
    id: string;
    name: string;
    price: number;
    imageUrls?: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: ProductMini[];
  timestamp?: number;
}

const STORAGE_KEY = 'labelcom_chat_history_v1';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load history on mount
  useEffect(() => {
      try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
              setMessages(JSON.parse(saved));
          } else {
              setMessages([
                  { role: 'assistant', content: 'Здравствуйте! Я ваш AI-дизайнер. Подскажите, что вы ищете?' }
              ]);
          }
      } catch (e) {
          console.error("Failed to load chat history", e);
      }
  }, []);

  // Save history on change
  useEffect(() => {
      if (messages.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
        setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: Date.now() } as Message];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: userMessage,
            history: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })) 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: data.reply,
            products: data.products,
            timestamp: Date.now()
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Простите, я устал. Попробуйте позже.', timestamp: Date.now() }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (id: string) => {
      setIsOpen(false);
      router.push(`/products/${id}`);
  };

  const clearHistory = () => {
      if (confirm('Очистить историю переписки?')) {
          const initialMsg: Message = { role: 'assistant', content: 'История очищена. Чем могу помочь?' };
          setMessages([initialMsg]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([initialMsg]));
      }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      
      {/* Chat Window */}
      <Transition
        show={isOpen}
        enter="transition ease-out duration-300"
        enterFrom="opacity-0 translate-y-10 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-10 scale-95"
      >
        <div className="bg-white w-80 md:w-96 max-h-[80vh] h-[600px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 mb-4 overflow-hidden ring-1 ring-black/5 origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-brown to-[#7D5A50] text-white p-4 flex justify-between items-center shadow-md z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-sm">
                    <SparklesIcon className="w-5 h-5 text-brand-gold animate-pulse" />
                </div>
                <div>
                    <h3 className="font-serif font-bold tracking-wide text-lg">AI Стилист</h3>
                    <p className="text-[10px] text-white/80 uppercase tracking-widest">Labelcom Intelligence</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={clearHistory} className="hover:bg-white/20 p-1.5 rounded-full transition-colors text-white/70 hover:text-white" title="Очистить историю">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#FBF9F4] min-h-0">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Bubble */}
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-brand-brown text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>

                {/* Recommended Products */}
                {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-full max-w-[90%] space-y-2">
                        <p className="text-xs text-gray-400 ml-1 font-medium uppercase tracking-wider flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3 text-brand-gold" />
                            Выбор AI
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-thin">
                            {msg.products.map(prod => (
                                <div 
                                    key={prod.id} 
                                    onClick={() => handleProductClick(prod.id)}
                                    className="min-w-[140px] bg-white p-2 rounded-xl shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow snap-start flex-shrink-0"
                                >
                                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                                        <Image 
                                            src={prod.imageUrls?.[0] || '/placeholder.svg'} 
                                            alt={prod.name} 
                                            fill 
                                            className="object-cover" 
                                            sizes="140px"
                                        />
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-800 truncate">{prod.name}</h4>
                                    <p className="text-xs text-brand-brown font-serif">{prod.price.toLocaleString()} ₽</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-brand-brown/60 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-brand-brown/60 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-brand-brown/60 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите совет..."
              className="flex-1 bg-gray-50 text-gray-800 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-brown/20 transition-all placeholder-gray-400 border border-transparent focus:bg-white"
            />
            <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-brand-brown text-white p-3 rounded-full hover:bg-brand-brown/90 transition-transform active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </Transition>

      {/* LUXURY AI BUTTON (The Orb) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center transition-all duration-500 outline-none ${isOpen ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}
      >
        {/* Pulsing Rings */}
        <div className="absolute inset-0 rounded-full bg-brand-brown/20 animate-ping duration-[3s]"></div>
        <div className="absolute inset-0 rounded-full bg-brand-gold/20 animate-pulse duration-[2s]"></div>
        
        {/* The Orb Content */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-brand-brown to-[#4A322C] rounded-full shadow-2xl flex items-center justify-center overflow-hidden border border-white/10 group-hover:scale-110 transition-transform duration-300">
            {/* Inner Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-full pointer-events-none"></div>
            
            {/* Icon */}
            <SparklesIcon className="w-8 h-8 text-brand-gold animate-spin-slow drop-shadow-lg" />
        </div>

        {/* Text Label (appears on hover) */}
        <div className="absolute right-full mr-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 hidden md:block">
            <span className="text-brand-brown font-bold text-sm whitespace-nowrap">Спросить AI</span>
        </div>
        
        {/* Notification Dot */}
        <span className="absolute top-0 right-0 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-gold border-2 border-white"></span>
        </span>
      </button>
    </div>
  );
};
