
"use client";

import React, { useState, memo, Fragment, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCartState, useCartDispatch } from '../contexts/CartContext'; 
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon, ShoppingCartIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon, ChevronDownIcon } from './Icons'; // Добавил ChevronDownIcon
import { Transition, Dialog, Menu } from '@headlessui/react'; // Добавил Menu

interface HeaderProps {}

// Обновленный NavLink
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
  const { user } = useAuth(); 

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Обновленная структура ссылок
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
            <Link href="/" className="text-4xl font-serif text-brand-brown tracking-wider mr-8 transform hover:scale-105 transition-transform">
              Labelcom
            </Link>

            <nav className="hidden md:flex items-center gap-8 flex-1">
              {navLinks.map(link => (
                link.isMenu ? (
                    <Menu as="div" className="relative" key={link.label}>
                        <Menu.Button className="flex items-center gap-1 text-brand-charcoal/80 hover:text-brand-brown transition-colors font-medium group py-2">
                            <span>{link.label}</span>
                            <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
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
                            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="px-1 py-1 ">
                                    {link.items?.map(item => (
                                        <Menu.Item key={item.href}>
                                            {({ active }) => (
                                                <Link href={item.href} className={`${active ? 'bg-brand-brown text-white' : 'text-gray-900'} group flex rounded-md items-center w-full px-2 py-2 text-sm transition-colors`}>
                                                    {item.label}
                                                </Link>
                                            )}
                                        </Menu.Item>
                                    ))}
                                </div>
                            </Menu.Items>
                        </Transition>
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
                    {/* ... Search ... */}
                </div>

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
          {/* ... (Backdrop and Panel) ... */}
            <Dialog.Panel className="p-5 flex flex-col h-full">
              {/* ... (Header) ... */}
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
            </Dialog.Panel>
        </Dialog>
      </Transition>
    </>
  );
};

export const Header = memo(HeaderComponent);
