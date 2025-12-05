/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Film photography inspired color palette
        'film-black': '#1a1a1a',
        'film-gray': '#2d2d2d',
        'film-silver': '#e5e5e5',
        'film-red': '#dc2626',
        'film-amber': '#f59e0b',
        'film-cyan': '#06b6d4',
      },
    },
  },
  plugins: [],
}
