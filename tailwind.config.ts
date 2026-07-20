import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-display)", "system-ui", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      defaultTheme: "light",
      themes: {
        light: {
          colors: {
            background: "#F4F4F5",
            foreground: "#18181B",
            content1: "#FFFFFF",
            content2: "#FFFFFF",
            content3: "#F4F4F5",
            primary: {
              50: "#E8F7EF",
              100: "#C5ECD6",
              DEFAULT: "#0F8A52",
              foreground: "#FFFFFF",
            },
            focus: "#0F8A52",
          },
        },
      },
    }),
  ],
};

export default config;
