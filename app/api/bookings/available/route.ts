import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Horários disponíveis da barbearia
const ALL_HOURS = [
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00", "14:30",
  "15:00", "15:30",
  "16:00", "16:30",
  "17:00", "17:30",
  "18:00",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Parâmetro 'date' é obrigatório. Ex: ?date=2026-05-20" },
        { status: 400 }
      );
    }

    const day = new Date(date);

    if (isNaN(day.getTime())) {
      return NextResponse.json(
        { error: "Data inválida. Use o formato YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Início e fim do dia
    const startOfDay = new Date(day);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(day);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Busca agendamentos já existentes no dia
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Horários já ocupados
    const bookedHours = bookings.map((b) => {
      const d = new Date(b.date);
      const h = d.getUTCHours().toString().padStart(2, "0");
      const m = d.getUTCMinutes().toString().padStart(2, "0");
      return `${h}:${m}`;
    });

    // Filtra os horários disponíveis
    const available = ALL_HOURS.filter((h) => !bookedHours.includes(h));

    return NextResponse.json({
      date,
      available,
      booked: bookedHours,
    });
  } catch (error) {
    console.error("ERRO AVAILABLE:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}