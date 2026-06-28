"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getHistoricoPorData, getResumoMes } from "../actions/historico";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function iniciais(nome: string | null): string {
  if (!nome) return "?";
  const p = nome.trim().split(" ");
  if (p.length === 1) return p[0].slice(0,2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

function formatarHora(date: Date): string {
  return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ nome }: { nome: string | null }) {
  return (
    <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[11px] font-medium text-[#888] shrink-0">
      {iniciais(nome)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "concluido") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-950 text-green-400 border border-green-900">Concluído</span>;
  if (status === "cancelado") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-900">Cancelado</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]">Aguardando</span>;
}

type Agendamento = {
  id: string;
  date: Date;
  status: string;
  user: { name: string | null; email: string };
  service: { name: string; price: unknown };
};

type DadosDia = {
  agendamentos: Agendamento[];
  total: number;
  caixa: number;
  totalAtendimentos: number;
  concluidosCount: number;
} | null;

type ResumoMes = {
  faturamento: number;
  totalAgendamentos: number;
  cancelados: number;
  diasAtivos: number;
  diasComAgendamento: string[];
} | null;

export default function HistoricoPage() {
  const router = useRouter();
  const hoje = new Date();

  const [calAno, setCalAno] = useState(hoje.getFullYear());
  const [calMes, setCalMes] = useState(hoje.getMonth());
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [dadosDia, setDadosDia] = useState<DadosDia>(null);
  const [resumoMes, setResumoMes] = useState<ResumoMes>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingMes, setLoadingMes] = useState(false);

  // Carrega resumo do mês ao mudar mês/ano
  useEffect(() => {
    setLoadingMes(true);
    setDataSelecionada(null);
    setDadosDia(null);
    getResumoMes(calAno, calMes + 1).then((res) => {
      setResumoMes(res);
      setLoadingMes(false);
    });
  }, [calAno, calMes]);

  function selecionarDia(key: string) {
    setDataSelecionada(key);
    startTransition(async () => {
      const res = await getHistoricoPorData(key);
      setDadosDia(res);
    });
  }

  function prevMes() {
    if (calMes === 0) { setCalAno((y) => y - 1); setCalMes(11); }
    else setCalMes((m) => m - 1);
  }

  function nextMes() {
    const agora = new Date();
    const eHojeMes = calAno === agora.getFullYear() && calMes === agora.getMonth();
    if (eHojeMes) return; // não avança para o futuro
    if (calMes === 11) { setCalAno((y) => y + 1); setCalMes(0); }
    else setCalMes((m) => m + 1);
  }

  function buildCalendar() {
    const firstDay = new Date(calAno, calMes, 1).getDay();
    const daysInMonth = new Date(calAno, calMes + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  const cells = buildCalendar();
  const diasComAgendamento = new Set(resumoMes?.diasComAgendamento ?? []);
  const ehMesAtual = calAno === hoje.getFullYear() && calMes === hoje.getMonth();

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-3 sm:px-4 py-5 w-full max-w-2xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/barbeiro/dashboard")}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-[#2a2a2a] text-[#555] hover:text-[#e0e0e0] hover:border-[#444] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <p className="text-[#e8e8e8] text-sm font-medium">Histórico</p>
          <p className="text-[#555] text-xs">Selecione uma data para ver os detalhes</p>
        </div>
      </div>

      {/* Resumo do mês */}
      {!loadingMes && resumoMes && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#111] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-[#555]">Faturamento</span>
            <span className="text-lg font-medium text-[#C9A84C]">
              {resumoMes.faturamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            <span className="text-[10px] text-[#444]">{MESES[calMes]}</span>
          </div>
          <div className="bg-[#111] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-[#555]">Agendamentos</span>
            <span className="text-lg font-medium text-[#e0e0e0]">{resumoMes.totalAgendamentos}</span>
            <span className="text-[10px] text-[#444]">no mês</span>
          </div>
          <div className="bg-[#111] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-[#555]">Cancelados</span>
            <span className="text-lg font-medium text-[#e0e0e0]">{resumoMes.cancelados}</span>
            <span className="text-[10px] text-[#444]">no mês</span>
          </div>
          <div className="bg-[#111] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[10px] text-[#555]">Dias ativos</span>
            <span className="text-lg font-medium text-[#e0e0e0]">{resumoMes.diasAtivos}</span>
            <span className="text-[10px] text-[#444]">com atendimentos</span>
          </div>
        </div>
      )}

      {/* Calendário */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 sm:p-5">

        {/* Navegação */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMes} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2a2a2a] text-[#555] hover:text-[#e0e0e0] hover:border-[#444] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <p className="text-[#e0e0e0] text-sm font-medium">{MESES[calMes]} {calAno}</p>
          <button onClick={nextMes} disabled={ehMesAtual}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2a2a2a] text-[#555] hover:text-[#e0e0e0] hover:border-[#444] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 text-center mb-2">
          {SEMANA.map((d) => (
            <span key={d} className="text-[10px] text-[#444] uppercase tracking-wider">{d}</span>
          ))}
        </div>

        {/* Células */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <span key={i} />;
            const d = new Date(calAno, calMes, day);
            const key = toKey(d);
            const isFuturo = d > hoje;
            const isHoje = toKey(d) === toKey(hoje);
            const isSelecionado = dataSelecionada === key;
            const temAgendamento = diasComAgendamento.has(key);

            return (
              <button key={i} onClick={() => !isFuturo && selecionarDia(key)} disabled={isFuturo}
                className={`relative h-9 w-full rounded-lg flex items-center justify-center text-xs transition-all ${
                  isFuturo ? "text-[#333] cursor-not-allowed" :
                  isSelecionado ? "bg-[#C9A84C] text-[#0a0a0a] font-medium" :
                  isHoje ? "border border-[#C9A84C] text-[#C9A84C]" :
                  "text-[#888] hover:bg-[#1a1a1a] hover:text-[#e0e0e0]"
                }`}>
                {day}
                {temAgendamento && !isSelecionado && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isHoje ? "bg-[#C9A84C]" : "bg-[#555]"}`} />
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-[#333] text-center mt-3">● dias com agendamentos</p>
      </div>

      {/* Detalhes do dia selecionado */}
      {dataSelecionada && (
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-[#e0e0e0]">
                {new Date(dataSelecionada + "T00:00:00").toLocaleDateString("pt-BR", {
                  weekday: "long", day: "2-digit", month: "long",
                })}
              </p>
              {dadosDia && !isPending && (
                <p className="text-[#555] text-xs mt-0.5">
                  {dadosDia.totalAtendimentos} agendamentos · {dadosDia.concluidosCount} concluídos
                </p>
              )}
            </div>
            {dadosDia && !isPending && (
              <div className="text-right shrink-0">
                <p className="text-[#C9A84C] text-sm font-medium">
                  {dadosDia.caixa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="text-[#444] text-[10px]">caixa do dia</p>
              </div>
            )}
          </div>

          {isPending ? (
            <p className="text-[#444] text-sm text-center py-4">Carregando...</p>
          ) : !dadosDia || dadosDia.agendamentos.length === 0 ? (
            <p className="text-[#444] text-sm text-center py-4">Nenhum agendamento nesta data.</p>
          ) : (
            <div className="flex flex-col gap-0">
              {dadosDia.agendamentos.map((a) => (
                <div key={a.id} className={`flex items-center justify-between gap-2 py-2.5 border-b border-[#1a1a1a] last:border-b-0 ${
                  a.status === "cancelado" ? "opacity-40" : ""
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar nome={a.user.name} />
                    <div className="min-w-0">
                      <p className="text-[#e0e0e0] text-xs font-medium truncate">{a.user.name ?? "—"}</p>
                      <p className="text-[#555] text-[10px] truncate">{a.service.name} · {formatarHora(a.date)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={a.status} />
                    <span className="text-[#C9A84C] text-[10px]">
                      {Number(a.service.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </main>
  );
}