import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
          950: "#0c2d3a",
        },
        accent: {
          DEFAULT: "#2563eb",
          light: "#3b82f6",
          dark: "#1d4ed8",
        },
        navy: {
          DEFAULT: "#0c4a6e",
          light: "#0369a1",
          dark: "#082f49",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
