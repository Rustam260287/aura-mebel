"use client";

import React, { useState, memo } from 'react';
import type { View } from '../types';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { HeartIcon, ShoppingCartIcon, SparklesIcon, Bars3Icon, XMarkIcon } from './Icons';
import { Button } from './Button';

interface HeaderProps {
  onNavigate: (view: View) => void;
  onStyleFinderClick: () => void;
}

const NavLink: React.FC<{ view: View; onNavigate: (view: View) => void; children: React.ReactNode; isMobile?: boolean; onClick?: () => void }> = ({ view, onNavigate, children, isMobile, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(view);
    onClick?.();
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={isMobile ? 'block px-4 py-2 text-lg text-brand-charcoal hover:bg-brand-cream-dark rounded-md' : 'text-brand-charcoal/80 hover:text-brand-brown transition-colors font-medium'}
    >
      {children}
    </a>
  );
};

const HeaderComponent: React.FC<HeaderProps> = ({ onNavigate, onStyleFinderClick }) => {
  const { cartCount, toggleCart } = useCart();
  const { wishlistCount } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Каталог', view: { page: 'catalog' } as View },
    { label: 'AI-редизайн', view: { page: 'ai-room-makeover' } as View },
    { label: 'Визуальный поиск', view: { page: 'visual-search' } as View },
    { label: 'Блог', view: { page: 'blog-list' } as View },
    { label: 'О нас', view: { page: 'about' } as View },
    { label: 'Контакты', view: { page: 'contacts' } as View },
  ];

  return (
    <>
      <header className="sticky top-0 bg-brand-cream/80 backdrop-blur-md z-30 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate({ page: 'home' }); }} className="text-4xl font-serif text-brand-brown tracking-wider">
              Aura
            </a>
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <NavLink key={link.label} view={link.view} onNavigate={onNavigate}>
                  {link.label}
                </NavLink>
              ))}
              <Button variant="outline" size="sm" onClick={onStyleFinderClick}>
                <SparklesIcon className="w-5 h-5 mr-2" />
                AI-стилист
              </Button>
            </nav>
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate({ page: 'wishlist' })} className="relative text-brand-charcoal/80 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-brand-cream-dark" aria-label={`Избранное, ${wishlistCount} товаров`}>
                <HeartIcon className="w-7 h-7" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-terracotta text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{wishlistCount}</span>
                )}
              </button>
              <button onClick={toggleCart} className="relative text-brand-charcoal/80 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-brand-cream-dark" aria-label={`Корзина, ${cartCount} товаров`}>
                <ShoppingCartIcon className="w-7 h-7" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-terracotta text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>
                )}
              </button>
              <button
                className="md:hidden text-brand-charcoal/80 hover:text-brand-brown"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Открыть меню"
              >
                <Bars3Icon className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      </header>
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative h-full w-full max-w-xs bg-brand-cream shadow-xl flex flex-col">
            <div className="px-6 py-4 flex-grow flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate({ page: 'home' }); setIsMobileMenuOpen(false); }} className="text-3xl font-serif text-brand-brown">Aura</a>
                <button onClick={() => setIsMobileMenuOpen(false)}><XMarkIcon className="w-8 h-8" /></button>
              </div>
              <nav className="flex flex-col gap-4">
                {navLinks.map(link => (
                  <NavLink key={link.label} view={link.view} onNavigate={onNavigate} isMobile onClick={() => setIsMobileMenuOpen(false)}>
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Header = memo(HeaderComponent);
