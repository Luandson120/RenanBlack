"use server";

import { sendWhatsAppMessage, buildClientMessage, buildBarberMessage } from "@/lib/whatsapp";

const BARBER_PHONE = process.env.WHATSAPP_BARBER_PHONE!; // número do Renan com DDI, ex: 5583988945683
const BARBERSHOP_NAME = "Renan Black Barber";
const BARBERSHOP_ADDRESS = "R. Barão do Rio Branco, Mamanguape - PB, 58280-000";

export async function notificarAgendamento({
  clientName,
  clientPhone,
  serviceName,
  date,
  time,
  price,
}: {
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  price: string;
}) {
  const phoneFormatado = clientPhone.replace(/\D/g, "");
  const phoneComDDI = phoneFormatado.startsWith("55")
    ? phoneFormatado
    : `55${phoneFormatado}`;

  // Envia para o cliente
  await sendWhatsAppMessage(
    phoneComDDI,
    buildClientMessage({
      clientName,
      serviceName,
      date,
      time,
      price,
      barbershopName: BARBERSHOP_NAME,
      barbershopAddress: BARBERSHOP_ADDRESS,
    })
  );

  // Envia para o barbeiro
  await sendWhatsAppMessage(
    BARBER_PHONE,
    buildBarberMessage({
      clientName,
      clientPhone,
      serviceName,
      date,
      time,
      price,
    })
  );
}