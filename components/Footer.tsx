import React, { memo } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

const FooterComponent: React.FC = () => {
  return (
    <footer className="bg-warm-white/50 backdrop-blur-md border-t border-stone-beige/20 pt-12 pb-10 text-soft-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
          <div className="space-y-4">
            <Logo variant="dark" />
            <p className="text-sm text-muted-gray leading-relaxed font-light max-w-sm">
              AURA — спокойная примерка мебели в вашем интерьере.<br />
              Можно смотреть, сохранять и возвращаться без давления.
            </p>
          </div>

          <nav className="flex flex-col gap-3 text-sm text-muted-gray">
            <Link href="/contacts" className="hover:text-soft-black transition-colors">
              Контакты
            </Link>
            <Link href="/privacy" className="hover:text-soft-black transition-colors">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="hover:text-soft-black transition-colors">
              Условия использования
            </Link>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-beige/20 text-xs text-muted-gray">
          © 2026 AURA
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);
