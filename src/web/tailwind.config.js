// tailwind.config.js
/** @type {import('tailwindcss').Config} */

import scrollbar from "tailwind-scrollbar";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "320px", // tương đương 20rem
      },
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        secondaryLight: "var(--color-secondary-light)",
        textPrimary: "var(--color-text-primary)",
      },
    },
  },
  plugins: [scrollbar],
  darkMode: "class",
};
