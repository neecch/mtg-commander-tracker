// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Indica a Tailwind dove trovare le classi che usi (tutti i file in src/)
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}