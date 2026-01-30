import "./globals.css";
import type { Metadata } from "next";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Dokumentointi",
  description: "Dokumentointisovellus",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body>
        {/* 🔒 Lukitsee koko äpin paitsi /share */}
        <AuthGate />

        {/* 🔽 Varsinainen appi */}
        {children}
      </body>
    </html>
  );
}
