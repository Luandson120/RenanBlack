"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── tipos ───────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  date: Date;
  status: string;
  user: { name: string | null; email: string; telefone?: string | null };
  service: { name: string; price: unknown };
}

interface Assinante {
  id: string;
  name: string | null;
  email: string;
  telefone: string | null;
  plano: string;
  ultimoCorte: Date | null;
  bookings: { date: Date }[];
}

interface UserComBooking {
  id: string;
  name: string | null;
  email: string;
  bookings: { date: Date }[];
}

interface Lembrete {
  id: string;
  name: string | null;
  email: string;
  telefone: string | null;
  ultimoCorte: Date | null;
  bookings: { date: Date }[];
}

interface DashboardData {
  agendamentosHoje: Booking[];
  agendamentosFuturos: Booking[];
  assinantes: Assinante[];
  foraDoclube: UserComBooking[];
  lembretes: Lembrete[];
  aberta: boolean;
  caixaDoDia: number;
  faturamentoMes: number;
  totalAgendamentos: number;
  concluidosHoje: number;
}

interface ValorExtra {
  id: string;
  descricao: string;
  valor: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function iniciais(nome: string | null): string {
  if (!nome) return "?";
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function formatarHora(date: Date): string {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatarData(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatarDataCompleta(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    weekday: "short", day: "2-digit", month: "2-digit",
  });
}

function diasDesdeUltimoCorte(bookings: { date: Date }[]): number {
  if (!bookings.length) return 999;
  const ultimo = new Date(bookings[0].date);
  return Math.floor((new Date().getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Agrupa os agendamentos de todos os assinantes por telefone (fallback: nome).
 * Retorna um Map onde a chave é a chave de agrupamento e o valor é a contagem
 * de visitas no mês atual.
 */
function calcularVisitasPorChave(assinantes: Assinante[]): Map<string, number> {
  const mapa = new Map<string, number>();
  const agora = new Date();

  for (const u of assinantes) {
    // Chave: telefone normalizado ou nome normalizado
    const chave = u.telefone
      ? u.telefone.replace(/\D/g, "")
      : (u.name ?? u.email).trim().toLowerCase();

    const visitasMes = u.bookings.filter((b) => {
      const d = new Date(b.date);
      return (
        d.getMonth() === agora.getMonth() &&
        d.getFullYear() === agora.getFullYear()
      );
    }).length;

    // Acumula (mesmo telefone pode ter múltiplos registros)
    mapa.set(chave, (mapa.get(chave) ?? 0) + visitasMes);
  }

  return mapa;
}

/** Chave de agrupamento de um assinante (telefone normalizado ou nome) */
function chaveAssinante(u: Assinante): string {
  return u.telefone
    ? u.telefone.replace(/\D/g, "")
    : (u.name ?? u.email).trim().toLowerCase();
}

function calcularIntervaloMedioDias(bookings: { date: Date }[]): number | null {
  if (bookings.length < 2) return null;
  const datas = bookings.map((b) => new Date(b.date).getTime()).sort((a, b) => a - b);
  let soma = 0;
  for (let i = 1; i < datas.length; i++) soma += datas[i] - datas[i - 1];
  return soma / (datas.length - 1) / (1000 * 60 * 60 * 24);
}

function formatarFrequencia(intervaloMedioDias: number | null): string | null {
  if (!intervaloMedioDias || !isFinite(intervaloMedioDias) || intervaloMedioDias <= 0) return null;
  const vezesPorMes = 30 / intervaloMedioDias;
  if (vezesPorMes >= 1) return `${vezesPorMes.toFixed(1)}×/mês`;
  return `a cada ${Math.round(intervaloMedioDias)} dias`;
}

// ─── sub-componentes ──────────────────────────────────────────────────────────

function Avatar({ nome }: { nome: string | null }) {
  return (
    <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[11px] font-medium text-[#888] shrink-0">
      {iniciais(nome)}
    </div>
  );
}

function StatusBadge({ status, futuro }: { status: string; futuro?: boolean }) {
  if (status === "concluido") {
    if (futuro) {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d1a0d] text-green-500 border border-green-900 whitespace-nowrap flex items-center gap-1">
          <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Confirmado
        </span>
      );
    }
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-950 text-green-400 border border-green-900 whitespace-nowrap">Concluído</span>;
  }
  if (status === "andamento")
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-900 whitespace-nowrap">Andamento</span>;
  if (status === "cancelado")
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-900 whitespace-nowrap">Cancelado</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#666] border border-[#2a2a2a] whitespace-nowrap">Aguardando</span>;
}

function AcoesAgendamento({
  status, carregando, futuro, onConfirmar, onCancelar,
}: {
  status: string; carregando: boolean; futuro?: boolean;
  onConfirmar: () => void; onCancelar: () => void;
}) {
  if (status === "concluido" || status === "cancelado") return null;
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onConfirmar} disabled={carregando}
        title={futuro ? "Pré-confirmar e registrar no caixa" : "Confirmar"}
        className="w-6 h-6 flex items-center justify-center rounded-full border border-green-900 bg-green-950 text-green-400 hover:bg-green-900 transition-colors disabled:opacity-40"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button
        onClick={onCancelar} disabled={carregando} title="Cancelar"
        className="w-6 h-6 flex items-center justify-center rounded-full border border-red-900 bg-red-950 text-red-400 hover:bg-red-900 transition-colors disabled:opacity-40"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function WhatsAppButton({ telefone }: { telefone: string }) {
  return (
    <a
      href={`https://wa.me/55${telefone.replace(/\D/g, "")}`}
      target="_blank" rel="noopener noreferrer"
      className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#2a5a2a] bg-[#0d1f0d] text-green-400 hover:bg-green-900 transition-colors shrink-0"
      title="Abrir WhatsApp"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

function LinhaAgendamentoMobile({
  a, statusAtual, futuro, carregando, onConfirmar, onCancelar,
}: {
  a: Booking; statusAtual: string; futuro: boolean; carregando: boolean;
  onConfirmar: () => void; onCancelar: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5 border-b border-[#1a1a1a] last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar nome={a.user.name} />
        <div className="min-w-0">
          <p className="text-[#e0e0e0] text-xs font-medium truncate">{a.user.name ?? "—"}</p>
          <p className="text-[#555] text-[10px] truncate">
            {a.service.name} · {futuro ? formatarDataCompleta(a.date) : formatarHora(a.date)}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <StatusBadge status={statusAtual} futuro={futuro} />
        <span className="text-[#C9A84C] text-[10px]">
          {Number(a.service.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
        <AcoesAgendamento
          status={statusAtual} carregando={carregando} futuro={futuro}
          onConfirmar={onConfirmar} onCancelar={onCancelar}
        />
      </div>
    </div>
  );
}

// ─── Pill de visitas do mês agrupadas por telefone/nome ──────────────────────

function VisitasMesPill({ visitas, media }: { visitas: number; media: number }) {
  const label = `${visitas}× mês`;
  if (visitas === 0)
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#555] border border-[#2a2a2a] whitespace-nowrap">{label}</span>;
  if (visitas > media)
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d1a0d] text-green-400 border border-green-900 whitespace-nowrap">{label}</span>;
  if (visitas < media)
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1200] text-yellow-400 border border-yellow-900 whitespace-nowrap">{label}</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] whitespace-nowrap">{label}</span>;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DashboardClient({
  data,
  onConfirmar,
  onCancelar,
  onAdicionarValorExtra,
  onRemoverValorExtra,
}: {
  data: DashboardData;
  onConfirmar?: (id: string) => Promise<void> | void;
  onCancelar?: (id: string) => Promise<void> | void;
  onAdicionarValorExtra?: (descricao: string, valor: number) => Promise<void> | void;
  onRemoverValorExtra?: (id: string) => Promise<void> | void;
}) {
  const router = useRouter();
  const [statusLocal, setStatusLocal] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState<string | null>(null);
  const [abaFuturos, setAbaFuturos] = useState(false);
  const [caixaExtra, setCaixaExtra] = useState(0);
  const [extras, setExtras] = useState<ValorExtra[]>([]);
  const [mostrarFormExtra, setMostrarFormExtra] = useState(false);
  const [descricaoExtra, setDescricaoExtra] = useState("Barba");
  const [valorExtraInput, setValorExtraInput] = useState("");
  const [enviandoExtra, setEnviandoExtra] = useState(false);
  const [fechandoBarbearia, setFechandoBarbearia] = useState(false);

  // ── visitas agrupadas por telefone/nome ──
  const visitasPorChave = calcularVisitasPorChave(data.assinantes);
  const todasVisitas = Array.from(visitasPorChave.values());
  const mediaVisitasMes =
    todasVisitas.length > 0
      ? todasVisitas.reduce((a, b) => a + b, 0) / todasVisitas.length
      : 0;

  // ── frequência histórica geral (intervalo médio entre cortes) ──
  const frequenciasIndividuais = data.assinantes
    .map((a) => calcularIntervaloMedioDias(a.bookings))
    .filter((v): v is number => v !== null);
  const intervaloMedioGeral = frequenciasIndividuais.length
    ? frequenciasIndividuais.reduce((a, b) => a + b, 0) / frequenciasIndividuais.length
    : null;
  const visitasPorMesLabel = intervaloMedioGeral
    ? `${(30 / intervaloMedioGeral).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×`
    : null;

  function statusAtual(a: Booking) {
    return statusLocal[a.id] ?? a.status;
  }

  async function handleConfirmar(a: Booking, futuro = false) {
    setCarregando(a.id);
    setStatusLocal((prev) => ({ ...prev, [a.id]: "concluido" }));
    const statusAnterior = statusLocal[a.id] ?? a.status;
    const valorServico = Number(a.service.price);
    if (futuro && statusAnterior !== "concluido" && !isNaN(valorServico)) {
      setCaixaExtra((prev) => prev + valorServico);
    }
    try {
      await onConfirmar?.(a.id);
      router.refresh();
    } catch {
      setStatusLocal((prev) => ({ ...prev, [a.id]: a.status }));
      if (futuro && !isNaN(valorServico)) setCaixaExtra((prev) => prev - valorServico);
    } finally {
      setCarregando(null);
    }
  }

  async function handleCancelar(a: Booking) {
    setCarregando(a.id);
    setStatusLocal((prev) => ({ ...prev, [a.id]: "cancelado" }));
    const statusAnterior = statusLocal[a.id] ?? a.status;
    const valorServico = Number(a.service.price);
    if (statusAnterior === "concluido" && !isNaN(valorServico)) {
      setCaixaExtra((prev) => Math.max(0, prev - valorServico));
    }
    try {
      await onCancelar?.(a.id);
      router.refresh();
    } catch {
      setStatusLocal((prev) => ({ ...prev, [a.id]: a.status }));
    } finally {
      setCarregando(null);
    }
  }

  async function handleAdicionarExtra() {
    const valor = parseFloat(valorExtraInput.replace(",", "."));
    if (!valor || valor <= 0) return;
    const descricao = descricaoExtra.trim() || "Extra";
    setEnviandoExtra(true);
    const idTemp = `extra-${Date.now()}`;
    setExtras((prev) => [...prev, { id: idTemp, descricao, valor }]);
    setCaixaExtra((prev) => prev + valor);
    try {
      await onAdicionarValorExtra?.(descricao, valor);
      router.refresh();
      setMostrarFormExtra(false);
      setDescricaoExtra("Barba");
      setValorExtraInput("");
    } catch {
      setExtras((prev) => prev.filter((e) => e.id !== idTemp));
      setCaixaExtra((prev) => prev - valor);
    } finally {
      setEnviandoExtra(false);
    }
  }

  async function handleRemoverExtra(extra: ValorExtra) {
    setExtras((prev) => prev.filter((e) => e.id !== extra.id));
    setCaixaExtra((prev) => Math.max(0, prev - extra.valor));
    try {
      await onRemoverValorExtra?.(extra.id);
      router.refresh();
    } catch {
      setExtras((prev) => [...prev, extra]);
      setCaixaExtra((prev) => prev + extra.valor);
    }
  }

  // Fecha a barbearia E cancela todos os agendamentos pendentes/aguardando de hoje
  async function handleFecharBarbearia() {
    if (fechandoBarbearia) return;
    setFechandoBarbearia(true);
    try {
      await fetch("/api/barbeiro/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aberta: false, bloquearHoje: true }),
      });
      router.refresh();
    } catch {
      // falha silenciosa — usuário pode tentar de novo
    } finally {
      setFechandoBarbearia(false);
    }
  }

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const nomeMes = new Date().toLocaleDateString("pt-BR", { month: "long" });
  const agendamentosExibidos = abaFuturos ? data.agendamentosFuturos : data.agendamentosHoje;
  const caixaTotal = data.caixaDoDia + caixaExtra;
  const concluidosFuturosLocal = data.agendamentosFuturos.filter(
    (a) => (statusLocal[a.id] ?? a.status) === "concluido"
  ).length;

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-3 sm:px-4 py-5 w-full max-w-3xl mx-auto flex flex-col gap-4">

      {/* Topbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-full bg-[#1a1200] border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] text-sm font-medium">R</div>
          <div className="min-w-0">
            <p className="text-[#e8e8e8] text-sm font-medium truncate">Renan Black Barber</p>
            <p className="text-[#555] text-xs capitalize truncate">{hoje}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push("/barbeiro/servicos")}
            className="text-xs px-2.5 py-1.5 rounded-full border border-[#2a2a2a] text-[#888] hover:text-[#e0e0e0] hover:border-[#444] transition-colors hidden sm:flex items-center gap-1.5"
          >
            Serviços
          </button>
          {/* Botão de status com fechar integrado */}
          {data.aberta ? (
            <button
              onClick={handleFecharBarbearia}
              disabled={fechandoBarbearia}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border bg-[#0d1f0d] border-[#2a5a2a] text-green-400 hover:bg-[#1f0d0d] hover:border-[#5a2a2a] hover:text-red-400 transition-colors disabled:opacity-50 group"
              title="Clique para fechar a barbearia e bloquear horários de hoje"
            >
              <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-green-400 group-hover:bg-red-400 transition-colors" />
              <span className="hidden xs:inline">
                {fechandoBarbearia ? "Fechando..." : "Aberta"}
              </span>
            </button>
          ) : (
            <button
              onClick={() => router.push("/barbeiro/status")}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border bg-[#1f0d0d] border-[#5a2a2a] text-red-400 hover:bg-[#0d1f0d] hover:border-[#2a5a2a] hover:text-green-400 transition-colors"
              title="Clique para abrir a barbearia"
            >
              <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-red-400" />
              <span className="hidden xs:inline">Fechada</span>
            </button>
          )}
        </div>
      </div>

      {/* Aviso quando fechada */}
      {!data.aberta && (
        <div className="bg-[#1f0d0d] border border-[#5a2a2a] rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div className="min-w-0">
            <p className="text-red-400 text-xs font-medium">Barbearia fechada — novos agendamentos bloqueados</p>
            <p className="text-[#884444] text-[10px] mt-0.5">
              Horários de hoje foram cancelados. Clique em &quot;Fechada&quot; para reabrir.
            </p>
          </div>
        </div>
      )}

      {/* Faturamento do mês */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl px-5 py-4 flex items-center justify-between">
        <span className="text-sm text-[#888] capitalize">Faturamento de {nomeMes}</span>
        <span className="text-xl font-medium text-[#C9A84C]">
          {data.faturamentoMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Caixa do dia */}
        <div className="bg-[#111] rounded-xl p-3 sm:p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-[11px] text-[#555]">Caixa do dia</span>
          <span className="text-xl sm:text-2xl font-medium text-[#C9A84C]">
            {caixaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] sm:text-[11px] text-[#444]">
              {data.concluidosHoje + concluidosFuturosLocal} atendimentos
            </span>
            {concluidosFuturosLocal > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-950 text-green-500 border border-green-900">
                +{concluidosFuturosLocal} futuro{concluidosFuturosLocal > 1 ? "s" : ""}
              </span>
            )}
            {extras.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1a1200] text-[#C9A84C] border border-[#854d0e]">
                +{extras.length} extra{extras.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={() => setMostrarFormExtra((v) => !v)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] text-[#888] border border-[#2a2a2a] rounded-lg py-1.5 hover:text-[#C9A84C] hover:border-[#3a3020] transition-colors"
          >
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Valor avulso
          </button>
        </div>

        {/* Agendamentos hoje */}
        <div className="bg-[#111] rounded-xl p-3 sm:p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-[11px] text-[#555]">Agendamentos hoje</span>
          <span className="text-xl sm:text-2xl font-medium text-[#e0e0e0]">{String(data.totalAgendamentos)}</span>
          <span className="text-[10px] sm:text-[11px] text-[#444]">{data.concluidosHoje} concluídos</span>
        </div>

        {/* Assinantes */}
        <div className="bg-[#111] rounded-xl p-3 sm:p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-[11px] text-[#555]">Assinantes ativos</span>
          <span className="text-xl sm:text-2xl font-medium text-[#e0e0e0]">{String(data.assinantes.length)}</span>
          <span className="text-[10px] sm:text-[11px] text-[#444]">no clube</span>
        </div>

        {/* Média de visitas */}
        <div className="bg-[#111] rounded-xl p-3 sm:p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-[11px] text-[#555]">Média de visitas</span>
          <span className="text-xl sm:text-2xl font-medium text-[#e0e0e0]">
            {visitasPorMesLabel ?? "—"}
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#444]">
            {visitasPorMesLabel ? "por assinante/mês" : "sem dados ainda"}
          </span>
        </div>

        {/* Fora do clube */}
        <div className="bg-[#111] rounded-xl p-3 sm:p-4 flex flex-col gap-1">
          <span className="text-[10px] sm:text-[11px] text-[#555]">Fora do clube</span>
          <span className="text-xl sm:text-2xl font-medium text-[#e0e0e0]">{String(data.foraDoclube.length)}</span>
          <span className="text-[10px] sm:text-[11px] text-[#444]">não assinantes</span>
        </div>
      </div>

      {/* Valor avulso */}
      {(mostrarFormExtra || extras.length > 0) && (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 sm:p-5">
          {mostrarFormExtra && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[#888]">Adicionar valor avulso ao caixa</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={descricaoExtra}
                  onChange={(e) => setDescricaoExtra(e.target.value)}
                  placeholder="Descrição (ex: Barba)"
                  className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#e0e0e0] placeholder-[#555] focus:outline-none focus:border-[#C9A84C]"
                />
                <input
                  value={valorExtraInput}
                  onChange={(e) => setValorExtraInput(e.target.value)}
                  inputMode="decimal"
                  placeholder="Valor (R$)"
                  className="sm:w-32 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#e0e0e0] placeholder-[#555] focus:outline-none focus:border-[#C9A84C]"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setMostrarFormExtra(false); setDescricaoExtra("Barba"); setValorExtraInput(""); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-[#888] hover:text-[#e0e0e0] hover:border-[#444] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdicionarExtra}
                  disabled={enviandoExtra || !valorExtraInput}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#1a1200] border border-[#C9A84C] text-[#C9A84C] hover:bg-[#241a00] transition-colors disabled:opacity-40"
                >
                  Adicionar ao caixa
                </button>
              </div>
            </div>
          )}
          {extras.length > 0 && (
            <div className={mostrarFormExtra ? "mt-3 pt-3 border-t border-[#1a1a1a] flex flex-col gap-2" : "flex flex-col gap-2"}>
              {extras.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2">
                  <span className="text-[#888] text-xs truncate">{e.descricao}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#C9A84C] text-xs">
                      {e.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <button
                      onClick={() => handleRemoverExtra(e)}
                      className="w-5 h-5 flex items-center justify-center rounded-full border border-[#2a2a2a] text-[#666] hover:text-red-400 hover:border-red-900 transition-colors"
                    >
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agendamentos */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAbaFuturos(false)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                !abaFuturos ? "bg-[#1a1200] border-[#C9A84C] text-[#C9A84C]" : "border-[#2a2a2a] text-[#666] hover:text-[#e0e0e0]"
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setAbaFuturos(true)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                abaFuturos ? "bg-[#1a1200] border-[#C9A84C] text-[#C9A84C]" : "border-[#2a2a2a] text-[#666] hover:text-[#e0e0e0]"
              }`}
            >
              Próximos 30 dias
              {data.agendamentosFuturos.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-[#C9A84C] text-[#0a0a0a] px-1.5 py-0.5 rounded-full font-medium">
                  {data.agendamentosFuturos.length}
                </span>
              )}
            </button>
          </div>
          {abaFuturos && (
            <p className="text-[10px] text-[#444] hidden sm:block">Confirmar registra no caixa do dia</p>
          )}
        </div>

        {agendamentosExibidos.length === 0 ? (
          <p className="text-[#444] text-sm text-center py-4">
            {abaFuturos ? "Nenhum agendamento nos próximos 30 dias." : "Nenhum agendamento hoje."}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-0 sm:hidden">
              {agendamentosExibidos.map((a) => (
                <LinhaAgendamentoMobile
                  key={a.id} a={a} statusAtual={statusAtual(a)} futuro={abaFuturos}
                  carregando={carregando === a.id}
                  onConfirmar={() => handleConfirmar(a, abaFuturos)}
                  onCancelar={() => handleCancelar(a)}
                />
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e1e]">
                    {["Cliente", abaFuturos ? "Data" : "Horário", "Serviço", "Valor", "Status", ""].map((h, i) => (
                      <th key={i} className="text-left text-[11px] text-[#444] uppercase tracking-wider font-normal pb-3 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agendamentosExibidos.map((a) => (
                    <tr key={a.id} className="border-b border-[#1a1a1a] last:border-b-0">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <Avatar nome={a.user.name} />
                          <span className="text-[#e0e0e0] text-xs truncate">{a.user.name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-[#888] text-xs">
                        {abaFuturos ? formatarDataCompleta(a.date) : formatarHora(a.date)}
                      </td>
                      <td className="py-3 pr-3 text-[#888] text-xs truncate">{a.service.name}</td>
                      <td className="py-3 pr-3 text-[#e0e0e0] text-xs">
                        {Number(a.service.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="py-3 pr-3"><StatusBadge status={statusAtual(a)} futuro={abaFuturos} /></td>
                      <td className="py-3">
                        <AcoesAgendamento
                          status={statusAtual(a)} carregando={carregando === a.id} futuro={abaFuturos}
                          onConfirmar={() => handleConfirmar(a, abaFuturos)}
                          onCancelar={() => handleCancelar(a)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Assinantes */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-[#e0e0e0]">Assinantes — contatos</p>
          <span className="text-[10px] px-2 py-1 rounded-full bg-green-950 text-green-400 border border-green-900">
            {data.assinantes.length}
          </span>
        </div>
        {visitasPorMesLabel && (
          <p className="text-[11px] text-[#555] mb-4">
            Média do mês: <span className="text-[#888]">{visitasPorMesLabel} por assinante</span>
          </p>
        )}
        {data.assinantes.length === 0 ? (
          <p className="text-[#444] text-sm text-center py-4">Nenhum assinante.</p>
        ) : (
          <div className="flex flex-col">
            {data.assinantes.map((u) => {
              const chave = chaveAssinante(u);
              const visitasMes = visitasPorChave.get(chave) ?? 0;
              const frequencia = formatarFrequencia(calcularIntervaloMedioDias(u.bookings));
              return (
                <div key={u.id} className="flex items-center justify-between gap-3 py-3 border-b border-[#1a1a1a] last:border-b-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar nome={u.name} />
                    <div className="min-w-0">
                      <p className="text-[#e0e0e0] text-sm truncate">{u.name ?? "—"}</p>
                      <p className="text-[#555] text-xs truncate">
                        {u.plano}{frequencia && <> · <span className="text-[#666]">{frequencia}</span></>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <VisitasMesPill visitas={visitasMes} media={mediaVisitasMes} />
                    {u.telefone && (
                      <>
                        <span className="text-[#666] text-xs hidden sm:inline">{u.telefone}</span>
                        <WhatsAppButton telefone={u.telefone} />
                      </>
                    )}
                    {u.ultimoCorte && (
                      <span className="text-[#444] text-xs">{formatarData(u.ultimoCorte)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fora do clube */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-[#e0e0e0]">Fora do clube</p>
          <span className="text-[10px] px-2 py-1 rounded-full bg-red-950 text-red-400 border border-red-900">
            {data.foraDoclube.length}
          </span>
        </div>
        {data.foraDoclube.length === 0 ? (
          <p className="text-[#444] text-sm text-center py-4">Todos são assinantes!</p>
        ) : (
          <div className="flex flex-col">
            {data.foraDoclube.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-[#1a1a1a] last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar nome={u.name} />
                  <span className="text-[#e0e0e0] text-xs truncate">{u.name ?? "—"}</span>
                </div>
                <span className="text-[#555] text-xs shrink-0">
                  {u.bookings[0] ? formatarData(u.bookings[0].date) : "Nunca"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lembretes */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-[#e0e0e0]">30 dias sem corte</p>
          <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-900 shrink-0">
            {data.lembretes.length} clientes
          </span>
        </div>
        {data.lembretes.length === 0 ? (
          <p className="text-[#444] text-sm text-center py-4">Nenhum cliente sem corte há 30 dias.</p>
        ) : (
          <div className="flex flex-col">
            {data.lembretes.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 py-3 border-b border-[#1a1a1a] last:border-b-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar nome={l.name} />
                  <div className="min-w-0">
                    <p className="text-[#e0e0e0] text-sm truncate">{l.name ?? "—"}</p>
                    <p className="text-[#555] text-xs">{diasDesdeUltimoCorte(l.bookings)} dias sem corte</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {l.telefone && <WhatsAppButton telefone={l.telefone} />}
                  <button className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-[#888] hover:text-[#e0e0e0] hover:border-[#444] transition-colors">
                    Notificar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}
