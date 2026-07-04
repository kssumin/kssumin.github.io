import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          0: 'var(--ink-0)',
          50: 'var(--ink-50)',
          100: 'var(--ink-100)',
          200: 'var(--ink-200)',
          300: 'var(--ink-300)',
          400: 'var(--ink-400)',
          500: 'var(--ink-500)',
          600: 'var(--ink-600)',
          700: 'var(--ink-700)',
          800: 'var(--ink-800)',
          900: 'var(--ink-900)',
          950: 'var(--ink-950)',
        },
        blue: {
          50: 'var(--blue-50)',
          600: 'var(--blue-600)',
          800: 'var(--blue-800)',
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
        's-9': '88px',
        's-10': '128px',
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
