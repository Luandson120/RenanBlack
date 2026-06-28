"use server";

import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type AgendamentoDTO = {
  id: string;
  date: Date;
  status: string;
  user: { name: string | null; email: string };
  service: { name: string; price: unknown };
};

type DadosDia = {
  agendamentos: AgendamentoDTO[];
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

export async function getHistoricoPorData(dateKey: string): Promise<DadosDia> {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(`${dateKey}T23:59:59.999`);

  try {
    const agendamentos = await prisma.booking.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        user: { select: { name: true, email: true } },
        service: { select: { name: true, price: true } },
      },
      orderBy: { date: "asc" },
    });

    const concluidos = agendamentos.filter((a) => a.status === "concluido");
    const caixa = concluidos.reduce((sum, a) => sum + Number(a.service.price), 0);

    return {
      agendamentos,
      total: agendamentos.length,
      caixa,
      totalAtendimentos: agendamentos.length,
      concluidosCount: concluidos.length,
    };
  } catch (error) {
    console.error("Erro ao buscar histórico do dia:", error);
    return null;
  }
}

export async function getResumoMes(ano: number, mes: number): Promise<ResumoMes> {
  const inicio = new Date(ano, mes - 1, 1, 0, 0, 0);
  const fim = new Date(ano, mes, 0, 23, 59, 59, 999);

  try {
    const agendamentos = await prisma.booking.findMany({
      where: { date: { gte: inicio, lte: fim } },
      include: { service: { select: { price: true } } },
    });

    const concluidos = agendamentos.filter((a) => a.status === "concluido");
    const cancelados = agendamentos.filter((a) => a.status === "cancelado");
    const faturamento = concluidos.reduce((sum, a) => sum + Number(a.service.price), 0);

    const diasSet = new Set(
      agendamentos.map((a) => {
        const d = a.date;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })
    );

    return {
      faturamento,
      totalAgendamentos: agendamentos.length,
      cancelados: cancelados.length,
      diasAtivos: diasSet.size,
      diasComAgendamento: Array.from(diasSet),
    };
  } catch (error) {
    console.error("Erro ao buscar resumo do mês:", error);
    return null;
  }
}
