"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Calendar, MapPin, Info, Menu, X, Handshake } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-zinc-900 text-white px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
         <Link href="/">
         <Image
         src="/renan-logo.png"
          alt="Renan Barber"
          width={120}
          height={40}
          priority
        /> 
        {/* Logo */}
        </Link> 
     

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            href="/agendamento" 
            className="flex items-center gap-2 text-sm font-medium hover:text-yellow-400 transition-colors"
          >
            <Calendar size={16} />
            Agendamento
        </Link>
          <Link href="/clubec:\Users\Luand\Downloads\page.tsx" className="flex items-center gap-2 text-sm font-medium hover:text-yellow-400 transition-colors">
  <Handshake size={16} />
            Clube
          </Link>
          
          <Link href="/localizacao" className="flex items-center gap-2 text-sm font-medium hover:text-yellow-400 transition-colors">
            <MapPin size={16} />
            Localização
          </Link>
          <Link href="/sobre" className="flex items-center gap-2 text-sm font-medium hover:text-yellow-400 transition-colors">
            <Info size={16} />
            Sobre
          </Link>
        </nav>

        {/* Botão hamburguer (mobile) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-md hover:bg-zinc-700 transition-colors"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menu mobile (dropdown) */}
      {isOpen && (
        <nav className="md:hidden flex flex-col gap-2 mt-4 pb-2 border-t border-zinc-700 pt-4">
          <Link href="/agendamento" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
            <Calendar size={16} />
            Agendamento
          </Link>
          <Link href="/localizacao" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
            <MapPin size={16} />
            Localização
          </Link>
          <Link href="/sobre" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
            <Info size={16} />
            Sobre
          </Link>
        </nav>
      )}
    </header>
  );
}