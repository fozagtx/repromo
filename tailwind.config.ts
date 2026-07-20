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
      defaultTheme: "dark",
      themes: {
        dark: {
          colors: {
            background: "#000000",
            foreground: "#FAFAFA",
            primary: {
              DEFAULT: "#FFFFFF",
              foreground: "#000000",
            },
            focus: "#FFFFFF",
          },
        },
      },
    }),
  ],
};

export default config;
