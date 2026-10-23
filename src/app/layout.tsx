import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "BankReady — Pre-Visit Banking Readiness & Assistance Platform",
  description:
    "Check required documents, understand service rules, review branch opening hours, lunch breaks, and holiday schedules before visiting your bank.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#1F2937] antialiased">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}

