import type { Config } from "tailwindcss";

/**
 * Tailwind is layered onto the existing design system in globals.css.
 * Supports both class-based dark mode (.dark) and [data-theme="dark"].
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '.dark, [data-theme="dark"]'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface: "var(--bg-raised)",
        border: "var(--border)",
        foreground: "var(--text)",
        muted: "var(--text-dim)",
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
        },
        danger: "var(--danger)",
        link: "var(--link)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      borderRadius: {
        glass: "18px",
      },
      boxShadow: {
        glass: "inset 0 1px 0 var(--glass-highlight), var(--glass-shadow)",
      },
      backdropBlur: {
        glass: "20px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Overpass", "Fira Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "Fira Code", "monospace"],
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        bebas: ["var(--font-bebas)", "Bebas Neue", "Impact", "sans-serif"],
        display: ["var(--font-bebas)", "Bebas Neue", "Impact", "sans-serif"],
      },
    },
  },
};

export default config;
