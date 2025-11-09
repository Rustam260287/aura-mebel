import React, { memo } from 'react';
import type { View } from '../types';

interface FooterProps {
  onNavigate: (view: View) => void;
}

const FooterComponent: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNavClick = (e: React.MouseEvent, view: View) => {
    e.preventDefault();
    onNavigate(view);
  };

  return (
    <footer className="bg-brand-cream-dark mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-serif text-brand-brown mb-4">Aura</h3>
            <p className="text-brand-charcoal/80">Мебель, вдохновленная уютом и людьми.</p>
          </div>
          <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Навигация</h4>
            <ul className="space-y-2">
              <li><a href="#" onClick={(e) => handleNavClick(e, { page: 'catalog' })} className="text-brand-charcoal/80 hover:text-brand-brown">Каталог</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, { page: 'ai-designer' })} className="text-brand-charcoal/80 hover:text-brand-brown">Интерьеры</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, { page: 'blog-list' })} className="text-brand-charcoal/80 hover:text-brand-brown">Блог</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, { page: 'about' })} className="text-brand-charcoal/80 hover:text-brand-brown">О нас</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, { page: 'contacts' })} className="text-brand-charcoal/80 hover:text-brand-brown">Контакты</a></li>
              <li><a href="#" onClick={(e) => handleNavClick(e, { page: 'admin' })} className="text-brand-charcoal/80 hover:text-brand-brown">Админ-панель</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Поддержка</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-brand-charcoal/80 hover:text-brand-brown">Доставка и оплата</a></li>
              <li><a href="#" className="text-brand-charcoal/80 hover:text-brand-brown">Возврат</a></li>
              <li><a href="#" className="text-brand-charcoal/80 hover:text-brand-brown">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-brand-charcoal mb-4">Подпишитесь на нас</h4>
            <div className="flex space-x-4">
              {/* Social media icons can be added here */}
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-brand-brown/20 pt-8 text-center text-sm text-brand-charcoal/60">
          &copy; {new Date().getFullYear()} Aura Мебель. Все права защищены.
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);