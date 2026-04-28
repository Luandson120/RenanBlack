import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/app/Sidebar";
import Footer from "@/app/Footer";

export const metadata: Metadata = {
  title: "Renan Barber",
  description: "Barbearia Renan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
        <Sidebar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}