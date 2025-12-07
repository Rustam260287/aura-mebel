
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
      const text = event.detail?.text || 'Здравствуйте! Нужна помощь стилиста.';
      const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
      const newHistory = [...messagesRef.current, userMsg];
      setMessages(newHistory);
      setIsOpen(true);
      sendToAi(text, newHistory);
    };

    window.addEventListener('openStylistChat', handleOpenChat as EventListener);
    return () => window.removeEventListener('openStylistChat', handleOpenChat as EventListener);
  }, [mounted, sendToAi]);

  // ИСПРАВЛЕНО: Два отдельных useEffect для прокрутки
  useEffect(() => {
    if (isOpen) {
      // Мгновенная прокрутка в самый низ при открытии чата
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50); // Небольшая задержка для рендера
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !chatContainerRef.current) return;
    const container = chatContainerRef.current;
    // Плавная прокрутка при новых сообщениях, если пользователь уже внизу
    if (container.scrollHeight - container.scrollTop <= container.clientHeight + 200) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);


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
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col items-end">
      <Transition show={isOpen} enter="transition ease-out duration-300" enterFrom="opacity-0 translate-y-10 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="transition ease-in duration-200" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-10 scale-95">
        <div className="bg-white w-80 md:w-96 h-[75vh] max-h-[90vh] md:h-[640px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 mb-4 overflow-hidden ring-1 ring-black/5 origin-bottom-right">
          <div className="bg-gradient-to-r from-brand-brown to-[#7D5A50] text-white p-4 flex justify-between items-center shadow-md z-10 flex-shrink-0">
            {/* ... (Header) ... */}
          </div>
          
          <div 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#FBF9F4] min-h-0 custom-scrollbar"
          >
            {/* ... (Сообщения) ... */}
            <div ref={messagesEndRef} />
          </div>

          {/* ... (Превью и форма) ... */}
          <form
            onSubmit={handleSubmit}
            className="p-2 bg-white border-t border-gray-100 flex gap-2 items-center flex-shrink-0"
            // ИСПРАВЛЕНО: Отступ для мобильных
            style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }} 
          >
            {/* ... (Содержимое формы) ... */}
          </form>
        </div>
      </Transition>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center transition-all duration-500 outline-none ${isOpen ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}
      >
        {/* ... (Содержимое кнопки открытия) ... */}
      </button>
    </div>
  );
};
