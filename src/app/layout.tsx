import type { Metadata } from "next";
import { Inter, Public_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Global Disorder Index (GDI)",
  description: "世界完蛋了指数 / Global Disorder Index Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${publicSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gdi-bg text-gdi-on-surface flex flex-col">{children}</body>
    </html>
  );
}
