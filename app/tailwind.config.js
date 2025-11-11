/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
          "primary": "#13a4ec",
          "background-light": "#f6f7f8",
          "background-dark": "#101c22",
      },
      fontFamily: {
          "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
      }
    },
  },
  plugins: [],
}
