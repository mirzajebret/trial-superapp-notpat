import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import FloatingCS from "@/components/FloatingCS";
import { AuthProvider } from "@/components/AuthContext";
import LoginGuard from "@/components/LoginGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KantorApp - Superapp Notaris",
  description: "Sistem Manajemen Kantor Notaris & PPAT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 flex min-h-screen`}
      >
        <AuthProvider>
          <LoginGuard>
            <Sidebar />
            <main className="flex-1 min-w-0 min-h-screen print:p-0">
              {children}
            </main>
            <FloatingCS />
          </LoginGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
