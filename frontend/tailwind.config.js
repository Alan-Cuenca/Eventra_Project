/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ev-surface': 'rgb(var(--ev-surface-rgb, 255 255 255) / <alpha-value>)',
        'ev-primary': 'rgb(var(--ev-primary-rgb, 82 111 125) / <alpha-value>)',
        'ev-bg-base': 'rgb(var(--ev-bg-base-rgb, 238 235 221) / <alpha-value>)',
        'ev-border': 'rgb(var(--ev-border-rgb, 203 198 182) / <alpha-value>)',
        'ev-text-main': 'rgb(var(--ev-text-main-rgb, 35 61 73) / <alpha-value>)',
      },
      boxShadow: {
        'liquid-glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6), 0 10px 25px -5px rgba(35, 61, 73, 0.1)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.bg-\\[var\\(--ev-surface\\)\\]\\/80': {
          'background-color': 'rgb(var(--ev-surface-rgb, 255 255 255) / 0.8)',
        },
        '.bg-\\[var\\(--ev-surface\\)\\]\\/75': {
          'background-color': 'rgb(var(--ev-surface-rgb, 255 255 255) / 0.75)',
        },
        '.bg-\\[var\\(--ev-surface\\)\\]\\/85': {
          'background-color': 'rgb(var(--ev-surface-rgb, 255 255 255) / 0.85)',
        },
        '.bg-\\[var\\(--ev-surface\\)\\]\\/90': {
          'background-color': 'rgb(var(--ev-surface-rgb, 255 255 255) / 0.9)',
        },
        '.bg-\\[var\\(--ev-surface\\)\\]\\/92': {
          'background-color': 'rgb(var(--ev-surface-rgb, 255 255 255) / 0.92)',
        },
        '.bg-\\[var\\(--ev-surface\\)\\]\\/95': {
          'background-color': 'rgb(var(--ev-surface-rgb, 255 255 255) / 0.95)',
        },
      });
    }
  ],
}
