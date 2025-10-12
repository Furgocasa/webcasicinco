import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          50: '#FFF5F2',
          100: '#FFE8E0',
          200: '#FFD1C2',
          300: '#FFB094',
          400: '#FF8B5F',
          500: '#FF6B35',
          600: '#F54D14',
          700: '#CC3A0A',
          800: '#A32F08',
          900: '#7A2306',
        },
        secondary: {
          DEFAULT: '#004E89',
          50: '#E6F0F7',
          100: '#CCE1EF',
          200: '#99C3DF',
          300: '#66A5CF',
          400: '#3387BF',
          500: '#004E89',
          600: '#003E6E',
          700: '#002F52',
          800: '#001F37',
          900: '#00101B',
        },
        accent: {
          DEFAULT: '#FFD23F',
          50: '#FFFBF0',
          100: '#FFF7E0',
          200: '#FFEFC2',
          300: '#FFE794',
          400: '#FFDC66',
          500: '#FFD23F',
          600: '#F5C00A',
          700: '#C29600',
          800: '#8F6F00',
          900: '#5C4700',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
