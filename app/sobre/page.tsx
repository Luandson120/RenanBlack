import Link from "next/link";
import Image from "next/image";


const REDES_SOCIAIS = {
  instagram: "https://www.instagram.com/barbearia_renanblack/",
  whatsapp: "https://wa.me/5583998945683",
};

interface Foto {
  src: string;
  alt: string;
}


const FOTOS: (Foto | null)[] = [
  { src: "/miguel.jpeg", alt: "Corte kids" },
  { src: "/cabeloearb.jpeg", alt: "Cabelo e barba" },
  { src: "/barba.jpeg", alt: "barba" },
  { src: "/logo.png", alt: "barba" },
];

function IconeCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconeInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
    </svg>
  );
}

function IconeWhatsapp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 max-w-2xl mx-auto flex flex-col gap-7">

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-full bg-[#1a1200] border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] text-lg font-medium mb-1">
          R
        </div>
        <h1 className="text-[#e8e8e8] text-xl font-medium">Sobre a Renan Black Barber</h1>
      </div>

      {/* Bio */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col gap-3">
        <p className="text-[#ccc] text-sm leading-relaxed">
          Me chamo Renan, sou barbeiro desde 2019 ✂️
        </p>
        <p className="text-[#ccc] text-sm leading-relaxed">
          Desde que comecei nessa profissão, descobri muito mais do que um trabalho — encontrei um propósito. Sou apaixonado pelo que faço e busco evoluir a cada dia, sempre aperfeiçoando minhas técnicas e meu atendimento.
        </p>
        <p className="text-[#ccc] text-sm leading-relaxed">
          Acredito que um corte de cabelo ou uma barba bem feita vão além da estética. É sobre devolver autoestima, renovar a confiança e fazer cada cliente se sentir bem consigo mesmo. Cada pessoa que senta na minha cadeira carrega uma história, e eu valorizo isso em cada detalhe do meu trabalho.
        </p>
        <p className="text-[#ccc] text-sm leading-relaxed">
          Na Barbearia Renan Black, meu compromisso é com qualidade, respeito e uma experiência diferenciada. Não é só sobre cortar cabelo, é sobre cuidar, ouvir e entregar o melhor resultado possível.
        </p>
        <p className="text-[#C9A84C] text-sm leading-relaxed font-medium">
          Mais do que barbeiro, sou alguém que ama transformar vidas através do que faz. 💈🔥
        </p>
      </div>

      {/* Fotos */}
      <div className="flex flex-col gap-3">
        <p className="text-[#e0e0e0] text-sm font-medium px-1">Espaço &amp; equipe</p>
        <div className="grid grid-cols-2 gap-3">
          {FOTOS.map((foto, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl overflow-hidden border bg-[#111] ${
                foto ? "border-[#2a2a2a]" : "border-dashed border-[#2a2a2a] flex flex-col items-center justify-center gap-2 text-[#444]"
              }`}
            >
              {foto ? (
                <Image
                  src={foto.src}
                  alt={foto.alt}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <IconeCamera />
                  <span className="text-[11px]">Foto em breve</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Redes sociais */}
      <div className="flex flex-col gap-3">
        <p className="text-[#e0e0e0] text-sm font-medium px-1">Redes sociais</p>
        <div className="flex gap-3">
          <Link
            href={REDES_SOCIAIS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#111] border border-[#2a2a2a] rounded-xl py-3 text-[#ccc] text-sm hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
          >
            <IconeInstagram />
            Instagram
          </Link>
          <Link
            href={REDES_SOCIAIS.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#111] border border-[#2a2a2a] rounded-xl py-3 text-[#ccc] text-sm hover:border-green-700 hover:text-green-400 transition-colors"
          >
            <IconeWhatsapp />
            WhatsApp
          </Link>
        </div>
      </div>

    </main>
  );
}
