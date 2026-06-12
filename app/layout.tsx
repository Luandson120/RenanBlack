import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { cn } from "@/lib/utils";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Renan Barber",
  description: "Barbearia Renan — Estilo e precisão em cada corte.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={cn(inter.variable, playfair.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-screen bg-zinc-950 text-white font-sans antialiased",
          "flex flex-col"
        )}
      >
        <Sidebar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}