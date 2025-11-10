"use client";

import React, { useState, memo } from 'react';
import Link from 'next/link'; // <-- Импортируем Link
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { HeartIcon, ShoppingCartIcon, SparklesIcon, Bars3Icon, XMarkIcon } from './Icons';
import { Button } from './Button';

// Убираем onNavigate, он больше не нужен
interface HeaderProps {
  onStyleFinderClick: () => void;
}

// Упрощаем NavLink, теперь это просто стилизованный Link
const NavLink: React.FC<{ href: string; children: React.ReactNode; isMobile?: boolean; onClick?: () => void }> = ({ href, children, isMobile, onClick }) => {
  return (
    <Link href={href} onClick={onClick} className={isMobile ? 'block px-4 py-2 text-lg text-brand-charcoal hover:bg-brand-cream-dark rounded-md' : 'text-brand-charcoal/80 hover:text-brand-brown transition-colors font-medium'}>
        {children}
    </Link>
  );
};

const HeaderComponent: React.FC<HeaderProps> = ({ onStyleFinderClick }) => {
  const { cartCount, toggleCart } = useCart();
  const { wishlistCount } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Обновляем navLinks, чтобы они содержали href
  const navLinks = [
    { label: 'Каталог', href: '/catalog' },
    { label: 'AI-редизайн', href: '/ai-room-makeover' },
    { label: 'Визуальный поиск', href: '/visual-search' },
    { label: 'Блог', href: '/blog' },
    { label: 'О нас', href: '/about' },
    { label: 'Контакты', href: '/contacts' },
  ];

  return (
    <>
      <header className="sticky top-0 bg-brand-cream/80 backdrop-blur-md z-30 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="text-4xl font-serif text-brand-brown tracking-wider">
              Aura
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <NavLink key={link.label} href={link.href}>
                  {link.label}
                </NavLink>
              ))}
              <Button variant="outline" size="sm" onClick={onStyleFinderClick}>
                <SparklesIcon className="w-5 h-5 mr-2" />
                AI-стилист
              </Button>
            </nav>
            <div className="flex items-center gap-4">
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
      {/* ... мобильное меню также нужно будет обновить ... */}
    </>
  );
};

export const Header = memo(HeaderComponent);
