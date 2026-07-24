/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1B2436',
          light: '#2B3650',
          soft: '#4B5673',
        },
        paper: '#FAFAF7',
        line: '#E4E1D8',
        teal: {
          DEFAULT: '#2F6F63',
          light: '#3E8C7D',
          soft: '#DCEBE7',
        },
        amber: {
          DEFAULT: '#C6862F',
          soft: '#F4E7D2',
        },
        rust: {
          DEFAULT: '#B54A3F',
          soft: '#F2DEDB',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
