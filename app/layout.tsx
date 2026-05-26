import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ConditionalChrome } from "@/components/layout/conditional-chrome";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Sovereign Namibia Registry Network",
    template: "%s | Sovereign Namibia",
  },
  description:
    "Namibia's trusted digital registry infrastructure. Secure identity, institutional records, verified infrastructure, and sovereign digital trust.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://sovereignnamibia.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.variable} flex min-h-screen flex-col antialiased`}>
        <ConditionalChrome>{children}</ConditionalChrome>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
