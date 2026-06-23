const ENDERECO = "R. Barão do Rio Branco, Mamanguape - PB, 58280-000";

function IconePin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconeRelogio() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconeRota() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

export default function LocalizacaoPage() {
  const enderecoCodificado = encodeURIComponent(ENDERECO);
  const urlMapaEmbed = `https://www.google.com/maps?q=${enderecoCodificado}&output=embed`;
  const urlComoChegar = `https://www.google.com/maps/dir/?api=1&destination=${enderecoCodificado}`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 max-w-2xl mx-auto flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-full bg-[#1a1200] border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] text-lg font-medium mb-1">
          R
        </div>
        <h1 className="text-[#e8e8e8] text-xl font-medium">Onde estamos</h1>
      </div>

      {/* Mapa */}
      <div className="rounded-2xl overflow-hidden border border-[#2a2a2a] aspect-[4/3]">
        <iframe
          src={urlMapaEmbed}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de localização da Renan Black Barber"
        />
      </div>

      {/* Endereço */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5 flex items-start gap-3">
        <span className="text-[#C9A84C] mt-0.5"><IconePin /></span>
        <div>
          <p className="text-[#e0e0e0] text-sm font-medium mb-0.5">Endereço</p>
          <p className="text-[#999] text-sm">{ENDERECO}</p>
        </div>
      </div>

      {/* Horário */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5 flex items-start gap-3">
        <span className="text-[#C9A84C] mt-0.5"><IconeRelogio /></span>
        <div>
          <p className="text-[#e0e0e0] text-sm font-medium mb-0.5">Horário de funcionamento</p>
          <p className="text-[#999] text-sm">Segunda a sábado: 08:00 às 18:00</p>
        </div>
      </div>

      {/* Como chegar */}
      <a
        href={urlComoChegar}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-[#C9A84C] text-[#0a0a0a] text-sm font-medium py-3 rounded-lg hover:bg-[#d9b85c] transition-colors"
      >
        <IconeRota />
        Como chegar
      </a>

    </main>
  );
}
