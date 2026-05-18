const WHATSAPP_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
};

// Envia mensagem de texto simples
export async function sendWhatsAppMessage(to: string, message: string) {
  const res = await fetch(WHATSAPP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error("Erro WhatsApp:", error);
  }

  return res.json();
}

// Mensagem para o CLIENTE após agendamento
export function buildClientMessage({
  clientName,
  serviceName,
  date,
  time,
  price,
  barbershopName,
  barbershopAddress,
}: {
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  price: string;
  barbershopName: string;
  barbershopAddress: string;
}): string {
  return `✅ *Agendamento confirmado!*

Olá, *${clientName}*! Seu agendamento foi realizado com sucesso.

📋 *Detalhes:*
- Serviço: ${serviceName}
- Data: ${date}
- Horário: ${time}
- Valor: R$ ${price}

📍 *Local:*
${barbershopName}
${barbershopAddress}

⚠️ _Caso precise cancelar, entre em contato com antecedência._

Até logo! 💈`;
}

// Mensagem para o BARBEIRO após agendamento
export function buildBarberMessage({
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
}): string {
  return `🔔 *Novo agendamento!*

👤 *Cliente:* ${clientName}
📱 *WhatsApp:* ${clientPhone}
✂️ *Serviço:* ${serviceName}
📅 *Data:* ${date}
⏰ *Horário:* ${time}
💰 *Valor:* R$ ${price}`;
}

// Relatório diário para o BARBEIRO
export function buildDailyReport({
  date,
  totalBookings,
  totalRevenue,
  subscribers,
  bookings,
}: {
  date: string;
  totalBookings: number;
  totalRevenue: number;
  subscribers: string[];
  bookings: { clientName: string; service: string; time: string; price: string }[];
}): string {
  const bookingList = bookings
    .map((b, i) => `${i + 1}. ${b.clientName} — ${b.service} às ${b.time} (R$ ${b.price})`)
    .join("\n");

  const subscriberList = subscribers.length > 0
    ? subscribers.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "Nenhum assinante hoje.";

  return `📊 *Relatório do dia — ${date}*

📋 *Total de agendamentos:* ${totalBookings}
💰 *Receita do dia:* R$ ${totalRevenue.toFixed(2).replace(".", ",")}

─────────────────
📅 *Agendamentos:*
${bookingList}

─────────────────
⭐ *Assinantes do dia:* ${subscribers.length}
${subscriberList}

_Relatório gerado automaticamente pela Barbearia Renan Black_ 💈`;
}