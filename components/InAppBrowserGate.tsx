import React, { useEffect, useState } from 'react';
import { getArEnvironment } from '../lib/browserUtils';

export const InAppBrowserGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [requiresExternal, setRequiresExternal] = useState(false);
    const [platform, setPlatform] = useState<'desktop' | 'ios' | 'android' | null>(null);

    useEffect(() => {
        const env = getArEnvironment();
        if (env.requiresExternalBrowser) {
            setRequiresExternal(true);
            setPlatform(env.platform);
        }
    }, []);

    if (!requiresExternal) {
        return <>{children}</>;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-warm-white dark:bg-[#121212] flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-soft-black/5 dark:bg-white/5 flex items-center justify-center mb-8 shadow-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-soft-black dark:text-white" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </div>

            <h1 className="text-2xl md:text-3xl font-serif italic text-soft-black dark:text-white mb-4 tracking-tight">
                Требуется полноценный браузер
            </h1>

            <p className="text-[#6B6B6B] dark:text-[#A0A0A0] text-[15px] leading-relaxed max-w-[280px] mb-12">
                Aura использует технологии дополненной реальности, которые недоступны внутри мессенджеров.
            </p>

            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-sm border border-stone-beige/30 dark:border-white/10 w-full max-w-sm">
                <div className="text-[13px] font-medium text-soft-black dark:text-white/80 uppercase tracking-widest mb-4">
                    Как продолжить
                </div>

                <div className="flex flex-col gap-4 text-left">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-soft-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-sm font-medium">1</div>
                        <div className="text-[15px] text-soft-black/90 dark:text-white/90 leading-tight pt-1.5">
                            Нажмите <span className="font-semibold text-soft-black dark:text-white">⋯</span> (или <span className="font-semibold text-soft-black dark:text-white">⋮</span>) в правом верхнем углу
                        </div>
                    </div>

                    <div className="w-[1px] h-6 bg-stone-beige/50 dark:bg-white/10 ml-4 hidden md:block"></div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-soft-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0 text-sm font-medium">2</div>
                        <div className="text-[15px] text-soft-black/90 dark:text-white/90 leading-tight pt-1.5">
                            {platform === 'ios' ? 'Выберите «Открыть в Safari»' : 'Выберите «Открыть в Chrome»'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
