import React from 'react';

interface AdminHeaderProps {
    onMenuClick: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm md:hidden">
            <button
                onClick={onMenuClick}
                className="p-2 text-brand-charcoal hover:text-brand-brown"
                aria-label="Открыть меню"
            >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
            <div className="text-lg font-serif text-brand-brown">
                Aura / Админ-панель
            </div>
        </header>
    );
};