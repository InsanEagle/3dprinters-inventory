import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        paper: "#f7f8fb",
        accent: "#2457d6"
      },
      boxShadow: {
        soft: "0 12px 36px rgba(23, 32, 51, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
