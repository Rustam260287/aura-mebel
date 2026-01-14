import React from 'react';
import {
  ArrowLeftIcon,
  ArrowsUpDownIcon,
  ChatBubbleLeftRightIcon,
  CubeIcon,
  CubeTransparentIcon,
  EyeIcon,
  HeartIcon,
  PhoneIcon,
  PhotoIcon,
  SlidersHorizontalIcon,
  ChartBarIcon,
} from '../icons';
import type { View, AdminView } from '../../types';

interface AdminSidebarProps {
  activeView: AdminView;
  setView: (view: AdminView) => void;
  onNavigate: (view: View) => void;
  role: 'owner' | 'manager' | null;
  isOpen: boolean;
  onClose: () => void;
}

const NavLink: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 ${isActive
      ? 'bg-brand-brown text-white'
      : 'text-brand-charcoal hover:bg-brand-cream-dark'
      }`}
  >
    {children}
    <span className="ml-3">{label}</span>
  </button>
);

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  setView,
  onNavigate,
  role,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-lg flex flex-col transition-transform transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-2xl font-serif text-brand-brown">Aura Control</h2>
        </div>
        <nav className="flex-grow mt-6">
          <div className="px-4 pb-2 text-xs uppercase tracking-wider text-muted-gray">
            Опыт
          </div>
          {role !== 'manager' ? (
            <>
              <NavLink label="Аналитика (beta)" isActive={activeView === 'analytics'} onClick={() => setView('analytics')}>
                <ChartBarIcon className="h-6 w-6" />
              </NavLink>
              <NavLink label="Путь посетителей" isActive={activeView === 'journey'} onClick={() => setView('journey')}>
                <ArrowsUpDownIcon className="h-6 w-6" />
              </NavLink>
              <NavLink
                label="Объекты → интерес"
                isActive={activeView === 'objectInterest'}
                onClick={() => setView('objectInterest')}
              >
                <SlidersHorizontalIcon className="h-6 w-6" />
              </NavLink>
              <NavLink
                label="Сохранено (агрегировано)"
                isActive={activeView === 'savedInsights'}
                onClick={() => setView('savedInsights')}
              >
                <HeartIcon className="h-6 w-6" />
              </NavLink>
            </>
          ) : (
            <NavLink
              label="Запросы менеджеру (hand-off)"
              isActive={activeView === 'handoffContacts'}
              onClick={() => setView('handoffContacts')}
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </NavLink>
          )}

          {role !== 'manager' && (
            <>
              <div className="mt-6 px-4 pb-2 text-xs uppercase tracking-wider text-muted-gray">
                Контент
              </div>
              <NavLink label="Объекты" isActive={activeView === 'objects'} onClick={() => setView('objects')}>
                <CubeIcon className="h-6 w-6" />
              </NavLink>
              <NavLink
                label="Конфигурации"
                isActive={activeView === 'scenes'}
                onClick={() => setView('scenes')}
              >
                <CubeIcon className="h-6 w-6" />
              </NavLink>
              <NavLink label="Визуальная примерка" isActive={activeView === 'assets'} onClick={() => setView('assets')}>
                <CubeTransparentIcon className="h-6 w-6" />
              </NavLink>
              <NavLink label="Медиа" isActive={activeView === 'media'} onClick={() => setView('media')}>
                <PhotoIcon className="h-6 w-6" />
              </NavLink>
              <NavLink
                label="Hand-off настройки"
                isActive={activeView === 'handoff'}
                onClick={() => setView('handoff')}
              >
                <PhoneIcon className="h-6 w-6" />
              </NavLink>
            </>
          )}
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
    </>
  );
};
