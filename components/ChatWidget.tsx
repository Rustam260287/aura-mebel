
"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PaperAirplaneIcon, XMarkIcon, PhotoIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
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
  customOffer?: boolean;
  hideCustomCta?: boolean;
  quickReplies?: string[];
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

  // Ref для хранения актуального состояния сообщений
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
              const initial = [{ role: 'assistant', content: 'Здравствуйте! Я ваш AI Ассистент Labelcom. Пришлите фото интерьера или опишите задачу — помогу подобрать мебель или оформить изготовление на заказ.', customOffer: false } as Message];
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

  const typeMessage = useCallback((fullText: string, products: ProductMini[] = [], customOffer = false, hideCustomCta = false, quickReplies: string[] = []) => {
    let currentIndex = 0;
    
    setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '', 
        products: [], 
        customOffer,
        hideCustomCta,
        quickReplies: [],
        timestamp: Date.now(),
        isTyping: true 
    }]);

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
        setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (!lastMsg || lastMsg.role !== 'assistant') return prev;

            const charsToAdd = Math.floor(Math.random() * 4) + 2; 
            const nextIndex = Math.min(currentIndex + charsToAdd, fullText.length);
            const nextContent = fullText.substring(0, nextIndex);
            
            currentIndex = nextIndex;

            if (currentIndex >= fullText.length) {
                if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                return prev.map((msg, idx) => 
                    idx === prev.length - 1 
                        ? { ...msg, content: fullText, products: products, customOffer, hideCustomCta, quickReplies, isTyping: false } 
                        : msg
                );
            }

            return prev.map((msg, idx) => 
                idx === prev.length - 1 ? { ...msg, content: nextContent } : msg
            );
        });
    }, 20); 
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
        typeMessage(data.reply, data.products, data.offerCustom, data.hideCustomCta, data.quickReplies);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Простите, произошла ошибка.', timestamp: Date.now() }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  }, [typeMessage]);

  const sendQuickPrompt = useCallback((text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    const newHistory = [...messagesRef.current, userMsg];
    setMessages(newHistory);
    // Remove quick replies from previous messages
    setMessages(prev => prev.map(m => ({...m, quickReplies: undefined}))); 
    
    setIsOpen(true);
    sendToAi(text, newHistory);
  }, [isLoading, sendToAi]);
  
  useEffect(() => {
    if (!mounted) return;
    const handleStartChat = (event: CustomEvent) => {
      const { imageUrl, text } = event.detail;
      
      const lastMsg = messagesRef.current[messagesRef.current.length - 1];
      if (lastMsg && lastMsg.role === 'user' && lastMsg.content.includes(imageUrl)) {
          return; 
      }

      const messageContent = `<img src="${imageUrl}" alt="Сгенерированный дизайн" class="rounded-lg mb-2 border border-gray-200" /><p>${text}</p>`;
      const userMsg: Message = { role: 'user', content: messageContent, timestamp: Date.now() };
      
      const newHistory = [...messagesRef.current, userMsg];
      setMessages(newHistory);
      setIsOpen(true);
      
      sendToAi(text, newHistory, imageUrl);
    };

    window.addEventListener('startChatWithImage', handleStartChat as EventListener);
    return () => {
      window.removeEventListener('startChatWithImage', handleStartChat as EventListener);
    };
  }, [mounted, sendToAi]);

  useEffect(() => {
    if (!mounted) return;
    const handleOpenChat = (event: CustomEvent<{ text?: string }>) => {
      const text = event.detail?.text || 'Здравствуйте! Нужна помощь экспертов.';
      const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
      const newHistory = [...messagesRef.current, userMsg];
      setMessages(newHistory);
      setIsOpen(true);
      sendToAi(text, newHistory);
    };

    window.addEventListener('openStylistChat', handleOpenChat as EventListener);
    return () => window.removeEventListener('openStylistChat', handleOpenChat as EventListener);
  }, [mounted, sendToAi]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!chatContainerRef.current) return;
    requestAnimationFrame(() => {
      const node = chatContainerRef.current;
      if (!node) return;
      node.scrollTo({ top: node.scrollHeight, behavior });
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => scrollToBottom('auto'), 0);
    return () => clearTimeout(timer);
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (!isOpen || !chatContainerRef.current) return;
    const container = chatContainerRef.current;
    const isTyping = messages.length > 0 && messages[messages.length - 1].isTyping;
    const behavior = isTyping ? 'auto' : 'smooth';
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 250; 

    if (isAtBottom) {
        scrollToBottom(behavior);
    }
  }, [messages, isOpen, previewUrl, scrollToBottom]);

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
    
    // Clear previous quick replies
    setMessages(prev => prev.map(m => ({...m, quickReplies: undefined})));

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
    const newHistory = [...messagesRef.current, userMsg];
    setMessages(newHistory);
    
    sendToAi(userMessage || "Проанализируй это изображение", newHistory, uploadedImageUrl);
  };

  const handleProductClick = (id: string) => {
      setIsOpen(false);
      router.push(`/products/${id}`);
  };

  const handleTryOn = (e: React.MouseEvent, product: ProductMini) => {
    e.stopPropagation();
    setIsOpen(false);
    
    // Создаем событие для открытия модалки примерки
    const event = new CustomEvent('openFurnitureTryOn', {
        detail: {
            productImage: product.imageUrls?.[0],
            productName: product.name
        }
    });
    window.dispatchEvent(event);
  };

  const clearHistory = () => {
      if (confirm('Начать новую консультацию?')) {
          const initialMsg: Message = { role: 'assistant', content: 'Новый чат начат. Я слушаю вас.', customOffer: false };
          setMessages([initialMsg]);
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      }
  };


  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col items-end">
      <Transition show={isOpen} enter="transition ease-out duration-300" enterFrom="opacity-0 translate-y-10 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="transition ease-in duration-200" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-10 scale-95">
        <div className="bg-white w-[calc(100vw-2rem)] md:w-96 h-[75vh] max-h-[calc(100vh-80px)] md:h-[680px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 mb-4 overflow-hidden ring-1 ring-black/5 origin-bottom-right font-sans">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-charcoal to-brand-brown/90 text-white p-4 flex justify-between items-center shadow-md z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                    <SparklesIcon className="w-5 h-5 text-brand-terracotta animate-pulse" />
                </div>
                <div>
                    <h3 className="font-serif font-bold tracking-wide text-base leading-tight">AI Ассистент</h3>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium">Labelcom Intelligence</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={clearHistory} className="hover:bg-white/20 p-2 rounded-full transition-colors text-white/70 hover:text-white" title="Очистить историю">
                    <TrashIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors text-white/90 hover:text-white">
                  <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
          </div>
          
          {/* Chat Area */}
          <div 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto p-4 space-y-6 bg-brand-cream-dark/30 min-h-0 custom-scrollbar scroll-smooth"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                
                {/* Message Bubble */}
                <div className={`prose prose-sm max-w-[90%] p-4 rounded-2xl leading-relaxed shadow-sm relative transition-all ${
                  msg.role === 'user' 
                    ? 'bg-brand-charcoal text-white rounded-tr-sm prose-invert' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  {msg.isTyping && (
                      <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-brand-terracotta animate-pulse"></span>
                  )}
                </div>

                {/* Recommended Products Carousel */}
                {!msg.isTyping && msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-full max-w-[95%] space-y-2 animate-fade-in-up">
                        <p className="text-[10px] text-brand-charcoal/40 ml-1 font-bold uppercase tracking-widest flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3 text-brand-terracotta" />
                            Рекомендации
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-hide px-1">
                            {msg.products.map(prod => (
                                <div 
                                    key={prod.id} 
                                    onClick={() => handleProductClick(prod.id)}
                                    className="min-w-[150px] w-[150px] bg-white p-2 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 snap-start flex-shrink-0 group relative"
                                >
                                    <div className="relative aspect-[4/3] rounded overflow-hidden bg-brand-cream-dark/50 mb-2">
                                        <Image 
                                            src={prod.imageUrls?.[0] || '/placeholder.svg'} 
                                            alt={prod.name} 
                                            fill 
                                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                            sizes="150px"
                                        />
                                        <button 
                                            onClick={(e) => handleTryOn(e, prod)}
                                            className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-brand-terracotta hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                            title="Примерить в комнате"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-800 truncate leading-tight mb-1">{prod.name}</h4>
                                    <p className="text-xs text-brand-terracotta font-serif font-bold">{prod.price.toLocaleString()} ₽</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom Offer Box */}
                {!msg.isTyping && msg.customOffer && (
                  <div className="mt-3 w-full max-w-[95%] animate-fade-in-up">
                    <div className="bg-brand-cream text-brand-charcoal rounded-xl p-4 border border-brand-brown/10 shadow-sm space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-terracotta/10 rounded-bl-full -mr-8 -mt-8"></div>
                      
                      <div className="flex items-center gap-2 text-sm font-bold text-brand-brown z-10 relative">
                        <SparklesIcon className="w-4 h-4 text-brand-terracotta" /> Индивидуальный заказ
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed z-10 relative">
                        Не нашли идеальный вариант? Наши мастера изготовят мебель любой сложности по вашему фото или эскизу.
                      </p>
                      {!msg.hideCustomCta && (
                        <button
                          type="button"
                          onClick={() => sendQuickPrompt('Хочу рассчитать изготовление по фото. Что для этого нужно?')}
                          className="w-full bg-white border border-brand-brown/20 text-brand-brown hover:bg-brand-brown hover:text-white text-xs font-bold py-2.5 rounded-lg transition-all duration-300 z-10 relative"
                        >
                          Рассчитать стоимость
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Replies */}
                {!msg.isTyping && msg.quickReplies && msg.quickReplies.length > 0 && (
                   <div className="mt-3 flex flex-wrap gap-2 w-full animate-fade-in-up">
                      {msg.quickReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => sendQuickPrompt(reply)}
                          className="bg-white border border-brand-brown/10 text-brand-charcoal/70 text-[10px] uppercase tracking-wide font-bold px-3 py-2 rounded-full hover:bg-brand-terracotta hover:text-white hover:border-brand-terracotta transition-colors shadow-sm"
                        >
                          {reply}
                        </button>
                      ))}
                   </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && !messages[messages.length-1]?.isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-brand-terracotta/60 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-brand-terracotta/60 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-brand-terracotta/60 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview */}
          {previewUrl && (
              <div className="px-4 py-3 bg-white flex items-center border-t border-gray-100">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shadow-sm group">
                      <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button 
                          onClick={handleRemoveFile}
                          className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <XMarkIcon className="w-3 h-3" />
                      </button>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-700">Изображение добавлено</p>
                    <p className="text-[10px] text-gray-400">Будет отправлено вместе с сообщением</p>
                  </div>
              </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center flex-shrink-0"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-brand-terracotta hover:bg-brand-brown/5 transition-all p-2.5 rounded-full flex-shrink-0"
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
              placeholder="Спросите AI..."
              className="flex-1 min-w-0 bg-gray-50 text-gray-800 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-terracotta focus:bg-white transition-all placeholder-gray-400 border border-transparent"
            />
            
            <button 
              type="submit" 
              disabled={(!input.trim() && !selectedFile) || isLoading || (messages.length > 0 && messages[messages.length-1].isTyping)}
              className="bg-brand-charcoal text-white p-2.5 rounded-full hover:bg-brand-brown transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0 flex items-center justify-center"
            >
              <PaperAirplaneIcon className="w-5 h-5 -ml-0.5 mt-0.5 transform -rotate-45" />
            </button>
          </form>
        </div>
      </Transition>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center transition-all duration-500 outline-none z-50 ${isOpen ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}
      >
        <div className="absolute inset-0 rounded-full bg-brand-terracotta/20 animate-ping duration-[3s]"></div>
        <div className="absolute inset-0 rounded-full bg-brand-brown/10 animate-pulse duration-[2s]"></div>
        
        <div className="relative w-14 h-14 md:w-16 md:h-16 bg-brand-charcoal rounded-full shadow-2xl flex items-center justify-center overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-300">
            <SparklesIcon className="w-7 h-7 md:w-8 md:h-8 text-brand-terracotta animate-pulse drop-shadow-lg" />
        </div>

        <div className="absolute right-full mr-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 hidden md:block">
            <span className="text-brand-charcoal font-bold text-sm whitespace-nowrap">AI Ассистент</span>
        </div>
      </button>
    </div>
  );
};
