import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E17',
        surface: '#111827',
        raised: '#161F30',
        bd: '#232C42',
        txt: '#E9EDF5',
        dim: '#8B93A8',
        faint: '#57607A',
        accent: '#4E6EF2',
        avail: '#34D399',
        charge: '#FBBF24',
        reserve: '#A78BFA',
        off: '#F87171',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        data: ['var(--font-data)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
