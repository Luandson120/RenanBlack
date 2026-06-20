"use server";

import { PrismaClient } from "../../../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

function getPrisma() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

async function verificarBarbeiro() {
  const cookieStore = await cookies();
  const barbeiroId = cookieStore.get("barbeiro_id")?.value;
  if (!barbeiroId) throw new Error("Não autorizado.");
  return barbeiroId;
}

export async function getServicos() {
  const prisma = getPrisma();
  try {
    await verificarBarbeiro();

    const barbearia = await prisma.barbershop.findFirst({
      select: { id: true },
    });
    if (!barbearia) return [];

    return await prisma.barbershopService.findMany({
      where: { barbershopId: barbearia.id },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

export async function adicionarServico(data: {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}) {
  const prisma = getPrisma();
  try {
    await verificarBarbeiro();

    const barbearia = await prisma.barbershop.findFirst({
      select: { id: true },
    });
    if (!barbearia) return { sucesso: false, erro: "Barbearia não encontrada." };

    await prisma.barbershopService.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl:
          data.imageUrl ||
          "https://utfs.io/f/c4919193-a675-4c47-9f21-ebd86d1c8e6a-4oen2a.png",
        barbershopId: barbearia.id,
      },
    });

    revalidatePath("/barbeiro/servicos");
    return { sucesso: true };
  } catch (error) {
    console.error(error);
    return { sucesso: false, erro: "Erro ao adicionar serviço." };
  } finally {
    await prisma.$disconnect();
  }
}

export async function editarServico(
  id: string,
  data: { name: string; description: string; price: number; imageUrl: string }
) {
  const prisma = getPrisma();
  try {
    await verificarBarbeiro();

    await prisma.barbershopService.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
      },
    });

    revalidatePath("/barbeiro/servicos");
    return { sucesso: true };
  } catch (error) {
    console.error(error);
    return { sucesso: false, erro: "Erro ao editar serviço." };
  } finally {
    await prisma.$disconnect();
  }
}

export async function toggleServicoAtivo(id: string, ativo: boolean) {
  const prisma = getPrisma();
  try {
    await verificarBarbeiro();

    await prisma.barbershopService.update({
      where: { id },
      data: { ativo },
    });

    revalidatePath("/barbeiro/servicos");
    return { sucesso: true };
  } catch (error) {
    console.error(error);
    return { sucesso: false, erro: "Erro ao atualizar serviço." };
  } finally {
    await prisma.$disconnect();
  }
}

export async function removerServico(id: string) {
  const prisma = getPrisma();
  try {
    await verificarBarbeiro();

    await prisma.booking.deleteMany({ where: { serviceId: id } });
    await prisma.barbershopService.delete({ where: { id } });

    revalidatePath("/barbeiro/servicos");
    return { sucesso: true };
  } catch (error) {
    console.error(error);
    return { sucesso: false, erro: "Erro ao remover serviço." };
  } finally {
    await prisma.$disconnect();
  }
}