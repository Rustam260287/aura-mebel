import React from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Meta } from '../components/Meta';

export default function Custom404() {
    return (
        <>
            <Meta title="Страница не найдена | AURA" description="Запрашиваемая страница не найдена." />
            <Header />
            <main className="flex-grow flex items-center justify-center min-h-[70vh] bg-warm-white dark:bg-aura-dark-base px-6">
                <div className="text-center max-w-md">
                    <h1 className="font-serif italic text-6xl md:text-8xl text-soft-black dark:text-aura-dark-text-main mb-6 tracking-tight">
                        404
                    </h1>
                    <p className="text-lg text-muted-gray dark:text-aura-dark-text-muted mb-2">
                        Страница не найдена
                    </p>
                    <p className="text-sm text-muted-gray/70 dark:text-aura-dark-text-muted/70 mb-10">
                        Возможно, она была перемещена или удалена.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-soft-black text-white text-sm font-medium tracking-tight hover:bg-soft-black/90 transition-colors"
                        >
                            На главную
                        </Link>
                        <Link
                            href="/objects"
                            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-white/80 backdrop-blur-md border border-stone-beige/30 text-soft-black text-sm font-medium tracking-tight hover:bg-white transition-colors"
                        >
                            Галерея
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
