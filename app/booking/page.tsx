import { Suspense } from "react";
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import BookingClient from "./BookingClient";

function getPrisma() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export default async function BookingPage() {
  const prisma = getPrisma();

  const barbershop = await prisma.barbershop.findFirst({
    include: { services: true },
  });

  if (!barbershop) {
    return <div>Barbearia não encontrada.</div>;
  }

  const services = barbershop.services.map((s) => ({
    ...s,
    price: s.price.toNumber(),
  }));

  return (
    <Suspense fallback={<div className="p-4 text-white">Carregando...</div>}>
      <BookingClient
        barbershopId={barbershop.id}
        services={services}
      />
    </Suspense>
  );
}