import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const BLACK = "#18181B";
const WHITE = "#FFFFFF";
const WASH = "#F4F4F5";

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
      colors: {
        brand: {
          DEFAULT: BLACK,
          foreground: WHITE,
        },
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
            background: WASH,
            foreground: BLACK,
            content1: WHITE,
            content2: WHITE,
            content3: WASH,
            divider: "#E4E4E7",
            focus: BLACK,
            primary: {
              50: WASH,
              100: "#E4E4E7",
              200: "#D4D4D8",
              300: "#A1A1AA",
              400: "#71717A",
              500: BLACK,
              600: BLACK,
              700: BLACK,
              800: BLACK,
              900: BLACK,
              DEFAULT: BLACK,
              foreground: WHITE,
            },
            secondary: {
              DEFAULT: BLACK,
              foreground: WHITE,
            },
            success: {
              DEFAULT: BLACK,
              foreground: WHITE,
            },
            warning: {
              DEFAULT: "#A1A1AA",
              foreground: BLACK,
            },
            danger: {
              DEFAULT: "#DC2626",
              foreground: WHITE,
            },
          },
        },
      },
    }),
  ],
};

export default config;
