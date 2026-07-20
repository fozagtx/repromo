import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Repromo",
  description:
    "You vibe coded the app. Paste your website or GitHub link and get a demo video.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "1024x1024" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/logo-256.png", sizes: "256x256", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F4F5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${ibmPlexSans.variable} h-full`}>
      <body className={`${ibmPlexSans.className} min-h-full antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
