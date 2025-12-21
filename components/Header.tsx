"use client";

import React, { useState, memo, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HeartIcon, ShoppingCartIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from './icons';
import { Dialog, Transition } from '@headlessui/react';
import { Logo } from './Logo';
import { cn } from '../utils';

const HeaderComponent: React.FC = () => {
  const router = useRouter();
  const isHomePage = router.pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (path: string) => {
      router.push(path);
      setIsMobileMenuOpen(false);
  }

  return (
    <>
      <header className={cn("sticky top-0 z-40 bg-warm-white/80 backdrop-blur-md transition-all duration-300 border-b border-stone-beige/20")}>
        <div className="container mx-auto flex items-center justify-between px-6 h-20 relative">
          
          {/* Logo (Left) */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity z-10">
            <Logo variant="dark" />
          </Link>

          {/* Center Content: ONLY CTA Button on inner pages. NOTHING on Home Page. */}
          {!isHomePage && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block">
                <button 
                  onClick={() => router.push('/')}
                  className="bg-soft-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:opacity-90 transition-all shadow-soft whitespace-nowrap"
               >
                  Посмотреть в интерьере
              </button>
            </div>
          )}

          {/* Icons Actions (Right) */}
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
      
      {/* Mobile Menu (Full Screen, Calm) */}
      <Transition.Root show={isMobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setIsMobileMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-warm-white" />
          </Transition.Child>

          <div className="fixed inset-0 flex flex-col p-6">
            <div className="flex items-center justify-between mb-16">
              <Logo />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                <XMarkIcon className="w-6 h-6 text-soft-black" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-8 text-3xl font-medium text-soft-black">
                <button onClick={() => handleNavigate('/')} className="text-left">Посмотреть в интерьере</button>
                <button onClick={() => handleNavigate('/products')} className="text-left">Готовая мебель</button>
                <button onClick={() => handleNavigate('/furniture-from-photo')} className="text-left">Создать свою</button>
                <button onClick={() => handleNavigate('/ai-room-makeover')} className="text-left">Изменить комнату</button>
            </nav>

            <div className="mt-auto border-t border-stone-beige/30 pt-8 space-y-6 text-muted-gray font-medium">
                <button onClick={() => handleNavigate('/about')} className="block">О проекте</button>
                <button onClick={() => handleNavigate('/contacts')} className="block">Контакты</button>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export const Header = memo(HeaderComponent);
