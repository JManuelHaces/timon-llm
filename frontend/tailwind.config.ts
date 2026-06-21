import type { Config } from "tailwindcss";

// Identidad de Timón: consola de mando náutica.
// abyss = mar profundo · hull = casco/paneles · brass = latón del timón · tide = bioluminiscencia.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss: {
          DEFAULT: "#060912",
          900: "#060912",
          800: "#0a101d",
          700: "#0e1626",
          600: "#131e33",
        },
        hull: {
          DEFAULT: "#111a2b",
          light: "#16223a",
          border: "#22324f",
        },
        foam: {
          DEFAULT: "#e8eef7",
          dim: "#9fb0c9",
          faint: "#5b6b85",
        },
        brass: {
          DEFAULT: "#e0a85a",
          light: "#f2c885",
          dark: "#b07e34",
        },
        tide: {
          DEFAULT: "#2dd4bf",
          light: "#5eead4",
          dark: "#0f9b8a",
        },
        coral: "#ff6b6b",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(45,212,191,0.15), 0 8px 40px -12px rgba(45,212,191,0.25)",
        brass: "0 0 0 1px rgba(224,168,90,0.2), 0 8px 40px -12px rgba(224,168,90,0.35)",
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 60px -24px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        horizon: "radial-gradient(120% 120% at 50% -20%, #16223a 0%, #0a101d 45%, #060912 100%)",
        "brass-sheen": "linear-gradient(135deg, #f2c885 0%, #e0a85a 40%, #b07e34 100%)",
      },
      keyframes: {
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        sweep: {
          "0%": { transform: "rotate(0deg)", opacity: "0.0" },
          "10%": { opacity: "0.9" },
          "100%": { transform: "rotate(360deg)", opacity: "0.0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        blink: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
      },
      animation: {
        "spin-slow": "spin-slow 24s linear infinite",
        sweep: "sweep 4s linear infinite",
        rise: "rise 0.4s ease-out both",
        "pulse-glow": "pulseGlow 2.4s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};

export default config;
