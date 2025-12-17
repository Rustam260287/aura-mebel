
"use client";

import React, { useState, memo, Fragment, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState, useCartDispatch } from '../contexts/CartContext'; 
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon, ShoppingCartIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon, ChevronDownIcon, ArrowUpTrayIcon } from './Icons';
import { Transition, Dialog, Menu } from '@headlessui/react';
import { Logo } from './Logo';

interface HeaderProps {}

const NavLink: React.FC<{ href: string; children: React.ReactNode; isMobile?: boolean; onClick?: () => void }> = ({ href, children, isMobile, onClick }) => {
  const router = useRouter();
  const isActive = router.pathname === href;

  if (isMobile) {
    return (
      <Link href={href} onClick={onClick} className={`block px-4 py-3 text-lg rounded-md transition-colors ${isActive ? 'bg-brand-brown/10 text-brand-brown font-semibold' : 'text-brand-charcoal hover:bg-brand-cream-dark'}`}>
          {children}
      </Link>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={`relative text-brand-charcoal/80 hover:text-brand-brown transition-colors font-medium group py-2`}>
        <span>{children}</span>
        <span className={`absolute bottom-0 left-0 h-0.5 bg-brand-brown transition-all duration-300 ease-out ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
    </Link>
  );
};

const HeaderComponent: React.FC<HeaderProps> = () => {
  const { cartCount } = useCartState();
  const { toggleCart } = useCartDispatch();
  const { wishlistCount } = useWishlist();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const navLinks = [
    { label: 'Каталог', href: '/products' },
    { label: 'Блог', href: '/blog' },
    { label: 'AI Редизайн', href: '/ai-room-makeover' },
    { 
      label: 'Компания', 
      isMenu: true,
      items: [
        { label: 'О нас', href: '/about' },
        { label: 'Контакты', href: '/contacts' },
      ]
    },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
      closeMobileMenu();
    }
  };

  const handleShareApp = async () => {
    const shareData = {
        title: 'Labelcom Мебель',
        text: 'Откройте для себя премиальную мебель и AI-дизайн интерьера!',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://label-com.ru',
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareData.url);
            alert('Ссылка скопирована в буфер обмена!');
        } catch (err) {
            console.error('Clipboard failed:', err);
        }
    }
  };

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    router.events.on('routeChangeStart', closeMobileMenu);
    return () => {
      router.events.off('routeChange-start', closeMobileMenu);
    };
  }, [router.events]);


  return (
    <>
      <header className="sticky top-0 bg-brand-cream/80 backdrop-blur-lg z-30 shadow-sm transition-all duration-300 border-b border-black/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-1 md:flex-none">
                <Link href="/" className="inline-block transform hover:scale-105 transition-transform origin-left">
                  <Logo />
                </Link>
            </div>

            <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
              {navLinks.map(link => (
                link.isMenu ? (
                  <Menu as="div" className="relative" key={link.label}>
                    {/* ... (Menu code remains the same) ... */}
                  </Menu>
                ) : (
                  <NavLink key={link.label} href={link.href!}>
                    {link.label}
                  </NavLink>
                )
              ))}
            </nav>

            <div className="flex items-center justify-end gap-x-1 md:gap-x-2 flex-1">
                {/* ... (Search code remains the same) ... */}
                
              <button 
                  onClick={handleShareApp}
                  className="hidden md:block text-brand-charcoal/80 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-brand-cream-dark"
                  aria-label="Поделиться"
                  title="Поделиться"
              >
                  <ArrowUpTrayIcon className="w-6 h-6" />
              </button>

              <Link href="/wishlist" className="relative text-brand-charcoal/80 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-brand-cream-dark" aria-label={`Избранное, ${wishlistCount} товаров`}>
                <HeartIcon className="w-7 h-7" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-terracotta text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-scale-in">{wishlistCount}</span>
                )}
              </Link>
              <button onClick={toggleCart} className="relative text-brand-charcoal/80 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-brand-cream-dark" aria-label={`Корзина, ${cartCount} товаров`}>
                <ShoppingCartIcon className="w-7 h-7" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-terracotta text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-scale-in">{cartCount}</span>
                )}
              </button>
              
              {/* FIX: Removed ml-2, now spacing is handled by parent `gap-x-1` */}
              <button className="md:hidden text-brand-charcoal p-2 -mr-2" onClick={() => setIsMobileMenuOpen(true)}>
                <Bars3Icon className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {/* ... (The rest of the component remains the same) ... */}
    </>
  );
};

export const Header = memo(HeaderComponent);
