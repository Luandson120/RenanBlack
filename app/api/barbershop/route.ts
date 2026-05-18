import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const barbershop = await prisma.barbershop.findFirst({
      include: {
        services: true,
      },
    });

    if (!barbershop) {
      return NextResponse.json(
        { error: "Barbearia não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(barbershop);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}