
import type { Config } from 'tailwindcss';

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
        'brand-cream': '#F9F8F6', // More warm and light background
        'brand-cream-dark': '#F0EBE5', // For panels and highlights
        'brand-brown': '#59443B', // Classic deep chocolate brown
        'brand-brown-light': '#8C7568', // Lighter brown for secondary text
        'brand-charcoal': '#3E3836', // Warm dark gray, almost black
        'brand-terracotta': '#AF4E2E', // Kept for accents like sales tags or errors
        'brand-gold': '#C6A87C', // Muted gold for stars and icons
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'], // Serif for headings
      },
      boxShadow: {
        'soft': '0 4px_20px -2px rgba(89, 68, 59, 0.08)', // Brown-tinted shadow
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
            '0%': { opacity: '0', transform: 'scale(0.97)' },
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
