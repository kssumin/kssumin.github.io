import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f4f4f4',
          200: '#e8e8e8',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        blue: {
          50: '#e8eeff',
          600: '#2c5eff',
          800: '#1f43c2',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        h1: ['46px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        h2: ['30px', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '600' }],
        h3: ['22px', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        lead: ['20px', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        body: ['19px', { lineHeight: '1.75', letterSpacing: '-0.005em' }],
        sm: ['16px', { lineHeight: '1.55', letterSpacing: '-0.005em' }],
        caption: ['13px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
        code: ['16px', { lineHeight: '1.5', letterSpacing: '0' }],
      },
      spacing: {
        's-1': '4px',
        's-2': '8px',
        's-3': '12px',
        's-4': '16px',
        's-5': '24px',
        's-6': '32px',
        's-7': '48px',
        's-8': '64px',
      },
      maxWidth: {
        reading: '720px',
        article: '860px',
      },
    },
  },
  plugins: [],
};

export default config;
