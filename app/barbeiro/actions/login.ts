"use server";

import { PrismaClient } from "../../../../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

function getPrisma() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

interface LoginResult {
  sucesso: boolean;
  erro?: string;
}

export async function loginBarbeiro(
  cpf: string,
  email: string,
  senha: string
): Promise<LoginResult> {
  const prisma = getPrisma();

  try {
    const barbeiro = await prisma.barbeiro.findUnique({
      where: { cpf },
    });

    if (!barbeiro) {
      return { sucesso: false, erro: "CPF, e-mail ou senha incorretos." };
    }

    if (barbeiro.email.toLowerCase() !== email.toLowerCase()) {
      return { sucesso: false, erro: "CPF, e-mail ou senha incorretos." };
    }

    if (!barbeiro.ativo) {
      return { sucesso: false, erro: "Conta inativa. Fale com o administrador." };
    }

    const senhaCorreta = await bcrypt.compare(senha, barbeiro.senha);
    if (!senhaCorreta) {
      return { sucesso: false, erro: "CPF, e-mail ou senha incorretos." };
    }

    const cookieStore = await cookies();
    cookieStore.set("barbeiro_id", barbeiro.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 horas
      path: "/",
    });

    return { sucesso: true };
  } catch (error) {
    console.error("Erro no login:", error);
    return { sucesso: false, erro: "Erro interno. Tente novamente." };
  } finally {
    await prisma.$disconnect();
  }
}