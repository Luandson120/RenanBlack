"use server";

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

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  const proximos30Dias = new Date(hoje);
  proximos30Dias.setDate(proximos30Dias.getDate() + 30);

  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  try {
    const [
      agendamentosHoje,
      agendamentosFuturos,
      assinantes,
      foraDoclube,
      statusBarbearia,
      lembretes,
      faturamentoMes,
    ] = await Promise.all([
      prisma.booking.findMany({
        where: { date: { gte: inicioDia, lte: fimDia } },
        include: {
          user: { select: { name: true, email: true } },
          service: { select: { name: true, price: true } },
        },
        orderBy: { date: "asc" },
      }),

      prisma.booking.findMany({
        where: {
          date: { gt: fimDia, lte: proximos30Dias },
          status: { not: "cancelado" },
        },
        include: {
          user: { select: { name: true, email: true } },
          service: { select: { name: true, price: true } },
        },
        orderBy: { date: "asc" },
        take: 50,
      }),

      prisma.user.findMany({
        where: { assinante: true },
        select: {
          id: true,
          name: true,
          email: true,
          bookings: {
            orderBy: { date: "desc" },
            take: 20,
            select: {
              date: true,
              service: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.user.findMany({
        where: { assinante: false },
        select: {
          id: true,
          name: true,
          email: true,
          bookings: {
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.barbershop.findFirst({
        select: { id: true, aberta: true },
      }),

      prisma.user.findMany({
        where: {
          bookings: {
            none: { date: { gte: trintaDiasAtras } },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          bookings: {
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true },
          },
        },
      }),

      prisma.booking.findMany({
        where: {
          date: { gte: inicioMes, lte: fimMes },
          status: "concluido",
        },
        select: { service: { select: { price: true } } },
      }),
    ]);

    const caixaDoDia = agendamentosHoje
      .filter((b) => b.status === "concluido")
      .reduce((acc, b) => acc + Number(b.service.price), 0);

    const faturamentoMesTotal = faturamentoMes.reduce(
      (acc, b) => acc + Number(b.service.price),
      0
    );

    const serializeBooking = (b: typeof agendamentosHoje[0]) => ({
      ...b,
      service: { ...b.service, price: Number(b.service.price) },
    });

    const serializeFuturo = (b: typeof agendamentosFuturos[0]) => ({
      ...b,
      service: { ...b.service, price: Number(b.service.price) },
    });

    function extrairTelefone(email: string): string | null {
      if (!email.endsWith("@guest.local")) return null;
      const digits = email.replace("@guest.local", "");
      if (digits.length < 10) return null;
      const ddd = digits.slice(0, 2);
      const parte1 = digits.slice(2, digits.length - 4);
      const parte2 = digits.slice(-4);
      return `(${ddd}) ${parte1}-${parte2}`;
    }

    const assinantesComContato = assinantes.map((u) => ({
      ...u,
      telefone: extrairTelefone(u.email),
      plano: u.bookings[0]?.service?.name ?? "—",
      ultimoCorte: u.bookings[0]?.date ?? null,
    }));

    const lembretesComContato = lembretes.map((u) => ({
      ...u,
      telefone: extrairTelefone(u.email),
      ultimoCorte: u.bookings[0]?.date ?? null,
    }));

    return {
      agendamentosHoje: agendamentosHoje.map(serializeBooking),
      agendamentosFuturos: agendamentosFuturos.map(serializeFuturo),
      assinantes: assinantesComContato,
      foraDoclube,
      lembretes: lembretesComContato,
      aberta: statusBarbearia?.aberta ?? true,
      barbershopId: statusBarbearia?.id ?? null,
      caixaDoDia,
      faturamentoMes: faturamentoMesTotal,
      totalAgendamentos: agendamentosHoje.length,
      concluidosHoje: agendamentosHoje.filter((b) => b.status === "concluido").length,
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function atualizarStatusAgendamento(id: string, status: "concluido" | "cancelado") {
  const prisma = getPrisma();
  try {
    await prisma.booking.update({ where: { id }, data: { status } });
    return { sucesso: true };
  } catch (error) {
    console.error(error);
    return { sucesso: false };
  } finally {
    await prisma.$disconnect();
  }
}

export async function toggleStatusBarbearia(id: string, abertaAtual: boolean) {
  const prisma = getPrisma();
  const novoStatus = !abertaAtual;

  try {
    // 1. Atualiza o status da barbearia
    await prisma.barbershop.update({
      where: { id },
      data: { aberta: novoStatus },
    });

    // 2. Se está FECHANDO: cancela agendamentos pendentes de hoje
    let agendamentosCancelados = 0;
    if (!novoStatus) {
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date();
      fimDia.setHours(23, 59, 59, 999);

      // Pega IDs dos serviços da barbearia
      const serviceIds = (
        await prisma.barbershopService.findMany({
          where: { barbershopId: id },
          select: { id: true },
        })
      ).map((s) => s.id);

      // Cancela bookings de hoje ainda aguardando ou em andamento
      const resultado = await prisma.booking.updateMany({
        where: {
          serviceId: { in: serviceIds },
          date: { gte: inicioDia, lte: fimDia },
          status: { in: ["aguardando", "andamento"] },
        },
        data: { status: "cancelado" },
      });

      agendamentosCancelados = resultado.count;
    }

    return { sucesso: true, novoStatus, agendamentosCancelados };
  } catch (error) {
    console.error(error);
    return { sucesso: false, novoStatus: abertaAtual, agendamentosCancelados: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

export async function adicionarValorExtra(descricao: string, valor: number) {
  // Sem model no banco ainda — retorna sucesso para o client não quebrar.
  // Quando o model ValorAvulso for criado, implementar aqui.
  return { sucesso: true, id: `mem-${Date.now()}` };
}