import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendWhatsAppMessage,
  buildClientMessage,
  buildBarberMessage,
} from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId obrigatório" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        service: {
          include: { barbershop: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const date = booking.date.toLocaleDateString("pt-BR");
    const time = booking.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const price = Number(booking.service.price).toFixed(2).replace(".", ",");
    const clientPhone = booking.user.email.replace("@guest.local", "");

    // Mensagem para o cliente
    const clientMsg = buildClientMessage({
      clientName: booking.user.name ?? "Cliente",
      serviceName: booking.service.name,
      date,
      time,
      price,
      barbershopName: booking.service.barbershop.name,
      barbershopAddress: booking.service.barbershop.address,
    });

    // Mensagem para o barbeiro
    const barberMsg = buildBarberMessage({
      clientName: booking.user.name ?? "Cliente",
      clientPhone,
      serviceName: booking.service.name,
      date,
      time,
      price,
    });

    // Envia para o cliente e para o barbeiro em paralelo
    await Promise.all([
      sendWhatsAppMessage(clientPhone, clientMsg),
      sendWhatsAppMessage(process.env.BARBER_PHONE!, barberMsg),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERRO NOTIFY:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}