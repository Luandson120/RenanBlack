"use server";

import { PrismaClient } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const prisma = new PrismaClient();

const BookingSchema = z.object({
  name:        z.string().min(2, "Nome obrigatório"),
  phone:       z.string().min(10, "WhatsApp inválido"),
  notes:       z.string().optional(),
  serviceId:   z.string(),
  barbershopId: z.string(),
  date:        z.string(), // "DD/MM/YYYY"
  time:        z.string(), // "HH:MM"
});

export type BookingInput = z.infer<typeof BookingSchema>;

export async function createBooking(data: BookingInput) {
  const parsed = BookingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, phone, notes, serviceId, barbershopId, date, time } = parsed.data;

  // Converte "30/04/2026" + "10:00" → Date UTC
  const [day, month, year] = date.split("/").map(Number);
  const [hours, minutes]   = time.split(":").map(Number);
  const dateTime = new Date(year, month - 1, day, hours, minutes);

  // Checa conflito de horário na mesma barbearia
  const conflict = await prisma.booking.findFirst({
    where: { barbershopId, date: dateTime },
  });
  if (conflict) {
    return { error: "Horário já reservado. Escolha outro." };
  }

  await prisma.booking.create({
    data: {
      userId:      phone, // ou session.user.id se tiver auth
      serviceId,
      barbershopId,
      date:        dateTime,
    },
  });

  revalidatePath("/agendamento");
  return { success: true };
}

// Busca serviços reais da barbearia
export async function getServicesWithTakenTimes(barbershopId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const [services, bookings] = await Promise.all([
    prisma.barbershopService.findMany({
      where: { barbershopId },
      orderBy: { price: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        barbershopId,
        date: { gte: today, lt: nextWeek },
      },
      select: { date: true },
    }),
  ]);

  // { "2026-04-30": ["08:00", "10:00"] }
  const takenByDate = bookings.reduce<Record<string, string[]>>((acc, b) => {
    const key  = b.date.toISOString().split("T")[0];
    const hour = `${String(b.date.getHours()).padStart(2, "0")}:${String(b.date.getMinutes()).padStart(2, "0")}`;
    acc[key]   = [...(acc[key] ?? []), hour];
    return acc;
  }, {});

  return { services, takenByDate };
}