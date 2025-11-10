/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // На будущее, если будете использовать App Router
  ],
  theme: {
    extend: {
      colors: {
        'brand-cream': '#FBF9F4',
        'brand-cream-dark': '#F0EDE5',
        'brand-brown': '#5D4037',
        'brand-charcoal': '#374151',
        'brand-terracotta': '#AF4E2E',
        'brand-terracotta-dark': '#944225',
        'brand-gold': '#DAA520',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      animation: {
        'subtle-fade-in': 'subtle-fade-in 0.8s ease-out forwards',
        'subtle-fade-out': 'subtle-fade-out 0.4s ease-in forwards',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'fade-in-right': 'fade-in-right 0.6s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.4s ease-out forwards',
        'jiggle': 'jiggle 0.5s ease-in-out',
        'shimmer': 'shimmer 1.5s infinite linear',
        'pop': 'pop 0.5s ease-out',
        'heart-pop': 'heart-pop 0.4s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'subtle-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'subtle-fade-out': {
            '0%': { opacity: '1', transform: 'translateY(0)' },
            '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
            '0%': { opacity: '0', transform: 'scale(0.97)' },
            '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in-right': {
            '0%': { opacity: '0', transform: 'translateX(25px)' },
            '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'jiggle': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pop': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        'heart-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        'pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': {
            transform: 'scale(1.03)',
            opacity: '.9'
          }
        },
      },
      minHeight: {
        'screen-ios': 'calc(var(--vh, 1vh) * 100)',
      },
    },
  },
  plugins: [],
}
