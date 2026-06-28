// src/app/agendamento/actions.ts
"use server";

import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { notificarAgendamento } from "@/app/barbeiro/actions/notificar";
import { google } from "googleapis";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Google Calendar ──────────────────────────────────────────────

function getCalendarClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

async function criarEventoCalendar({
  name,
  serviceName,
  date,
  time,
  durationMinutes = 60,
}: {
  name: string;
  serviceName: string;
  date: string; // "DD/MM/YYYY"
  time: string; // "HH:MM"
  durationMinutes?: number;
}) {
  const calendar = getCalendarClient();

  const [day, month, year] = date.split("/").map(Number);
  const [hours, minutes] = time.split(":").map(Number);

  // Horário de início e fim em UTC-3 (Brasília)
  const start = new Date(year, month - 1, day, hours, minutes, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID!,
    requestBody: {
      summary: `✂️ ${name} — ${serviceName}`,
      description: `Agendamento feito pelo sistema Renan Black Barber.\nCliente: ${name}\nServiço: ${serviceName}`,
      start: {
        dateTime: start.toISOString(),
        timeZone: "America/Recife",
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "America/Recife",
      },
    },
  });
}

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

// ─── Converte "DD/MM/YYYY" + "HH:MM" → DateTime ──────────────────

function parseDateTime(date: string, time: string): Date {
  const [day, month, year] = date.split("/").map(Number);
  const [hours, minutes]   = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

// ─── Verifica se o serviço é uma assinatura ───────────────────────

function ehAssinatura(nomeServico: string): boolean {
  return nomeServico.toLowerCase().includes("assinatura");
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

  // Busca o serviço
  const service = await prisma.barbershopService.findUnique({
    where: { id: serviceId },
    select: { name: true, price: true, durationMinutes: true },
  });
  if (!service) {
    return { error: "Serviço não encontrado." };
  }

  // Verifica se é assinatura
  const isAssinatura = ehAssinatura(service.name);

  // Busca ou cria usuário pelo telefone
  const emailGuest = `${phone.replace(/\D/g, "")}@guest.local`;

  let user = await prisma.user.findFirst({
    where: { email: emailGuest },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email: emailGuest,
        assinante: isAssinatura,
      },
    });
  } else if (isAssinatura && !user.assinante) {
    await prisma.user.update({
      where: { id: user.id },
      data: { assinante: true },
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

  // Cria evento no Google Calendar
  try {
    await criarEventoCalendar({
      name,
      serviceName: service.name,
      date,
      time,
      durationMinutes: service.durationMinutes ?? 60,
    });
  } catch (err) {
    console.error("Erro ao criar evento no Google Calendar:", err);
  }

  // Envia notificações WhatsApp
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
  return {
    success: true,
    novoAssinante: isAssinatura,
  };
}