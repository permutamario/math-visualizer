/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "!./src/vendors/**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
