/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          50: '#EBEAFD',
          100: '#D7D5FB',
          200: '#AFABF7',
          300: '#8781F3',
          400: '#5F57EF',
          500: '#4F46E5',
          600: '#3730A3',
          700: '#312E81',
          800: '#1E1B4B',
          900: '#0F0D2E',
        },
        surface: {
          dark: '#09090B',
          light: '#F8FAFC',
          gray: '#18181B',
          'gray-light': '#27272A',
        },
        success: {
          DEFAULT: '#10B981',
          50: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
        },
        danger: {
          DEFAULT: '#E11D48',
          50: '#FEE2E2',
          500: '#EF4444',
          600: '#E11D48',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'shrink': {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'shrink': 'shrink linear',
      },
    },
  },
  plugins: [],
}

