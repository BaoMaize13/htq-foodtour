import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: '#8B1538',
        'burgundy-dark': '#5C0A1F',
        'burgundy-deep': '#3A0915',
        'burgundy-bg': '#1a0a0f',
        gold: '#FFD700',
        'gold-dark': '#D4AF37',
        'gold-muted': '#C49F2F',
      },
    },
  },
  plugins: [],
} satisfies Config
