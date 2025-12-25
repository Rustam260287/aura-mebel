"use client";

import React, { useState, memo, Fragment, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HeartIcon, Bars3Icon, XMarkIcon } from './icons';
import { Logo } from './Logo';
import { cn } from '../utils';
import { FEATURE_FLAGS } from '../lib/featureFlags';

const navLinks = [
  { label: 'Мебель', href: '/products', enabled: FEATURE_FLAGS.READY_FURNITURE_SCENARIO },
  { label: 'Создать', href: '/furniture-from-photo', enabled: FEATURE_FLAGS.CUSTOM_FURNITURE_SCENARIO },
  { label: 'Комната', href: '/ai-room-makeover', enabled: FEATURE_FLAGS.AI_REDESIGN_SCENARIO },
];

const HeaderComponent: React.FC = () => {
  const router = useRouter();
  const isHomePage = router.pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const visibleNavLinks = navLinks.filter(link => link.enabled);

  const handleNavigate = (path: string) => {
      router.push(path);
      setIsMobileMenuOpen(false);
  }

  return (
    <>
      <header className={cn("hidden md:block sticky top-0 z-40 bg-warm-white/80 backdrop-blur-md transition-all duration-300 border-b border-stone-beige/20")}>
        <div className="container mx-auto flex items-center justify-between px-6 h-20 relative">
          
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity z-10">
            <Logo variant="dark" />
          </Link>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block">
            {/* Defer rendering of this block until client-side mount to prevent hydration mismatch */}
            {mounted && (
                <>
                    {isHomePage ? (
                        <nav className="flex items-center gap-8 text-[15px] font-medium text-soft-black">
                            {visibleNavLinks.map(link => (
                                <Link key={link.href} href={link.href} className="hover:opacity-70 transition-opacity">{link.label}</Link>
                            ))}
                        </nav>
                    ) : (
                        <button 
                          onClick={() => router.push('/')}
                          className="bg-soft-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:opacity-90 transition-all shadow-soft whitespace-nowrap"
                       >
                          Посмотреть в интерьере
                      </button>
                    )}
                </>
            )}
          </div>

          <div className="flex items-center gap-5 text-soft-black z-10 ml-auto lg:ml-0">
            <button onClick={() => router.push('/wishlist')} className="hover:opacity-70 transition-opacity p-1">
                <HeartIcon className="w-6 h-6 stroke-1" />
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden hover:opacity-70 transition-opacity p-1">
                <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu is client-side only by nature, so it's safe */}
      {/* ... (Mobile menu code remains unchanged) ... */}
    </>
  );
};

export const Header = memo(HeaderComponent);
