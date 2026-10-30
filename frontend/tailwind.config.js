/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#050814',
          card: 'rgba(15, 23, 42, 0.75)',
          border: 'rgba(56, 189, 248, 0.2)',
          borderHighlight: 'rgba(139, 92, 246, 0.4)',
          cyan: '#00F0FF',
          blue: '#0A84FF',
          purple: '#8B5CF6',
          purpleDark: '#6D28D9',
          danger: '#FF3366',
          warning: '#F59E0B',
          success: '#10B981',
          muted: '#94A3B8'
        }
      },
      backgroundImage: {
        'cyber-gradient': 'radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.15) 0%, rgba(139, 92, 246, 0.08) 40%, rgba(5, 8, 20, 1) 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 240, 255, 0.2), rgba(139, 92, 246, 0.15), transparent 70%)',
      },
      boxShadow: {
        'cyber-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.3)',
        'cyber-purple': '0 0 25px -5px rgba(139, 92, 246, 0.3)',
        'cyber-danger': '0 0 25px -5px rgba(255, 51, 102, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 240, 255, 0.6), 0 0 40px rgba(139, 92, 246, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
