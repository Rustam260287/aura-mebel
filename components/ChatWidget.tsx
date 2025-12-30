"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Transition } from '@headlessui/react';
import { PhotoIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useExperience } from '../contexts/ExperienceContext';
import { useSaved } from '../contexts/SavedContext';
import { trackJourneyEvent } from '../lib/journey/client';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

const PRICING_HANDOFF_REPLY =
  'Я передал ваш вопрос менеджеру.\nОн уже видит, какой объект вы смотрели.';

function getHandoffReason(input: string): 'pricing' | 'purchase' | null {
  const t = (input || '').toLowerCase();
  if (!t.trim()) return null;
  return (
    /\bprice\b/.test(t) ||
    /\bcost\b/.test(t) ||
    /сколько\s+стоит/.test(t) ||
    /цена\b/.test(t) ||
    /стоимост/.test(t) ||
    /прайс/.test(t) ||
    /доставк/.test(t) ||
    /скидк/.test(t) ||
    /оплат/.test(t)
      ? 'pricing'
      : /как\s+заказат/.test(t) || /заказат/.test(t) || /купит/.test(t) || /покупк/.test(t) || /оформит/.test(t) || /\border\b/.test(t) || /\bbuy\b/.test(t)
        ? 'purchase'
        : null
  );
}

export const ChatWidget: React.FC = () => {
  const { state, data, emitEvent } = useExperience();
  const { isSaved, addToSaved } = useSaved();

  const isBlocked = state === 'THREE_D_ACTIVE' || state === 'AR_ACTIVE';
  const isActive = state === 'ASSISTANT_OPEN';
  const isVisible = state === 'ASSISTANT_OPEN' || state === 'HANDOFF_REQUESTED';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [handoffLocked, setHandoffLocked] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const [handoffLinks, setHandoffLinks] = useState<{ whatsapp?: string; telegram?: string; email?: string } | null>(null);

  const close = useCallback(() => {
    conversationIdRef.current += 1;
    try {
      abortRef.current?.abort();
    } catch {}
    abortRef.current = null;
    setHandoffLocked(false);
    setIsLoading(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setInput('');
    setMessages([]);
    emitEvent({ type: 'CLOSE_ASSISTANT' });
  }, [emitEvent]);

  useEffect(() => {
    if (isBlocked && isVisible) {
      close();
    }
  }, [close, isBlocked, isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    conversationIdRef.current += 1;
    abortRef.current = null;
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setHandoffLocked(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setHandoffLinks(null);
  }, [isVisible]);

  const objectContext = useMemo(
    () => ({
      id: data.activeObjectId || '',
      name: data.activeObjectName || '',
      objectType: data.activeObjectType || '',
    }),
    [data.activeObjectId, data.activeObjectName, data.activeObjectType],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const node = chatContainerRef.current;
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollTo({ top: node.scrollHeight, behavior });
    });
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    scrollToBottom('auto');
  }, [isVisible, messages.length, scrollToBottom]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const appendMessage = useCallback((msg: Omit<Message, 'timestamp'>) => {
    setMessages((prev) => [...prev, { ...msg, timestamp: Date.now() }]);
  }, []);

  const requestHandoff = useCallback(
    (reason: 'pricing' | 'purchase' | 'contact', lastUserMessage: string) => {
      appendMessage({ role: 'assistant', content: PRICING_HANDOFF_REPLY });
      setHandoffLocked(true);
      emitEvent({ type: 'HANDOFF_REQUESTED', reason, lastUserMessage });
    },
    [appendMessage, emitEvent],
  );

  useEffect(() => {
    if (!isVisible) return;
    if (state !== 'HANDOFF_REQUESTED') return;
    let isActive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/handoff');
        const json = await res.json().catch(() => null);
        if (!res.ok || !json) return;
        const whatsapp =
          typeof json.whatsapp === 'string' && json.whatsapp.trim() ? json.whatsapp.trim() : undefined;
        const telegram =
          typeof json.telegram === 'string' && json.telegram.trim() ? json.telegram.trim() : undefined;
        const email = typeof json.email === 'string' && json.email.trim() ? json.email.trim() : undefined;
        if (isActive) setHandoffLinks({ whatsapp, telegram, email });
      } catch {
        // ignore
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [isVisible, state]);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const reader = new FileReader();
    const base64Image = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const uploadRes = await fetch('/api/chat/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!uploadRes.ok) return null;
    const payload = await uploadRes.json().catch(() => null);
    return typeof payload?.url === 'string' ? payload.url : null;
  }, []);

  const sendToAi = useCallback(
    async (text: string, imageUrl?: string) => {
      const conversationId = conversationIdRef.current;
      const safeHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: (m.content || '').replace(/<[^>]*>?/gm, ''),
      }));

      try {
        abortRef.current?.abort();
      } catch {}
      const controller = new AbortController();
      abortRef.current = controller;

      let res: Response;
      try {
        res = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            history: safeHistory,
            imageUrl,
            objectContext,
          }),
        });
      } catch (err) {
        if (conversationId !== conversationIdRef.current) return;
        if (state !== 'ASSISTANT_OPEN') return;
        // Abort is an expected path when user enters 3D/AR or closes the assistant.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        return;
      }

      const data = await res.json().catch(() => null);
      if (conversationId !== conversationIdRef.current) return;
      if (state !== 'ASSISTANT_OPEN') return;
      if (!res.ok) {
        appendMessage({
          role: 'assistant',
          content: 'Сейчас не получилось ответить. Можно попробовать ещё раз чуть позже.',
        });
        return;
      }

      if (data?.handoffRequired) {
        const reason = getHandoffReason(text) || 'pricing';
        requestHandoff(reason, text);
        return;
      }

      const reply = typeof data?.reply === 'string' ? data.reply : '';
      if (!reply.trim()) return;
      appendMessage({ role: 'assistant', content: reply });
    },
    [appendMessage, messages, objectContext, requestHandoff, state],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isActive || isBlocked || handoffLocked || isLoading) return;

      const text = input.trim();
      if (!text && !selectedFile) return;

      setIsLoading(true);
      setInput('');

      let imageUrl: string | undefined;
      if (selectedFile) {
        try {
          const url = await uploadImage(selectedFile);
          if (url) {
            imageUrl = url;
            appendMessage({
              role: 'user',
              content: `<img src="${url}" alt="Фото" class="rounded-lg mb-2 border border-gray-200" /><p>${text}</p>`,
            });
          } else {
            appendMessage({ role: 'user', content: text || 'Фото' });
          }
        } catch {
          appendMessage({ role: 'user', content: text || 'Фото' });
        } finally {
          handleRemoveFile();
        }
      } else {
        appendMessage({ role: 'user', content: text });
      }

      emitEvent({ type: 'ASSISTANT_QUESTION', text });

      const handoffReason = getHandoffReason(text);
      if (handoffReason) {
        requestHandoff(handoffReason, text);
        setIsLoading(false);
        return;
      }

      try {
        await sendToAi(text || 'Опиши впечатление и масштаб', imageUrl);
      } finally {
        setIsLoading(false);
      }
    },
    [
      appendMessage,
      handoffLocked,
      handleRemoveFile,
      input,
      isActive,
      isBlocked,
      isLoading,
      requestHandoff,
      selectedFile,
      sendToAi,
      uploadImage,
    ],
  );

  if (!isVisible || isBlocked) return null;

  const activeObjectSaved = data.activeObjectId ? isSaved(data.activeObjectId) : false;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col items-end">
      <Transition
        show={isVisible}
        enter="transition ease-out duration-300"
        enterFrom="opacity-0 translate-y-6 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-6 scale-95"
      >
        <div className="bg-white w-[calc(100vw-2rem)] md:w-96 h-[70vh] max-h-[calc(100vh-100px)] md:h-[640px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ring-1 ring-black/5 origin-bottom-right font-sans">
          <div className="bg-gradient-to-r from-brand-charcoal to-brand-brown/90 text-white p-4 flex justify-between items-center shadow-md z-10 flex-shrink-0">
            <div className="min-w-0">
              <h3 className="font-serif font-bold tracking-wide text-base leading-tight">Помощник</h3>
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-medium truncate">
                Спокойно про ощущения, масштаб, уместность
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isActive && data.activeObjectId && (
                <button
                  type="button"
                  onClick={() => {
                    if (!data.activeObjectId) return;
                    if (activeObjectSaved) return;
                    addToSaved(data.activeObjectId);
                  }}
                  className="hover:bg-white/20 px-3 py-2 rounded-full transition-colors text-white/90 hover:text-white text-xs font-semibold"
                >
                  {activeObjectSaved ? 'Сохранено' : 'Сохранить'}
                </button>
              )}
              {isActive && (
                <button
                  type="button"
                  onClick={() => {
                    const lastUser = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
                    const text = (lastUser || '').replace(/<[^>]*>?/gm, '').trim();
                    requestHandoff('contact', text);
                  }}
                  className="hover:bg-white/20 px-3 py-2 rounded-full transition-colors text-white/90 hover:text-white text-xs font-semibold"
                >
                  Связаться
                </button>
              )}
              <button
                type="button"
                onClick={close}
                className="hover:bg-white/20 p-2 rounded-full transition-colors text-white/90 hover:text-white"
                aria-label="Закрыть"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-cream-dark/30 min-h-0">
            {messages.length === 0 ? (
              <div className="text-xs text-gray-500 leading-relaxed bg-white/70 border border-gray-100 rounded-xl p-4">
                Задайте вопрос про ощущение, визуальный вес и масштаб. Я отвечу коротко и без давления.
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`prose prose-sm max-w-[92%] p-4 rounded-2xl leading-relaxed shadow-sm border ${
                      msg.role === 'user'
                        ? 'bg-brand-charcoal text-white rounded-tr-sm prose-invert border-brand-charcoal/10'
                        : 'bg-white text-gray-800 rounded-tl-sm border-gray-100'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3.5 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm text-xs text-gray-500">
                  Думаю…
                </div>
              </div>
            )}
          </div>

          {state === 'HANDOFF_REQUESTED' && (
            <div className="px-4 py-3 bg-white border-t border-gray-100 text-xs text-gray-600">
              <div className="font-medium text-gray-800">Связь с менеджером</div>
              <div className="mt-1 text-gray-600">Если удобно, напишите любым способом:</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {handoffLinks?.whatsapp && (
                  <a
                    href={handoffLinks.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackJourneyEvent({ type: 'CONTACT_MANAGER', objectId: data.activeObjectId })}
                    className="text-xs px-3 py-2 rounded-full bg-white border border-gray-200 text-brand-charcoal hover:border-brand-charcoal/40 transition-colors"
                  >
                    WhatsApp
                  </a>
                )}
                {handoffLinks?.telegram && (
                  <a
                    href={handoffLinks.telegram}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackJourneyEvent({ type: 'CONTACT_MANAGER', objectId: data.activeObjectId })}
                    className="text-xs px-3 py-2 rounded-full bg-white border border-gray-200 text-brand-charcoal hover:border-brand-charcoal/40 transition-colors"
                  >
                    Telegram
                  </a>
                )}
                {handoffLinks?.email && (
                  <a
                    href={`mailto:${handoffLinks.email}`}
                    onClick={() => trackJourneyEvent({ type: 'CONTACT_MANAGER', objectId: data.activeObjectId })}
                    className="text-xs px-3 py-2 rounded-full bg-white border border-gray-200 text-brand-charcoal hover:border-brand-charcoal/40 transition-colors"
                  >
                    Email
                  </a>
                )}
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="px-4 py-3 bg-white flex items-center border-t border-gray-100">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-700">Фото добавлено</p>
                <p className="text-[10px] text-gray-400">Отправлю вместе с сообщением</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-auto text-gray-400 hover:text-brand-terracotta transition-colors p-2 rounded-full"
                aria-label="Убрать фото"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center flex-shrink-0"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-brand-terracotta hover:bg-brand-brown/5 transition-all p-2.5 rounded-full flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Добавить фото"
              disabled={handoffLocked || isLoading}
            >
              <PhotoIcon className="w-6 h-6" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Задать вопрос…"
              disabled={!isActive || handoffLocked}
              className="flex-1 min-w-0 bg-gray-50 text-gray-800 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-terracotta focus:bg-white transition-all placeholder-gray-400 border border-transparent disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={!isActive || handoffLocked || isLoading || (!input.trim() && !selectedFile)}
              className="bg-brand-charcoal text-white p-2.5 rounded-full hover:bg-brand-brown transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0 flex items-center justify-center"
              aria-label="Отправить"
            >
              <PaperAirplaneIcon className="w-5 h-5 -ml-0.5 mt-0.5 transform -rotate-45" />
            </button>
          </form>
        </div>
      </Transition>
    </div>
  );
};
