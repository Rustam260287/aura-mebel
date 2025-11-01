
import React from 'react';
import { ArrowLeftIcon } from '../../components/Icons'; // Assuming icons are accessible
import type { View } from '../../types';

interface AdminSidebarProps {
  activeView: string;
  setView: (view: 'dashboard' | 'products' | 'blog') => void;
  onNavigate: (view: View) => void;
}

const NavLink: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${
      isActive
        ? 'bg-brand-brown text-white'
        : 'text-brand-charcoal hover:bg-brand-cream-dark'
    }`}
  >
    {children}
    <span className="ml-3">{label}</span>
  </button>
);

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeView, setView, onNavigate }) => {
  return (
    <aside className="w-64 bg-white h-screen sticky top-0 shadow-lg flex flex-col">
      <div className="px-6 py-4 border-b">
        <h2 className="text-2xl font-serif text-brand-brown">Aura / Админ</h2>
      </div>
      <nav className="flex-grow mt-6">
        <NavLink label="Аналитика" isActive={activeView === 'dashboard'} onClick={() => setView('dashboard')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </NavLink>
        <NavLink label="Товары" isActive={activeView === 'products'} onClick={() => setView('products')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
        </NavLink>
        <NavLink label="Блог" isActive={activeView === 'blog'} onClick={() => setView('blog')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
        </NavLink>
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={() => onNavigate({ page: 'home' })}
          className="w-full flex items-center px-4 py-3 text-brand-charcoal hover:bg-brand-cream-dark transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="ml-3">Вернуться на сайт</span>
        </button>
      </div>
    </aside>
  );
};
