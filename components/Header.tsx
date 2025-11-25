"use client";

import React, { useState, memo, Fragment, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { HeartIcon, ShoppingCartIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from './Icons';
import { Transition } from '@headlessui/react';

interface HeaderProps {}

const NavLink: React.FC<{ href: string; children: React.ReactNode; isMobile?: boolean; onClick?: () => void }> = ({ href, children, isMobile, onClick }) => {
  return (
    <Link href={href} onClick={onClick} className={isMobile ? 'block px-4 py-2 text-lg text-brand-charcoal hover:bg-brand-cream-dark rounded-md' : 'text-brand-charcoal/80 hover:text-brand-brown transition-colors font-medium'}>
        {children}
    </Link>
  );
};

const HeaderComponent: React.FC<HeaderProps> = () => {
  const { cartCount, toggleCart } = useCart();
  const { wishlistCount } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Use a safe way to access search params that doesn't break during SSG/SSR if possible, 
  // or just rely on client-side routing.
  // Note: In Next.js 13+ pages dir, useSearchParams is from next/navigation (client component).

  const navLinks = [
    { label: 'Каталог', href: '/products' },
    { label: 'Блог', href: '/blog' },
    { label: 'О нас', href: '/about' },
    { label: 'Контакты', href: '/contacts' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      closeMobileMenu();
    }
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <>
      <header className="sticky top-0 bg-brand-cream/80 backdrop-blur-md z-30 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="text-4xl font-serif text-brand-brown tracking-wider mr-8">
              Aura
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 flex-1">
              {navLinks.map(link => (
                <NavLink key={link.label} href={link.href}>
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="flex items-center gap-2">
                {/* Search - Desktop */}
                <div className="hidden md:flex items-center relative mr-2">
                    <form 
                        onSubmit={handleSearchSubmit} 
                        className={`flex items-center transition-all duration-300 ease-in-out overflow-hidden ${isSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}`}
                    >
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Поиск..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onBlur={() => !searchQuery && setIsSearchOpen(false)}
                            className="w-full bg-transparent border-b border-brand-brown/30 text-brand-charcoal placeholder-brand-charcoal/50 focus:outline-none focus:border-brand-brown py-1 pr-8 text-sm"
                        />
                    </form>
                    <button 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="text-brand-charcoal/80 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-brand-cream-dark"
                        aria-label="Поиск"
                    >
                        <MagnifyingGlassIcon className="w-6 h-6" />
                    </button>
                </div>

              <Link href="/wishlist" className="relative text-brand-charcoal/80 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-brand-cream-dark" aria-label={`Избранное, ${wishlistCount} товаров`}>
                <HeartIcon className="w-7 h-7" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-terracotta text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{wishlistCount}</span>
                )}
              </Link>
              <button onClick={toggleCart} className="relative text-brand-charcoal/80 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-brand-cream-dark" aria-label={`Корзина, ${cartCount} товаров`}>
                <ShoppingCartIcon className="w-7 h-7" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-terracotta text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>
                )}
              </button>
              <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}><Bars3Icon className="w-8 h-8" /></button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <Transition show={isMobileMenuOpen} as={Fragment}>
        <div className="md:hidden fixed inset-0 z-40">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-black/30" onClick={closeMobileMenu} />
          </Transition.Child>
          <Transition.Child
            as="div"
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-brand-cream shadow-xl"
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <div className="p-5 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <span className="text-3xl font-serif text-brand-brown">Aura</span>
                <button onClick={closeMobileMenu}>
                  <XMarkIcon className="w-8 h-8" />
                </button>
              </div>

               {/* Search - Mobile */}
               <form onSubmit={handleSearchSubmit} className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Поиск товаров..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-brand-cream-dark border border-transparent focus:border-brand-brown rounded-md py-2 pl-4 pr-10 outline-none transition-colors"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-brand-charcoal/50 hover:text-brand-brown">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                        </button>
                    </div>
               </form>

              <nav className="flex flex-col gap-4">
                {navLinks.map(link => (
                  <NavLink key={link.label} href={link.href} isMobile onClick={closeMobileMenu}>
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </Transition.Child>
        </div>
      </Transition>
    </>
  );
};

export const Header = memo(HeaderComponent);
