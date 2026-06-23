"use server";

import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { notificarAgendamento } from "@/app/barbeiro/actions/notificar";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Schema de validação ──────────────────────────────────────────

const BookingSchema = z.object({
  barbershopId: z.string().uuid(),
  serviceId:    z.string().uuid(),
  date:         z.string(), // "DD/MM/YYYY"
  time:         z.string(), // "HH:MM"
  name:         z.string().min(1),
  phone:        z.string().min(10),
  notes:        z.string().optional(),
});

// ─── Converte "DD/MM/YYYY" + "HH:MM" → DateTime UTC ──────────────

function parseDateTime(date: string, time: string): Date {
  const [day, month, year] = date.split("/").map(Number);
  const [hours, minutes]   = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

// ─── getServicesWithTakenTimes ────────────────────────────────────

export async function getServicesWithTakenTimes(barbershopId: string) {
  const services = await prisma.barbershopService.findMany({
    where: { barbershopId },
    orderBy: { name: "asc" },
  });

  const serviceIds = services.map((s) => s.id);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(now.getDate() + 14);

  const bookings = await prisma.booking.findMany({
    where: {
      serviceId: { in: serviceIds },
      date: { gte: now, lt: end },
    },
    select: { date: true },
  });

  const takenByDate: Record<string, string[]> = {};
  for (const b of bookings) {
    const d   = b.date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const hh  = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    (takenByDate[key] ??= []).push(hh);
  }

  return { services, takenByDate };
}

// ─── createBooking ────────────────────────────────────────────────

export async function createBooking(input: unknown) {
  const parsed = BookingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos. Verifique os campos e tente novamente." };
  }

  const { serviceId, date, time, name, phone, notes } = parsed.data;
  const bookingDate = parseDateTime(date, time);

  // Verifica conflito de horário
  const conflict = await prisma.booking.findFirst({
    where: { serviceId, date: bookingDate },
  });
  if (conflict) {
    return { error: "Este horário acabou de ser reservado. Escolha outro." };
  }

  // Busca o serviço para pegar nome e preço
  const service = await prisma.barbershopService.findUnique({
    where: { id: serviceId },
    select: { name: true, price: true },
  });

  if (!service) {
    return { error: "Serviço não encontrado." };
  }

  // Busca ou cria usuário pelo telefone
  let user = await prisma.user.findFirst({
    where: { email: `${phone.replace(/\D/g, "")}@guest.local` },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email: `${phone.replace(/\D/g, "")}@guest.local`,
      },
    });
  }

  // Cria o agendamento
  await prisma.booking.create({
    data: {
      userId:    user.id,
      serviceId,
      date:      bookingDate,
    },
  });

  // Envia notificações WhatsApp (não bloqueia o retorno em caso de erro)
  try {
    await notificarAgendamento({
      clientName:  name,
      clientPhone: phone,
      serviceName: service.name,
      date,
      time,
      price: Number(service.price).toFixed(2).replace(".", ","),
    });
  } catch (err) {
    console.error("Erro ao enviar WhatsApp:", err);
  }

  revalidatePath("/agendamento");
  return { success: true };
}