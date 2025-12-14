
"use client";

import React, { useState, memo, Fragment, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState, useCartDispatch } from '../contexts/CartContext'; 
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon, ShoppingCartIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon, ChevronDownIcon, ArrowUpTrayIcon } from './Icons';
import { Transition, Dialog, Menu } from '@headlessui/react';
import { Logo } from './Logo'; // Import Logo

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
      router.events.off('routeChangeStart', closeMobileMenu);
    };
  }, [router.events]);


  return (
    <>
      <header className="sticky top-0 bg-brand-cream/80 backdrop-blur-lg z-30 shadow-sm transition-all duration-300 border-b border-black/5">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="mr-8 transform hover:scale-105 transition-transform origin-left">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-8 flex-1">
              {navLinks.map(link => (
                link.isMenu ? (
                  <Menu as="div" className="relative" key={link.label}>
                    {({ open }) => (
                      <>
                        <Menu.Button className="flex items-center gap-1 text-brand-charcoal/80 hover:text-brand-brown transition-colors font-medium group py-2">
                          <span>{link.label}</span>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : 'group-hover:rotate-180'}`} />
                        </Menu.Button>
                        <Transition
                          show={open}
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="px-1 py-1 ">
                              {link.items?.map(item => (
                                <Menu.Item key={item.href}>
                                  {({ active }) => (
                                    <Link
                                      href={item.href}
                                      className={`${active ? 'bg-brand-brown text-white' : 'text-gray-900'} group flex rounded-md items-center w-full px-2 py-2 text-sm transition-colors`}
                                    >
                                      {item.label}
                                    </Link>
                                  )}
                                </Menu.Item>
                              ))}
                            </div>
                          </Menu.Items>
                        </Transition>
                      </>
                    )}
                  </Menu>
                ) : (
                  <NavLink key={link.label} href={link.href!}>
                    {link.label}
                  </NavLink>
                )
              ))}
            </nav>

            <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center relative mr-2">
                    <form 
                        onSubmit={handleSearchSubmit} 
                        className={`flex items-center transition-all duration-300 ease-in-out overflow-hidden ${isSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}`}
                    >
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Поиск по каталогу..."
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
                
              <button 
                  onClick={handleShareApp}
                  className="hidden md:block text-brand-charcoal/80 hover:text-brand-brown transition-colors p-2 rounded-full hover:bg-brand-cream-dark"
                  aria-label="Поделиться приложением"
                  title="Поделиться приложением"
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
              <button className="md:hidden ml-2 text-brand-charcoal" onClick={() => setIsMobileMenuOpen(true)}><Bars3Icon className="w-8 h-8" /></button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <Transition show={isMobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="md:hidden fixed inset-0 z-40" onClose={closeMobileMenu}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
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
            <Dialog.Panel className="p-5 flex flex-col h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <Logo /> {/* Logo in mobile menu */}
                <button onClick={closeMobileMenu}>
                  <XMarkIcon className="w-8 h-8" />
                </button>
              </div>

               <form onSubmit={handleSearchSubmit} className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Поиск товаров..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border-gray-200 focus:border-brand-brown rounded-md py-2.5 pl-4 pr-10 outline-none focus:ring-2 focus:ring-brand-brown/20 transition-all"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-brand-charcoal/50 hover:text-brand-brown">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                        </button>
                    </div>
               </form>

              <nav className="flex flex-col gap-2">
                {navLinks.map(link => (
                    link.isMenu ? (
                        <div key={link.label}>
                            <p className="px-4 pt-4 pb-2 text-sm text-gray-400 font-bold uppercase tracking-wider">{link.label}</p>
                            {link.items?.map(item => (
                                <NavLink key={item.href} href={item.href} isMobile>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ) : (
                        <NavLink key={link.label} href={link.href!} isMobile>
                            {link.label}
                        </NavLink>
                    )
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t border-gray-200">
                 <button 
                    onClick={handleShareApp}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-brand-brown/30 text-brand-brown font-medium py-3 rounded-lg hover:bg-brand-brown hover:text-white transition-colors"
                 >
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    Поделиться приложением
                 </button>
              </div>

            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
};

export const Header = memo(HeaderComponent);
