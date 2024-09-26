/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
    theme: {
    extend: {},
  },
  plugins: [require('daisyui'), 'decorators-legacy'
    
  ],
  daisyui: {
    themes: ["light", "dark", "cupcake", "retro", "cyberpunk"],
  },
}