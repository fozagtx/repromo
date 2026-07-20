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
              50: "#F4F4F5",
              100: "#E4E4E7",
              DEFAULT: "#18181B",
              foreground: "#FFFFFF",
            },
            focus: "#18181B",
          },
        },
      },
    }),
  ],
};

export default config;
