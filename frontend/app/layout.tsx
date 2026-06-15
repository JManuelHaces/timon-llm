import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timón — Consola de voz",
  description: "Mezclador de tono para tu IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
