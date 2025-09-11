module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include all JS/TS files in the src folder
    "./index.html", // Include the main HTML file
  ],
  theme: {
    extend: {
      // Add custom Tailwind theme configurations here (e.g., colors, fonts)
      colors: {
        primary: '#3880ff', // Ionic primary color
        secondary: '#3dc2ff',
        tertiary: '#5260ff',
      },
    },
  },
  plugins: [],
};