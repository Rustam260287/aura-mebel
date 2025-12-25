
import type { Config } from 'tailwindcss';
import { Z_INDEX } from './lib/zIndex';

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", 
  ],
  theme: {
    extend: {
      colors: {
        // Основная палитра LABEL
        'warm-white': '#F7F7F5', // Фон (основа)
        'soft-black': '#1C1C1C', // Основной текст / Кнопки
        'muted-gray': '#8A8A8A', // Вторичный текст
        'stone-beige': '#C8BEB2', // Акцент (редко)
        
        // Legacy support (mapping to new system where possible to prevent crashes)
        'brand-cream': '#F7F7F5', 
        'brand-cream-dark': '#EBEBE9',
        'brand-brown': '#1C1C1C', 
        'brand-charcoal': '#1C1C1C',
        'brand-terracotta': '#C8BEB2', 
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Основной шрифт для всего
        serif: ['Inter', 'sans-serif'], // Убираем засечки, используем Inter везде
      },
      borderRadius: {
        'lg': '14px', // Для кнопок (12-16px)
        'xl': '20px', // Для карточек
        '2xl': '24px',
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(28, 28, 28, 0.05)', // Очень мягкая тень
      },
      zIndex: {
        base: `${Z_INDEX.base}`,
        cta: `${Z_INDEX.cta}`,
        header: `${Z_INDEX.header}`,
        ar: `${Z_INDEX.ar}`,
        menuOverlay: `${Z_INDEX.mobileMenuOverlay}`,
        menuButton: `${Z_INDEX.mobileMenuButton}`,
        modal: `${Z_INDEX.systemModal}`,
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
            '0%': { opacity: '0', transform: 'scale(0.98)' },
            '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
