import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { TwaInit } from "@/components/TwaInit";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "SENU Mentor App",
  description: "Digital assistant for SENU students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className} bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] min-h-screen overflow-x-hidden`}>
        <TwaInit />
        {children}
      </body>
    </html>
  );
}
