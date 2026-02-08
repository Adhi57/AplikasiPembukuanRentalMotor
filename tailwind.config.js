/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
        colors: {
        gray: {
          100: '#f7f7f7', // Pure neutral gray
          500: '#808080',
          900: '#1a1a1a',
        },
      },
    },
  },
  plugins: [],
}
