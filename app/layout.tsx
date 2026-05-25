import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sovereign Namibia — National Digital Identity",
    template: "%s | Sovereign Namibia",
  },
  description:
    "Find your citizen identity record. Claim and secure your account. Namibia's trusted sovereign digital identity platform.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://sovereignnamibia.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.variable} flex min-h-screen flex-col antialiased`}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
