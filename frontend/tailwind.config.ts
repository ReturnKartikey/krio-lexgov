import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brivo direct token names — Bloomberg & Cobalt (Cool Archival Alabaster & Royal Blue)
        "brivo-navy": "#090d16",
        "brivo-void": "#030712",
        "brivo-cyan": "#2563eb",
        "brivo-mist": "#edf2f7",
        "brivo-slate": "#475467",
        "brivo-paper": "#f8fafc",
        brivo: {
          navy: "#090d16",
          void: "#030712",
          cyan: "#2563eb",
          mist: "#edf2f7",
          slate: "#475467",
          paper: "#f8fafc",
        },
        // Semantic roles mapped to Brivo tokens
        background: "#f8fafc",
        foreground: "#090d16",
        surface: {
          DEFAULT: "#ffffff",
          hover: "#f1f5f9",
          elevated: "#ffffff",
          card: "#ffffff",
          border: "#e2e8f0",
          hairline: "rgba(9, 13, 22, 0.08)",
        },
        accent: {
          DEFAULT: "#090d16",
          hover: "#1e293b",
          glow: "rgba(37, 99, 235, 0.15)",
          subtle: "#edf2f7",
          blue: "#2563eb",
          red: "#be123c",
        },
        muted: {
          DEFAULT: "#475467",
          light: "#edf2f7",
          dark: "#090d16",
        },
        status: {
          success: "#059669",
          warning: "#d97706",
          danger: "#be123c",
          info: "#2563eb",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "sans-serif"],
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": "0.65rem",
        "micro": "0.7rem",
      },
      letterSpacing: {
        widest: "0.2em",
        ultra: "0.3em",
      },
      borderWidth: {
        hairline: "1px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "pulse-subtle": "pulseSubtle 3s infinite ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
