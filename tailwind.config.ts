import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0b0e11',
        card: '#1e2329',
        elevated: '#2b3139',
        primary: '#fcd535',
        'primary-active': '#f0b90b',
        'on-primary': '#181a20',
        'on-dark': '#ffffff',
        body: '#eaecef',
        muted: '#707a8a',
        hairline: '#2b3139',
        up: '#0ecb81',
        down: '#f6465d',
        ink: '#181a20',
        light: '#ffffff'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace']
      },
      borderRadius: {
        btn: '6px',
        input: '8px',
        card: '12px'
      }
    }
  },
  plugins: []
};

export default config;
