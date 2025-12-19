"use client";

import React, { useState, memo, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState, useCartDispatch } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { HeartIcon, ShoppingCartIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon, ShareIcon, ChevronDownIcon } from './Icons'; // Добавил ShareIcon, ChevronDownIcon
import { Dialog, Transition, Menu } from '@headlessui/react';
import { Logo } from './Logo';
import { cn } from '../utils';

const HEADER_BG = "bg-[#FBF9F4]"; // Цвет фона как на референсе

const HeaderComponent: React.FC = () => {
  const router = useRouter();
  const { cartCount } = useCartState();
  const { toggleCart } = useCartDispatch();
  const { wishlistCount } = useWishlist();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    setSearchInput('');
    setIsSearchOpen(false);
  };

  const handleShare = async () => {
    const shareData = {
        title: 'Labelcom Мебель',
        text: 'Премиальная мебель для вашего дома',
        url: window.location.href,
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) {}
    } else {
        try { await navigator.clipboard.writeText(window.location.href); alert('Ссылка скопирована'); } catch (err) {}
    }
  };

  return (
    <>
      <header className={cn("sticky top-0 z-40 transition-all duration-300", HEADER_BG)}>
        <div className="container mx-auto flex items-center justify-between px-6 h-20">
          
          {/* Logo (Left) */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo variant="dark" />
          </Link>

          {/* Navigation (Center) */}
          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#59443B]">
            <Link href="/products" className="hover:opacity-70 transition-opacity">Каталог</Link>
            <Link href="/blog" className="hover:opacity-70 transition-opacity">Блог</Link>
            <Link href="/ai-room-makeover" className="hover:opacity-70 transition-opacity">AI Редизайн</Link>
            
            {/* Dropdown "Компания" */}
            <Menu as="div" className="relative">
                <Menu.Button className="flex items-center gap-1 hover:opacity-70 transition-opacity focus:outline-none">
                    Компания
                    <ChevronDownIcon className="w-3 h-3 mt-0.5" />
                </Menu.Button>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <Link href="/about" className={cn("block px-4 py-2 text-sm text-gray-700", active && "bg-gray-50")}>
                                    О нас
                                </Link>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <Link href="/contacts" className={cn("block px-4 py-2 text-sm text-gray-700", active && "bg-gray-50")}>
                                    Контакты
                                </Link>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <Link href="/shipping" className={cn("block px-4 py-2 text-sm text-gray-700", active && "bg-gray-50")}>
                                    Доставка
                                </Link>
                            )}
                        </Menu.Item>
                    </Menu.Items>
                </Transition>
            </Menu>
          </nav>

          {/* Icons Actions (Right) */}
          <div className="flex items-center gap-5 text-[#59443B]">
             <button onClick={() => setIsSearchOpen(true)} className="hover:opacity-70 transition-opacity p-1">
                <MagnifyingGlassIcon className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <button onClick={handleShare} className="hover:opacity-70 transition-opacity p-1 hidden sm:block">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            </button>

            <button onClick={() => router.push('/wishlist')} className="hover:opacity-70 transition-opacity p-1 relative">
                <HeartIcon className="w-5 h-5" />
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#59443B] rounded-full border border-[#FBF9F4]" />}
            </button>

            <button onClick={toggleCart} className="hover:opacity-70 transition-opacity p-1 relative">
                <ShoppingCartIcon className="w-5 h-5" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#59443B] rounded-full border border-[#FBF9F4]" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden hover:opacity-70 transition-opacity p-1 ml-2">
                <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <Transition.Root show={isSearchOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsSearchOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-[#59443B]/20 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-start justify-center pt-24 px-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 -translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-2xl bg-white shadow-xl rounded-lg overflow-hidden">
                <form className="flex items-center px-4 py-3" onSubmit={handleSearchSubmit}>
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Поиск..."
                    autoFocus
                    className="flex-1 border-0 bg-transparent px-4 py-2 text-[#59443B] placeholder:text-gray-400 focus:ring-0 text-sm"
                  />
                  <button type="button" onClick={() => setIsSearchOpen(false)}>
                    <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Mobile Menu */}
      <Transition.Root show={isMobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setIsMobileMenuOpen}>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-xs bg-[#FBF9F4] shadow-2xl h-full flex flex-col p-6">
                <div className="flex items-center justify-between mb-8">
                  <Logo className="scale-90 origin-left" />
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#59443B]">
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <nav className="flex flex-col gap-6 text-lg font-serif text-[#59443B]">
                    <Link href="/products" onClick={() => setIsMobileMenuOpen(false)}>Каталог</Link>
                    <Link href="/blog" onClick={() => setIsMobileMenuOpen(false)}>Блог</Link>
                    <Link href="/ai-room-makeover" onClick={() => setIsMobileMenuOpen(false)}>AI Редизайн</Link>
                    <Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>О нас</Link>
                    <Link href="/contacts" onClick={() => setIsMobileMenuOpen(false)}>Контакты</Link>
                    <Link href="/shipping" onClick={() => setIsMobileMenuOpen(false)}>Доставка</Link>
                </nav>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export const Header = memo(HeaderComponent);
