import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f1419",
          raised: "#1a2332",
          border: "#2d3a4f",
        },
        accent: {
          DEFAULT: "#3b82f6",
          muted: "#60a5fa",
        },
        phase: {
          despair: "#8B0000",
          hope: "#2E8B57",
          growth: "#1E90FF",
          optimism: "#DAA520",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
