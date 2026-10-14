import type { Language } from "@accordly/shared";
import type { Metadata } from "next";
import { Google_Sans, Google_Sans_Code } from "next/font/google";
import "./globals.css";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
});

const googleSansCode = Google_Sans_Code({
  variable: "--font-google-sans-code",
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
      className={`${googleSans.variable} ${googleSansCode.variable} h-full bg-gray-50 antialiased dark:bg-gray-900`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
