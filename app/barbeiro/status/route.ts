// src/app/api/barbeiro/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { cookies } from "next/headers";

function getPrisma() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

async function getBarbeiroId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("barbeiro_id")?.value ?? null;
}

export async function GET() {
  const barbeiroId = await getBarbeiroId();
  if (!barbeiroId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const prisma = getPrisma();
  try {
    const barbershop = await prisma.barbershop.findFirst();
    return NextResponse.json({ aberta: barbershop?.aberta ?? false });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  const barbeiroId = await getBarbeiroId();
  if (!barbeiroId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { aberta, bloquearHoje } = (await req.json()) as {
    aberta: boolean;
    bloquearHoje?: boolean;
  };

  const prisma = getPrisma();
  try {
    const barbershop = await prisma.barbershop.findFirst();
    if (!barbershop) return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 });

    await prisma.barbershop.update({
      where: { id: barbershop.id },
      data: { aberta },
    });

    let agendamentosCancelados = 0;
    if (!aberta && bloquearHoje) {
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date();
      fimDia.setHours(23, 59, 59, 999);

      const serviceIds = (
        await prisma.barbershopService.findMany({
          where: { barbershopId: barbershop.id },
          select: { id: true },
        })
      ).map((s) => s.id);

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

    return NextResponse.json({ ok: true, aberta, agendamentosCancelados });
  } finally {
    await prisma.$disconnect();
  }
}