"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Calendar, MapPin, Info, Menu, X, Handshake } from "lucide-react";

const links = [
  { href: "/agendamento", label: "Agendamento", icon: Calendar },
  { href: "/clube", label: "Clube", icon: Handshake },
  { href: "/localizacao", label: "Localização", icon: MapPin },
  { href: "/sobre", label: "Sobre", icon: Info },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 text-white px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/renan-logo.png"
            alt="Renan Barber"
            width={120}
            height={40}
            priority
          />
        </Link>

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-yellow-400 transition-colors"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Botão hamburguer */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir menu"
          className="md:hidden p-2 rounded-md hover:bg-zinc-700 transition-colors"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menu mobile */}
      {isOpen && (
        <nav className="md:hidden flex flex-col gap-1 mt-4 pb-2 border-t border-zinc-700 pt-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors text-sm text-zinc-300 hover:text-white"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}