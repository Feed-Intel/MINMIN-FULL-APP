import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    '../../web/app/**/*.{ts,tsx}',
    '../../web/components/**/*.{ts,tsx}',
    '../../web/pages/**/*.{ts,tsx}',
    './node_modules/@minmin/theme/dist/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-sans)'] },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--muted-text)',
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-fg)',
        },
        accent: 'var(--accent)',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [animate],
};

export default config;
