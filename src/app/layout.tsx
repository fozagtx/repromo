import type { Metadata } from "next";
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
    "Paste your GitHub link. Get a short promo you can post the same day you launch.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
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
