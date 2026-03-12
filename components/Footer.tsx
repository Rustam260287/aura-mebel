import React, { memo } from 'react';
import Link from 'next/link';

const FooterComponent: React.FC = () => {
  return (
    <footer className="bg-warm-white/45 backdrop-blur-md border-t border-stone-beige/15 pt-10 pb-8 text-soft-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[12px] uppercase tracking-[0.18em] text-muted-gray">
              Aura
            </div>
            <p className="text-sm text-muted-gray leading-relaxed font-light max-w-sm">
              Спокойная примерка мебели в вашем интерьере.
              <br />
              Без давления, без спешки.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-gray">
            <Link href="/privacy" className="hover:text-soft-black transition-colors">
              Политика конфиденциальности
            </Link>
            <Link href="/terms" className="hover:text-soft-black transition-colors">
              Условия использования
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-5 border-t border-stone-beige/15 text-xs text-muted-gray">
          © 2026 AURA
        </div>
      </div>
    </footer>
  );
};

export const Footer = memo(FooterComponent);
