"use client";

import React, { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HeartIcon } from './icons/index';
import { Logo } from './Logo';
import { cn } from '../utils';

const HeaderComponent: React.FC = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <header className={cn("hidden md:block sticky top-0 z-40 bg-warm-white/72 dark:bg-aura-dark-base/88 backdrop-blur-md transition-all duration-300")}>
        <div className="container mx-auto flex items-center justify-between px-6 h-[76px] relative">

          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity z-10">
            <Logo variant="dark" />
          </Link>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {mounted && (
              <div className="px-4 py-2 rounded-full bg-white/60 dark:bg-aura-dark-surface/70 border border-stone-beige/30 dark:border-aura-dark-border text-[12px] tracking-[0.16em] uppercase text-muted-gray dark:text-aura-dark-text-muted">
                Aura
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 text-soft-black dark:text-aura-dark-text-main z-10 ml-auto lg:ml-0">
            <button
              onClick={() => router.push('/saved')}
              className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-aura-dark-surface/70 border border-stone-beige/30 dark:border-aura-dark-border px-4 py-2.5 hover:opacity-80 transition-opacity"
              aria-label="Открыть сохранённое"
            >
              <HeartIcon className="w-4 h-4 stroke-[1.6]" />
              <span className="text-sm font-medium">Saved</span>
            </button>
          </div>
        </div>
      </header>

    </>
  );
};

export const Header = memo(HeaderComponent);

