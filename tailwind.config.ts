
import type { Config } from 'tailwindcss';
import { Z_INDEX } from './lib/zIndex';

const config: Config = {
  darkMode: 'class',
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

        // Aura "Evening" Dark Theme Palette
        'aura-dark-base': '#141311',      // Deep Warm Charcoal
        'aura-dark-surface': '#1F1D1B',   // Cards, Modals
        'aura-dark-surface-2': '#2A2826', // Hover, Inputs
        'aura-dark-text-main': '#EBEBE9', // Soft White (dimmed)
        'aura-dark-text-sec': '#9E9A95',  // Warm Gray
        'aura-dark-text-muted': '#6A6763',// Muted (Refined to reduce noise)
        'aura-dark-border': '#2E2C29',    // Subtle Border

        // Legacy support (mapping to new system where possible to prevent crashes)
        'brand-cream': '#F7F7F5',
        'brand-cream-dark': '#EBEBE9',
        'brand-brown': '#1C1C1C',
        'brand-charcoal': '#1C1C1C',
        'brand-terracotta': '#C8BEB2',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Основной шрифт для всего
        serif: ['Playfair Display', 'serif'], // Акцентный шрифт для заголовков
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
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'bounce-slow': 'bounce 3s infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(-5%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
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
