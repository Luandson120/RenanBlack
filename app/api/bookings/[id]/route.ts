import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, unauthorized } from "@/app/api/middleware/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    if (booking.userId !== user.userId) {
      return NextResponse.json(
        { error: "Sem permissão para cancelar este agendamento" },
        { status: 403 }
      );
    }

    await prisma.booking.delete({ where: { id } });

    return NextResponse.json({ message: "Agendamento cancelado com sucesso" });
  } catch (error) {
    console.error("ERRO DELETE:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}