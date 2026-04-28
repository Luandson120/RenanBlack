import "dotenv/config";


import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Limpa o banco antes de popular
  await prisma.booking.deleteMany();
  await prisma.barbershopService.deleteMany();
  await prisma.barbershop.deleteMany();

  const barbershop = await prisma.barbershop.create({
    data: {
      name: "Renan Black",
      address: "R. Barão do Rio Branco, Mamanguape - PB, 58280-000",
      phones: ["(83) 83 9894-5683"],
      description:
        "A Renan Blacker é uma barbearia moderna localizada em Mamanguape - PB, oferecendo serviços de qualidade para o homem contemporâneo. Nossa equipe é altamente qualificada e apaixonada pelo que faz.",
      imageUrl:
        "https://utfs.io/f/c4919193-a675-4c47-9f21-ebd86d1c8e6a-4oen2a.png",
      services: {
        createMany: {
          data: [
            {
              name: "Corte de Cabelo",
              description: "Estilo personalizado com as últimas tendências.",
              price: 25.0,
              imageUrl:
                "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
            },
            {
              name: "Barba",
              description:
                "Modelagem completa para destacar sua masculinidade.",
              price: 20.0,
              imageUrl:
                "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
            },
            {
              name: "Pézinho",
              description: "Acabamento perfeito para um visual renovado.",
              price: 10.0,
              imageUrl:
                "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
            },
            {
              name: "Sobrancelha",
              description: "Expressão acentuada com modelagem precisa.",
              price: 10.0,
              imageUrl:
                "https://utfs.io/f/2118f76e-89e4-43e6-87c9-8f157500c333-b0ps0b.png",
            },
            {
              name: "Assinatura Cabelo",
              description: "Corte seu cabelo de forma ilimitada.",
              price: 52.5,
              imageUrl:
                "https://utfs.io/f/c4919193-a675-4c47-9f21-ebd86d1c8e6a-4oen2a.png",
            },
            {
              name: "Assinatura Barba",
              description: "Faça sua barba de forma ilimitada.",
              price: 42.5,
              imageUrl:
                "https://utfs.io/f/c4919193-a675-4c47-9f21-ebd86d1c8e6a-4oen2a.png",
            },
            {
              name: "Assinatura Cabelo e Barba",
              description:
                "Corte seu cabelo e faça barba de forma ilimitada.",
              price: 72.5,
              imageUrl:
                "https://utfs.io/f/c4919193-a675-4c47-9f21-ebd86d1c8e6a-4oen2a.png",
            },
            {
              name: "Hidratação",
              description: "Hidratação profunda para cabelo e barba.",
              price: 25.0,
              imageUrl:
                "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
            },
          ],
        },
      },
    },
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log(`🏪 Barbearia criada: ${barbershop.name}`);
  console.log(`📍 Endereço: ${barbershop.address}`);
  console.log(`✂️  Serviços cadastrados: 8`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  