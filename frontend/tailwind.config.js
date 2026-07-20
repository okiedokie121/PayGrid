/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: "#0a0b0d",
        bgSurface: "#131519",
        bgSurfaceHover: "#1a1d22",
        borderSubtle: "#22262c",
        accentPrimary: "#c9a15a",
        accentSecondary: "#5b9df0",
        accentSuccess: "#34d399",
        accentWarning: "#f2994a",
        accentDanger: "#ef5350",
        textPrimary: "#ffffff",
        textSecondary: "#9a9ca3",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
