"use server";

import { revalidatePath } from "next/cache";
import { PrismaClient } from "../../../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

function getPrisma() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function getDashboardData() {
  const prisma = getPrisma();

  const hoje = new Date();
  const inicioDia = new Date(hoje);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(hoje);
  fimDia.setHours(23, 59, 59, 999);

  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);

  try {
    const [
      agendamentosHoje,
      assinantes,
      foraDoclube,
      statusBarbearia,
      lembretes,
      agendamentosMes,
    ] = await Promise.all([

      // Agendamentos de hoje com usuário e serviço
      prisma.booking.findMany({
        where: {
          date: { gte: inicioDia, lte: fimDia },
        },
        include: {
          user: { select: { name: true } },
          service: { select: { name: true, price: true } },
        },
        orderBy: { date: "asc" },
      }),

      // Assinantes ativos
      prisma.user.findMany({
        where: { assinante: true },
        select: {
          id: true,
          name: true,
          bookings: {
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true, service: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Fora do clube (não assinantes)
      prisma.user.findMany({
        where: { assinante: false },
        select: {
          id: true,
          name: true,
          bookings: {
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Status da barbearia
      prisma.barbershop.findFirst({
        select: { aberta: true },
      }),

      // Clientes sem corte há mais de 30 dias
      prisma.user.findMany({
        where: {
          bookings: {
            none: {
              date: { gte: trintaDiasAtras },
            },
          },
        },
        select: {
          id: true,
          name: true,
          bookings: {
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true },
          },
        },
      }),

      // Agendamentos concluídos no mês (pra faturamento mensal)
      prisma.booking.findMany({
        where: {
          date: { gte: inicioMes, lte: fimMes },
          status: "concluido",
        },
        select: {
          service: { select: { price: true } },
        },
      }),
    ]);

    // Caixa do dia — soma dos serviços concluídos hoje
    const caixaDoDia = agendamentosHoje
      .filter((b) => b.status === "concluido")
      .reduce((acc, b) => acc + Number(b.service.price), 0);

    // Faturamento do mês — soma dos serviços concluídos no mês inteiro
    const faturamentoMes = agendamentosMes.reduce(
      (acc, b) => acc + Number(b.service.price),
      0
    );

    return {
      agendamentosHoje,
      assinantes,
      foraDoclube,
      lembretes,
      aberta: statusBarbearia?.aberta ?? true,
      caixaDoDia,
      faturamentoMes,
      totalAgendamentos: agendamentosHoje.length,
      concluidosHoje: agendamentosHoje.filter((b) => b.status === "concluido").length,
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Confirma o atendimento (marca como concluído)
export async function confirmarAgendamento(id: string) {
  const prisma = getPrisma();
  try {
    await prisma.booking.update({
      where: { id },
      data: { status: "concluido" },
    });
    revalidatePath("/barbeiro/dashboard");
  } finally {
    await prisma.$disconnect();
  }
}

// Cancela o agendamento
export async function cancelarAgendamento(id: string) {
  const prisma = getPrisma();
  try {
    await prisma.booking.update({
      where: { id },
      data: { status: "cancelado" },
    });
    revalidatePath("/barbeiro/dashboard");
  } finally {
    await prisma.$disconnect();
  }
}