import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "Team Availability & Schedule Matrix (ระบบเช็กตารางความพร้อมและคิวว่างของทีม)",
  description:
    "Enterprise-grade team schedule matrix, availability tracker, and secure authentication engine with cryptographic OTP password recovery.",
  keywords: [
    "Team Availability",
    "Schedule Matrix",
    "ตารางงาน",
    "คิวว่างทีม",
    "Next.js 15",
    "Prisma",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
