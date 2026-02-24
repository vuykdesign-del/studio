import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppNav } from "@/components/app/nav";
import { ContractionProvider } from "@/context/ContractionContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Tracker de Panza",
  description: "Una app simple para registrar contracciones de embarazo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${inter.variable} font-body antialiased flex flex-col h-dvh`}
      >
        <ContractionProvider>
          <main className="flex-1 overflow-y-auto">{children}</main>
          <AppNav />
        </ContractionProvider>
        <Toaster />
        <footer className="text-center text-xs text-muted-foreground p-2">
          Esta app es una herramienta de registro y no reemplaza la indicación
          médica.
        </footer>
      </body>
    </html>
  );
}
