import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

function getPrisma() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// Horário de funcionamento
const HORA_ABERTURA = 8;   // 08:00
const HORA_FECHAMENTO = 18; // 18:00
const INTERVALO_MIN = 30;   // 30 minutos

// Gera todos os horários do dia (08:00 até 17:30)
function gerarHorarios(): string[] {
  const horarios: string[] = [];
  let hora = HORA_ABERTURA;
  let minuto = 0;

  while (hora < HORA_FECHAMENTO) {
    horarios.push(
      `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`
    );
    minuto += INTERVALO_MIN;
    if (minuto >= 60) {
      minuto = 0;
      hora++;
    }
  }

  return horarios;
}

// GET /api/bookings/available?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // "YYYY-MM-DD"

  if (!date) {
    return NextResponse.json({ error: "Parâmetro date obrigatório." }, { status: 400 });
  }

  const [year, month, day] = date.split("-").map(Number);

  // Verifica se é domingo
  const diaSemana = new Date(year, month - 1, day).getDay();
  if (diaSemana === 0) {
    return NextResponse.json({
      available: [],
      fechado: true,
      mensagem: "Fechado aos domingos.",
    });
  }

  // Verifica horário atual se for hoje
  const agora = new Date();
  const ehHoje =
    agora.getFullYear() === year &&
    agora.getMonth() + 1 === month &&
    agora.getDate() === day;

  // Verifica se já passou do horário de fechamento hoje
  if (ehHoje && agora.getHours() >= HORA_FECHAMENTO) {
    return NextResponse.json({
      available: [],
      fechado: true,
      mensagem: "A barbearia já encerrou o atendimento hoje.",
    });
  }

  const prisma = getPrisma();

  try {
    // Verifica se a barbearia está aberta
    const barbearia = await prisma.barbershop.findFirst({
      select: { aberta: true },
    });

    if (!barbearia?.aberta) {
      return NextResponse.json({
        available: [],
        fechado: true,
        mensagem: "A barbearia está fechada no momento.",
      });
    }

    // Busca horários já ocupados no dia
    const inicioDia = new Date(year, month - 1, day, 0, 0, 0);
    const fimDia = new Date(year, month - 1, day, 23, 59, 59);

    const bookings = await prisma.booking.findMany({
      where: { date: { gte: inicioDia, lte: fimDia } },
      select: { date: true },
    });

    const ocupados = new Set(
      bookings.map((b) => {
        const d = new Date(b.date);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      })
    );

    // Gera horários e filtra
    const todos = gerarHorarios();

    const available = todos.filter((horario) => {
      // Remove horários ocupados
      if (ocupados.has(horario)) return false;

      // Se for hoje, remove horários que já passaram
      if (ehHoje) {
        const [h, m] = horario.split(":").map(Number);
        const horaSlot = new Date(year, month - 1, day, h, m);
        if (horaSlot <= agora) return false;
      }

      return true;
    });

    return NextResponse.json({ available, fechado: false });
  } finally {
    await prisma.$disconnect();
  }
}