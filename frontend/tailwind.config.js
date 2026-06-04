/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'emerald': {
          '50': '#f0fdf4',
          '400': '#4ade80',
          '500': '#22c55e',
          '800': '#166534',
          '900': '#064e3b',
          '950': '#052e16',
        },
        'zinc': {
          '200': '#e4e4e7',
          '300': '#d4d4d8',
          '400': '#a1a1aa',
          '500': '#71717a',
          '600': '#52525b',
          '900': '#18181b',
          '950': '#09090b',
        }
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        }
      }
    },
  },
  plugins: [],
}
