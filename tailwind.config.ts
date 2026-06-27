import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          950: "#0a0f0d",
          900: "#0f1a14",
          800: "#1a2e20",
        },
      },
    },
  },
  plugins: [],
};

export default config;
