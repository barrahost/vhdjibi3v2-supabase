/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#F0F9F8',
          100: '#D9F0EE',
          200: '#B3E0DB',
          300: '#7FCEC8',
          400: '#4DBAB2',
          500: '#00877A',
          600: '#007267',
          700: '#00665C',
          800: '#00524A',
          900: '#00443C',
        },
      },
    },
  },
  plugins: [],
};