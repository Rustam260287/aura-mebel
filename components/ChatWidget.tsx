
"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PaperAirplaneIcon, XMarkIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
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
  isTyping?: boolean;
}

const STORAGE_KEY = 'labelcom_chat_history_v1';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Ref для хранения актуального состояния сообщений, чтобы избежать проблем с замыканиями
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
      messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
      if (!mounted) return;
      try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
              const loadedMessages = JSON.parse(saved);
              setMessages(loadedMessages);
              messagesRef.current = loadedMessages;
          } else {
              const initial = [{ role: 'assistant', content: 'Здравствуйте! Я ваш AI-дизайнер. Подскажите, что вы ищете? Вы можете прислать фото интерьера, и я подберу мебель.' } as Message];
              setMessages(initial);
              messagesRef.current = initial;
          }
      } catch (e) { console.error("Failed to load chat history", e); }
  }, [mounted]);

  useEffect(() => {
      if (!mounted) return;
      const completedMessages = messages.filter(m => !m.isTyping);
      if (completedMessages.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(completedMessages));
      }
  }, [messages, mounted]);

  const typeMessage = useCallback((fullText: string, products: ProductMini[] = []) => {
    let currentIndex = 0;
    
    setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '', 
        products: [], 
        timestamp: Date.now(),
        isTyping: true 
    }]);

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
        setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (!lastMsg || lastMsg.role !== 'assistant') return prev;

            const charsToAdd = Math.floor(Math.random() * 3) + 1;
            const nextIndex = Math.min(currentIndex + charsToAdd, fullText.length);
            const nextContent = fullText.substring(0, nextIndex);
            
            currentIndex = nextIndex;

            if (currentIndex >= fullText.length) {
                if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                return prev.map((msg, idx) => 
                    idx === prev.length - 1 
                        ? { ...msg, content: fullText, products: products, isTyping: false } 
                        : msg
                );
            }

            return prev.map((msg, idx) => 
                idx === prev.length - 1 ? { ...msg, content: nextContent } : msg
            );
        });
    }, 30);
  }, []);

  const sendToAi = useCallback(async (text: string, currentMessages: Message[], imageUrl?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: text,
            imageUrl: imageUrl, 
            history: currentMessages.slice(-6).map(m => ({ 
                role: m.role, 
                content: m.content.replace(/<[^>]*>?/gm, '') 
            }))
        }),
      });

      const data = await res.json();
      if (res.ok) {
        typeMessage(data.reply, data.products);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Простите, произошла ошибка.', timestamp: Date.now() }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  }, [typeMessage]);
  
  useEffect(() => {
    if (!mounted) return;
    const handleStartChat = (event: CustomEvent) => {
      const { imageUrl, text } = event.detail;
      
      // Проверка на дубликаты (если событие сработало дважды)
      const lastMsg = messagesRef.current[messagesRef.current.length - 1];
      if (lastMsg && lastMsg.role === 'user' && lastMsg.content.includes(imageUrl)) {
          return; 
      }

      const messageContent = `<img src="${imageUrl}" alt="Сгенерированный дизайн" class="rounded-lg mb-2 border border-gray-200" /><p>${text}</p>`;
      const userMsg: Message = { role: 'user', content: messageContent, timestamp: Date.now() };
      
      // Обновляем состояние и сразу получаем новый массив для отправки
      const newHistory = [...messagesRef.current, userMsg];
      setMessages(newHistory);
      setIsOpen(true);
      
      // Отправляем запрос
      sendToAi(text, newHistory, imageUrl);
    };

    window.addEventListener('startChatWithImage', handleStartChat as EventListener);
    return () => {
      window.removeEventListener('startChatWithImage', handleStartChat as EventListener);
    };
  }, [mounted, sendToAi]); // Зависимости обновлены

  useEffect(() => {
    if (!isOpen || !chatContainerRef.current) return;

    const container = chatContainerRef.current;
    const isTyping = messages.length > 0 && messages[messages.length - 1].isTyping;
    const behavior = isTyping ? 'auto' : 'smooth';
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;

    if (isAtBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior });
    }
  }, [messages, isOpen, previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleRemoveFile = () => {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = input.trim();
    if ((!userMessage && !selectedFile) || isLoading) return;
    
    setIsLoading(true);
    setInput('');
    
    let uploadedImageUrl = undefined;
    let finalMessageContent = userMessage;

    if (selectedFile) {
        try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(selectedFile);
            });
            const base64Image = await base64Promise;

            const uploadRes = await fetch('/api/ai/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image }),
            });
            
            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                uploadedImageUrl = uploadData.url;
                finalMessageContent = `<img src="${uploadedImageUrl}" alt="Загруженное фото" class="rounded-lg mb-2 border border-gray-200" /><p>${userMessage}</p>`;
            }
        } catch (err) {
            console.error("Upload failed", err);
        }
        handleRemoveFile();
    }

    const userMsg: Message = { role: 'user', content: finalMessageContent, timestamp: Date.now() };
    
    // Используем messagesRef для получения актуального состояния без дублирования в setMessages callback
    const newHistory = [...messagesRef.current, userMsg];
    setMessages(newHistory);
    
    sendToAi(userMessage || "Проанализируй это изображение", newHistory, uploadedImageUrl);
  };
  
  const handleProductClick = (id: string) => {
      setIsOpen(false);
      router.push(`/products/${id}`);
  };

  const clearHistory = () => {
      if (confirm('Очистить историю переписки?')) {
          const initialMsg: Message = { role: 'assistant', content: 'История очищена. Чем могу помочь?' };
          setMessages([initialMsg]);
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      }
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      <Transition show={isOpen} enter="transition ease-out duration-300" enterFrom="opacity-0 translate-y-10 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="transition ease-in duration-200" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-10 scale-95">
        <div className="bg-white w-80 md:w-96 max-h-[80vh] h-[600px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 mb-4 overflow-hidden ring-1 ring-black/5 origin-bottom-right">
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
                    <TrashIcon className="w-5 h-5" />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
          </div>
          
          <div 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#FBF9F4] min-h-0 custom-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`prose prose-sm max-w-[90%] p-4 rounded-2xl leading-relaxed shadow-sm relative transition-all ${
                  msg.role === 'user' 
                    ? 'bg-brand-brown text-white rounded-tr-sm prose-invert' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  {msg.isTyping && (
                      <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-brand-brown animate-pulse"></span>
                  )}
                </div>
                {!msg.isTyping && msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-full max-w-[95%] space-y-2 animate-fade-in-up">
                        <p className="text-xs text-gray-400 ml-1 font-medium uppercase tracking-wider flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3 text-brand-gold" />
                            Выбор AI
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin px-1">
                            {msg.products.map(prod => (
                                <div 
                                    key={prod.id} 
                                    onClick={() => handleProductClick(prod.id)}
                                    className="min-w-[140px] w-[140px] bg-white p-2 rounded-xl shadow-md border border-gray-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 snap-start flex-shrink-0 group"
                                >
                                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                                        <Image 
                                            src={prod.imageUrls?.[0] || '/placeholder.svg'} 
                                            alt={prod.name} 
                                            fill 
                                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                            sizes="140px"
                                        />
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-800 truncate leading-tight mb-1">{prod.name}</h4>
                                    <p className="text-xs text-brand-brown font-serif font-medium">{prod.price.toLocaleString()} ₽</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            ))}
            {isLoading && !messages[messages.length-1]?.isTyping && (
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

          {previewUrl && (
              <div className="px-3 pt-2 bg-white flex items-center border-t border-gray-50">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden border border-gray-200">
                      <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                      <button 
                          onClick={handleRemoveFile}
                          className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl hover:bg-black/70"
                      >
                          <XMarkIcon className="w-3 h-3" />
                      </button>
                  </div>
                  <span className="ml-2 text-xs text-gray-500">Изображение выбрано</span>
              </div>
          )}

          <form onSubmit={handleSubmit} className="p-2 bg-white border-t border-gray-100 flex gap-2 items-center flex-shrink-0">
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-gray-50 flex-shrink-0"
                title="Загрузить фото"
            >
                <PhotoIcon className="w-6 h-6" />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
            />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спросите совет..."
              className="flex-1 bg-gray-50 text-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-brown/20 transition-all placeholder-gray-400 border border-transparent focus:bg-white"
            />
            <button 
                type="submit" 
                disabled={(!input.trim() && !selectedFile) || isLoading || (messages.length > 0 && messages[messages.length-1].isTyping)}
                className="bg-brand-brown text-white p-2 rounded-full hover:bg-brand-brown/90 transition-transform active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0 flex items-center justify-center"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </Transition>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center transition-all duration-500 outline-none ${isOpen ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}
      >
        <div className="absolute inset-0 rounded-full bg-brand-brown/20 animate-ping duration-[3s]"></div>
        <div className="absolute inset-0 rounded-full bg-brand-gold/20 animate-pulse duration-[2s]"></div>
        
        <div className="relative w-16 h-16 bg-gradient-to-br from-brand-brown to-[#4A322C] rounded-full shadow-2xl flex items-center justify-center overflow-hidden border border-white/10 group-hover:scale-100 hover:scale-110 transition-transform duration-300">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-full pointer-events-none"></div>
            <SparklesIcon className="w-8 h-8 text-brand-gold animate-spin-slow drop-shadow-lg" />
        </div>

        <div className="absolute right-full mr-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/50 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 hidden md:block">
            <span className="text-brand-brown font-bold text-sm whitespace-nowrap">Спросить AI</span>
        </div>
      </button>
    </div>
  );
};
