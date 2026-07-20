import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
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
            primary: {
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
