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

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-brand-cream border-b border-brand-brown/10 shadow-sm transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between gap-6 px-4 py-4 sm:px-6 h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <Logo className="origin-left" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 justify-center gap-10 text-sm font-medium text-brand-charcoal/80">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "hover:text-brand-brown transition-colors relative group py-2",
                  router.pathname === link.href ? "text-brand-brown font-bold" : ""
                )}
              >
                {link.label}
                <span className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-brand-brown transition-all duration-300 ease-out rounded-full",
                    router.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                )} />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
             <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Поиск"
              className="text-brand-charcoal hover:text-brand-brown transition-colors p-1"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={() => router.push('/wishlist')}
              aria-label={`Избранное, ${wishlistCount} товаров`}
              className="hidden sm:block text-brand-charcoal hover:text-brand-brown transition-colors p-1 relative"
            >
              <HeartIcon className="h-6 w-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-brown text-[10px] font-bold text-white shadow-sm ring-2 ring-brand-cream">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleCart}
              aria-label={`Корзина, ${cartCount} товаров`}
              className="text-brand-charcoal hover:text-brand-brown transition-colors p-1 relative"
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-brown text-[10px] font-bold text-white shadow-sm ring-2 ring-brand-cream">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-brand-charcoal hover:text-brand-brown transition-colors p-1"
              aria-label="Меню"
            >
              <Bars3Icon className="h-7 w-7" />
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
            <div className="fixed inset-0 bg-brand-brown/20 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
                <form className="flex items-center p-4" onSubmit={handleSearchSubmit}>
                  <MagnifyingGlassIcon className="ml-2 h-6 w-6 text-brand-brown/50" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Что вы ищете? (например: диван, стол...)"
                    autoFocus
                    className="flex-1 border-0 bg-transparent px-4 py-3 text-lg text-brand-charcoal placeholder:text-gray-400 focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
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
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-xs bg-brand-cream shadow-2xl flex flex-col h-full border-l border-brand-brown/10">
                <div className="flex items-center justify-between px-6 py-5 border-b border-brand-brown/10">
                  <Logo className="scale-90 origin-left" />
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-full p-2 text-brand-charcoal hover:bg-brand-brown/10 hover:text-brand-brown"
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
                            "block text-xl font-serif text-brand-charcoal hover:text-brand-brown transition-colors",
                             router.pathname === link.href ? "text-brand-brown font-bold italic" : ""
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-12 pt-8 border-t border-brand-brown/10 space-y-6">
                     <Link
                        href="/wishlist"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex w-full items-center gap-4 text-brand-charcoal font-medium hover:text-brand-brown"
                      >
                        <HeartIcon className="h-6 w-6" />
                        Избранное 
                        {wishlistCount > 0 && <span className="ml-auto text-xs bg-brand-brown text-white px-2 py-0.5 rounded-full">{wishlistCount}</span>}
                      </Link>

                      <button
                        onClick={() => {
                            handleLoginRedirect();
                            setIsMobileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-4 text-brand-charcoal font-medium hover:text-brand-brown"
                      >
                         <ArrowUpTrayIcon className="h-6 w-6" />
                        Войти
                      </button>
                  </div>
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
