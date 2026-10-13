import type { Language } from "@accordly/shared";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Accordly", template: "%s | Accordly" },
};

const lang: Language = "en";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-gray-50 antialiased dark:bg-gray-900`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
