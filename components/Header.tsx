import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../types';
import { MagnifyingGlassIcon, HeartIcon, ShoppingCartIcon } from './Icons';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

interface HeaderProps {
  onNavigate: (view: View) => void;
  onSearchSubmit: (searchTerm: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onSearchSubmit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { cartCount, toggleCart } = useCart();
  const { wishlistCount } = useWishlist();
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const isInitialMount = useRef(true);
  
  // Refs for logo tap admin access
  const tapCount = useRef(0);
  const lastTap = useRef(0);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Animate only when items are added, not removed (for simplicity)
    // We check against a simple condition `cartCount > 0` and trigger animation
    if (cartCount > 0) {
      setIsCartAnimating(true);
      const timer = setTimeout(() => setIsCartAnimating(false), 500); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [cartCount]);


  const handleNav = (e: React.MouseEvent, view: View) => {
    e.preventDefault();
    onNavigate(view);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearchSubmit(searchTerm.trim());
      setSearchTerm('');
    }
  };

  const handleLogoTap = (e: React.MouseEvent) => {
    const now = Date.now();
    
    if (now - lastTap.current > 300) {
      // If taps are too far apart, reset the counter
      tapCount.current = 1;
    } else {
      tapCount.current += 1;
    }
    
    lastTap.current = now;
    
    if (tapCount.current >= 5) {
      onNavigate({ page: 'admin' });
      tapCount.current = 0; // Reset after successful trigger
    } else {
      // Default navigation behavior for single clicks
      if (tapCount.current === 1) {
          handleNav(e, { page: 'home' });
      }
    }
  };


  return (
    <header className="sticky top-0 bg-brand-cream/80 backdrop-blur-md z-40 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div 
            className="text-3xl font-serif text-brand-brown cursor-pointer"
            onClick={handleLogoTap}
          >
            Aura
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" onClick={(e) => handleNav(e, { page: 'catalog' })} className="text-brand-charcoal hover:text-brand-brown transition-colors">Каталог</a>
            <a href="#" onClick={(e) => handleNav(e, { page: 'blog-list' })} className="text-brand-charcoal hover:text-brand-brown transition-colors">Блог</a>
            <a href="#" onClick={(e) => handleNav(e, { page: 'lookbook' })} className="text-brand-charcoal hover:text-brand-brown transition-colors">Lookbook</a>
            <a href="#" onClick={(e) => handleNav(e, { page: 'about' })} className="text-brand-charcoal hover:text-brand-brown transition-colors">О нас</a>
            <a href="#" onClick={(e) => handleNav(e, { page: 'contacts' })} className="text-brand-charcoal hover:text-brand-brown transition-colors">Контакты</a>
          </nav>

          {/* Search and Icons */}
          <div className="flex items-center space-x-5">
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <input 
                type="text"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-10 py-2 w-48 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-brown"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-brown">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </form>
            <button onClick={(e) => handleNav(e as any, { page: 'visual-search' })} className="text-brand-charcoal hover:text-brand-brown transition-colors" title="Визуальный поиск">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
            </button>
            <button onClick={(e) => handleNav(e as any, { page: 'wishlist' })} className="relative text-brand-charcoal hover:text-brand-brown transition-colors">
              <HeartIcon className="w-6 h-6" />
              {wishlistCount > 0 && <span className="absolute -top-2 -right-2 text-xs bg-brand-terracotta text-white rounded-full w-5 h-5 flex items-center justify-center">{wishlistCount}</span>}
            </button>
            <button onClick={toggleCart} className={`relative text-brand-charcoal hover:text-brand-brown transition-colors ${isCartAnimating ? 'animate-pop' : ''}`}>
              <ShoppingCartIcon className="w-6 h-6" />
              {cartCount > 0 && <span className="absolute -top-2 -right-2 text-xs bg-brand-terracotta text-white rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};