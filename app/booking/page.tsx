import { prisma } from "@/lib/prisma";
import BookingClient from "./BookingClient";

export default async function BookingPage() {
  const barbershop = await prisma.barbershop.findFirst({
    include: { services: true },
  });

  if (!barbershop) {
    return <div>Barbearia nao encontrada.</div>;
  }

  return (
    <BookingClient
      barbershopId={barbershop.id}
      services={barbershop.services}
    />
  );
}
