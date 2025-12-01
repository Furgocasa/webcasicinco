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
        // Colores de marca Casi Cinco
        brand: {
          blue: '#002297',
          'blue-dark': '#052d5a',
          'blue-darker': '#042143',
          yellow: '#ffd935',
          'yellow-dark': '#e6c430',
          'yellow-light': '#ffe566',
          gray: '#d6d8d7',
        },
        // Colores legacy (mantener compatibilidad)
        primary: {
          DEFAULT: '#002297',
          50: '#e7eef5',
          100: '#cfdceb',
          200: '#9fb9d7',
          300: '#6f97c3',
          400: '#3f74af',
          500: '#002297',
          600: '#052e5a',
          700: '#042244',
          800: '#03172d',
          900: '#020b17',
        },
        secondary: {
          DEFAULT: '#ffd935',
          50: '#fffef5',
          100: '#fffceb',
          200: '#fff9d7',
          300: '#fff5c2',
          400: '#fff2ae',
          500: '#ffd935',
          600: '#e6c430',
          700: '#ccaf2a',
          800: '#b39a25',
          900: '#998520',
        },
        accent: {
          DEFAULT: '#d6d8d7',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e3e3e3',
          400: '#d6d8d7',
          500: '#c4c6c5',
          600: '#a8aaa9',
          700: '#8c8e8d',
          800: '#707271',
          900: '#545655',
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
