/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media', // Enable dark mode based on system preference
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Film photography inspired color palette - simplified
        'film-orange': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#FF6600', // Base color as 600
          700: '#E55A00',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        'fg': '#2d2d2d',
        'bg': '#F8F7F5',
      },
    },
  },
  plugins: [],
}
