import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage, buildDailyReport } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  // Protege o endpoint com uma chave secreta
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        user: true,
        service: true,
      },
      orderBy: { date: "asc" },
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.service.price), 0);

    const subscribers = bookings
      .filter(b => b.service.name.toLowerCase().includes("assinatura"))
      .map(b => b.user.name ?? b.user.email);

    const bookingList = bookings.map(b => ({
      clientName: b.user.name ?? b.user.email,
      service: b.service.name,
      time: b.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      price: Number(b.service.price).toFixed(2).replace(".", ","),
    }));

    const message = buildDailyReport({
      date: today.toLocaleDateString("pt-BR"),
      totalBookings: bookings.length,
      totalRevenue,
      subscribers,
      bookings: bookingList,
    });

    await sendWhatsAppMessage(process.env.BARBER_PHONE!, message);

    return NextResponse.json({ success: true, totalBookings: bookings.length });
  } catch (error) {
    console.error("ERRO REPORT:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}