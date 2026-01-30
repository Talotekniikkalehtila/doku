import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Dokumentointi",
  description: "Dokumentointisovellus",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fi">
      <body>
        {/* 🔒 Lukitsee koko äpin paitsi /share */}
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
