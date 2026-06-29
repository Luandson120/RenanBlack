import { Suspense } from "react";
import BookingPage from "./BookingPage";
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

function getPrisma() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export default async function AgendamentoPage() {
  const prisma = getPrisma();

  const barbershop = await prisma.barbershop.findFirst({
    include: { services: { where: { ativo: true } } },
  });

  if (!barbershop) return <div>Barbearia não encontrada</div>;

  const services = barbershop.services.map((service) => ({
    ...service,
    price: service.price.toNumber(),
  }));

  return (
    <Suspense fallback={<div className="p-4 text-white">Carregando...</div>}>
      <BookingPage
        barbershopId={barbershop.id}
        barbershopName={barbershop.name}
        barbershopAddress={barbershop.address}
        services={services}
      />
    </Suspense>
  );
}