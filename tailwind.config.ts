import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bcel-red': '#b71113',
        'bcel-red2': '#8a0c0d',
        'bcel-gold': '#C99A00',
        'bcel-gold2': '#A07800',
        'bcel-green': '#0B9E5E',
        'bcel-bg': '#F2F4F7',
        'bcel-border': '#E2E6EE',
      },
      fontFamily: {
        notoSansLao: ['Noto Sans Lao', 'Times New Roman', 'serif'],
        sarabun: ['Sarabun', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Vidaloka'],
      },
    },
  },
  plugins: [],
}
export default config
