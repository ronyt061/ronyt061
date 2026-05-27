import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif"
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace"
        ]
      },
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b9b9c1",
          400: "#8a8a95",
          500: "#5d5d68",
          600: "#3f3f48",
          700: "#2a2a31",
          800: "#1a1a1f",
          900: "#0e0e12"
        }
      },
      keyframes: {
        in: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } }
      },
      animation: {
        in: "in 120ms ease-out",
        fade: "fade 150ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
