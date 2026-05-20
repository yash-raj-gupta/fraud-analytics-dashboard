import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Banking-style palette
        ink: {
          50: "#f8f9fb",
          100: "#eef1f6",
          200: "#d9dfeb",
          300: "#b6c0d3",
          400: "#8694b1",
          500: "#5e6e8e",
          600: "#475573",
          700: "#36425a",
          800: "#232c3f",
          900: "#141a28",
          950: "#0a0e18",
        },
        accent: {
          DEFAULT: "#1f6feb",
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#b9d6ff",
          300: "#8bbaff",
          400: "#5a96ff",
          500: "#1f6feb",
          600: "#1556c2",
          700: "#0f4499",
          800: "#0c3675",
          900: "#0a2a59",
        },
        danger: {
          DEFAULT: "#dc2626",
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#dc2626",
          600: "#b91c1c",
          700: "#991b1b",
        },
        success: { DEFAULT: "#059669", 100: "#d1fae5", 500: "#059669", 600: "#047857" },
        warning: { DEFAULT: "#d97706", 100: "#fef3c7", 500: "#d97706", 600: "#b45309" },
        gold: { DEFAULT: "#b8860b", 500: "#b8860b" },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)",
        elevated: "0 8px 24px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
