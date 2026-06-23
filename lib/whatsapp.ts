const WHATSAPP_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
};

// ─── Envio base ───────────────────────────────────────────────────

export async function sendWhatsAppMessage(to: string, message: string) {
  console.log("📤 Enviando WhatsApp para:", to);
  console.log("🔗 URL:", WHATSAPP_URL);
  console.log("🔑 Token:", process.env.WHATSAPP_TOKEN ? "✅ definido" : "❌ não definido");
  console.log("📱 Phone ID:", process.env.WHATSAPP_PHONE_ID ?? "❌ não definido");
  console.log("🌐 API Version:", process.env.WHATSAPP_API_VERSION ?? "❌ não definido");

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

  const data = await res.json(); // ← lê uma única vez

  console.log("📬 WhatsApp status:", res.status);
  console.log("📬 WhatsApp response:", JSON.stringify(data, null, 2));

  if (!res.ok) {
    console.error("❌ Erro WhatsApp:", JSON.stringify(data, null, 2));
  }

  return data;
}

// ─── Confirmação de agendamento para o CLIENTE ────────────────────

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

// ─── Notificação de agendamento para o BARBEIRO ───────────────────

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

// ─── Lembrete 30 dias sem corte para o CLIENTE ───────────────────

export function buildLembrete30Dias({
  clientName,
  diasSemCorte,
  barbershopName,
  barbershopPhone,
}: {
  clientName: string;
  diasSemCorte: number;
  barbershopName: string;
  barbershopPhone: string;
}): string {
  return `✂️ *Ei, ${clientName}! Tá na hora do corte!*

Faz *${diasSemCorte} dias* que você não aparece por aqui. Sentimos sua falta! 😄

Agende agora pelo nosso app e garanta seu horário.

📍 *${barbershopName}*
📱 ${barbershopPhone}

_Te esperamos! 💈_`;
}

// ─── Relatório diário para o BARBEIRO ────────────────────────────

export function buildDailyReport({
  date,
  totalBookings,
  totalRevenue,
  subscribers,
  bookings,
  barbershopName,
}: {
  date: string;
  totalBookings: number;
  totalRevenue: number;
  subscribers: string[];
  bookings: { clientName: string; service: string; time: string; price: string }[];
  barbershopName?: string;
}): string {
  const bookingList = bookings.length > 0
    ? bookings
        .map((b, i) => `${i + 1}. ${b.clientName} — ${b.service} às ${b.time} (R$ ${b.price})`)
        .join("\n")
    : "Nenhum agendamento hoje.";

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

_Relatório gerado automaticamente — ${barbershopName ?? "Renan Black Barber"} 💈_`;
}