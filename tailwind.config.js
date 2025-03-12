/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          600: '#2563eb',
          700: '#0f172a',
          800: '#0f1629',
          900: '#0a0f1a',
        }
      }
    }
  },
  plugins: [],
} 