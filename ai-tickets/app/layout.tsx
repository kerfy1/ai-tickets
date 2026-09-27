import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-обробка звернень",
  description: "Внутрішній інструмент служби підтримки: збір і AI-аналіз звернень",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
