import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

function getPrisma() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// Eventos que indicam que o pagamento entrou/se manteve ativo
const EVENTOS_ATIVAR = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];

// Eventos que indicam que a assinatura deve ser desativada
const EVENTOS_DESATIVAR = [
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "SUBSCRIPTION_DELETED",
];

// Busca o e-mail do cliente no Asaas a partir do ID retornado no webhook
async function buscarEmailDoCliente(customerId: string): Promise<string | null> {
  const resposta = await fetch(`https://www.asaas.com/api/v3/customers/${customerId}`, {
    headers: {
      access_token: process.env.ASAAS_API_KEY!,
    },
  });
  if (!resposta.ok) return null;
  const cliente = await resposta.json();
  return cliente.email ?? null;
}

export async function POST(request: NextRequest) {
  // Confirma que a requisição realmente veio do Asaas
  const tokenRecebido = request.headers.get("asaas-access-token");
  if (!process.env.ASAAS_WEBHOOK_TOKEN || tokenRecebido !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const evento = corpo.event as string | undefined;
  const customerId = corpo.payment?.customer as string | undefined;

  if (!evento || !customerId) {
    return NextResponse.json({ recebido: true });
  }

  const ativar = EVENTOS_ATIVAR.includes(evento);
  const desativar = EVENTOS_DESATIVAR.includes(evento);

  if (!ativar && !desativar) {
    // Evento que não nos interessa (ex: PAYMENT_CREATED) — só confirma o recebimento
    return NextResponse.json({ recebido: true });
  }

  const prisma = getPrisma();
  try {
    const email = await buscarEmailDoCliente(customerId);
    if (!email) {
      console.warn("Webhook Asaas: não foi possível obter o e-mail do cliente", customerId);
      return NextResponse.json({ recebido: true });
    }

    const usuario = await prisma.user.findUnique({ where: { email } });
    if (!usuario) {
      console.warn("Webhook Asaas: nenhum usuário encontrado para o e-mail", email);
      return NextResponse.json({ recebido: true });
    }

    await prisma.user.update({
      where: { id: usuario.id },
      data: { assinante: ativar },
    });

    return NextResponse.json({ recebido: true });
  } catch (error) {
    console.error("Erro ao processar webhook do Asaas:", error);
    return NextResponse.json({ erro: "Erro ao processar webhook." }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}