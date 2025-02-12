/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
	  colors: {
        'custom-blue': '#1E3A8A', // Replace with your preferred blue shade
        'custom-gold': '#D4AF37', // Replace with your preferred gold shade
        'custom-white': '#FFFFFF', // White
      },
	},
  },
  plugins: [],
};
