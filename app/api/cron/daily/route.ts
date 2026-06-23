import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
  sendWhatsAppMessage,
  buildDailyReport,
  buildLembrete30Dias,
} from "@/lib/whatsapp";

function getPrisma() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const BARBER_PHONE = process.env.WHATSAPP_BARBER_PHONE!;
const BARBERSHOP_NAME = "Renan Black Barber";
const BARBERSHOP_PHONE = "(83) 98894-5683";
const CRON_SECRET = process.env.CRON_SECRET;

// GET /api/cron/daily — chamado pelo Vercel Cron às 19:00
export async function GET(req: NextRequest) {
  // Proteção por secret
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const prisma = getPrisma();

  try {
    const hoje = new Date();
    const inicioDia = new Date(hoje);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(hoje);
    fimDia.setHours(23, 59, 59, 999);

    const dataFormatada = hoje.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // ─── 1. Relatório diário ──────────────────────────────────────
    const agendamentosHoje = await prisma.booking.findMany({
      where: { date: { gte: inicioDia, lte: fimDia } },
      include: {
        user: { select: { name: true } },
        service: { select: { name: true, price: true } },
      },
      orderBy: { date: "asc" },
    });

    const assinantesHoje = agendamentosHoje
      .filter((b) => b.service.name.toLowerCase().includes("assinatura"))
      .map((b) => b.user.name ?? "—");

    const totalReceita = agendamentosHoje.reduce(
      (acc, b) => acc + Number(b.service.price),
      0
    );

    const bookingsList = agendamentosHoje.map((b) => ({
      clientName: b.user.name ?? "—",
      service: b.service.name,
      time: new Date(b.date).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      price: Number(b.service.price).toFixed(2).replace(".", ","),
    }));

    await sendWhatsAppMessage(
      BARBER_PHONE,
      buildDailyReport({
        date: dataFormatada,
        totalBookings: agendamentosHoje.length,
        totalRevenue: totalReceita,
        subscribers: assinantesHoje,
        bookings: bookingsList,
      })
    );

    // ─── 2. Lembretes 30 dias sem corte ──────────────────────────
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const clientesSemCorte = await prisma.user.findMany({
      where: {
        bookings: {
          none: { date: { gte: trintaDiasAtras } },
        },
        // Só notifica quem tem telefone (email @guest.local = criado pelo phone)
        email: { endsWith: "@guest.local" },
      },
      select: {
        name: true,
        email: true,
        bookings: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true },
        },
      },
    });

    let lembretesEnviados = 0;

    for (const cliente of clientesSemCorte) {
      // Extrai o telefone do email (formato: 83988945683@guest.local)
      const phone = cliente.email.replace("@guest.local", "");
      const phoneComDDI = phone.startsWith("55") ? phone : `55${phone}`;

      const ultimoCorte = cliente.bookings[0]?.date;
      const dias = ultimoCorte
        ? Math.floor(
            (hoje.getTime() - new Date(ultimoCorte).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999;

      await sendWhatsAppMessage(
        phoneComDDI,
        buildLembrete30Dias({
          clientName: cliente.name ?? "cliente",
          diasSemCorte: dias,
          barbershopName: BARBERSHOP_NAME,
          barbershopPhone: BARBERSHOP_PHONE,
        })
      );

      lembretesEnviados++;
    }

    return NextResponse.json({
      sucesso: true,
      relatorio: "enviado",
      lembretesEnviados,
    });
  } finally {
    await prisma.$disconnect();
  }
}