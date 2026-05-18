import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, unauthorized } from "@/app/api/middleware/auth";

// GET /api/bookings/me — listar agendamentos do usuário logado
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: user.userId },
      include: {
        service: {
          include: {
            barbershop: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/bookings — criar agendamento
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { serviceId, date } = await req.json();

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: "serviceId e date são obrigatórios" },
        { status: 400 }
      );
    }

    // Verifica se o serviço existe
    const service = await prisma.barbershopService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      );
    }

    // Verifica se já existe agendamento nesse horário
    const conflict = await prisma.booking.findFirst({
      where: { date: new Date(date) },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Horário já ocupado" },
        { status: 409 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.userId,
        serviceId,
        date: new Date(date),
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}