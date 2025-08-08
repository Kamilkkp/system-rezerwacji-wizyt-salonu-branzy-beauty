import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SalonProvider } from '@/context/SalonContext';
import { ThemeRegistry } from "@/components/ThemeRegistry";

export const metadata: Metadata = {
  title: "Beauty Salon Panel",
  description: "Management System for Beauty Salons",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <SalonProvider>
              {children}
            </SalonProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}