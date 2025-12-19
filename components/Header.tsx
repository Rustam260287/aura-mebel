"use client";

import React, { useState, memo, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState, useCartDispatch } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { HeartIcon, ShoppingCartIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon, ArrowUpTrayIcon } from './Icons';
import { Dialog, Transition } from '@headlessui/react';
import { Logo } from './Logo';
import { cn } from '../utils';

const NAV_LINKS = [
  { label: 'Каталог', href: '/products' },
  { label: 'Блог', href: '/blog' },
  { label: 'AI Редизайн', href: '/ai-room-makeover' },
  { label: 'О нас', href: '/about' },
  { label: 'Контакты', href: '/contacts' },
  { label: 'Доставка', href: '/shipping' },
];

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

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchInput('');
  };

  const handleWishlistOpen = () => {
    router.push('/wishlist');
  };

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-brand-cream/90 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <Logo className="text-sm scale-90 sm:scale-100 origin-left" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 justify-center gap-8 text-[13px] font-medium uppercase tracking-widest text-brand-charcoal/80 transition-colors duration-200">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "hover:text-brand-terracotta relative group py-1",
                  router.pathname === link.href ? "text-brand-terracotta font-semibold" : ""
                )}
              >
                {link.label}
                <span className={cn(
                    "absolute bottom-0 left-0 h-[1px] bg-brand-terracotta transition-all duration-300 ease-out",
                    router.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                )} />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
             <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Поиск"
              className="rounded-full p-2 text-brand-charcoal/70 transition hover:text-brand-terracotta hover:bg-brand-brown/5 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/20"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleWishlistOpen}
              aria-label={`Избранное, ${wishlistCount} товаров`}
              className="hidden sm:block relative rounded-full p-2 text-brand-charcoal/70 transition hover:text-brand-terracotta hover:bg-brand-brown/5 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/20"
            >
              <HeartIcon className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2 items-center justify-center rounded-full bg-brand-terracotta ring-2 ring-brand-cream" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleCart}
              aria-label={`Корзина, ${cartCount} товаров`}
              className="relative rounded-full p-2 text-brand-charcoal/70 transition hover:text-brand-terracotta hover:bg-brand-brown/5 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/20"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-terracotta text-[10px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

             <div className="hidden md:block w-px h-6 bg-brand-charcoal/10 mx-2" />

            <button
              type="button"
              onClick={handleLoginRedirect}
              className="hidden md:flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-charcoal/70 transition hover:text-brand-terracotta px-2 py-1"
            >
              Войти
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-full p-2 text-brand-charcoal/70 transition hover:text-brand-terracotta hover:bg-brand-brown/5 focus:outline-none md:hidden"
              aria-label="Меню"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <Transition.Root show={isSearchOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleSearchClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-brand-charcoal/20 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-start justify-center pt-20 px-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 -translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 -translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                <form className="flex items-center border-b border-gray-100 p-2" onSubmit={handleSearchSubmit}>
                  <MagnifyingGlassIcon className="ml-4 h-5 w-5 text-gray-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Поиск товаров, коллекций..."
                    autoFocus
                    className="flex-1 border-0 bg-transparent px-4 py-4 text-brand-charcoal placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSearchClose}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  >
                    <span className="sr-only">Закрыть</span>
                    <kbd className="hidden sm:inline-block font-sans text-xs font-semibold text-gray-400">ESC</kbd>
                    <XMarkIcon className="h-5 w-5 sm:hidden" />
                  </button>
                </form>
                {/* Search suggestions could go here */}
                {searchInput.length > 0 && (
                    <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500 text-center">
                        Нажмите Enter для поиска "{searchInput}"
                    </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Mobile Menu */}
      <Transition.Root show={isMobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={setIsMobileMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-brand-charcoal/20 backdrop-blur-sm" />
          </Transition.Child>

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
              <Dialog.Panel className="w-full max-w-sm bg-white shadow-2xl flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <Logo className="scale-75 origin-left" />
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-full p-2 text-brand-charcoal/70 transition hover:text-brand-terracotta hover:bg-brand-brown/5"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 py-8">
                  <ul className="space-y-6">
                    {NAV_LINKS.map(link => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "block text-2xl font-serif text-brand-charcoal hover:text-brand-terracotta transition-colors",
                             router.pathname === link.href ? "text-brand-terracotta italic" : ""
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-12 space-y-4 border-t border-gray-100 pt-8">
                     <button
                        type="button"
                        className="flex w-full items-center gap-3 text-lg font-medium text-brand-charcoal/80 transition hover:text-brand-terracotta"
                        onClick={() => {
                          handleWishlistOpen();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <HeartIcon className="h-6 w-6" />
                        Избранное 
                        {wishlistCount > 0 && <span className="ml-auto text-sm text-brand-terracotta font-bold">{wishlistCount}</span>}
                      </button>

                      <button
                        type="button"
                        className="flex w-full items-center gap-3 text-lg font-medium text-brand-charcoal/80 transition hover:text-brand-terracotta"
                        onClick={() => {
                          handleLoginRedirect();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                         <ArrowUpTrayIcon className="h-6 w-6" />
                        Войти / Регистрация
                      </button>
                  </div>
                </nav>
                
                <div className="bg-brand-cream p-6 text-center text-xs text-brand-charcoal/50">
                    &copy; 2024 Label.com
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export const Header = memo(HeaderComponent);
