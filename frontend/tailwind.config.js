/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0A0F1E',
          50: '#1A2235',
          100: '#141929',
        },
        amber: {
          bch: '#F59E0B',
          light: '#FCD34D',
        },
        slate: {
          bch: '#64748B',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
