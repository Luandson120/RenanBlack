"use client";

import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  date: Date;
  status: string;
  user: { name: string | null };
  service: { name: string; price: unknown };
}

interface UserComBooking {
  id: string;
  name: string | null;
  bookings: { date: Date; service?: { name: string } }[];
}

interface DashboardData {
  agendamentosHoje: Booking[];
  assinantes: UserComBooking[];
  foraDoclube: UserComBooking[];
  lembretes: UserComBooking[];
  aberta: boolean;
  caixaDoDia: number;
  totalAgendamentos: number;
  concluidosHoje: number;
}

function iniciais(nome: string | null): string {
  if (!nome) return "?";
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function formatarHora(date: Date): string {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarData(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function diasDesdeUltimoCorte(bookings: { date: Date }[]): number {
  if (!bookings.length) return 999;
  const ultimo = new Date(bookings[0].date);
  const hoje = new Date();
  return Math.floor((hoje.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24));
}

function Avatar({ nome }: { nome: string | null }) {
  return (
    <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[11px] font-medium text-[#888] shrink-0">
      {iniciais(nome)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "concluido")
    return <span className="text-[11px] px-2 py-1 rounded-full bg-green-950 text-green-400 border border-green-900">Concluído</span>;
  if (status === "andamento")
    return <span className="text-[11px] px-2 py-1 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-900">Em andamento</span>;
  return <span className="text-[11px] px-2 py-1 rounded-full bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]">Aguardando</span>;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 max-w-3xl mx-auto flex flex-col gap-5">

      {/* Topbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1a1200] border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] text-sm font-medium">
            R
          </div>
          <div>
            <p className="text-[#e8e8e8] text-sm font-medium">Renan Black Barber</p>
            <p className="text-[#555] text-xs capitalize">{hoje}</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/barbeiro/status")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            data.aberta
              ? "bg-[#0d1f0d] border-[#2a5a2a] text-green-400"
              : "bg-[#1f0d0d] border-[#5a2a2a] text-red-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${data.aberta ? "bg-green-400" : "bg-red-400"}`} />
          {data.aberta ? "Barbearia aberta" : "Barbearia fechada"}
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#111] rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[11px] text-[#555]">Caixa do dia</span>
          <span className="text-2xl font-medium text-[#C9A84C]">
            {data.caixaDoDia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
          <span className="text-[11px] text-[#444]">{data.concluidosHoje} atendimentos</span>
        </div>
        <div className="bg-[#111] rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[11px] text-[#555]">Agendamentos hoje</span>
          <span className="text-2xl font-medium text-[#e0e0e0]">{data.totalAgendamentos}</span>
          <span className="text-[11px] text-[#444]">{data.concluidosHoje} concluídos</span>
        </div>
        <div className="bg-[#111] rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[11px] text-[#555]">Assinantes ativos</span>
          <span className="text-2xl font-medium text-[#e0e0e0]">{data.assinantes.length}</span>
          <span className="text-[11px] text-[#444]">no clube</span>
        </div>
        <div className="bg-[#111] rounded-xl p-4 flex flex-col gap-1">
          <span className="text-[11px] text-[#555]">Fora do clube</span>
          <span className="text-2xl font-medium text-[#e0e0e0]">{data.foraDoclube.length}</span>
          <span className="text-[11px] text-[#444]">não assinantes</span>
        </div>
      </div>

      {/* Agendamentos */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-[#e0e0e0]">Agendamentos de hoje</p>
          <span className="text-[11px] px-2 py-1 rounded-full bg-[#1a1200] border border-[#C9A84C] text-[#C9A84C]">
            {data.totalAgendamentos} no total
          </span>
        </div>
        {data.agendamentosHoje.length === 0 ? (
          <p className="text-[#444] text-sm text-center py-4">Nenhum agendamento hoje.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {["Cliente", "Horário", "Serviço", "Valor", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] text-[#444] uppercase tracking-wider font-normal pb-3 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.agendamentosHoje.map((a) => (
                  <tr key={a.id} className="border-b border-[#1a1a1a] last:border-b-0">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <Avatar nome={a.user.name} />
                        <span className="text-[#e0e0e0] text-xs truncate">{a.user.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-[#888] text-xs">{formatarHora(a.date)}</td>
                    <td className="py-3 pr-3 text-[#888] text-xs truncate">{a.service.name}</td>
                    <td className="py-3 pr-3 text-[#e0e0e0] text-xs">
                      {Number(a.service.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assinantes + Fora do clube */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#e0e0e0]">Assinantes ativos</p>
            <span className="text-[11px] px-2 py-1 rounded-full bg-green-950 text-green-400 border border-green-900">
              {data.assinantes.length}
            </span>
          </div>
          {data.assinantes.length === 0 ? (
            <p className="text-[#444] text-sm text-center py-4">Nenhum assinante.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {["Nome", "Último serviço"].map((h) => (
                    <th key={h} className="text-left text-[11px] text-[#444] uppercase tracking-wider font-normal pb-2 pr-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.assinantes.map((u) => (
                  <tr key={u.id} className="border-b border-[#1a1a1a] last:border-b-0">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <Avatar nome={u.name} />
                        <span className="text-[#e0e0e0] truncate">{u.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-[#666]">
                      {u.bookings[0] ? formatarData(u.bookings[0].date) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-[#e0e0e0]">Fora do clube</p>
            <span className="text-[11px] px-2 py-1 rounded-full bg-red-950 text-red-400 border border-red-900">
              {data.foraDoclube.length}
            </span>
          </div>
          {data.foraDoclube.length === 0 ? (
            <p className="text-[#444] text-sm text-center py-4">Todos são assinantes!</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {["Nome", "Último corte"].map((h) => (
                    <th key={h} className="text-left text-[11px] text-[#444] uppercase tracking-wider font-normal pb-2 pr-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.foraDoclube.map((u) => (
                  <tr key={u.id} className="border-b border-[#1a1a1a] last:border-b-0">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <Avatar nome={u.name} />
                        <span className="text-[#e0e0e0] truncate">{u.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-[#666]">
                      {u.bookings[0] ? formatarData(u.bookings[0].date) : "Nunca"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Lembretes */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-[#e0e0e0]">Lembrete — 30 dias sem corte</p>
          <span className="text-[11px] px-2 py-1 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-900">
            {data.lembretes.length} clientes
          </span>
        </div>
        {data.lembretes.length === 0 ? (
          <p className="text-[#444] text-sm text-center py-4">Nenhum cliente sem corte há 30 dias.</p>
        ) : (
          <div className="flex flex-col">
            {data.lembretes.map((l) => (
              <div key={l.id} className="flex items-center justify-between py-3 border-b border-[#1a1a1a] last:border-b-0">
                <div className="flex items-center gap-3">
                  <Avatar nome={l.name} />
                  <div>
                    <p className="text-[#e0e0e0] text-sm">{l.name ?? "—"}</p>
                    <p className="text-[#555] text-xs">{diasDesdeUltimoCorte(l.bookings)} dias sem corte</p>
                  </div>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-lg border border-[#2a2a2a] text-[#888] hover:text-[#e0e0e0] hover:border-[#444] transition-colors">
                  Notificar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}
