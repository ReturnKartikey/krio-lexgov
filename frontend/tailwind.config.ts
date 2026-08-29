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
        // Brivo direct token names
        "brivo-navy": "#1a2333",
        "brivo-void": "#0b1020",
        "brivo-cyan": "#00c2d1",
        "brivo-mist": "#d9f5f8",
        "brivo-slate": "#98a2b3",
        "brivo-paper": "#faf8fc",
        brivo: {
          navy: "#1a2333",
          void: "#0b1020",
          cyan: "#00c2d1",
          mist: "#d9f5f8",
          slate: "#98a2b3",
          paper: "#faf8fc",
        },
        // Semantic roles mapped to Brivo tokens
        background: "#faf8fc",
        foreground: "#1a2333",
        surface: {
          DEFAULT: "#ffffff",
          hover: "#f5f3f9",
          elevated: "#ffffff",
          card: "#ffffff",
          border: "rgba(26, 35, 51, 0.10)",
          hairline: "rgba(26, 35, 51, 0.08)",
        },
        accent: {
          DEFAULT: "#00c2d1",
          hover: "#00aab7",
          glow: "rgba(0, 194, 209, 0.25)",
          subtle: "#d9f5f8",
          blue: "#00c2d1",
        },
        muted: {
          DEFAULT: "#98a2b3",
          light: "#d9f5f8",
          dark: "#1a2333",
        },
        status: {
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#00c2d1",
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
