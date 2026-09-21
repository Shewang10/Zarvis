/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: '#040711',
          panel: 'rgba(8, 16, 32, 0.75)',
          border: 'rgba(0, 240, 255, 0.25)',
          cyan: '#00f0ff',
          blue: '#0088ff',
          gold: '#ffd000',
          amber: '#ff9900',
          green: '#00ff88',
          red: '#ff3366',
          text: '#e2f4ff',
          muted: '#5a7894',
        },
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        hud: ['"Orbitron"', '"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.4), inset 0 0 15px rgba(0, 240, 255, 0.1)',
        'glow-blue': '0 0 15px rgba(0, 136, 255, 0.4)',
        'glow-gold': '0 0 15px rgba(255, 208, 0, 0.4)',
        'glow-green': '0 0 15px rgba(0, 255, 136, 0.4)',
        'glow-red': '0 0 15px rgba(255, 51, 102, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spin 18s linear infinite reverse',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
}

