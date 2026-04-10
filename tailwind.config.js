/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5', // Brand color
          700: '#4338ca',
        },
        surface: '#ffffff',
        background: '#f8fafc',
        border: '#e2e8f0',
        content: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#94a3b8',
        }
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'float': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'inner-subtle': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        slideUp: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
